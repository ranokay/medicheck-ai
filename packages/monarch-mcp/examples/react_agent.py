import asyncio
import inspect
import json
import logging
import os
import sys
import time
from typing import Any, Callable

import openai
from dotenv import load_dotenv

logging.getLogger("openai").setLevel(logging.INFO)
logger = logging.getLogger(__name__)

# Import Monarch MCP components
from monarch_mcp.client import MonarchClient
from monarch_mcp.server import mcp
from monarch_mcp.tools import (
    ChemicalApi,
    DiseaseApi,
    EntityApi,
    GeneApi,
    HistoPhenoApi,
    MappingApi,
    PhenotypeApi,
    ProteinApi,
    SearchApi,
    SimilarityApi,
    VariantApi,
)

_API_INSTANCES = (
    EntityApi(),
    DiseaseApi(),
    GeneApi(),
    PhenotypeApi(),
    SimilarityApi(),
    SearchApi(),
    HistoPhenoApi(),
    MappingApi(),
    ChemicalApi(),
    VariantApi(),
    ProteinApi(),
)

TOOL_DISPATCH: dict[str, Callable[..., Any]] = {}
for api in _API_INSTANCES:
    for attr in dir(api):
        if attr.startswith("_"):
            continue
        method = getattr(api, attr)
        if inspect.iscoroutinefunction(method):
            TOOL_DISPATCH[attr] = method


def call_openai_with_retry(
    client,
    model: str,
    messages: list,
    max_retries: int = 10,
    initial_wait: float = 25.0,
):
    """Call OpenAI API with retry logic for rate limits."""
    wait_time = initial_wait
    for attempt in range(max_retries):
        try:
            return client.chat.completions.create(model=model, messages=messages)
        except openai.RateLimitError:
            if attempt == max_retries - 1:
                raise
            print(
                f"\n⏳ Rate limited. Waiting {wait_time:.0f}s before retry ({attempt + 1}/{max_retries})..."
            )
            time.sleep(wait_time)
            # Exponential backoff with cap at 60 seconds
            wait_time = min(wait_time * 1.5, 60.0)
    raise RuntimeError("Max retries exceeded")


async def main():
    load_dotenv()
    OPENAI_MODEL = os.getenv("OPENAI_MODEL")

    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not found in .env file or environment.")
        sys.exit(1)

    # Initialize the Monarch API client
    api_client = MonarchClient()

    # Convert tools to JSON for the prompt
    tools_dict = await mcp.get_tools()
    tools = [tool.to_mcp_tool().model_dump(mode="json") for tool in tools_dict.values()]
    tools_json_str = json.dumps(tools, indent=2)

    system_prompt = f"""
You are an expert clinical geneticist and bioinformatics assistant specializing in phenotype analysis, disease diagnosis, and cross-species modeling. Your goal is to answer the user's question by breaking it down into a series of steps using the Monarch Initiative tools.

You will proceed in a loop of Thought, Action, and Observation.

At each step, you must first output your reasoning in a `Thought:` block. Then, you must specify your next move in an `Action:` block.

The `Action` must be a single JSON object with one of two formats:
1. To call a tool: `{{"tool_name": "function_to_call", "arguments": {{"arg1": "value1"}}}}`
2. To finish and give the final answer: `{{"tool_name": "finish", "answer": "Your final answer here."}}`

**IMPORTANT RULES:**
- You MUST choose a tool from the Available Tools list
- Consider using phenotype matching for diagnosis questions
- Use semantic similarity for finding related diseases
- Check for animal models when discussing potential therapies

**Available Tools:**
{tools_json_str}
"""

    print("\n--- Monarch Initiative ReAct Agent ---")
    print("Ask questions about phenotypes, diseases, genes, or clinical diagnosis.")
    print("Type 'exit' to quit.\n")

    try:
        while True:
            question = input("> ")
            if question.lower() == "exit":
                break

            history = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ]

            for i in range(15):  # Allow more steps for complex phenotype analysis
                print(f"\n--- Step {i + 1}: Reasoning ---")

                response = call_openai_with_retry(openai, OPENAI_MODEL, history)
                response_text = response.choices[0].message.content

                print(response_text)
                history.append({"role": "assistant", "content": response_text})

                try:
                    # Extract action JSON
                    action_json_str = ""
                    if "Action:" in response_text:
                        action_part = response_text.split("Action:", 1)[1].strip()
                        json_start = action_part.find("{")
                        json_end = action_part.rfind("}") + 1
                        if (
                            json_start != -1
                            and json_end != -1
                            and json_end > json_start
                        ):
                            action_json_str = action_part[json_start:json_end]

                    if not action_json_str:
                        print("Error: Could not find valid JSON in Action block.")
                        history.append(
                            {
                                "role": "user",
                                "content": "Observation: Error parsing action. Please ensure the Action block contains valid JSON.",
                            }
                        )
                        continue

                    action = json.loads(action_json_str)
                    tool_name = action.get("tool_name")

                    if tool_name == "finish":
                        final_answer = action.get("answer", "I have finished the task.")
                        print(f"\n✅ Final Answer:\n{final_answer}")
                        break

                    tool_callable = TOOL_DISPATCH.get(tool_name)
                    if tool_callable is None:
                        print(f"Error: Tool '{tool_name}' is not available.")
                        history.append(
                            {
                                "role": "user",
                                "content": f"Observation: Invalid tool name '{tool_name}'. Choose from available tools.",
                            }
                        )
                        continue

                    arguments = action.get("arguments", {})
                    print(f"--- Step {i + 1}: Action ---")
                    print(f"Calling: {tool_name}({arguments})")

                    observation = await tool_callable(api_client, **arguments)

                    # Format observation
                    obs_str = json.dumps(observation, indent=2)

                    # Truncate if too long
                    if len(obs_str) > 2000:
                        obs_str = obs_str[:2000] + "\n... (truncated)"

                    history.append(
                        {"role": "user", "content": f"Observation:\n{obs_str}"}
                    )
                    print(f"--- Step {i + 1}: Observation ---")
                    print(obs_str[:500] + "..." if len(obs_str) > 500 else obs_str)

                except json.JSONDecodeError as e:
                    print(f"Error: Could not parse Action JSON. Error: {e}")
                    history.append(
                        {
                            "role": "user",
                            "content": "Observation: Error parsing action JSON. Use valid JSON format.",
                        }
                    )
                except Exception as e:
                    print(f"Error during action: {e}")
                    history.append(
                        {
                            "role": "user",
                            "content": f"Observation: Error occurred: {str(e)}",
                        }
                    )
            else:
                print("\nWarning: Agent reached maximum steps without finishing.")

    except KeyboardInterrupt:
        print("\nExiting...")
    finally:
        await api_client.close()
        print("API client session closed.")


if __name__ == "__main__":
    asyncio.run(main())
