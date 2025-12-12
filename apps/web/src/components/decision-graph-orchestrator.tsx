/**
 * DecisionGraphOrchestrator Component
 *
 * Main orchestrator that manages the 4-step decision flow:
 * 1. Patient Context (optional)
 * 2. Anatomy Selection (UBERON)
 * 3. Phenotype Selection (HPO)
 * 4. Refinement (HPO children)
 * 5. Diagnosis (Semantic Similarity)
 * 6. Chat (LLM Q&A)
 */

import { api } from "@medicheck-ai/backend/convex/_generated/api";
import type { Id } from "@medicheck-ai/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
	Activity,
	Brain,
	CheckCircle2,
	Circle,
	MessageSquare,
	RefreshCcw,
	Stethoscope,
	User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	calculateConfidenceWithContext,
	type MonarchEntity,
	type PatientContext,
	type SimilarityMatch,
} from "@/lib/monarch-api";
import { cn } from "@/lib/utils";
import { AnatomySelector } from "./anatomy-selector";
import { DiagnosisChat } from "./diagnosis-chat";
import { DiagnosisSimSearch } from "./diagnosis-simsearch";
import { PatientContextForm } from "./patient-context-form";
import { PhenotypeFilter } from "./phenotype-filter";
import { RefinementTraversal } from "./refinement-traversal";

type Step =
	| "patient"
	| "anatomy"
	| "phenotype"
	| "refinement"
	| "diagnosis"
	| "chat";

interface Patient {
	firstName?: string;
	lastName?: string;
	sex?: string;
	dateOfBirth?: string;
	height?: number;
	weight?: number;
}

interface DecisionGraphOrchestratorProps {
	className?: string;
	patient?: Patient | null;
	consultationId?: string;
	onComplete?: (results: SimilarityMatch[]) => void;
}

interface StepInfo {
	id: Step;
	label: string;
	icon: React.ReactNode;
}

const STEPS: StepInfo[] = [
	{ id: "patient", label: "Patient", icon: <User className="h-4 w-4" /> },
	{ id: "anatomy", label: "Anatomy", icon: <Activity className="h-4 w-4" /> },
	{ id: "phenotype", label: "Symptoms", icon: <Brain className="h-4 w-4" /> },
	{
		id: "refinement",
		label: "Refine",
		icon: <CheckCircle2 className="h-4 w-4" />,
	},
	{
		id: "diagnosis",
		label: "Diagnosis",
		icon: <Stethoscope className="h-4 w-4" />,
	},
	{ id: "chat", label: "Chat", icon: <MessageSquare className="h-4 w-4" /> },
];

export function DecisionGraphOrchestrator({
	className,
	patient,
	consultationId,
	onComplete,
}: DecisionGraphOrchestratorProps) {
	// Current step
	const [currentStep, setCurrentStep] = useState<Step>("patient");

	// Patient context (demographics)
	const [patientContext, setPatientContext] = useState<PatientContext>({});

	// Auto-populate patient context from patient prop
	useEffect(() => {
		if (patient) {
			const calculateAgeCategory = (
				dateOfBirth: string,
			): PatientContext["ageCategory"] => {
				const birthDate = new Date(dateOfBirth);
				const today = new Date();
				let age = today.getFullYear() - birthDate.getFullYear();
				const monthDiff = today.getMonth() - birthDate.getMonth();
				if (
					monthDiff < 0 ||
					(monthDiff === 0 && today.getDate() < birthDate.getDate())
				) {
					age--;
				}

				if (age < 1 / 12) return "infant"; // neonate
				if (age < 1) return "infant";
				if (age < 12) return "child";
				if (age < 18) return "adolescent";
				if (age < 65) return "adult";
				return "elderly";
			};

			setPatientContext({
				ageCategory: patient.dateOfBirth
					? calculateAgeCategory(patient.dateOfBirth)
					: undefined,
				gender: patient.sex as PatientContext["gender"],
				heightCm: patient.height,
				weightKg: patient.weight,
			});
		}
	}, [patient]);

	// Selected anatomy (UBERON) - supports multiple
	const [selectedAnatomy, setSelectedAnatomy] = useState<MonarchEntity[]>([]);

	// Selected phenotypes (HPO)
	const [selectedPhenotypes, setSelectedPhenotypes] = useState<MonarchEntity[]>(
		[],
	);

	// Refined phenotypes (more specific HPO terms)
	const [refinedPhenotypes, setRefinedPhenotypes] = useState<MonarchEntity[]>(
		[],
	);

	// Diagnosis results
	const [diagnosisResults, setDiagnosisResults] = useState<SimilarityMatch[]>(
		[],
	);

	// Get current step index
	const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

	// Reset all state
	const handleReset = useCallback(() => {
		setCurrentStep("patient");
		setPatientContext({});
		setSelectedAnatomy([]);
		setSelectedPhenotypes([]);
		setRefinedPhenotypes([]);
		setDiagnosisResults([]);
	}, []);

	// Patient context handlers
	const handleUpdateContext = useCallback(
		(updates: Partial<PatientContext>) => {
			setPatientContext((prev) => ({ ...prev, ...updates }));
		},
		[],
	);

	// Phenotype handlers
	const handleAddPhenotype = useCallback((phenotype: MonarchEntity) => {
		setSelectedPhenotypes((prev) => {
			if (prev.some((p) => p.id === phenotype.id)) return prev;
			return [...prev, phenotype];
		});
	}, []);

	const handleRemovePhenotype = useCallback((id: string) => {
		setSelectedPhenotypes((prev) => prev.filter((p) => p.id !== id));
	}, []);

	// Refinement handlers
	const handleAddRefinement = useCallback((phenotype: MonarchEntity) => {
		setRefinedPhenotypes((prev) => {
			if (prev.some((p) => p.id === phenotype.id)) return prev;
			return [...prev, phenotype];
		});
	}, []);

	const handleRemoveRefinement = useCallback((id: string) => {
		setRefinedPhenotypes((prev) => prev.filter((p) => p.id !== id));
	}, []);

	// Diagnosis results handler - just store results, don't complete yet
	const handleResultsLoaded = useCallback((results: SimilarityMatch[]) => {
		setDiagnosisResults(results);
		// Don't call onComplete here - wait for user to finish in Chat step
	}, []);

	// Convex mutation for completing consultation
	const completeConsultation = useMutation(
		api.consultations.completeConsultation,
	);

	// Transform results for Convex (same logic as diagnosis-chat)
	const transformResultsForConvex = useCallback(
		(results: SimilarityMatch[]) => {
			const allScores = results.map((r) => r.score);

			return results.slice(0, 10).map((result, index) => {
				const confidence = calculateConfidenceWithContext(
					result.score,
					allScores,
					index,
				);

				const severity =
					confidence >= 85
						? ("high" as const)
						: confidence >= 70
							? ("medium" as const)
							: ("low" as const);

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
					probability: confidence,
					severity,
					matchedPhenotypes,
				};

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

	// Build structured input for saving
	const buildStructuredInput = useCallback(() => {
		const bodyParts = selectedAnatomy.map((a) => ({
			id: a.id,
			name: a.name,
		}));

		const allSymptoms = [...selectedPhenotypes, ...refinedPhenotypes];
		const selectedSymptoms = allSymptoms.map((p) => {
			const symptom: { id: string; name: string; description?: string } = {
				id: p.id,
				name: p.name,
			};
			// Only include description if it's a non-empty string (not null/undefined)
			if (p.description) {
				symptom.description = p.description;
			}
			return symptom;
		});

		return {
			bodyParts,
			factors: {},
			selectedSymptoms,
			severityScore: 5,
			patientInfo: {
				ageCategory: patientContext?.ageCategory || "adult",
				gender: patientContext?.gender || "unknown",
				height: patientContext?.heightCm,
				weight: patientContext?.weightKg,
			},
		};
	}, [selectedAnatomy, selectedPhenotypes, refinedPhenotypes, patientContext]);

	// Handle finish consultation from diagnosis step (without chat)
	const [isSaving, setIsSaving] = useState(false);

	const handleFinishFromDiagnosis = useCallback(async () => {
		if (!consultationId || isSaving) return;

		setIsSaving(true);
		try {
			const transformedResults = transformResultsForConvex(diagnosisResults);
			const structuredInput = buildStructuredInput();

			await completeConsultation({
				id: consultationId as Id<"consultations">,
				diagnosisResults: transformedResults,
				structuredInput,
			});
			onComplete?.(diagnosisResults);
		} catch (error) {
			console.error("Failed to save consultation:", error);
			onComplete?.(diagnosisResults);
		} finally {
			setIsSaving(false);
		}
	}, [
		consultationId,
		diagnosisResults,
		isSaving,
		completeConsultation,
		transformResultsForConvex,
		buildStructuredInput,
		onComplete,
	]);

	// Step indicator component
	const StepIndicator = () => (
		<div className="mb-6 flex items-center justify-center gap-1">
			{STEPS.map((step, index) => {
				const isActive = step.id === currentStep;
				const isCompleted = index < currentStepIndex;
				const isClickable = isCompleted || index === currentStepIndex;

				return (
					<div key={step.id} className="flex items-center">
						<button
							type="button"
							disabled={!isClickable}
							onClick={() => isClickable && setCurrentStep(step.id)}
							className={cn(
								"flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-xs transition-colors",
								isActive && "bg-primary text-primary-foreground",
								isCompleted &&
									!isActive &&
									"bg-primary/20 text-primary hover:bg-primary/30",
								!isActive &&
									!isCompleted &&
									"cursor-not-allowed bg-muted text-muted-foreground",
							)}
						>
							{isCompleted ? (
								<CheckCircle2 className="h-3.5 w-3.5" />
							) : isActive ? (
								step.icon
							) : (
								<Circle className="h-3.5 w-3.5" />
							)}
							<span className="hidden sm:inline">{step.label}</span>
						</button>
						{index < STEPS.length - 1 && (
							<div
								className={cn(
									"mx-1 h-0.5 w-4",
									index < currentStepIndex ? "bg-primary" : "bg-muted",
								)}
							/>
						)}
					</div>
				);
			})}
		</div>
	);

	// Summary badges
	const SummaryBadges = () => {
		const items: string[] = [];
		if (patientContext.ageCategory) items.push(patientContext.ageCategory);
		if (patientContext.gender) items.push(patientContext.gender);
		if (selectedAnatomy.length > 0) {
			items.push(...selectedAnatomy.map((a) => a.name));
		}
		if (selectedPhenotypes.length > 0)
			items.push(`${selectedPhenotypes.length} symptoms`);
		if (refinedPhenotypes.length > 0)
			items.push(`${refinedPhenotypes.length} refined`);

		if (items.length === 0) return null;

		return (
			<div className="mb-4 flex flex-wrap items-center justify-center gap-1.5">
				{items.map((item) => (
					<Badge key={item} variant="outline" className="text-xs">
						{item}
					</Badge>
				))}
				<Button
					variant="ghost"
					size="sm"
					onClick={handleReset}
					className="h-6 px-2 text-xs"
				>
					<RefreshCcw className="mr-1 h-3 w-3" />
					Reset
				</Button>
			</div>
		);
	};

	return (
		<div className={cn("mx-auto w-full max-w-3xl", className)}>
			<StepIndicator />
			<SummaryBadges />

			{/* Step: Patient Context */}
			{currentStep === "patient" && (
				<PatientContextForm
					patientContext={patientContext}
					onUpdateContext={handleUpdateContext}
					onProceed={() => setCurrentStep("anatomy")}
					onSkip={() => setCurrentStep("anatomy")}
				/>
			)}

			{/* Step: Anatomy Selection */}
			{currentStep === "anatomy" && (
				<AnatomySelector
					selectedAnatomy={selectedAnatomy}
					onAdd={(anatomy) => {
						setSelectedAnatomy((prev) => {
							if (prev.some((a) => a.id === anatomy.id)) return prev;
							return [...prev, anatomy];
						});
					}}
					onRemove={(id) => {
						setSelectedAnatomy((prev) => prev.filter((a) => a.id !== id));
					}}
					onProceed={() => setCurrentStep("phenotype")}
				/>
			)}

			{/* Step: Phenotype Selection */}
			{currentStep === "phenotype" && (
				<PhenotypeFilter
					selectedAnatomy={selectedAnatomy}
					selectedPhenotypes={selectedPhenotypes}
					onAddPhenotype={handleAddPhenotype}
					onRemovePhenotype={handleRemovePhenotype}
					onProceed={() => setCurrentStep("refinement")}
					onBack={() => setCurrentStep("anatomy")}
				/>
			)}

			{/* Step: Refinement */}
			{currentStep === "refinement" && (
				<RefinementTraversal
					selectedPhenotypes={selectedPhenotypes}
					refinedPhenotypes={refinedPhenotypes}
					onAddRefinement={handleAddRefinement}
					onRemoveRefinement={handleRemoveRefinement}
					onProceed={() => setCurrentStep("diagnosis")}
					onBack={() => setCurrentStep("phenotype")}
				/>
			)}

			{/* Step: Diagnosis Results */}
			{currentStep === "diagnosis" && (
				<DiagnosisSimSearch
					selectedPhenotypes={selectedPhenotypes}
					refinedPhenotypes={refinedPhenotypes}
					patientContext={patientContext}
					diagnosisResults={diagnosisResults}
					onResultsLoaded={handleResultsLoaded}
					onProceedToChat={() => setCurrentStep("chat")}
					onFinishConsultation={handleFinishFromDiagnosis}
					isSaving={isSaving}
					onBack={() => setCurrentStep("refinement")}
					onReset={handleReset}
				/>
			)}

			{/* Step: Chat */}
			{currentStep === "chat" && (
				<DiagnosisChat
					selectedPhenotypes={selectedPhenotypes}
					refinedPhenotypes={refinedPhenotypes}
					selectedAnatomy={selectedAnatomy}
					diagnosisResults={diagnosisResults}
					patientContext={patientContext}
					consultationId={consultationId}
					onBack={() => setCurrentStep("diagnosis")}
					onReset={handleReset}
					onComplete={
						onComplete ? () => onComplete(diagnosisResults) : undefined
					}
				/>
			)}
		</div>
	);
}
