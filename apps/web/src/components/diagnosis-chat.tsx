/**
 * DiagnosisChat Component
 *
 * LLM-powered chat interface for Q&A about diagnosis results.
 * Uses the Monarch API endpoints directly.
 *
 * IMPORTANT: The LLM does NOT make diagnostic decisions.
 * All diagnosis is done through semantic similarity.
 * The LLM only helps explain results and answer questions.
 */

import { api } from "@medicheck-ai/backend/convex/_generated/api";
import type { Id } from "@medicheck-ai/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
	Bot,
	CheckCircle,
	ChevronLeft,
	Loader2,
	RefreshCcw,
	Send,
	Sparkles,
	User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	calculateConfidenceWithContext,
	type MonarchEntity,
	monarchAPI,
	type PatientContext,
	type SimilarityMatch,
} from "@/lib/monarch-api";
import { cn } from "@/lib/utils";

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	timestamp: number;
}

interface SelectedAnatomy {
	id: string;
	name: string;
}

interface DiagnosisChatProps {
	selectedPhenotypes: MonarchEntity[];
	refinedPhenotypes: MonarchEntity[];
	selectedAnatomy: SelectedAnatomy[];
	diagnosisResults: SimilarityMatch[];
	patientContext?: PatientContext;
	consultationId?: string;
	onBack: () => void;
	onReset: () => void;
	onComplete?: () => void;
	className?: string;
}

const EXAMPLE_QUESTIONS = [
	"What does this condition mean in simple terms?",
	"What are the most common symptoms of this disease?",
	"What tests might a doctor recommend?",
	"Should I see a specialist? What type?",
	"Are there any lifestyle changes that could help?",
	"What are the treatment options?",
];

export function DiagnosisChat({
	selectedPhenotypes,
	refinedPhenotypes,
	selectedAnatomy,
	diagnosisResults,
	patientContext,
	consultationId,
	onBack,
	onReset,
	onComplete,
	className,
}: DiagnosisChatProps) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Convex mutations for saving diagnosis
	const completeConsultation = useMutation(
		api.consultations.completeConsultation,
	);

	// Transform SimilarityMatch[] to the expected Convex schema format
	const transformResultsForConvex = useCallback(
		(results: SimilarityMatch[]) => {
			// Get all scores for context-aware confidence calculation
			const allScores = results.map((r) => r.score);

			return results.slice(0, 10).map((result, index) => {
				// Calculate normalized confidence (0-100%)
				const confidence = calculateConfidenceWithContext(
					result.score,
					allScores,
					index,
				);

				// Determine severity based on normalized confidence
				const severity =
					confidence >= 85
						? ("high" as const)
						: confidence >= 70
							? ("medium" as const)
							: ("low" as const);

				// Extract matched phenotypes from the similarity data
				const matchedPhenotypes =
					result.similarity?.object_best_matches?.matches
						?.slice(0, 5)
						.map((match) => ({
							id: match.match_target || "",
							name: match.match_target_label || "",
							frequency: match.score
								? `${(match.score * 100).toFixed(0)}%`
								: undefined,
						})) || [];

				// Build the result object, only including defined values
				// Convex validators don't accept null, only undefined or omitted keys
				const diagnosisResult: {
					conditionName: string;
					conditionId?: string;
					mondoId?: string;
					probability: number;
					severity: "low" | "medium" | "high";
					description?: string;
					matchedPhenotypes: Array<{
						id: string;
						name: string;
						frequency?: string;
					}>;
				} = {
					conditionName: result.subject.name,
					probability: confidence, // Use normalized confidence instead of raw score
					severity,
					matchedPhenotypes,
				};

				// Only add optional fields if they have actual values
				if (result.subject.id) {
					diagnosisResult.conditionId = result.subject.id;
				}
				if (result.subject.id?.startsWith("MONDO:")) {
					diagnosisResult.mondoId = result.subject.id;
				}
				if (result.subject.description) {
					diagnosisResult.description = result.subject.description;
				}

				return diagnosisResult;
			});
		},
		[],
	);

	// Build structured input for saving to Convex
	const buildStructuredInput = useCallback(() => {
		// Map body parts (anatomy) to the expected format
		const bodyParts = selectedAnatomy.map((a) => ({
			id: a.id,
			name: a.name,
		}));

		// Combine all selected symptoms as dynamicSymptoms
		const allSymptoms = [...selectedPhenotypes, ...refinedPhenotypes];
		const selectedSymptoms = allSymptoms.map((p) => {
			const symptom: { id: string; name: string; description?: string } = {
				id: p.id,
				name: p.name,
			};
			if (p.description) {
				symptom.description = p.description;
			}
			return symptom;
		});

		return {
			bodyParts,
			factors: {}, // We don't use the old factor system anymore
			selectedSymptoms,
			severityScore: 5, // Default score
			patientInfo: {
				ageCategory: patientContext?.ageCategory || "adult",
				gender: patientContext?.gender || "unknown",
				height: patientContext?.heightCm,
				weight: patientContext?.weightKg,
			},
		};
	}, [selectedAnatomy, selectedPhenotypes, refinedPhenotypes, patientContext]);

	// Handle finish consultation
	const handleFinishConsultation = useCallback(async () => {
		if (!consultationId || isSaving) return;

		setIsSaving(true);
		try {
			const transformedResults = transformResultsForConvex(diagnosisResults);
			const structuredInput = buildStructuredInput();

			// Transform chat messages to match Convex schema
			const chatHistory = messages.map((msg) => ({
				role: msg.role as "user" | "assistant",
				content: msg.content,
				timestamp: msg.timestamp,
			}));

			await completeConsultation({
				id: consultationId as Id<"consultations">,
				diagnosisResults: transformedResults,
				structuredInput,
				chatHistory: chatHistory.length > 0 ? chatHistory : undefined,
			});
			onComplete?.();
		} catch (error) {
			console.error("Failed to save consultation:", error);
			// Still call onComplete to allow navigation
			onComplete?.();
		} finally {
			setIsSaving(false);
		}
	}, [
		consultationId,
		diagnosisResults,
		messages,
		isSaving,
		completeConsultation,
		transformResultsForConvex,
		buildStructuredInput,
		onComplete,
	]);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (scrollAreaRef.current) {
			const scrollContainer = scrollAreaRef.current.querySelector(
				"[data-radix-scroll-area-viewport]",
			);
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}
		}
	}, []);

	// Focus input on mount
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	// Build context for the LLM
	const buildContext = useCallback(() => {
		const allPhenotypes = [...selectedPhenotypes, ...refinedPhenotypes];
		const phenotypeNames = allPhenotypes.map((p) => p.name).join(", ");
		const topDiseases = diagnosisResults
			.slice(0, 5)
			.map(
				(d, i) => `${i + 1}. ${d.subject.name} (score: ${d.score.toFixed(2)})`,
			)
			.join("\n");

		let contextStr = `Patient symptoms: ${phenotypeNames}\n\nTop matching conditions:\n${topDiseases}`;

		if (patientContext) {
			const demographics: string[] = [];
			if (patientContext.ageCategory)
				demographics.push(`Age: ${patientContext.ageCategory}`);
			if (patientContext.gender)
				demographics.push(`Gender: ${patientContext.gender}`);
			if (patientContext.heightCm)
				demographics.push(`Height: ${patientContext.heightCm}cm`);
			if (patientContext.weightKg)
				demographics.push(`Weight: ${patientContext.weightKg}kg`);
			if (demographics.length > 0) {
				contextStr = `Patient demographics: ${demographics.join(", ")}\n\n${contextStr}`;
			}
		}

		return contextStr;
	}, [selectedPhenotypes, refinedPhenotypes, diagnosisResults, patientContext]);

	// Send message to LLM
	const sendMessage = useCallback(
		async (content: string) => {
			if (!content.trim() || isLoading) return;

			const userMessage: ChatMessage = {
				role: "user",
				content: content.trim(),
				timestamp: Date.now(),
			};

			setMessages((prev) => [...prev, userMessage]);
			setInputValue("");
			setIsLoading(true);

			try {
				const response = await monarchAPI.chat({
					message: content.trim(),
					context: buildContext(),
					history: messages.map((m) => ({
						role: m.role,
						content: m.content,
					})),
				});

				const assistantMessage: ChatMessage = {
					role: "assistant",
					content: response.response,
					timestamp: Date.now(),
				};

				setMessages((prev) => [...prev, assistantMessage]);
			} catch (error) {
				console.error("Chat error:", error);
				const errorMessage: ChatMessage = {
					role: "assistant",
					content:
						"I apologize, but I encountered an error processing your question. Please try again.",
					timestamp: Date.now(),
				};
				setMessages((prev) => [...prev, errorMessage]);
			} finally {
				setIsLoading(false);
			}
		},
		[isLoading, messages, buildContext],
	);

	// Handle send button click
	const handleSend = useCallback(() => {
		sendMessage(inputValue);
	}, [inputValue, sendMessage]);

	// Handle key press
	const handleKeyPress = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[handleSend],
	);

	// Format timestamp
	const formatTime = (timestamp: number) => {
		return new Date(timestamp).toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Context summary
	const contextSummary = {
		symptoms: selectedPhenotypes.length,
		conditions: diagnosisResults.length,
		topCondition: diagnosisResults[0]?.subject.name || null,
	};

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			{/* Header Card */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-lg">
						<Sparkles className="h-5 w-5 text-primary" />
						Ask Questions About Your Results
					</CardTitle>
					<CardDescription>
						Chat with our AI assistant to understand your diagnosis results
						better. Remember: this is for educational purposes only.
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="flex flex-wrap gap-2">
						<Badge variant="secondary" className="text-xs">
							{contextSummary.symptoms} symptoms
						</Badge>
						<Badge variant="secondary" className="text-xs">
							{contextSummary.conditions} conditions found
						</Badge>
						{contextSummary.topCondition && (
							<Badge variant="outline" className="text-xs">
								Top: {contextSummary.topCondition}
							</Badge>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Chat Card */}
			<Card className="flex flex-1 flex-col">
				<CardContent className="flex-1 p-0">
					<ScrollArea ref={scrollAreaRef} className="h-[400px] p-4">
						{messages.length === 0 ? (
							<div className="flex h-full flex-col items-center justify-center space-y-4">
								<Sparkles className="h-12 w-12 text-muted-foreground/50" />
								<div className="space-y-2 text-center">
									<p className="font-medium text-muted-foreground">
										Ask me anything about your results
									</p>
									<p className="text-muted-foreground/70 text-sm">
										I can explain conditions, symptoms, and what steps to take
										next
									</p>
								</div>

								{/* Example Questions */}
								<div className="mt-4 flex flex-wrap justify-center gap-2">
									{EXAMPLE_QUESTIONS.slice(0, 4).map((question) => (
										<Button
											key={question}
											variant="outline"
											size="sm"
											className="text-xs"
											onClick={() => sendMessage(question)}
										>
											{question}
										</Button>
									))}
								</div>
							</div>
						) : (
							<div className="space-y-4">
								{messages.map((message) => (
									<div
										key={message.timestamp}
										className={cn(
											"flex gap-3",
											message.role === "user" ? "justify-end" : "justify-start",
										)}
									>
										{message.role === "assistant" && (
											<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
												<Bot className="h-4 w-4" />
											</div>
										)}
										<div
											className={cn(
												"max-w-[80%] rounded-lg px-4 py-2",
												message.role === "user"
													? "bg-primary text-primary-foreground"
													: "bg-muted",
											)}
										>
											<p className="whitespace-pre-wrap text-sm">
												{message.content}
											</p>
											<p
												className={cn(
													"mt-1 text-[10px]",
													message.role === "user"
														? "text-primary-foreground/70"
														: "text-muted-foreground",
												)}
											>
												{formatTime(message.timestamp)}
											</p>
										</div>
										{message.role === "user" && (
											<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
												<User className="h-4 w-4" />
											</div>
										)}
									</div>
								))}

								{/* Loading indicator */}
								{isLoading && (
									<div className="flex gap-3">
										<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
											<Bot className="h-4 w-4" />
										</div>
										<div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
											<Loader2 className="h-4 w-4 animate-spin" />
											<span className="text-muted-foreground text-sm">
												Thinking...
											</span>
										</div>
									</div>
								)}
							</div>
						)}
					</ScrollArea>
				</CardContent>

				{/* Input Area */}
				<div className="border-t p-4">
					<div className="flex gap-2">
						<Input
							ref={inputRef}
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={handleKeyPress}
							placeholder="Ask a question about your results..."
							disabled={isLoading}
							className="flex-1"
						/>
						<Button
							onClick={handleSend}
							disabled={!inputValue.trim() || isLoading}
							size="icon"
						>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Send className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>
			</Card>

			{/* Navigation */}
			<div className="flex justify-between">
				<Button variant="outline" onClick={onBack}>
					<ChevronLeft className="mr-2 h-4 w-4" />
					Back to Results
				</Button>
				<div className="flex gap-2">
					<Button variant="outline" onClick={onReset}>
						<RefreshCcw className="mr-2 h-4 w-4" />
						Start Over
					</Button>
					{consultationId && (
						<Button onClick={handleFinishConsultation} disabled={isSaving}>
							{isSaving ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<CheckCircle className="mr-2 h-4 w-4" />
							)}
							Finish Consultation
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
