import { api } from "@medicheck-ai/backend/convex/_generated/api";
import type { Id } from "@medicheck-ai/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
	AlertCircle,
	Check,
	ChevronLeft,
	ChevronRight,
	Loader2,
	Plus,
	Thermometer,
	X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

// Common symptoms list for quick selection
const COMMON_SYMPTOMS = [
	"Durere de cap",
	"Febră",
	"Tuse",
	"Durere în gât",
	"Oboseală",
	"Durere musculară",
	"Greață",
	"Amețeală",
	"Dificultăți de respirație",
	"Durere de stomac",
	"Durere în piept",
	"Nas înfundat",
	"Frisoane",
	"Pierderea apetitului",
	"Durere de spate",
];

type Step = "chief-complaint" | "symptoms" | "vitals" | "review";

interface SymptomCheckerProps {
	patientId: Id<"patients">;
	consultationId?: Id<"consultations">;
	onComplete: (consultationId: Id<"consultations">) => void;
}

interface SymptomEntry {
	name: string;
	severity: "mild" | "moderate" | "severe";
	duration?: string;
	notes?: string;
}

interface VitalSigns {
	bloodPressureSystolic?: number;
	bloodPressureDiastolic?: number;
	heartRate?: number;
	temperature?: number;
	respiratoryRate?: number;
	oxygenSaturation?: number;
	weight?: number;
	height?: number;
}

export function SymptomChecker({
	patientId,
	consultationId: initialConsultationId,
	onComplete,
}: SymptomCheckerProps) {
	const [step, setStep] = useState<Step>("chief-complaint");
	const [consultationId, setConsultationId] = useState<
		Id<"consultations"> | undefined
	>(initialConsultationId);

	// Chief complaint
	const [chiefComplaint, setChiefComplaint] = useState("");

	// Symptoms
	const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
	const [newSymptom, setNewSymptom] = useState("");
	const [symptomSeverity, setSymptomSeverity] = useState<
		"mild" | "moderate" | "severe"
	>("moderate");
	const [symptomDuration, setSymptomDuration] = useState("");

	// Vital signs
	const [vitalSigns, setVitalSigns] = useState<VitalSigns>({});

	// Loading states
	const [isLoading, setIsLoading] = useState(false);

	// Mutations
	const startConsultation = useMutation(api.consultations.startConsultation);
	const updateVitals = useMutation(api.consultations.updateVitalSigns);
	const addSymptomMutation = useMutation(api.consultations.addSymptom);
	const completeConsultation = useMutation(
		api.consultations.completeConsultation,
	);

	// Query current consultation if we have an ID (can be used later for resuming)
	const _consultation = useQuery(
		api.consultations.getConsultation,
		consultationId ? { id: consultationId } : "skip",
	);

	const handleStartConsultation = async () => {
		if (!chiefComplaint.trim()) {
			toast.error("Vă rugăm să introduceți motivul vizitei");
			return;
		}

		setIsLoading(true);
		try {
			const id = await startConsultation({
				patientId,
				chiefComplaint: chiefComplaint.trim(),
			});
			setConsultationId(id);
			setStep("symptoms");
		} catch (error) {
			toast.error("Eroare la crearea consultației");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddSymptom = (symptomName: string) => {
		if (!symptomName.trim()) return;

		const newEntry: SymptomEntry = {
			name: symptomName.trim(),
			severity: symptomSeverity,
			duration: symptomDuration || undefined,
		};

		setSymptoms((prev) => [...prev, newEntry]);
		setNewSymptom("");
		setSymptomDuration("");
	};

	const handleRemoveSymptom = (index: number) => {
		setSymptoms((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSaveSymptoms = async () => {
		if (!consultationId) return;

		setIsLoading(true);
		try {
			// Save all symptoms to the consultation
			for (const symptom of symptoms) {
				await addSymptomMutation({
					consultationId,
					symptom,
				});
			}
			setStep("vitals");
		} catch (error) {
			toast.error("Eroare la salvarea simptomelor");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSaveVitals = async () => {
		if (!consultationId) return;

		setIsLoading(true);
		try {
			await updateVitals({
				consultationId,
				vitalSigns,
			});
			setStep("review");
		} catch (error) {
			toast.error("Eroare la salvarea semnelor vitale");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleComplete = async () => {
		if (!consultationId) return;

		setIsLoading(true);
		try {
			// Generate mock diagnosis results (replace with actual AI in production)
			const diagnosisResults = generateMockDiagnosis(symptoms, chiefComplaint);

			await completeConsultation({
				id: consultationId,
				diagnosisResults: diagnosisResults,
			});

			onComplete(consultationId);
		} catch (error) {
			toast.error("Eroare la finalizarea consultației");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const getProgress = () => {
		switch (step) {
			case "chief-complaint":
				return 25;
			case "symptoms":
				return 50;
			case "vitals":
				return 75;
			case "review":
				return 100;
		}
	};

	return (
		<div className="space-y-6">
			{/* Progress indicator */}
			<div className="space-y-2">
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">Progres Evaluare</span>
					<span className="font-medium">{getProgress()}%</span>
				</div>
				<Progress value={getProgress()} className="h-2" />
			</div>

			{/* Step 1: Chief Complaint */}
			{step === "chief-complaint" && (
				<Card>
					<CardHeader>
						<CardTitle>Motivul Vizitei</CardTitle>
						<CardDescription>
							Care este principalul motiv pentru care pacientul s-a prezentat?
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="chief-complaint">Descriere</Label>
							<Textarea
								id="chief-complaint"
								placeholder="Ex: Pacientul acuză dureri de cap intense de 3 zile..."
								value={chiefComplaint}
								onChange={(e) => setChiefComplaint(e.target.value)}
								rows={4}
							/>
						</div>

						<Button
							onClick={handleStartConsultation}
							disabled={!chiefComplaint.trim() || isLoading}
							className="w-full"
						>
							{isLoading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<ChevronRight className="mr-2 h-4 w-4" />
							)}
							Continuă
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Step 2: Symptoms */}
			{step === "symptoms" && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Thermometer className="h-5 w-5" />
							Simptome
						</CardTitle>
						<CardDescription>
							Adăugați simptomele raportate de pacient
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Current symptoms list */}
						{symptoms.length > 0 && (
							<div className="space-y-2">
								<Label>Simptome adăugate</Label>
								<div className="flex flex-wrap gap-2">
									{symptoms.map((symptom, index) => (
										<Badge
											key={`${symptom.name}-${index}`}
											variant="secondary"
											className="gap-1 py-1.5 pr-1 pl-3"
										>
											<span>{symptom.name}</span>
											<span className="mx-1 text-xs opacity-60">
												(
												{symptom.severity === "mild"
													? "ușor"
													: symptom.severity === "moderate"
														? "moderat"
														: "sever"}
												)
											</span>
											<button
												type="button"
												onClick={() => handleRemoveSymptom(index)}
												className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
											>
												<X className="h-3 w-3" />
											</button>
										</Badge>
									))}
								</div>
							</div>
						)}

						<Separator />

						{/* Quick select symptoms */}
						<div className="space-y-2">
							<Label>Simptome frecvente</Label>
							<div className="flex flex-wrap gap-2">
								{COMMON_SYMPTOMS.filter(
									(s) => !symptoms.some((sym) => sym.name === s),
								).map((symptom) => (
									<Badge
										key={symptom}
										variant="outline"
										className="cursor-pointer hover:bg-primary/10"
										onClick={() => handleAddSymptom(symptom)}
									>
										<Plus className="mr-1 h-3 w-3" />
										{symptom}
									</Badge>
								))}
							</div>
						</div>

						<Separator />

						{/* Custom symptom input */}
						<div className="space-y-4">
							<Label>Adaugă simptom personalizat</Label>
							<div className="grid gap-4 sm:grid-cols-3">
								<div className="sm:col-span-2">
									<Input
										placeholder="Descriere simptom..."
										value={newSymptom}
										onChange={(e) => setNewSymptom(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddSymptom(newSymptom);
											}
										}}
									/>
								</div>
								<Select
									value={symptomSeverity}
									onValueChange={(v) =>
										setSymptomSeverity(v as typeof symptomSeverity)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="mild">Ușor</SelectItem>
										<SelectItem value="moderate">Moderat</SelectItem>
										<SelectItem value="severe">Sever</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<Input
									placeholder="Durată (ex: 3 zile, 1 săptămână)"
									value={symptomDuration}
									onChange={(e) => setSymptomDuration(e.target.value)}
								/>
								<Button
									variant="secondary"
									onClick={() => handleAddSymptom(newSymptom)}
									disabled={!newSymptom.trim()}
								>
									<Plus className="mr-2 h-4 w-4" />
									Adaugă
								</Button>
							</div>
						</div>

						{symptoms.length === 0 && (
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>
									Adăugați cel puțin un simptom pentru a continua
								</AlertDescription>
							</Alert>
						)}

						<div className="flex gap-3 pt-4">
							<Button
								variant="outline"
								onClick={() => setStep("chief-complaint")}
							>
								<ChevronLeft className="mr-2 h-4 w-4" />
								Înapoi
							</Button>
							<Button
								onClick={handleSaveSymptoms}
								disabled={symptoms.length === 0 || isLoading}
								className="flex-1"
							>
								{isLoading ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<ChevronRight className="mr-2 h-4 w-4" />
								)}
								Continuă
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Step 3: Vital Signs */}
			{step === "vitals" && (
				<Card>
					<CardHeader>
						<CardTitle>Semne Vitale</CardTitle>
						<CardDescription>
							Introduceți semnele vitale măsurate (opțional)
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label>Tensiune arterială (sistolică)</Label>
								<Input
									type="number"
									placeholder="120"
									value={vitalSigns.bloodPressureSystolic || ""}
									onChange={(e) =>
										setVitalSigns((prev) => ({
											...prev,
											bloodPressureSystolic: e.target.value
												? Number(e.target.value)
												: undefined,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Tensiune arterială (diastolică)</Label>
								<Input
									type="number"
									placeholder="80"
									value={vitalSigns.bloodPressureDiastolic || ""}
									onChange={(e) =>
										setVitalSigns((prev) => ({
											...prev,
											bloodPressureDiastolic: e.target.value
												? Number(e.target.value)
												: undefined,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Puls (bpm)</Label>
								<Input
									type="number"
									placeholder="72"
									value={vitalSigns.heartRate || ""}
									onChange={(e) =>
										setVitalSigns((prev) => ({
											...prev,
											heartRate: e.target.value
												? Number(e.target.value)
												: undefined,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Temperatură (°C)</Label>
								<Input
									type="number"
									step="0.1"
									placeholder="36.6"
									value={vitalSigns.temperature || ""}
									onChange={(e) =>
										setVitalSigns((prev) => ({
											...prev,
											temperature: e.target.value
												? Number(e.target.value)
												: undefined,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Frecvență respiratorie</Label>
								<Input
									type="number"
									placeholder="16"
									value={vitalSigns.respiratoryRate || ""}
									onChange={(e) =>
										setVitalSigns((prev) => ({
											...prev,
											respiratoryRate: e.target.value
												? Number(e.target.value)
												: undefined,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Saturație O2 (%)</Label>
								<Input
									type="number"
									placeholder="98"
									value={vitalSigns.oxygenSaturation || ""}
									onChange={(e) =>
										setVitalSigns((prev) => ({
											...prev,
											oxygenSaturation: e.target.value
												? Number(e.target.value)
												: undefined,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Greutate (kg)</Label>
								<Input
									type="number"
									step="0.1"
									placeholder="70"
									value={vitalSigns.weight || ""}
									onChange={(e) =>
										setVitalSigns((prev) => ({
											...prev,
											weight: e.target.value
												? Number(e.target.value)
												: undefined,
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Înălțime (cm)</Label>
								<Input
									type="number"
									placeholder="175"
									value={vitalSigns.height || ""}
									onChange={(e) =>
										setVitalSigns((prev) => ({
											...prev,
											height: e.target.value
												? Number(e.target.value)
												: undefined,
										}))
									}
								/>
							</div>
						</div>

						<div className="flex gap-3 pt-4">
							<Button variant="outline" onClick={() => setStep("symptoms")}>
								<ChevronLeft className="mr-2 h-4 w-4" />
								Înapoi
							</Button>
							<Button
								onClick={handleSaveVitals}
								disabled={isLoading}
								className="flex-1"
							>
								{isLoading ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<ChevronRight className="mr-2 h-4 w-4" />
								)}
								Continuă
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Step 4: Review */}
			{step === "review" && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Check className="h-5 w-5 text-green-500" />
							Revizuire și Finalizare
						</CardTitle>
						<CardDescription>
							Verificați informațiile și generați diagnosticul
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Chief Complaint */}
						<div>
							<h4 className="mb-2 font-medium">Motivul Vizitei</h4>
							<p className="text-muted-foreground">{chiefComplaint}</p>
						</div>

						<Separator />

						{/* Symptoms */}
						<div>
							<h4 className="mb-2 font-medium">Simptome ({symptoms.length})</h4>
							<div className="flex flex-wrap gap-2">
								{symptoms.map((symptom, index) => (
									<Badge key={`${symptom.name}-${index}`} variant="secondary">
										{symptom.name} (
										{symptom.severity === "mild"
											? "ușor"
											: symptom.severity === "moderate"
												? "moderat"
												: "sever"}
										)
									</Badge>
								))}
							</div>
						</div>

						<Separator />

						{/* Vital Signs */}
						<div>
							<h4 className="mb-2 font-medium">Semne Vitale</h4>
							{Object.entries(vitalSigns).filter(([_, v]) => v !== undefined)
								.length > 0 ? (
								<div className="grid gap-2 text-sm sm:grid-cols-2">
									{vitalSigns.bloodPressureSystolic && (
										<div>
											<span className="text-muted-foreground">Tensiune: </span>
											{vitalSigns.bloodPressureSystolic}/
											{vitalSigns.bloodPressureDiastolic} mmHg
										</div>
									)}
									{vitalSigns.heartRate && (
										<div>
											<span className="text-muted-foreground">Puls: </span>
											{vitalSigns.heartRate} bpm
										</div>
									)}
									{vitalSigns.temperature && (
										<div>
											<span className="text-muted-foreground">
												Temperatură:{" "}
											</span>
											{vitalSigns.temperature}°C
										</div>
									)}
									{vitalSigns.oxygenSaturation && (
										<div>
											<span className="text-muted-foreground">SpO2: </span>
											{vitalSigns.oxygenSaturation}%
										</div>
									)}
									{vitalSigns.weight && (
										<div>
											<span className="text-muted-foreground">Greutate: </span>
											{vitalSigns.weight} kg
										</div>
									)}
									{vitalSigns.height && (
										<div>
											<span className="text-muted-foreground">Înălțime: </span>
											{vitalSigns.height} cm
										</div>
									)}
								</div>
							) : (
								<p className="text-muted-foreground text-sm">
									Nu au fost înregistrate semne vitale
								</p>
							)}
						</div>

						<div className="flex gap-3 pt-4">
							<Button variant="outline" onClick={() => setStep("vitals")}>
								<ChevronLeft className="mr-2 h-4 w-4" />
								Înapoi
							</Button>
							<Button
								onClick={handleComplete}
								disabled={isLoading}
								className="flex-1"
							>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Se procesează...
									</>
								) : (
									<>
										<Check className="mr-2 h-4 w-4" />
										Finalizează și Generează Diagnostic
									</>
								)}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// Helper function to generate mock diagnosis (replace with AI in production)
function generateMockDiagnosis(
	symptoms: SymptomEntry[],
	_chiefComplaint: string,
) {
	const hasHeadache = symptoms.some(
		(s) =>
			s.name.toLowerCase().includes("cap") ||
			s.name.toLowerCase().includes("headache"),
	);
	const hasFever = symptoms.some(
		(s) =>
			s.name.toLowerCase().includes("febr") ||
			s.name.toLowerCase().includes("fever"),
	);
	const hasCough = symptoms.some(
		(s) =>
			s.name.toLowerCase().includes("tuse") ||
			s.name.toLowerCase().includes("cough"),
	);
	const hasThroatPain = symptoms.some((s) =>
		s.name.toLowerCase().includes("gât"),
	);
	const hasFatigue = symptoms.some((s) =>
		s.name.toLowerCase().includes("obos"),
	);

	const results = [];

	if (hasFever && (hasCough || hasThroatPain)) {
		results.push({
			conditionName: "Gripă (Influenza)",
			probability: 78,
			severity: "medium" as const,
			description: "Infecție virală a tractului respirator",
			recommendedActions: [
				"Odihnă la pat",
				"Hidratare abundentă",
				"Antipiretice pentru febră",
			],
			specialistRecommendation: "Medic de familie",
		});
	}

	if (hasCough || hasThroatPain) {
		results.push({
			conditionName: "Răceală comună",
			probability: 65,
			severity: "low" as const,
			description: "Infecție virală ușoară a tractului respirator superior",
			recommendedActions: [
				"Odihnă",
				"Lichide calde",
				"Medicamente pentru simptome",
			],
		});
	}

	if (hasHeadache && hasFever) {
		results.push({
			conditionName: "Sinuzită",
			probability: 45,
			severity: "medium" as const,
			description: "Inflamație a sinusurilor paranazale",
			recommendedActions: [
				"Decongestionante nazale",
				"Antiinflamatorii",
				"Consultație ORL dacă persistă",
			],
			specialistRecommendation: "ORL",
		});
	}

	if (hasFatigue && hasFever) {
		results.push({
			conditionName: "Mononucleoză",
			probability: 32,
			severity: "medium" as const,
			description: "Infecție virală cauzată de virusul Epstein-Barr",
			recommendedActions: [
				"Odihnă prelungită",
				"Hidratare",
				"Analize de sânge recomandate",
			],
			specialistRecommendation: "Medic internist",
		});
	}

	// Default if no matches
	if (results.length === 0) {
		results.push({
			conditionName: "Necesită evaluare suplimentară",
			probability: 50,
			severity: "low" as const,
			description: "Simptomele necesită o evaluare mai detaliată",
			recommendedActions: [
				"Consultație medicală pentru evaluare completă",
				"Monitorizare simptome",
			],
		});
	}

	return results;
}
