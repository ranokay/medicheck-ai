import cors from "cors";
import express from "express";
import neo4j, { type Driver, type Record as Neo4jRecord } from "neo4j-driver";

const app = express();
app.use(cors());
app.use(express.json());

// Neo4j driver - connects to Monarch KG
// Default to Monarch's public instance, but can be overridden for local
const NEO4J_URI = process.env.NEO4J_URI || "bolt://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || ""; // Monarch public instance may not need auth

let driver: Driver;

try {
	driver = neo4j.driver(
		NEO4J_URI,
		NEO4J_PASSWORD ? neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD) : undefined,
	);
	console.log(`Connected to Neo4j at ${NEO4J_URI}`);
} catch (error) {
	console.error("Failed to connect to Neo4j:", error);
	process.exit(1);
}

// Health check
app.get("/health", async (_req, res) => {
	try {
		const session = driver.session();
		await session.run("RETURN 1");
		await session.close();
		res.json({ status: "ok", neo4j: "connected" });
	} catch (error) {
		res.status(500).json({ status: "error", error: String(error) });
	}
});

// Interface types
interface CandidateDisease {
	id: string;
	name: string;
	description?: string;
	matchedPhenotypes: number;
	totalPhenotypes: number;
	matchScore: number;
}

interface Phenotype {
	id: string;
	name: string;
	description?: string;
}

/**
 * POST /candidate-diseases
 * Given a list of phenotype/symptom names (in English), find diseases that match
 */
app.post("/candidate-diseases", async (req, res) => {
	const { phenotypes, limit = 20 } = req.body as {
		phenotypes: string[];
		limit?: number;
	};

	if (!phenotypes || !Array.isArray(phenotypes) || phenotypes.length === 0) {
		return res.status(400).json({ error: "phenotypes array is required" });
	}

	const session = driver.session();

	try {
		// Monarch KG uses biolink model - Disease and Phenotype nodes connected by associations
		// This query finds diseases associated with the given phenotypes
		const cypher = `
			// First, find phenotypes that match the input terms
			MATCH (p:Phenotype)
			WHERE any(term IN $phenotypeTerms WHERE toLower(p.name) CONTAINS toLower(term))

			// Then find diseases associated with these phenotypes
			MATCH (d:Disease)-[r]-(p)
			WHERE type(r) IN ['biolink:has_phenotype', 'has_phenotype', 'HAS_PHENOTYPE', 'PHENOTYPE_OF']

			// Count matches and get disease details
			WITH d, collect(DISTINCT p.name) AS matchedPhenotypeNames, count(DISTINCT p) AS matchedCount

			// Get total phenotypes for this disease
			OPTIONAL MATCH (d)-[r2]-(allP:Phenotype)
			WHERE type(r2) IN ['biolink:has_phenotype', 'has_phenotype', 'HAS_PHENOTYPE', 'PHENOTYPE_OF']

			WITH d, matchedPhenotypeNames, matchedCount, count(DISTINCT allP) AS totalPhenotypes

			RETURN
				d.id AS disease_id,
				d.name AS disease_name,
				d.description AS disease_description,
				matchedCount AS matched_phenotypes,
				totalPhenotypes AS total_phenotypes,
				toFloat(matchedCount) / CASE WHEN totalPhenotypes > 0 THEN totalPhenotypes ELSE 1 END AS match_score
			ORDER BY match_score DESC, matchedCount DESC
			LIMIT $limit
		`;

		const result = await session.run(cypher, {
			phenotypeTerms: phenotypes,
			limit: neo4j.int(limit),
		});

		const diseases: CandidateDisease[] = result.records.map(
			(record: Neo4jRecord) => ({
				id: record.get("disease_id") || "",
				name: record.get("disease_name") || "Unknown",
				description: record.get("disease_description") || undefined,
				matchedPhenotypes:
					record.get("matched_phenotypes")?.toInt?.() ??
					record.get("matched_phenotypes") ??
					0,
				totalPhenotypes:
					record.get("total_phenotypes")?.toInt?.() ??
					record.get("total_phenotypes") ??
					0,
				matchScore: record.get("match_score") ?? 0,
			}),
		);

		res.json({ diseases, query: { phenotypes, limit } });
	} catch (error) {
		console.error("KG query failed:", error);
		res.status(500).json({ error: "KG query failed", details: String(error) });
	} finally {
		await session.close();
	}
});

/**
 * POST /related-phenotypes
 * Given candidate diseases, find additional phenotypes that could help differentiate them
 */
app.post("/related-phenotypes", async (req, res) => {
	const {
		diseaseIds,
		excludePhenotypes = [],
		limit = 15,
	} = req.body as {
		diseaseIds: string[];
		excludePhenotypes?: string[];
		limit?: number;
	};

	if (!diseaseIds || !Array.isArray(diseaseIds) || diseaseIds.length === 0) {
		return res.status(400).json({ error: "diseaseIds array is required" });
	}

	const session = driver.session();

	try {
		// Find phenotypes associated with the candidate diseases that haven't been asked about
		const cypher = `
			MATCH (d:Disease)-[r]-(p:Phenotype)
			WHERE d.id IN $diseaseIds
			AND type(r) IN ['biolink:has_phenotype', 'has_phenotype', 'HAS_PHENOTYPE', 'PHENOTYPE_OF']
			AND NOT toLower(p.name) IN $excludeLower

			// Count how many of the candidate diseases have this phenotype
			WITH p, count(DISTINCT d) AS diseaseCount, collect(DISTINCT d.name) AS diseaseNames

			// Prioritize phenotypes that differentiate between candidates
			RETURN
				p.id AS phenotype_id,
				p.name AS phenotype_name,
				p.description AS phenotype_description,
				diseaseCount,
				diseaseNames
			ORDER BY diseaseCount DESC
			LIMIT $limit
		`;

		const result = await session.run(cypher, {
			diseaseIds,
			excludeLower: excludePhenotypes.map((p) => p.toLowerCase()),
			limit: neo4j.int(limit),
		});

		const phenotypes: (Phenotype & {
			diseaseCount: number;
			diseaseNames: string[];
		})[] = result.records.map((record: Neo4jRecord) => ({
			id: record.get("phenotype_id") || "",
			name: record.get("phenotype_name") || "Unknown",
			description: record.get("phenotype_description") || undefined,
			diseaseCount:
				record.get("diseaseCount")?.toInt?.() ??
				record.get("diseaseCount") ??
				0,
			diseaseNames: record.get("diseaseNames") || [],
		}));

		res.json({ phenotypes, query: { diseaseIds, excludePhenotypes, limit } });
	} catch (error) {
		console.error("KG query failed:", error);
		res.status(500).json({ error: "KG query failed", details: String(error) });
	} finally {
		await session.close();
	}
});

/**
 * POST /search-phenotypes
 * Search for phenotypes by name (for symptom normalization)
 */
app.post("/search-phenotypes", async (req, res) => {
	const { query, limit = 10 } = req.body as { query: string; limit?: number };

	if (!query || typeof query !== "string") {
		return res.status(400).json({ error: "query string is required" });
	}

	const session = driver.session();

	try {
		const cypher = `
			MATCH (p:Phenotype)
			WHERE toLower(p.name) CONTAINS toLower($query)
			RETURN
				p.id AS phenotype_id,
				p.name AS phenotype_name,
				p.description AS phenotype_description
			LIMIT $limit
		`;

		const result = await session.run(cypher, {
			query,
			limit: neo4j.int(limit),
		});

		const phenotypes: Phenotype[] = result.records.map(
			(record: Neo4jRecord) => ({
				id: record.get("phenotype_id") || "",
				name: record.get("phenotype_name") || "Unknown",
				description: record.get("phenotype_description") || undefined,
			}),
		);

		res.json({ phenotypes, query: { search: query, limit } });
	} catch (error) {
		console.error("KG query failed:", error);
		res.status(500).json({ error: "KG query failed", details: String(error) });
	} finally {
		await session.close();
	}
});

/**
 * GET /disease/:id
 * Get detailed information about a specific disease
 */
app.get("/disease/:id", async (req, res) => {
	const { id } = req.params;

	const session = driver.session();

	try {
		const cypher = `
			MATCH (d:Disease {id: $diseaseId})
			OPTIONAL MATCH (d)-[r]-(p:Phenotype)
			WHERE type(r) IN ['biolink:has_phenotype', 'has_phenotype', 'HAS_PHENOTYPE', 'PHENOTYPE_OF']
			WITH d, collect(DISTINCT {id: p.id, name: p.name}) AS phenotypes
			RETURN
				d.id AS disease_id,
				d.name AS disease_name,
				d.description AS disease_description,
				phenotypes
		`;

		const result = await session.run(cypher, { diseaseId: id });

		if (result.records.length === 0) {
			return res.status(404).json({ error: "Disease not found" });
		}

		const record = result.records[0];
		res.json({
			id: record.get("disease_id"),
			name: record.get("disease_name"),
			description: record.get("disease_description"),
			phenotypes: record.get("phenotypes") || [],
		});
	} catch (error) {
		console.error("KG query failed:", error);
		res.status(500).json({ error: "KG query failed", details: String(error) });
	} finally {
		await session.close();
	}
});

// Graceful shutdown
process.on("SIGINT", async () => {
	console.log("Shutting down...");
	await driver.close();
	process.exit(0);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`KG Service listening on http://localhost:${PORT}`);
	console.log(`Neo4j URI: ${NEO4J_URI}`);
});
