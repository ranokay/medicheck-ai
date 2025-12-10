import { api } from "@medicheck-ai/backend/convex/_generated/api";
import type { Id } from "@medicheck-ai/backend/convex/_generated/dataModel";
import { useAction, useMutation } from "convex/react";
import {
	AlertCircle,
	AlertTriangle,
	ArrowRight,
	Brain,
	Check,
	ChevronLeft,
	Loader2,
	Stethoscope,
	ThermometerSun,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
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
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

// Session state types
interface DiagnosisResult {
	conditionNameEn: string;
	conditionNameRo: string;
	conditionId: string;
	probability: number;
	severity: "low" | "medium" | "high" | "critical";
	matchedSymptoms: string[];
	description: string;
	recommendedActions: string[];
	specialistRecommendation?: string;
}

interface Question {
	questionId: string;
	questionTextRo: string;
	questionType: "yes_no" | "single_choice" | "scale";
	options?: string[];
	phenotypeEn: string;
	reasoning?: string;
}

interface CandidateDisease {
	id: string;
	name: string;
	matchScore: number;
	matchedPhenotypes: number;
	totalPhenotypes: number;
}

interface QAEntry {
	question: string;
	answer: string;
	phenotypeEn: string;
}

type Step = "initial" | "processing" | "question" | "diagnosis";

interface AISymptomCheckerProps {
	patientId: Id<"patients">;
	consultationId?: Id<"consultations">;
	patientAge: number;
	patientSex: "male" | "female";
	onComplete: (consultationId: Id<"consultations">) => void;
}

export function AISymptomChecker({
	patientId,
	consultationId: existingConsultationId,
	patientAge,
	patientSex,
	onComplete,
}: AISymptomCheckerProps) {
	// State
	const [step, setStep] = useState<Step>("initial");
	const [consultationId, setConsultationId] = useState<
		Id<"consultations"> | undefined
	>(existingConsultationId);

	// Initial form
	const [chiefComplaint, setChiefComplaint] = useState("");
	const [initialSymptoms, setInitialSymptoms] = useState("");

	// AI session state
	const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
	const [currentAnswer, setCurrentAnswer] = useState<string>("");
	const [symptomsEn, setSymptomsEn] = useState<string[]>([]);
	const [deniedSymptomsEn, setDeniedSymptomsEn] = useState<string[]>([]);
	const [candidateDiseases, setCandidateDiseases] = useState<
		CandidateDisease[]
	>([]);
	const [qaHistory, setQaHistory] = useState<QAEntry[]>([]);
	const [diagnosisResult, setDiagnosisResult] = useState<{
		diagnoses: DiagnosisResult[];
		explanationRo: string;
		urgencyLevel: "routine" | "urgent" | "emergency";
		confidenceNote: string;
	} | null>(null);

	// Processing state
	const [isProcessing, setIsProcessing] = useState(false);
	const [processingMessage, setProcessingMessage] = useState("");

	// Convex mutations and actions
	const startConsultation = useMutation(api.consultations.startConsultation);
	const completeConsultation = useMutation(
		api.consultations.completeConsultation,
	);
	const startDiagnosticSession = useAction(api.ai.startDiagnosticSession);
	const processAnswer = useAction(api.ai.processAnswer);

	// Handle initial symptoms submission
	const handleStartDiagnosis = useCallback(async () => {
		if (!chiefComplaint.trim()) {
			toast.error("Vă rugăm să introduceți motivul vizitei");
			return;
		}

		setIsProcessing(true);
		setStep("processing");

		try {
			// Create consultation if not exists
			let consId = consultationId;
			if (!consId) {
				setProcessingMessage("Se creează consultația...");
				consId = await startConsultation({
					patientId,
					chiefComplaint: chiefComplaint.trim(),
				});
				setConsultationId(consId);
			}

			// Start AI diagnostic session
			setProcessingMessage("Se analizează simptomele cu AI...");
			const result = await startDiagnosticSession({
				consultationId: consId,
				patientAge,
				patientSex,
				chiefComplaint: chiefComplaint.trim(),
				initialSymptomsRo: initialSymptoms.trim() || chiefComplaint.trim(),
			});

			if (result.status === "no_matches") {
				toast.warning(result.message);
				setSymptomsEn(result.symptomsEn);
				// Show empty diagnosis
				setDiagnosisResult({
					diagnoses: [],
					explanationRo: result.message,
					urgencyLevel: "routine",
					confidenceNote:
						"Nu s-au găsit potriviri în baza de cunoștințe medicale.",
				});
				setStep("diagnosis");
			} else if (result.status === "diagnosis") {
				// Direct to diagnosis
				setSymptomsEn(result.symptomsEn);
				setCandidateDiseases(result.candidateDiseases);
				setDiagnosisResult({
					diagnoses: result.diagnoses,
					explanationRo: result.explanationRo,
					urgencyLevel: result.urgencyLevel,
					confidenceNote: result.confidenceNote,
				});
				setStep("diagnosis");
			} else if (result.status === "question") {
				// Question flow
				setSymptomsEn(result.symptomsEn);
				setCandidateDiseases(result.candidateDiseases);
				setCurrentQuestion(result.question);
				setStep("question");
			}
		} catch (error) {
			console.error("AI diagnosis error:", error);
			toast.error(
				"Eroare la analiza AI. Verificați dacă serviciul KG rulează.",
			);
			setStep("initial");
		} finally {
			setIsProcessing(false);
			setProcessingMessage("");
		}
	}, [
		chiefComplaint,
		initialSymptoms,
		consultationId,
		patientId,
		patientAge,
		patientSex,
		startConsultation,
		startDiagnosticSession,
	]);

	// Handle question answer
	const handleAnswerSubmit = useCallback(async () => {
		if (!currentQuestion || !currentAnswer || !consultationId) return;

		setIsProcessing(true);
		setProcessingMessage("Se procesează răspunsul...");

		try {
			const isConfirmed =
				currentAnswer === "da" ||
				currentAnswer === "yes" ||
				currentAnswer.toLowerCase().includes("da");

			const result = await processAnswer({
				consultationId,
				patientAge,
				patientSex,
				currentSymptomsEn: symptomsEn,
				deniedSymptomsEn,
				candidateDiseases: candidateDiseases.map((d) => ({
					id: d.id,
					name: d.name,
					matchScore: d.matchScore,
					matchedPhenotypes: d.matchedPhenotypes,
					totalPhenotypes: d.totalPhenotypes,
				})),
				previousQA: qaHistory,
				currentAnswer: {
					question: currentQuestion.questionTextRo,
					answer: currentAnswer,
					phenotypeEn: currentQuestion.phenotypeEn,
					isConfirmed,
				},
			});

			// Update state
			setSymptomsEn(result.symptomsEn);
			setDeniedSymptomsEn(result.deniedSymptomsEn);
			setCandidateDiseases(result.candidateDiseases);
			setQaHistory(result.allQA);

			if (result.status === "diagnosis") {
				setDiagnosisResult({
					diagnoses: result.diagnoses,
					explanationRo: result.explanationRo,
					urgencyLevel: result.urgencyLevel,
					confidenceNote: result.confidenceNote,
				});
				setStep("diagnosis");
			} else if (result.status === "question") {
				setCurrentQuestion(result.question);
				setCurrentAnswer("");
			}
		} catch (error) {
			console.error("Process answer error:", error);
			toast.error("Eroare la procesarea răspunsului");
		} finally {
			setIsProcessing(false);
			setProcessingMessage("");
		}
	}, [
		currentQuestion,
		currentAnswer,
		consultationId,
		patientAge,
		patientSex,
		symptomsEn,
		deniedSymptomsEn,
		candidateDiseases,
		qaHistory,
		processAnswer,
	]);

	// Complete and save diagnosis
	const handleCompleteDiagnosis = useCallback(async () => {
		if (!consultationId || !diagnosisResult) return;

		setIsProcessing(true);

		try {
			await completeConsultation({
				id: consultationId,
				diagnosisResults: diagnosisResult.diagnoses.map((d) => ({
					conditionName: d.conditionNameRo,
					conditionId: d.conditionId,
					probability: Math.round(d.probability * 100),
					severity: d.severity,
					description: d.description,
					recommendedActions: d.recommendedActions,
					specialistRecommendation: d.specialistRecommendation,
				})),
			});

			toast.success("Consultația a fost salvată");
			onComplete(consultationId);
		} catch (error) {
			console.error("Complete consultation error:", error);
			toast.error("Eroare la salvarea consultației");
		} finally {
			setIsProcessing(false);
		}
	}, [consultationId, diagnosisResult, completeConsultation, onComplete]);

	// Calculate progress
	const getProgress = () => {
		switch (step) {
			case "initial":
				return 10;
			case "processing":
				return 30;
			case "question":
				return 50 + Math.min(qaHistory.length * 10, 40);
			case "diagnosis":
				return 100;
		}
	};

	return (
		<div className="space-y-6">
			{/* Progress */}
			<div className="space-y-2">
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">Progres Evaluare AI</span>
					<span className="font-medium">{getProgress()}%</span>
				</div>
				<Progress value={getProgress()} className="h-2" />
			</div>

			{/* Initial symptoms form */}
			{step === "initial" && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Brain className="h-5 w-5" />
							Evaluare Simptome cu AI
						</CardTitle>
						<CardDescription>
							Introduceți motivul vizitei și simptomele pacientului. AI-ul va
							analiza informațiile folosind baza de cunoștințe medicale Monarch.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="chief-complaint">Motivul Vizitei *</Label>
							<Input
								id="chief-complaint"
								placeholder="ex: Durere de cap și amețeală de 2 zile"
								value={chiefComplaint}
								onChange={(e) => setChiefComplaint(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="symptoms">Simptome Adiționale</Label>
							<Textarea
								id="symptoms"
								placeholder="Descrieți toate simptomele pacientului în detaliu..."
								value={initialSymptoms}
								onChange={(e) => setInitialSymptoms(e.target.value)}
								rows={4}
							/>
						</div>

						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Notă</AlertTitle>
							<AlertDescription>
								AI-ul va căuta în baza de cunoștințe Monarch KG pentru a găsi
								afecțiuni potențiale. Răspunsurile sunt bazate exclusiv pe
								datele din Knowledge Graph.
							</AlertDescription>
						</Alert>

						<Button
							onClick={handleStartDiagnosis}
							className="w-full"
							disabled={!chiefComplaint.trim()}
						>
							Începe Analiza AI
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Processing state */}
			{step === "processing" && (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Loader2 className="h-12 w-12 animate-spin text-primary" />
						<p className="mt-4 font-medium text-lg">{processingMessage}</p>
						<p className="mt-2 text-muted-foreground text-sm">
							Se conectează la serviciul Knowledge Graph...
						</p>
					</CardContent>
				</Card>
			)}

			{/* Question flow */}
			{step === "question" && currentQuestion && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Stethoscope className="h-5 w-5" />
							Întrebare de Diagnostic #{qaHistory.length + 1}
						</CardTitle>
						<CardDescription>
							Bazat pe simptomele raportate, AI-ul are nevoie de mai multe
							informații.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Show current symptoms */}
						{symptomsEn.length > 0 && (
							<div className="space-y-2">
								<Label className="text-muted-foreground text-xs">
									Simptome identificate (EN):
								</Label>
								<div className="flex flex-wrap gap-1">
									{symptomsEn.map((s) => (
										<Badge key={s} variant="secondary" className="text-xs">
											{s}
										</Badge>
									))}
								</div>
							</div>
						)}

						<Separator />

						{/* Question */}
						<div className="space-y-4">
							<p className="font-medium text-lg">
								{currentQuestion.questionTextRo}
							</p>

							{currentQuestion.questionType === "yes_no" && (
								<RadioGroup
									value={currentAnswer}
									onValueChange={setCurrentAnswer}
									className="space-y-2"
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="da" id="yes" />
										<Label htmlFor="yes">Da</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="nu" id="no" />
										<Label htmlFor="no">Nu</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="nu_stiu" id="unknown" />
										<Label htmlFor="unknown">Nu știu</Label>
									</div>
								</RadioGroup>
							)}

							{currentQuestion.questionType === "single_choice" &&
								currentQuestion.options && (
									<RadioGroup
										value={currentAnswer}
										onValueChange={setCurrentAnswer}
										className="space-y-2"
									>
										{currentQuestion.options.map((opt, i) => (
											<div key={opt} className="flex items-center space-x-2">
												<RadioGroupItem value={opt} id={`opt-${i}`} />
												<Label htmlFor={`opt-${i}`}>{opt}</Label>
											</div>
										))}
									</RadioGroup>
								)}

							{currentQuestion.questionType === "scale" && (
								<Input
									type="number"
									min={0}
									max={10}
									placeholder="0-10"
									value={currentAnswer}
									onChange={(e) => setCurrentAnswer(e.target.value)}
								/>
							)}
						</div>

						{/* Top candidate diseases preview */}
						{candidateDiseases.length > 0 && (
							<div className="space-y-2">
								<Label className="text-muted-foreground text-xs">
									Afecțiuni candidate din KG:
								</Label>
								<div className="space-y-1">
									{candidateDiseases.slice(0, 3).map((d) => (
										<div
											key={d.id}
											className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs"
										>
											<span className="truncate">{d.name}</span>
											<Badge variant="outline" className="ml-2">
												{(d.matchScore * 100).toFixed(0)}%
											</Badge>
										</div>
									))}
								</div>
							</div>
						)}

						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() => {
									setStep("initial");
									setCurrentQuestion(null);
									setCurrentAnswer("");
								}}
							>
								<ChevronLeft className="mr-2 h-4 w-4" />
								Înapoi
							</Button>
							<Button
								onClick={handleAnswerSubmit}
								disabled={!currentAnswer || isProcessing}
								className="flex-1"
							>
								{isProcessing ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Se procesează...
									</>
								) : (
									<>
										Continuă
										<ArrowRight className="ml-2 h-4 w-4" />
									</>
								)}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Diagnosis results */}
			{step === "diagnosis" && diagnosisResult && (
				<div className="space-y-4">
					{/* Urgency alert */}
					{diagnosisResult.urgencyLevel !== "routine" && (
						<Alert
							variant={
								diagnosisResult.urgencyLevel === "emergency"
									? "destructive"
									: "default"
							}
						>
							<AlertTriangle className="h-4 w-4" />
							<AlertTitle>
								{diagnosisResult.urgencyLevel === "emergency"
									? "URGENȚĂ!"
									: "Atenție"}
							</AlertTitle>
							<AlertDescription>
								{diagnosisResult.urgencyLevel === "emergency"
									? "Pacientul necesită atenție medicală imediată!"
									: "Se recomandă consultație medicală în curând."}
							</AlertDescription>
						</Alert>
					)}

					{/* Main diagnosis card */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ThermometerSun className="h-5 w-5" />
								Rezultate Diagnostic AI
							</CardTitle>
							<CardDescription>{diagnosisResult.explanationRo}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Confidence note */}
							<Alert>
								<Brain className="h-4 w-4" />
								<AlertDescription className="text-sm">
									{diagnosisResult.confidenceNote}
								</AlertDescription>
							</Alert>

							{/* Diagnoses list */}
							{diagnosisResult.diagnoses.length > 0 ? (
								<div className="space-y-4">
									{diagnosisResult.diagnoses.map((diagnosis, index) => (
										<div
											key={diagnosis.conditionId || index}
											className="rounded-lg border p-4"
										>
											<div className="flex items-start justify-between">
												<div>
													<h4 className="font-semibold">
														{diagnosis.conditionNameRo}
													</h4>
													<p className="text-muted-foreground text-sm">
														{diagnosis.conditionNameEn}
													</p>
												</div>
												<div className="flex items-center gap-2">
													<Badge
														variant={
															diagnosis.severity === "critical"
																? "destructive"
																: diagnosis.severity === "high"
																	? "destructive"
																	: diagnosis.severity === "medium"
																		? "default"
																		: "secondary"
														}
													>
														{diagnosis.severity}
													</Badge>
													<Badge variant="outline">
														{(diagnosis.probability * 100).toFixed(0)}%
													</Badge>
												</div>
											</div>

											{diagnosis.description && (
												<p className="mt-2 text-sm">{diagnosis.description}</p>
											)}

											{diagnosis.matchedSymptoms.length > 0 && (
												<div className="mt-2">
													<p className="text-muted-foreground text-xs">
														Simptome potrivite:
													</p>
													<div className="mt-1 flex flex-wrap gap-1">
														{diagnosis.matchedSymptoms.map((s) => (
															<Badge
																key={s}
																variant="secondary"
																className="text-xs"
															>
																<Check className="mr-1 h-3 w-3" />
																{s}
															</Badge>
														))}
													</div>
												</div>
											)}

											{diagnosis.recommendedActions.length > 0 && (
												<div className="mt-3">
													<p className="font-medium text-sm">
														Acțiuni Recomandate:
													</p>
													<ul className="mt-1 list-inside list-disc text-sm">
														{diagnosis.recommendedActions.map((action) => (
															<li key={action}>{action}</li>
														))}
													</ul>
												</div>
											)}

											{diagnosis.specialistRecommendation && (
												<div className="mt-2 rounded bg-muted p-2">
													<p className="text-sm">
														<strong>Specialist recomandat:</strong>{" "}
														{diagnosis.specialistRecommendation}
													</p>
												</div>
											)}
										</div>
									))}
								</div>
							) : (
								<div className="py-8 text-center">
									<AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
									<p className="mt-4 text-muted-foreground">
										Nu s-au găsit afecțiuni potrivite în baza de cunoștințe.
									</p>
								</div>
							)}

							{/* Q&A history */}
							{qaHistory.length > 0 && (
								<div className="space-y-2">
									<Separator />
									<details className="text-sm">
										<summary className="cursor-pointer text-muted-foreground">
											Istoric întrebări ({qaHistory.length})
										</summary>
										<div className="mt-2 space-y-2">
											{qaHistory.map((qa) => (
												<div
													key={`${qa.question}-${qa.phenotypeEn}`}
													className="rounded bg-muted/50 p-2"
												>
													<p className="font-medium">Î: {qa.question}</p>
													<p className="text-muted-foreground">
														R: {qa.answer}
													</p>
												</div>
											))}
										</div>
									</details>
								</div>
							)}

							{/* Complete button */}
							<Button
								onClick={handleCompleteDiagnosis}
								disabled={isProcessing}
								className="w-full"
							>
								{isProcessing ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Se salvează...
									</>
								) : (
									<>
										<Check className="mr-2 h-4 w-4" />
										Finalizează și Salvează Consultația
									</>
								)}
							</Button>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
