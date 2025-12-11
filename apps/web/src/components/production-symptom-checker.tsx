import { api } from "@medicheck-ai/backend/convex/_generated/api";
import type { Id } from "@medicheck-ai/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
	Activity,
	AlertTriangle,
	Check,
	ChevronLeft,
	ChevronRight,
	FileText,
	Loader2,
	Search,
	Sparkles,
	Stethoscope,
	User,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
// Import body parts and symptom factors data
import {
	BODY_SYSTEMS,
	type BodyPart,
	type BodySystem,
	COMMON_BODY_PARTS,
	getBodyPartsBySystem,
	searchBodyParts,
} from "@/lib/body-parts-data";
import {
	getFactorById,
	getHpoIdsFromFactors,
	getMergedSymptomProfiles,
	type SymptomFactorCategory,
	type SymptomSpecificCategory,
} from "@/lib/symptom-factors-data";
import { cn } from "@/lib/utils";

// Step configuration
const STEPS = [
	{ id: 1, name: "Body Parts", nameRo: "Zone Afectate", icon: User },
	{
		id: 2,
		name: "Symptom Details",
		nameRo: "Detalii Simptome",
		icon: Stethoscope,
	},
	{ id: 3, name: "Patient Info", nameRo: "Date Pacient", icon: FileText },
	{ id: 4, name: "Results", nameRo: "Rezultate", icon: Sparkles },
] as const;

// Age categories with Romanian translations
const AGE_CATEGORIES = [
	{ value: "infant", label: "Infant (0-1 year)", labelRo: "Sugar (0-1 an)" },
	{ value: "child", label: "Child (1-12 years)", labelRo: "Copil (1-12 ani)" },
	{
		value: "adolescent",
		label: "Adolescent (12-18 years)",
		labelRo: "Adolescent (12-18 ani)",
	},
	{
		value: "young_adult",
		label: "Young Adult (18-35 years)",
		labelRo: "Adult tânăr (18-35 ani)",
	},
	{
		value: "adult",
		label: "Adult (35-60 years)",
		labelRo: "Adult (35-60 ani)",
	},
	{
		value: "senior",
		label: "Senior (60+ years)",
		labelRo: "Vârstnic (60+ ani)",
	},
];

// Component props
interface ProductionSymptomCheckerProps {
	patientId?: Id<"patients">;
	consultationId?: string;
	language?: "en" | "ro";
	onComplete?: (results: DiagnosisResult) => void;
}

// Diagnosis result type
interface DiagnosisResult {
	diagnoses: Array<{
		id: string;
		name: string;
		probability: number;
		description?: string;
		mondoId?: string;
	}>;
	urgencyLevel: "low" | "medium" | "high" | "emergency";
	recommendations: string[];
	additionalTests?: string[];
	timestamp: Date;
}

// Selected data state
interface SymptomCheckState {
	selectedBodyParts: BodyPart[];
	selectedFactors: Record<SymptomFactorCategory, string[]>;
	// New symptom-specific factors (Mayo Clinic style)
	symptomSpecificFactors: Record<string, string[]>; // categoryId -> factorIds
	additionalNotes: string;
	severity: number;
	patientInfo: {
		ageCategory: string;
		gender: string;
		height?: number;
		weight?: number;
	};
}

const initialState: SymptomCheckState = {
	selectedBodyParts: [],
	selectedFactors: {
		pain_quality: [],
		triggers: [],
		relief: [],
		accompanying: [],
		duration: [],
		severity: [],
		onset: [],
		frequency: [],
		location_modifier: [],
	},
	symptomSpecificFactors: {},
	additionalNotes: "",
	severity: 5,
	patientInfo: {
		ageCategory: "",
		gender: "",
		height: undefined,
		weight: undefined,
	},
};

export function ProductionSymptomChecker({
	patientId,
	consultationId,
	language = "ro",
	onComplete,
}: ProductionSymptomCheckerProps) {
	// State
	const [currentStep, setCurrentStep] = useState(1);
	const [state, setState] = useState<SymptomCheckState>(initialState);
	const [isSaving, setIsSaving] = useState(false);
	const [bodyPartSearch, setBodyPartSearch] = useState("");
	const [activeBodySystem, setActiveBodySystem] = useState<
		BodySystem | "general"
	>("general");
	const [isLoading, setIsLoading] = useState(false);
	const [results, setResults] = useState<DiagnosisResult | null>(null);
	const [showEmergencyWarning, setShowEmergencyWarning] = useState(false);

	// Dynamic symptoms from kg-service - grouped by body part
	const [groupedSymptoms, setGroupedSymptoms] = useState<
		Record<
			string,
			{
				bodyPart: { id: string; name: string; nameRo: string };
				symptoms: Array<{
					id: string;
					name: string;
					description?: string | null;
				}>;
			}
		>
	>({});
	const [commonSymptoms, setCommonSymptoms] = useState<
		Array<{
			id: string;
			name: string;
			description?: string | null;
			count: number;
		}>
	>([]);
	const [selectedDynamicSymptoms, setSelectedDynamicSymptoms] = useState<
		Set<string>
	>(new Set());
	const [isLoadingSymptoms, setIsLoadingSymptoms] = useState(false);

	// Fetch patient data from Convex
	const patient = useQuery(
		api.patients.getPatient,
		patientId ? { id: patientId } : "skip",
	);

	// Convex mutations for saving
	const updateStructuredInput = useMutation(
		api.consultations.updateStructuredInput,
	);
	const saveDiagnosisResults = useMutation(
		api.consultations.saveDiagnosisResults,
	);

	// Helper function to calculate age category from date of birth
	const getAgeCategoryFromDOB = useCallback((dateOfBirth: string): string => {
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

		if (age < 1) return "infant";
		if (age < 12) return "child";
		if (age < 18) return "adolescent";
		if (age < 35) return "young_adult";
		if (age < 60) return "adult";
		return "senior";
	}, []);

	// Pre-populate patient info when patient data is loaded
	useEffect(() => {
		if (patient) {
			setState((prev) => ({
				...prev,
				patientInfo: {
					...prev.patientInfo,
					ageCategory: patient.dateOfBirth
						? getAgeCategoryFromDOB(patient.dateOfBirth)
						: prev.patientInfo.ageCategory,
					gender: patient.sex || prev.patientInfo.gender,
				},
			}));
		}
	}, [patient, getAgeCategoryFromDOB]);

	// Translation helper
	const t = useCallback(
		(en: string, ro: string) => (language === "ro" ? ro : en),
		[language],
	);

	// Filter body parts based on search and active system
	const filteredBodyParts = useMemo(() => {
		if (bodyPartSearch) {
			return searchBodyParts(bodyPartSearch);
		}
		if (activeBodySystem === "general") {
			return COMMON_BODY_PARTS.slice(0, 30); // Show first 30 as "most common"
		}
		return getBodyPartsBySystem(activeBodySystem);
	}, [bodyPartSearch, activeBodySystem]);

	// Progress calculation
	const progress = useMemo(() => {
		const stepProgress = ((currentStep - 1) / (STEPS.length - 1)) * 100;
		return Math.min(stepProgress, 100);
	}, [currentStep]);

	// Check for emergency symptoms
	const checkEmergencySymptoms = useCallback(() => {
		const selectedAccompanying = state.selectedFactors.accompanying;
		const accompaniedByEmergency = selectedAccompanying.some((id) => {
			const factor = getFactorById(id);
			return (
				factor?.name.includes("Fainting") ||
				factor?.name.includes("Shortness of breath") ||
				factor?.name.includes("Confusion")
			);
		});

		// Check for chest + severe + sudden onset
		const hasChest = state.selectedBodyParts.some(
			(p) => p.parentSystem === "cardiovascular" || p.id.includes("chest"),
		);
		const hasSevere = state.severity >= 8;
		const hasSuddenOnset = state.selectedFactors.onset.includes("on_sudden");

		if ((hasChest && hasSevere && hasSuddenOnset) || accompaniedByEmergency) {
			setShowEmergencyWarning(true);
		}
	}, [state]);

	// Fetch dynamic symptoms when body parts change
	const fetchDynamicSymptoms = useCallback(async () => {
		if (state.selectedBodyParts.length === 0) {
			setGroupedSymptoms({});
			setCommonSymptoms([]);
			return;
		}

		setIsLoadingSymptoms(true);
		try {
			// Fetch symptoms for each body part separately
			const perPartSymptoms: Record<
				string,
				{
					bodyPart: { id: string; name: string; nameRo: string };
					symptoms: Array<{
						id: string;
						name: string;
						description?: string | null;
					}>;
				}
			> = {};
			const symptomOccurrences: Map<
				string,
				{
					symptom: { id: string; name: string; description?: string | null };
					count: number;
				}
			> = new Map();

			await Promise.all(
				state.selectedBodyParts.map(async (bodyPart) => {
					const response = await fetch(
						"http://localhost:4000/symptoms-for-body-parts",
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								bodyPartNames: [bodyPart.name.toLowerCase()],
								limit: 20,
							}),
						},
					);

					if (response.ok) {
						const data = (await response.json()) as {
							phenotypes: Array<{
								id: string;
								name: string;
								description?: string | null;
							}>;
						};

						perPartSymptoms[bodyPart.id] = {
							bodyPart: {
								id: bodyPart.id,
								name: bodyPart.name,
								nameRo: bodyPart.nameRo,
							},
							symptoms: data.phenotypes,
						};

						// Track symptom occurrences across body parts
						for (const symptom of data.phenotypes) {
							const existing = symptomOccurrences.get(symptom.id);
							if (existing) {
								existing.count += 1;
							} else {
								symptomOccurrences.set(symptom.id, { symptom, count: 1 });
							}
						}
					}
				}),
			);

			// Find common symptoms (appear in 2+ body parts)
			const common: Array<{
				id: string;
				name: string;
				description?: string | null;
				count: number;
			}> = [];
			const commonIds = new Set<string>();

			for (const [id, data] of symptomOccurrences) {
				if (data.count >= 2) {
					common.push({ ...data.symptom, count: data.count });
					commonIds.add(id);
				}
			}

			// Remove common symptoms from individual body part lists
			for (const partId of Object.keys(perPartSymptoms)) {
				perPartSymptoms[partId].symptoms = perPartSymptoms[
					partId
				].symptoms.filter((s) => !commonIds.has(s.id));
			}

			// Sort common symptoms by count (most common first)
			common.sort((a, b) => b.count - a.count);

			setGroupedSymptoms(perPartSymptoms);
			setCommonSymptoms(common);
		} catch (error) {
			console.error("Failed to fetch symptoms:", error);
		} finally {
			setIsLoadingSymptoms(false);
		}
	}, [state.selectedBodyParts]);

	// Toggle dynamic symptom selection
	const toggleDynamicSymptom = useCallback((symptomId: string) => {
		setSelectedDynamicSymptoms((prev) => {
			const next = new Set(prev);
			if (next.has(symptomId)) {
				next.delete(symptomId);
			} else {
				next.add(symptomId);
			}
			return next;
		});
	}, []);

	// Handle body part selection
	const toggleBodyPart = useCallback((part: BodyPart) => {
		setState((prev) => {
			const isSelected = prev.selectedBodyParts.some((p) => p.id === part.id);
			return {
				...prev,
				selectedBodyParts: isSelected
					? prev.selectedBodyParts.filter((p) => p.id !== part.id)
					: [...prev.selectedBodyParts, part],
			};
		});
	}, []);

	// Handle symptom-specific factor selection (Mayo Clinic style)
	const toggleSymptomSpecificFactor = useCallback(
		(category: SymptomSpecificCategory, factorId: string) => {
			setState((prev) => {
				const currentFactors = prev.symptomSpecificFactors[category.id] || [];
				const isSelected = currentFactors.includes(factorId);

				let newFactors: string[];
				if (isSelected) {
					newFactors = currentFactors.filter((id) => id !== factorId);
				} else if (category.allowMultiple) {
					newFactors = [...currentFactors, factorId];
				} else {
					newFactors = [factorId];
				}

				return {
					...prev,
					symptomSpecificFactors: {
						...prev.symptomSpecificFactors,
						[category.id]: newFactors,
					},
				};
			});
		},
		[],
	);

	// Get symptom profile based on selected body parts
	const currentSymptomProfile = useMemo(() => {
		const uberonIds = state.selectedBodyParts.map((p) => p.id);
		return getMergedSymptomProfiles(uberonIds);
	}, [state.selectedBodyParts]);

	// Handle step navigation
	const goToNextStep = useCallback(() => {
		if (currentStep === 1 && state.selectedBodyParts.length === 0) {
			toast.error(
				t(
					"Please select at least one body part",
					"Selectați cel puțin o zonă afectată",
				),
			);
			return;
		}

		// Fetch dynamic symptoms when entering step 2
		if (currentStep === 1) {
			fetchDynamicSymptoms();
		}

		if (currentStep === 2) {
			checkEmergencySymptoms();
		}

		if (currentStep < STEPS.length) {
			setCurrentStep((prev) => prev + 1);
		}
	}, [
		currentStep,
		state.selectedBodyParts.length,
		checkEmergencySymptoms,
		fetchDynamicSymptoms,
		t,
	]);

	const goToPreviousStep = useCallback(() => {
		if (currentStep > 1) {
			setCurrentStep((prev) => prev - 1);
		}
	}, [currentStep]);

	// Submit for diagnosis
	const submitForDiagnosis = useCallback(async () => {
		setIsLoading(true);
		setCurrentStep(4);

		try {
			// Collect all HPO IDs from selected factors to create symptoms array
			const allSelectedFactorIds = Object.values(state.selectedFactors).flat();
			const allHpoIds = getHpoIdsFromFactors(allSelectedFactorIds);

			// Combine HPO IDs from factors with selected dynamic symptoms
			// Flatten all symptoms from grouped symptoms
			const allDynamicSymptoms = [
				...Object.values(groupedSymptoms).flatMap((g) => g.symptoms),
				...commonSymptoms,
			];
			const dynamicSymptomObjects = allDynamicSymptoms
				.filter((s) => selectedDynamicSymptoms.has(s.id))
				.map((s) => ({
					id: s.id,
					name: s.name,
					hpoId: s.id,
				}));

			const factorSymptomObjects = allHpoIds.map((hpoId) => {
				const factor = allSelectedFactorIds.find((fid) => {
					const f = getFactorById(fid);
					return f?.hpoId === hpoId;
				});
				const factorData = factor ? getFactorById(factor) : null;
				return {
					id: hpoId,
					name: factorData?.name || hpoId,
					hpoId: hpoId,
				};
			});

			// Merge and deduplicate symptoms by ID
			const allSymptoms = [...dynamicSymptomObjects, ...factorSymptomObjects];
			const uniqueSymptoms = allSymptoms.filter(
				(s, i, arr) => arr.findIndex((x) => x.id === s.id) === i,
			);

			// Prepare the payload for the KG Decision Flow service
			// Format: Body Parts → Symptoms (HPO IDs) → Diagnosis (Jaccard Similarity)
			const payload = {
				// Body parts with UBERON IDs
				bodyParts: state.selectedBodyParts.map((p) => ({
					id: p.id,
					name: p.name,
					uberonId: p.id, // The id field is the UBERON ID
				})),
				// Symptoms as HPO ID objects (from selected factors + dynamic symptoms)
				symptoms: uniqueSymptoms,
				severity: state.severity,
				patientInfo: {
					ageCategory: state.patientInfo.ageCategory,
					biologicalSex: state.patientInfo.gender,
				},
			};

			// Call KG service
			const response = await fetch("http://localhost:4000/diagnose", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error("Failed to get diagnosis");
			}

			const data = await response.json();

			const diagnosisResult: DiagnosisResult = {
				diagnoses: data.diagnoses || [],
				urgencyLevel: data.urgencyLevel || "low",
				recommendations: data.recommendations || [],
				additionalTests: data.additionalTests || [],
				timestamp: new Date(),
			};

			setResults(diagnosisResult);

			// Note: onComplete is called in saveToPatientRecord after save is successful
			// Don't call it here to prevent navigation before save

			toast.success(t("Diagnosis complete", "Diagnosticul este complet"));
		} catch (error) {
			console.error("Diagnosis error:", error);
			toast.error(
				t("Failed to get diagnosis", "Eroare la obținerea diagnosticului"),
			);

			// Set mock results for demo
			setResults({
				diagnoses: [
					{
						id: "mondo:0005015",
						name: "Diabetes mellitus type 2",
						probability: 0.75,
						description:
							"A metabolic disorder characterized by high blood sugar levels",
						mondoId: "MONDO:0005015",
					},
					{
						id: "mondo:0005148",
						name: "Hypertension",
						probability: 0.65,
						description: "Abnormally high blood pressure",
						mondoId: "MONDO:0005148",
					},
				],
				urgencyLevel: "medium",
				recommendations: [
					"Schedule a follow-up appointment within 1 week",
					"Monitor blood pressure daily",
					"Recommend fasting blood glucose test",
				],
				additionalTests: ["HbA1c", "Lipid panel", "Kidney function tests"],
				timestamp: new Date(),
			});
		} finally {
			setIsLoading(false);
		}
	}, [state, onComplete, t]);

	// Reset the checker
	const resetChecker = useCallback(() => {
		setState(initialState);
		setCurrentStep(1);
		setResults(null);
		setShowEmergencyWarning(false);
		setSelectedDynamicSymptoms(new Set());
		setGroupedSymptoms({});
		setCommonSymptoms([]);
	}, []);

	// Save to patient record
	const saveToPatientRecord = useCallback(async () => {
		if (!results || !consultationId) {
			toast.error(
				t(
					"No consultation to save to",
					"Nu există o consultație în care să salvați",
				),
			);
			return;
		}

		setIsSaving(true);
		try {
			// Get all dynamic symptoms that were selected
			const allDynamicSymptoms = [
				...Object.values(groupedSymptoms).flatMap((g) => g.symptoms),
				...commonSymptoms,
			];
			const selectedDynamicSymptomObjects = allDynamicSymptoms
				.filter((s) => selectedDynamicSymptoms.has(s.id))
				.map((s) => ({
					id: s.id,
					name: s.name,
					description: s.description || undefined,
				}));

			// First, save the structured input
			await updateStructuredInput({
				consultationId: consultationId as Id<"consultations">,
				structuredInput: {
					bodyParts: state.selectedBodyParts.map((p) => ({
						id: p.id,
						name: p.name,
						nameRo: p.nameRo,
						system: p.parentSystem,
					})),
					factors: {
						painQuality: state.selectedFactors.pain_quality.map((id) => {
							const factor = getFactorById(id);
							return {
								id,
								category: "pain_quality",
								name: factor?.name || id,
								nameRo: factor?.nameRo,
								hpoId: factor?.hpoId,
							};
						}),
						triggers: state.selectedFactors.triggers.map((id) => {
							const factor = getFactorById(id);
							return {
								id,
								category: "triggers",
								name: factor?.name || id,
								nameRo: factor?.nameRo,
								hpoId: factor?.hpoId,
							};
						}),
						relief: state.selectedFactors.relief.map((id) => {
							const factor = getFactorById(id);
							return {
								id,
								category: "relief",
								name: factor?.name || id,
								nameRo: factor?.nameRo,
								hpoId: factor?.hpoId,
							};
						}),
						accompanying: state.selectedFactors.accompanying.map((id) => {
							const factor = getFactorById(id);
							return {
								id,
								category: "accompanying",
								name: factor?.name || id,
								nameRo: factor?.nameRo,
								hpoId: factor?.hpoId,
							};
						}),
						onset: state.selectedFactors.onset.map((id) => {
							const factor = getFactorById(id);
							return {
								id,
								category: "onset",
								name: factor?.name || id,
								nameRo: factor?.nameRo,
								hpoId: factor?.hpoId,
							};
						}),
						duration: state.selectedFactors.duration.map((id) => {
							const factor = getFactorById(id);
							return {
								id,
								category: "duration",
								name: factor?.name || id,
								nameRo: factor?.nameRo,
								hpoId: factor?.hpoId,
							};
						}),
						frequency: state.selectedFactors.frequency.map((id) => {
							const factor = getFactorById(id);
							return {
								id,
								category: "frequency",
								name: factor?.name || id,
								nameRo: factor?.nameRo,
								hpoId: factor?.hpoId,
							};
						}),
						severity: state.selectedFactors.severity.map((id) => {
							const factor = getFactorById(id);
							return {
								id,
								category: "severity",
								name: factor?.name || id,
								nameRo: factor?.nameRo,
								hpoId: factor?.hpoId,
							};
						}),
						locationModifier: state.selectedFactors.location_modifier.map(
							(id) => {
								const factor = getFactorById(id);
								return {
									id,
									category: "location_modifier",
									name: factor?.name || id,
									nameRo: factor?.nameRo,
									hpoId: factor?.hpoId,
								};
							},
						),
					},
					symptomSpecificFactors: state.symptomSpecificFactors,
					selectedSymptoms: selectedDynamicSymptomObjects,
					severityScore: state.severity,
					additionalNotes: state.additionalNotes || undefined,
					patientInfo: {
						ageCategory: state.patientInfo.ageCategory,
						gender: state.patientInfo.gender,
						height: state.patientInfo.height,
						weight: state.patientInfo.weight,
					},
				},
			});

			// Then save the diagnosis results
			await saveDiagnosisResults({
				consultationId: consultationId as Id<"consultations">,
				diagnosisResults: results.diagnoses.map((d) => ({
					conditionName: d.name,
					conditionId: d.id || undefined,
					mondoId: d.mondoId || undefined,
					probability: Math.round(d.probability * 100),
					severity:
						results.urgencyLevel === "emergency"
							? "critical"
							: results.urgencyLevel === "high"
								? "high"
								: results.urgencyLevel === "medium"
									? "medium"
									: "low",
					description: d.description || undefined,
					recommendedActions: results.recommendations,
				})),
				urgencyLevel: results.urgencyLevel,
				suggestedTests: results.additionalTests,
			});

			toast.success(
				t(
					"Results saved to patient record",
					"Rezultatele au fost salvate în fișa pacientului",
				),
			);

			if (onComplete) {
				onComplete(results);
			}
		} catch (error) {
			console.error("Save error:", error);
			toast.error(
				t("Failed to save results", "Eroare la salvarea rezultatelor"),
			);
		} finally {
			setIsSaving(false);
		}
	}, [
		results,
		consultationId,
		state,
		groupedSymptoms,
		commonSymptoms,
		selectedDynamicSymptoms,
		updateStructuredInput,
		saveDiagnosisResults,
		onComplete,
		t,
	]);

	// Render step 1: Body Parts Selection
	const renderBodyPartsStep = () => (
		<div className="space-y-4">
			{/* Search input */}
			<div className="relative">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder={t(
						"Search body parts...",
						"Căutați zone ale corpului...",
					)}
					value={bodyPartSearch}
					onChange={(e) => setBodyPartSearch(e.target.value)}
					className="pl-10"
				/>
			</div>

			{/* Body system tabs */}
			<Tabs
				value={activeBodySystem}
				onValueChange={(v) => setActiveBodySystem(v as BodySystem | "general")}
			>
				<TabsList className="flex h-auto flex-wrap gap-1 bg-transparent p-0">
					<TabsTrigger
						value="general"
						className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
					>
						{t("Common", "Frecvente")}
					</TabsTrigger>
					{BODY_SYSTEMS.map((system) => (
						<TabsTrigger
							key={system.id}
							value={system.id}
							className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
						>
							{language === "ro" ? system.nameRo : system.name}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			{/* Selected body parts */}
			{state.selectedBodyParts.length > 0 && (
				<div className="flex flex-wrap gap-2 rounded-lg bg-muted/50 p-3">
					<span className="mr-2 text-muted-foreground text-sm">
						{t("Selected:", "Selectate:")}
					</span>
					{state.selectedBodyParts.map((part) => (
						<Badge
							key={part.id}
							variant="default"
							className="cursor-pointer"
							onClick={() => toggleBodyPart(part)}
						>
							{language === "ro" ? part.nameRo : part.name}
							<X className="ml-1 h-3 w-3" />
						</Badge>
					))}
				</div>
			)}

			{/* Body parts grid */}
			<ScrollArea className="h-[350px]">
				<div className="grid grid-cols-2 gap-2 pr-4 sm:grid-cols-3">
					{filteredBodyParts.map((part) => {
						const isSelected = state.selectedBodyParts.some(
							(p) => p.id === part.id,
						);
						return (
							<Card
								key={part.id}
								className={cn(
									"cursor-pointer transition-all hover:shadow-md",
									isSelected && "bg-primary/5 ring-2 ring-primary",
								)}
								onClick={() => toggleBodyPart(part)}
							>
								<CardContent className="p-3">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-medium text-sm">
												{language === "ro" ? part.nameRo : part.name}
											</p>
											<p className="text-muted-foreground text-xs">{part.id}</p>
										</div>
										{isSelected && <Check className="h-4 w-4 text-primary" />}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</ScrollArea>
		</div>
	);

	// Render step 2: Symptom Factors (Mayo Clinic style - symptom-specific)
	const renderFactorsStep = () => {
		// Get symptom-specific categories based on selected body parts
		const symptomProfile = currentSymptomProfile;

		return (
			<div className="space-y-4">
				{/* Summary of selected body parts */}
				<div className="rounded-lg bg-muted/50 p-3">
					<p className="mb-2 text-muted-foreground text-sm">
						{t("Affected areas:", "Zone afectate:")}
					</p>
					<div className="flex flex-wrap gap-1">
						{state.selectedBodyParts.map((part) => (
							<Badge key={part.id} variant="outline">
								{language === "ro" ? part.nameRo : part.name}
							</Badge>
						))}
					</div>
				</div>

				{/* Dynamic symptoms from Monarch KG - Grouped by body part */}
				<Card>
					<CardHeader className="px-4 py-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Activity className="h-4 w-4" />
								<CardTitle className="text-sm">
									{t("Related Symptoms", "Simptome Asociate")}
								</CardTitle>
							</div>
							{selectedDynamicSymptoms.size > 0 && (
								<Badge variant="secondary" className="text-xs">
									{selectedDynamicSymptoms.size}
								</Badge>
							)}
						</div>
						<CardDescription className="text-xs">
							{t(
								"Select symptoms that apply to the selected body parts",
								"Selectați simptomele care se aplică zonelor afectate",
							)}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 px-4 pt-0 pb-3">
						{isLoadingSymptoms ? (
							<div className="flex items-center gap-2 text-muted-foreground text-sm">
								<Loader2 className="h-4 w-4 animate-spin" />
								{t("Loading symptoms...", "Se încarcă simptomele...")}
							</div>
						) : Object.keys(groupedSymptoms).length > 0 ||
							commonSymptoms.length > 0 ? (
							<>
								{/* Common symptoms section - symptoms that appear in multiple body parts */}
								{commonSymptoms.length > 0 && (
									<div className="space-y-2">
										<div className="flex items-center gap-2">
											<span className="text-sm">🔗</span>
											<p className="font-medium text-muted-foreground text-xs">
												{t("Common Symptoms", "Simptome Comune")}
											</p>
											<Badge variant="outline" className="text-xs">
												{commonSymptoms.length}
											</Badge>
										</div>
										<div className="flex flex-wrap gap-1">
											{commonSymptoms.map((symptom) => {
												const isSelected = selectedDynamicSymptoms.has(
													symptom.id,
												);
												return (
													<Badge
														key={symptom.id}
														variant={isSelected ? "default" : "secondary"}
														className="cursor-pointer text-xs"
														onClick={() => toggleDynamicSymptom(symptom.id)}
														title={
															symptom.description ||
															`${t("Appears in", "Apare în")} ${symptom.count} ${t("body parts", "zone")}`
														}
													>
														{symptom.name}
													</Badge>
												);
											})}
										</div>
									</div>
								)}

								{/* Per-body-part symptoms */}
								{Object.values(groupedSymptoms).map(({ bodyPart, symptoms }) =>
									symptoms.length > 0 ? (
										<div key={bodyPart.id} className="space-y-2">
											<div className="flex items-center gap-2">
												<p className="font-medium text-muted-foreground text-xs">
													{language === "ro" ? bodyPart.nameRo : bodyPart.name}
												</p>
												<Badge variant="outline" className="text-xs">
													{symptoms.length}
												</Badge>
											</div>
											<div className="flex flex-wrap gap-1">
												{symptoms.map((symptom) => {
													const isSelected = selectedDynamicSymptoms.has(
														symptom.id,
													);
													return (
														<Badge
															key={symptom.id}
															variant={isSelected ? "default" : "outline"}
															className="cursor-pointer text-xs"
															onClick={() => toggleDynamicSymptom(symptom.id)}
															title={symptom.description || undefined}
														>
															{symptom.name}
														</Badge>
													);
												})}
											</div>
										</div>
									) : null,
								)}
							</>
						) : (
							<p className="text-muted-foreground text-sm">
								{t(
									"No specific symptoms found for these body parts",
									"Nu s-au găsit simptome specifice pentru aceste zone",
								)}
							</p>
						)}
					</CardContent>
				</Card>

				{/* Severity slider */}
				<Card>
					<CardContent className="pt-4">
						<Label className="font-medium text-sm">
							{t(
								"Pain/Discomfort Severity:",
								"Severitatea durerii/disconfortului:",
							)}{" "}
							{state.severity}/10
						</Label>
						<Slider
							value={[state.severity]}
							onValueChange={([v]) =>
								setState((prev) => ({ ...prev, severity: v }))
							}
							max={10}
							min={1}
							step={1}
							className="mt-3"
						/>
						<div className="mt-1 flex justify-between text-muted-foreground text-xs">
							<span>{t("Mild", "Ușor")}</span>
							<span>{t("Moderate", "Moderat")}</span>
							<span>{t("Severe", "Sever")}</span>
						</div>
					</CardContent>
				</Card>

				{/* Symptom-specific factor categories (Mayo Clinic style) */}
				<ScrollArea className="h-[300px]">
					<div className="space-y-4 pr-4">
						{symptomProfile.categories.map((category) => {
							const selectedCount =
								state.symptomSpecificFactors[category.id]?.length || 0;

							return (
								<Card key={category.id}>
									<CardHeader className="px-4 py-3">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span>{category.icon}</span>
												<CardTitle className="text-sm">
													{language === "ro" ? category.nameRo : category.name}
												</CardTitle>
											</div>
											{selectedCount > 0 && (
												<Badge variant="secondary" className="text-xs">
													{selectedCount}
												</Badge>
											)}
										</div>
										<CardDescription className="text-xs">
											{language === "ro"
												? category.descriptionRo
												: category.description}
										</CardDescription>
									</CardHeader>
									<CardContent className="px-4 pt-0 pb-3">
										<div className="flex flex-wrap gap-1">
											{category.factors.map((factor) => {
												const isSelected = state.symptomSpecificFactors[
													category.id
												]?.includes(factor.id);
												return (
													<Badge
														key={factor.id}
														variant={isSelected ? "default" : "outline"}
														className="cursor-pointer text-xs"
														onClick={() =>
															toggleSymptomSpecificFactor(category, factor.id)
														}
													>
														{language === "ro" ? factor.nameRo : factor.name}
													</Badge>
												);
											})}
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</ScrollArea>

				{/* Additional notes */}
				<div className="space-y-2">
					<Label className="text-sm">
						{t("Additional Notes (optional):", "Note adiționale (opțional):")}
					</Label>
					<Textarea
						placeholder={t(
							"Any other symptoms or relevant information...",
							"Orice alte simptome sau informații relevante...",
						)}
						value={state.additionalNotes}
						onChange={(e) =>
							setState((prev) => ({ ...prev, additionalNotes: e.target.value }))
						}
						className="h-20"
					/>
				</div>
			</div>
		);
	};

	// Render step 3: Patient Info
	const renderPatientInfoStep = () => {
		// Calculate age from DOB for display
		const calculateAge = (dateOfBirth: string): number => {
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
			return age;
		};

		return (
			<div className="space-y-4">
				{/* Patient Info Header - Show stored patient data if available */}
				{patient && (
					<Card className="border-primary/20 bg-primary/5">
						<CardHeader className="pb-2">
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2 text-base">
									<User className="h-4 w-4" />
									{patient.firstName} {patient.lastName}
								</CardTitle>
								<Badge variant="secondary">
									{t("Patient Data", "Date Pacient")}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-1 text-sm">
							<div className="grid grid-cols-2 gap-x-4 gap-y-1">
								{patient.dateOfBirth && (
									<div>
										<span className="text-muted-foreground">
											{t("Age:", "Vârstă:")}
										</span>{" "}
										{calculateAge(patient.dateOfBirth)} {t("years", "ani")}
									</div>
								)}
								{patient.sex && (
									<div>
										<span className="text-muted-foreground">
											{t("Sex:", "Sex:")}
										</span>{" "}
										{patient.sex === "male"
											? t("Male", "Masculin")
											: t("Female", "Feminin")}
									</div>
								)}
								{patient.cnp && (
									<div>
										<span className="text-muted-foreground">CNP:</span>{" "}
										{patient.cnp}
									</div>
								)}
								{patient.bloodType && (
									<div>
										<span className="text-muted-foreground">
											{t("Blood Type:", "Grupa sanguină:")}
										</span>{" "}
										{patient.bloodType}
									</div>
								)}
							</div>
							{patient.knownAllergies && patient.knownAllergies.length > 0 && (
								<div className="pt-1">
									<span className="text-muted-foreground">
										{t("Allergies:", "Alergii:")}
									</span>{" "}
									<span className="text-destructive">
										{patient.knownAllergies.join(", ")}
									</span>
								</div>
							)}
							{patient.chronicConditions &&
								patient.chronicConditions.length > 0 && (
									<div>
										<span className="text-muted-foreground">
											{t("Chronic Conditions:", "Afecțiuni cronice:")}
										</span>{" "}
										{patient.chronicConditions.join(", ")}
									</div>
								)}
							{patient.currentMedications &&
								patient.currentMedications.length > 0 && (
									<div>
										<span className="text-muted-foreground">
											{t("Current Medications:", "Medicație curentă:")}
										</span>{" "}
										{patient.currentMedications.join(", ")}
									</div>
								)}
						</CardContent>
					</Card>
				)}

				{/* Age category - with edit option */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label>{t("Age Category", "Categoria de vârstă")}</Label>
						{patient && state.patientInfo.ageCategory && (
							<Badge variant="outline" className="text-xs">
								<Check className="mr-1 h-3 w-3" />
								{t("Auto-filled", "Completat automat")}
							</Badge>
						)}
					</div>
					<Select
						value={state.patientInfo.ageCategory}
						onValueChange={(v) =>
							setState((prev) => ({
								...prev,
								patientInfo: { ...prev.patientInfo, ageCategory: v },
							}))
						}
					>
						<SelectTrigger>
							<SelectValue
								placeholder={t(
									"Select age category",
									"Selectați categoria de vârstă",
								)}
							/>
						</SelectTrigger>
						<SelectContent>
							{AGE_CATEGORIES.map((cat) => (
								<SelectItem key={cat.value} value={cat.value}>
									{language === "ro" ? cat.labelRo : cat.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Gender - with edit option */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label>{t("Gender", "Gen")}</Label>
						{patient && state.patientInfo.gender && (
							<Badge variant="outline" className="text-xs">
								<Check className="mr-1 h-3 w-3" />
								{t("Auto-filled", "Completat automat")}
							</Badge>
						)}
					</div>
					<Select
						value={state.patientInfo.gender}
						onValueChange={(v) =>
							setState((prev) => ({
								...prev,
								patientInfo: { ...prev.patientInfo, gender: v },
							}))
						}
					>
						<SelectTrigger>
							<SelectValue
								placeholder={t("Select gender", "Selectați genul")}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="male">{t("Male", "Masculin")}</SelectItem>
							<SelectItem value="female">{t("Female", "Feminin")}</SelectItem>
							<SelectItem value="other">{t("Other", "Altul")}</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Height and Weight */}
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label>{t("Height (cm)", "Înălțime (cm)")}</Label>
						<Input
							type="number"
							placeholder="170"
							value={state.patientInfo.height || ""}
							onChange={(e) =>
								setState((prev) => ({
									...prev,
									patientInfo: {
										...prev.patientInfo,
										height: e.target.value ? Number(e.target.value) : undefined,
									},
								}))
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("Weight (kg)", "Greutate (kg)")}</Label>
						<Input
							type="number"
							placeholder="70"
							value={state.patientInfo.weight || ""}
							onChange={(e) =>
								setState((prev) => ({
									...prev,
									patientInfo: {
										...prev.patientInfo,
										weight: e.target.value ? Number(e.target.value) : undefined,
									},
								}))
							}
						/>
					</div>
				</div>

				{/* Summary before submission */}
				<Card className="bg-muted/50">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">{t("Summary", "Rezumat")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<div>
							<span className="text-muted-foreground">
								{t("Body parts:", "Zone afectate:")}
							</span>{" "}
							{state.selectedBodyParts
								.map((p) => (language === "ro" ? p.nameRo : p.name))
								.join(", ")}
						</div>
						<div>
							<span className="text-muted-foreground">
								{t("Severity:", "Severitate:")}
							</span>{" "}
							{state.severity}/10
						</div>
						{/* Show selected symptom-specific factors */}
						{currentSymptomProfile.categories.map((category) => {
							const selectedFactorIds =
								state.symptomSpecificFactors[category.id] || [];
							if (selectedFactorIds.length === 0) return null;

							const selectedFactorNames = selectedFactorIds
								.map((id) => {
									const factor = category.factors.find((f) => f.id === id);
									return factor
										? language === "ro"
											? factor.nameRo
											: factor.name
										: null;
								})
								.filter(Boolean)
								.join(", ");

							return (
								<div key={category.id}>
									<span className="text-muted-foreground">
										{language === "ro" ? category.nameRo : category.name}:
									</span>{" "}
									{selectedFactorNames}
								</div>
							);
						})}
						{state.additionalNotes && (
							<div>
								<span className="text-muted-foreground">
									{t("Notes:", "Note:")}
								</span>{" "}
								{state.additionalNotes}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		);
	};

	// Render step 4: Results
	const renderResultsStep = () => {
		if (isLoading) {
			return (
				<div className="flex flex-col items-center justify-center space-y-4 py-12">
					<Loader2 className="h-12 w-12 animate-spin text-primary" />
					<p className="font-medium text-lg">
						{t("Analyzing symptoms...", "Analizăm simptomele...")}
					</p>
					<p className="text-muted-foreground text-sm">
						{t(
							"Consulting the Monarch Knowledge Graph",
							"Consultăm Graful de Cunoștințe Monarch",
						)}
					</p>
				</div>
			);
		}

		if (!results) return null;

		return (
			<div className="space-y-4">
				{/* Urgency level alert */}
				{results.urgencyLevel !== "low" && (
					<Card
						className={cn(
							"border-2",
							results.urgencyLevel === "emergency" &&
								"border-red-500 bg-red-50 dark:bg-red-950",
							results.urgencyLevel === "high" &&
								"border-orange-500 bg-orange-50 dark:bg-orange-950",
							results.urgencyLevel === "medium" &&
								"border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
						)}
					>
						<CardContent className="flex items-center gap-3 pt-4">
							<AlertTriangle
								className={cn(
									"h-6 w-6",
									results.urgencyLevel === "emergency" && "text-red-500",
									results.urgencyLevel === "high" && "text-orange-500",
									results.urgencyLevel === "medium" && "text-yellow-500",
								)}
							/>
							<div>
								<p className="font-semibold">
									{results.urgencyLevel === "emergency"
										? t(
												"Emergency - Immediate attention required",
												"Urgență - Necesită atenție imediată",
											)
										: results.urgencyLevel === "high"
											? t(
													"High priority - See a doctor soon",
													"Prioritate ridicată - Consultați un medic curând",
												)
											: t("Moderate priority", "Prioritate moderată")}
								</p>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Diagnoses */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Stethoscope className="h-5 w-5" />
							{t("Possible Diagnoses", "Diagnostice Posibile")}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{results.diagnoses.map((diagnosis, index) => (
							<div key={diagnosis.id} className="flex items-start gap-3">
								<div
									className={cn(
										"flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm",
										index === 0
											? "bg-primary text-primary-foreground"
											: "bg-muted",
									)}
								>
									{index + 1}
								</div>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<p className="font-medium">{diagnosis.name}</p>
										<Badge variant="outline" className="text-xs">
											{Math.round(diagnosis.probability * 100)}%
										</Badge>
									</div>
									{diagnosis.description && (
										<p className="mt-1 text-muted-foreground text-sm">
											{diagnosis.description}
										</p>
									)}
									{diagnosis.mondoId && (
										<p className="mt-1 text-muted-foreground text-xs">
											{diagnosis.mondoId}
										</p>
									)}
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				{/* Action buttons */}
				<div className="flex gap-3 pt-4">
					<Button variant="outline" onClick={resetChecker} className="flex-1">
						{t("Start New Assessment", "Începe Evaluare Nouă")}
					</Button>
					<Button
						className="flex-1"
						onClick={saveToPatientRecord}
						disabled={isSaving}
					>
						{isSaving ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{t("Saving...", "Se salvează...")}
							</>
						) : (
							t("Save to Patient Record", "Salvează în Fișa Pacientului")
						)}
					</Button>
				</div>
			</div>
		);
	};

	// Emergency warning dialog
	const renderEmergencyWarning = () => {
		if (!showEmergencyWarning) return null;

		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
				<Card className="w-full max-w-md border-2 border-red-500">
					<CardHeader className="bg-red-50 dark:bg-red-950">
						<CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
							<AlertTriangle className="h-6 w-6" />
							{t("Emergency Warning", "Avertisment de Urgență")}
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-4">
						<p className="mb-4 text-sm">
							{t(
								"The symptoms you've described may indicate a medical emergency. Please consider:",
								"Simptomele descrise pot indica o urgență medicală. Vă rugăm să luați în considerare:",
							)}
						</p>
						<ul className="space-y-2 text-sm">
							<li className="flex items-center gap-2">
								<AlertTriangle className="h-4 w-4 text-red-500" />
								{t(
									"Calling emergency services (112)",
									"Apelați serviciile de urgență (112)",
								)}
							</li>
							<li className="flex items-center gap-2">
								<AlertTriangle className="h-4 w-4 text-red-500" />
								{t(
									"Going to the nearest emergency room",
									"Mergeți la cea mai apropiată urgență",
								)}
							</li>
						</ul>
					</CardContent>
					<CardFooter className="gap-3">
						<Button
							variant="outline"
							onClick={() => setShowEmergencyWarning(false)}
							className="flex-1"
						>
							{t("Continue Assessment", "Continuă Evaluarea")}
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								// Could trigger emergency protocol here
								setShowEmergencyWarning(false);
							}}
							className="flex-1"
						>
							{t("Acknowledge", "Am înțeles")}
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	};

	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4">
			{renderEmergencyWarning()}

			<Card className="w-full overflow-hidden">
				{/* Header with progress */}
				<CardHeader className="bg-muted/50">
					<div className="mb-2 flex items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							{t("Symptom Assessment", "Evaluare Simptome")}
						</CardTitle>
						<Badge variant="outline">
							{t("Step", "Pas")} {currentStep}/{STEPS.length}
						</Badge>
					</div>
					<Progress value={progress} className="h-2" />

					{/* Step indicators */}
					<div className="mt-4 flex justify-between">
						{STEPS.map((step) => {
							const Icon = step.icon;
							const isActive = currentStep === step.id;
							const isCompleted = currentStep > step.id;

							return (
								<div
									key={step.id}
									className={cn(
										"flex flex-col items-center gap-1",
										isActive && "text-primary",
										isCompleted && "text-green-500",
										!isActive && !isCompleted && "text-muted-foreground",
									)}
								>
									<div
										className={cn(
											"flex h-8 w-8 items-center justify-center rounded-full border-2",
											isActive && "border-primary bg-primary/10",
											isCompleted && "border-green-500 bg-green-500/10",
											!isActive && !isCompleted && "border-muted",
										)}
									>
										{isCompleted ? (
											<Check className="h-4 w-4" />
										) : (
											<Icon className="h-4 w-4" />
										)}
									</div>
									<span className="hidden text-xs sm:block">
										{language === "ro" ? step.nameRo : step.name}
									</span>
								</div>
							);
						})}
					</div>
				</CardHeader>

				{/* Content */}
				<CardContent className="pt-6">
					{currentStep === 1 && renderBodyPartsStep()}
					{currentStep === 2 && renderFactorsStep()}
					{currentStep === 3 && renderPatientInfoStep()}
					{currentStep === 4 && renderResultsStep()}
				</CardContent>

				{/* Navigation footer */}
				{currentStep < 4 && (
					<CardFooter className="flex justify-between bg-muted/30">
						<Button
							variant="outline"
							onClick={goToPreviousStep}
							disabled={currentStep === 1}
						>
							<ChevronLeft className="mr-1 h-4 w-4" />
							{t("Previous", "Înapoi")}
						</Button>

						{currentStep < 3 ? (
							<Button onClick={goToNextStep}>
								{t("Next", "Următorul")}
								<ChevronRight className="ml-1 h-4 w-4" />
							</Button>
						) : (
							<Button
								onClick={submitForDiagnosis}
								disabled={
									!state.patientInfo.ageCategory || !state.patientInfo.gender
								}
							>
								<Sparkles className="mr-1 h-4 w-4" />
								{t("Get Diagnosis", "Obține Diagnostic")}
							</Button>
						)}
					</CardFooter>
				)}
			</Card>
		</div>
	);
}

export default ProductionSymptomChecker;
