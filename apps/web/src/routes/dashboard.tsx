import { api } from "@medicheck-ai/backend/convex/_generated/api";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
	Activity,
	AlertTriangle,
	BookOpen,
	Check,
	ChevronRight,
	ClipboardList,
	ExternalLink,
	Heart,
	History,
	Info,
	Key,
	Loader2,
	Pill,
	Save,
	Stethoscope,
	User,
	X,
} from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";

import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/ui/select";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../components/ui/tabs";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			throw redirect({
				to: "/",
			});
		}
	},
});

const LANGUAGES = [
	{ value: "English", label: "English" },
	{ value: "Turkish", label: "Türkçe" },
	{ value: "Spanish", label: "Español" },
	{ value: "French", label: "Français" },
	{ value: "German", label: "Deutsch" },
	{ value: "Italian", label: "Italiano" },
	{ value: "Portuguese", label: "Português" },
	{ value: "Russian", label: "Русский" },
	{ value: "Chinese", label: "中文" },
	{ value: "Japanese", label: "日本語" },
	{ value: "Korean", label: "한국어" },
	{ value: "Arabic", label: "العربية" },
];

// Types for API response
interface PossibleCondition {
	condition: string;
	riskLevel: "High" | "Medium" | "Low";
	description: string;
	commonSymptoms?: string[];
	matchingSymptoms?: string[];
	additionalInfo?: string;
}

interface GeneralAdvice {
	recommendedActions: string[];
	lifestyleConsiderations?: string[];
	whenToSeekMedicalAttention?: string[];
}

interface EducationalResources {
	medicalTerminology?: Record<string, string>;
	preventiveMeasures?: string[];
	reliableSources?: string[];
}

interface DiagnosisResult {
	status: string;
	result?: {
		disclaimer: string;
		analysis: {
			possibleConditions: PossibleCondition[];
			generalAdvice?: GeneralAdvice;
		};
		educationalResources?: EducationalResources;
		meta?: {
			confidenceLevel?: string;
			analysisTimestamp?: string;
		};
	};
}

// Tag input component
function TagInput({
	tags,
	setTags,
	placeholder,
	id,
}: {
	tags: string[];
	setTags: (tags: string[]) => void;
	placeholder: string;
	id: string;
}) {
	const [inputValue, setInputValue] = useState("");

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			const trimmed = inputValue.trim();
			if (trimmed && !tags.includes(trimmed)) {
				setTags([...tags, trimmed]);
			}
			setInputValue("");
		} else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
			setTags(tags.slice(0, -1));
		}
	};

	const removeTag = (tagToRemove: string) => {
		setTags(tags.filter((tag) => tag !== tagToRemove));
	};

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap gap-2">
				{tags.map((tag) => (
					<Badge key={tag} variant="secondary" className="gap-1 px-2 py-1">
						{tag}
						<button
							type="button"
							onClick={() => removeTag(tag)}
							className="ml-1 hover:text-destructive"
						>
							<X className="h-3 w-3" />
						</button>
					</Badge>
				))}
			</div>
			<Input
				id={id}
				type="text"
				placeholder={placeholder}
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				onKeyDown={handleKeyDown}
			/>
		</div>
	);
}

// Results display component
function DiagnosisResults({ result }: { result: DiagnosisResult }) {
	if (!result.result) {
		return (
			<Card className="border-destructive">
				<CardContent className="pt-6">
					<p className="text-destructive">Failed to get diagnosis results.</p>
				</CardContent>
			</Card>
		);
	}

	const { disclaimer, analysis, educationalResources, meta } = result.result;

	return (
		<div className="space-y-6">
			{/* Disclaimer */}
			<Card className="border-blue-500/50 bg-blue-500/10">
				<CardContent className="flex gap-3 pt-6">
					<Info className="h-5 w-5 shrink-0 text-blue-500" />
					<p className="text-muted-foreground text-sm">{disclaimer}</p>
				</CardContent>
			</Card>

			{/* Possible Conditions */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Stethoscope className="h-5 w-5 text-primary" />
						Possible Conditions
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{analysis.possibleConditions.map((condition, index) => (
						<Card key={`${condition.condition}-${index}`} className="shadow-sm">
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">
										{condition.condition}
									</CardTitle>
									<Badge
										variant={
											condition.riskLevel === "High"
												? "danger"
												: condition.riskLevel === "Medium"
													? "warning"
													: "success"
										}
									>
										{condition.riskLevel === "High" && (
											<AlertTriangle className="mr-1 h-3 w-3" />
										)}
										{condition.riskLevel} Risk
									</Badge>
								</div>
								<CardDescription>{condition.description}</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{condition.commonSymptoms &&
									condition.commonSymptoms.length > 0 && (
										<div>
											<p className="mb-2 font-medium text-muted-foreground text-sm">
												Common Symptoms:
											</p>
											<div className="flex flex-wrap gap-2">
												{condition.commonSymptoms.map((symptom) => (
													<Badge key={symptom} variant="outline">
														{symptom}
													</Badge>
												))}
											</div>
										</div>
									)}
								{condition.matchingSymptoms &&
									condition.matchingSymptoms.length > 0 && (
										<div>
											<p className="mb-2 font-medium text-muted-foreground text-sm">
												Matching Symptoms:
											</p>
											<div className="flex flex-wrap gap-2">
												{condition.matchingSymptoms.map((symptom) => (
													<Badge key={symptom} variant="secondary">
														<Check className="mr-1 h-3 w-3" />
														{symptom}
													</Badge>
												))}
											</div>
										</div>
									)}
								{condition.additionalInfo && (
									<p className="text-muted-foreground text-sm">
										{condition.additionalInfo}
									</p>
								)}
							</CardContent>
						</Card>
					))}
				</CardContent>
			</Card>

			{/* General Advice */}
			{analysis.generalAdvice && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ClipboardList className="h-5 w-5 text-primary" />
							General Advice
						</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-2">
						{analysis.generalAdvice.recommendedActions &&
							analysis.generalAdvice.recommendedActions.length > 0 && (
								<div className="space-y-3">
									<h4 className="flex items-center gap-2 font-medium">
										<Check className="h-4 w-4 text-green-500" />
										Recommended Actions
									</h4>
									<ul className="space-y-2">
										{analysis.generalAdvice.recommendedActions.map((action) => (
											<li
												key={action}
												className="flex items-start gap-2 text-muted-foreground text-sm"
											>
												<ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />
												{action}
											</li>
										))}
									</ul>
								</div>
							)}

						{analysis.generalAdvice.whenToSeekMedicalAttention &&
							analysis.generalAdvice.whenToSeekMedicalAttention.length > 0 && (
								<div className="space-y-3">
									<h4 className="flex items-center gap-2 font-medium text-yellow-600 dark:text-yellow-500">
										<AlertTriangle className="h-4 w-4" />
										When to Seek Medical Attention
									</h4>
									<ul className="space-y-2">
										{analysis.generalAdvice.whenToSeekMedicalAttention.map(
											(advice) => (
												<li
													key={advice}
													className="flex items-start gap-2 text-muted-foreground text-sm"
												>
													<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
													{advice}
												</li>
											),
										)}
									</ul>
								</div>
							)}
					</CardContent>
				</Card>
			)}

			{/* Educational Resources */}
			{educationalResources && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BookOpen className="h-5 w-5 text-primary" />
							Educational Resources
						</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-2">
						{educationalResources.medicalTerminology &&
							Object.keys(educationalResources.medicalTerminology).length >
								0 && (
								<div className="space-y-3">
									<h4 className="font-medium">Medical Terminology</h4>
									<div className="space-y-2">
										{Object.entries(
											educationalResources.medicalTerminology,
										).map(([term, definition]) => (
											<div key={term}>
												<span className="font-medium text-primary text-sm">
													{term}:
												</span>
												<p className="text-muted-foreground text-sm">
													{definition}
												</p>
											</div>
										))}
									</div>
								</div>
							)}

						{educationalResources.preventiveMeasures &&
							educationalResources.preventiveMeasures.length > 0 && (
								<div className="space-y-3">
									<h4 className="font-medium">Preventive Measures</h4>
									<ul className="space-y-2">
										{educationalResources.preventiveMeasures.map((measure) => (
											<li
												key={measure}
												className="flex items-start gap-2 text-muted-foreground text-sm"
											>
												<Heart className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />
												{measure}
											</li>
										))}
									</ul>
								</div>
							)}

						{educationalResources.reliableSources &&
							educationalResources.reliableSources.length > 0 && (
								<div className="space-y-3">
									<h4 className="font-medium">Reliable Sources</h4>
									<ul className="space-y-2">
										{educationalResources.reliableSources.map((source) => (
											<li
												key={source}
												className="flex items-start gap-2 text-muted-foreground text-sm"
											>
												<ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
												{source}
											</li>
										))}
									</ul>
								</div>
							)}
					</CardContent>
				</Card>
			)}

			{/* Meta Information */}
			{meta && (
				<div className="flex flex-wrap gap-4 text-muted-foreground text-xs">
					{meta.confidenceLevel && (
						<span>Confidence: {meta.confidenceLevel}</span>
					)}
					{meta.analysisTimestamp && (
						<span>
							Analyzed: {new Date(meta.analysisTimestamp).toLocaleString()}
						</span>
					)}
				</div>
			)}
		</div>
	);
}

function DashboardPage() {
	// API Key state
	const [apiKeyInput, setApiKeyInput] = useState(""); // Form state
	const [symptoms, setSymptoms] = useState<string[]>([]);
	const [age, setAge] = useState("");
	const [gender, setGender] = useState("");
	const [height, setHeight] = useState("");
	const [weight, setWeight] = useState("");
	const [medicalHistory, setMedicalHistory] = useState<string[]>([]);
	const [currentMedications, setCurrentMedications] = useState<string[]>([]);
	const [allergies, setAllergies] = useState<string[]>([]);
	const [smokingStatus, setSmokingStatus] = useState("false");
	const [alcoholConsumption, setAlcoholConsumption] = useState("none");
	const [exerciseLevel, setExerciseLevel] = useState("moderate");
	const [dietType, setDietType] = useState("balanced");
	const [language, setLanguage] = useState("English");

	// UI state
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<DiagnosisResult | null>(null);
	const [activeTab, setActiveTab] = useState("symptom-analysis");

	// Convex queries and mutations
	const storedApiKey = useQuery(api.diagnosis.getApiKey);
	const userProfile = useQuery(api.diagnosis.getUserProfile);
	const recentDiagnoses = useQuery(api.diagnosis.getDiagnoses, { limit: 5 });
	const saveApiKeyMutation = useMutation(api.diagnosis.saveApiKey);
	const saveDiagnosisMutation = useMutation(api.diagnosis.saveDiagnosis);
	const saveProfileMutation = useMutation(api.diagnosis.saveUserProfile);

	const handleSaveApiKey = async () => {
		if (!apiKeyInput.trim()) {
			toast.error("Please enter an API key");
			return;
		}
		try {
			await saveApiKeyMutation({ apiKey: apiKeyInput });
			setApiKeyInput("");
			toast.success("API Key saved successfully");
		} catch {
			toast.error("Failed to save API Key");
		}
	};

	const handleSaveProfile = async () => {
		try {
			await saveProfileMutation({
				age: age ? Number.parseInt(age) : undefined,
				gender: gender || undefined,
				height: height ? Number.parseFloat(height) : undefined,
				weight: weight ? Number.parseFloat(weight) : undefined,
				medicalHistory: medicalHistory.length > 0 ? medicalHistory : undefined,
				currentMedications:
					currentMedications.length > 0 ? currentMedications : undefined,
				allergies: allergies.length > 0 ? allergies : undefined,
				smokingStatus: smokingStatus || undefined,
				alcoholConsumption: alcoholConsumption || undefined,
				exerciseLevel: exerciseLevel || undefined,
				dietType: dietType || undefined,
			});
			toast.success("Profile saved successfully");
		} catch {
			toast.error("Failed to save profile");
		}
	};

	const loadProfile = () => {
		if (userProfile) {
			if (userProfile.age) setAge(userProfile.age.toString());
			if (userProfile.gender) setGender(userProfile.gender);
			if (userProfile.height) setHeight(userProfile.height.toString());
			if (userProfile.weight) setWeight(userProfile.weight.toString());
			if (userProfile.medicalHistory)
				setMedicalHistory(userProfile.medicalHistory);
			if (userProfile.currentMedications)
				setCurrentMedications(userProfile.currentMedications);
			if (userProfile.allergies) setAllergies(userProfile.allergies);
			if (userProfile.smokingStatus)
				setSmokingStatus(userProfile.smokingStatus);
			if (userProfile.alcoholConsumption)
				setAlcoholConsumption(userProfile.alcoholConsumption);
			if (userProfile.exerciseLevel)
				setExerciseLevel(userProfile.exerciseLevel);
			if (userProfile.dietType) setDietType(userProfile.dietType);
			toast.success("Profile loaded");
		}
	};

	const handleAnalyze = async () => {
		const keyToUse = storedApiKey || apiKeyInput;
		if (!keyToUse) {
			toast.error("Please provide an API Key");
			return;
		}
		if (symptoms.length === 0) {
			toast.error("Please add at least one symptom");
			return;
		}

		setLoading(true);
		setResult(null);

		try {
			const payload = {
				symptoms,
				age: age || undefined,
				gender: gender || undefined,
				height: height || undefined,
				weight: weight || undefined,
				medicalHistory: medicalHistory.length > 0 ? medicalHistory : undefined,
				currentMedications:
					currentMedications.length > 0 ? currentMedications : undefined,
				allergies: allergies.length > 0 ? allergies : undefined,
				smoking: smokingStatus === "true",
				alcohol: alcoholConsumption,
				exercise: exerciseLevel,
				diet: dietType,
				language,
			};

			const response = await fetch(
				"https://ai-medical-diagnosis-api-symptoms-to-results.p.rapidapi.com/analyzeSymptomsAndDiagnose?noqueue=1",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-RapidAPI-Key": keyToUse,
						"X-RapidAPI-Host":
							"ai-medical-diagnosis-api-symptoms-to-results.p.rapidapi.com",
					},
					body: JSON.stringify(payload),
				},
			);

			const data = await response.json();

			if (data.status === "success" && data.result) {
				setResult(data as DiagnosisResult);

				// Save the diagnosis
				await saveDiagnosisMutation({
					symptoms,
					patientInfo: {
						age: age ? Number.parseInt(age) : undefined,
						gender: gender || undefined,
						height: height ? Number.parseFloat(height) : undefined,
						weight: weight ? Number.parseFloat(weight) : undefined,
						medicalHistory:
							medicalHistory.length > 0 ? medicalHistory : undefined,
						currentMedications:
							currentMedications.length > 0 ? currentMedications : undefined,
						allergies: allergies.length > 0 ? allergies : undefined,
						smokingStatus: smokingStatus || undefined,
						alcoholConsumption: alcoholConsumption || undefined,
						exerciseLevel: exerciseLevel || undefined,
						dietType: dietType || undefined,
					},
					result: data,
					language,
				});

				toast.success("Diagnosis complete and saved");
			} else {
				toast.error(data.message || "Failed to get diagnosis");
			}
		} catch (error) {
			console.error(error);
			toast.error("An error occurred during analysis");
		} finally {
			setLoading(false);
		}
	};

	return (
		<ScrollArea className="h-full">
			<div className="container mx-auto max-w-6xl space-y-6 p-4 pb-16">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Stethoscope className="h-8 w-8 text-primary" />
						<div>
							<h1 className="font-bold text-2xl">AI Medical Diagnosis</h1>
							<p className="text-muted-foreground text-sm">
								Symptom analysis powered by AI
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Select value={language} onValueChange={setLanguage}>
							<SelectTrigger className="w-32">
								<SelectValue placeholder="Language" />
							</SelectTrigger>
							<SelectContent>
								{LANGUAGES.map((lang) => (
									<SelectItem key={lang.value} value={lang.value}>
										{lang.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button variant="outline" size="sm" asChild>
							<a
								href="https://rapidapi.com/bilgisamapi-api2/api/ai-medical-diagnosis-api-symptoms-to-results"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Key className="mr-2 h-4 w-4" />
								Get API Key
							</a>
						</Button>
					</div>
				</div>

				{/* API Key Configuration */}
				{!storedApiKey && (
					<Card className="border-yellow-500/50 bg-yellow-500/10">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Key className="h-5 w-5" />
								API Key Required
							</CardTitle>
							<CardDescription>
								Enter your RapidAPI key for the AI Medical Diagnosis API. Your
								key will be securely stored.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex gap-4">
							<Input
								type="password"
								placeholder="Enter your RapidAPI key"
								value={apiKeyInput}
								onChange={(e) => setApiKeyInput(e.target.value)}
								className="flex-1"
							/>
							<Button onClick={handleSaveApiKey}>
								<Save className="mr-2 h-4 w-4" />
								Save Key
							</Button>
						</CardContent>
					</Card>
				)}

				{/* Main Content */}
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="symptom-analysis" className="gap-2">
							<Stethoscope className="h-4 w-4" />
							<span className="hidden sm:inline">Symptom Analysis</span>
							<span className="sm:hidden">Symptoms</span>
						</TabsTrigger>
						<TabsTrigger value="health-profile" className="gap-2">
							<User className="h-4 w-4" />
							<span className="hidden sm:inline">Health Profile</span>
							<span className="sm:hidden">Profile</span>
						</TabsTrigger>
						<TabsTrigger value="history" className="gap-2">
							<History className="h-4 w-4" />
							<span className="hidden sm:inline">Diagnosis History</span>
							<span className="sm:hidden">History</span>
						</TabsTrigger>
					</TabsList>

					{/* Symptom Analysis Tab */}
					<TabsContent value="symptom-analysis" className="space-y-6">
						<div className="grid gap-6 lg:grid-cols-2">
							{/* Left Column - Form */}
							<div className="space-y-6">
								{/* Symptoms */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Activity className="h-5 w-5 text-primary" />
											Symptoms
										</CardTitle>
										<CardDescription>
											Enter your symptoms, press Enter to add each one
										</CardDescription>
									</CardHeader>
									<CardContent>
										<TagInput
											id="symptoms"
											tags={symptoms}
											setTags={setSymptoms}
											placeholder="e.g., headache, fever, fatigue..."
										/>
									</CardContent>
								</Card>

								{/* Patient Information */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<User className="h-5 w-5 text-primary" />
											Patient Information
										</CardTitle>
										<div className="flex items-center gap-2">
											{userProfile && (
												<Button
													variant="outline"
													size="sm"
													onClick={loadProfile}
												>
													Load Saved Profile
												</Button>
											)}
										</div>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="age">Age</Label>
												<Input
													id="age"
													type="number"
													placeholder="e.g., 30"
													value={age}
													onChange={(e) => setAge(e.target.value)}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="gender">Gender</Label>
												<Select value={gender} onValueChange={setGender}>
													<SelectTrigger id="gender">
														<SelectValue placeholder="Select" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="male">Male</SelectItem>
														<SelectItem value="female">Female</SelectItem>
														<SelectItem value="other">Other</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="height">Height (cm)</Label>
												<Input
													id="height"
													type="number"
													placeholder="e.g., 170"
													value={height}
													onChange={(e) => setHeight(e.target.value)}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="weight">Weight (kg)</Label>
												<Input
													id="weight"
													type="number"
													placeholder="e.g., 70"
													value={weight}
													onChange={(e) => setWeight(e.target.value)}
												/>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Medical History */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Pill className="h-5 w-5 text-primary" />
											Medical Background
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="space-y-2">
											<Label>Medical History</Label>
											<TagInput
												id="medical-history"
												tags={medicalHistory}
												setTags={setMedicalHistory}
												placeholder="e.g., hypertension, diabetes..."
											/>
										</div>
										<div className="space-y-2">
											<Label>Current Medications</Label>
											<TagInput
												id="medications"
												tags={currentMedications}
												setTags={setCurrentMedications}
												placeholder="e.g., lisinopril 10mg..."
											/>
										</div>
										<div className="space-y-2">
											<Label>Allergies</Label>
											<TagInput
												id="allergies"
												tags={allergies}
												setTags={setAllergies}
												placeholder="e.g., penicillin, peanuts..."
											/>
										</div>
									</CardContent>
								</Card>

								{/* Lifestyle */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Heart className="h-5 w-5 text-primary" />
											Lifestyle Information
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>Smoking Status</Label>
												<Select
													value={smokingStatus}
													onValueChange={setSmokingStatus}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="false">Non-smoker</SelectItem>
														<SelectItem value="true">Smoker</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label>Alcohol Consumption</Label>
												<Select
													value={alcoholConsumption}
													onValueChange={setAlcoholConsumption}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="none">None</SelectItem>
														<SelectItem value="occasional">
															Occasional
														</SelectItem>
														<SelectItem value="moderate">Moderate</SelectItem>
														<SelectItem value="frequent">Frequent</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>Exercise Level</Label>
												<Select
													value={exerciseLevel}
													onValueChange={setExerciseLevel}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="sedentary">Sedentary</SelectItem>
														<SelectItem value="light">Light</SelectItem>
														<SelectItem value="moderate">Moderate</SelectItem>
														<SelectItem value="active">Active</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label>Diet Type</Label>
												<Select value={dietType} onValueChange={setDietType}>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="balanced">Balanced</SelectItem>
														<SelectItem value="vegetarian">
															Vegetarian
														</SelectItem>
														<SelectItem value="vegan">Vegan</SelectItem>
														<SelectItem value="keto">Keto</SelectItem>
														<SelectItem value="mixed">Mixed</SelectItem>
														<SelectItem value="other">Other</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Analyze Button */}
								<Button
									className="w-full py-6 text-lg"
									onClick={handleAnalyze}
									disabled={loading || (!storedApiKey && !apiKeyInput)}
								>
									{loading ? (
										<>
											<Loader2 className="mr-2 h-5 w-5 animate-spin" />
											Analyzing...
										</>
									) : (
										<>
											<Stethoscope className="mr-2 h-5 w-5" />
											Analyze Symptoms
										</>
									)}
								</Button>
							</div>

							{/* Right Column - Results */}
							<div className="space-y-6">
								{result ? (
									<DiagnosisResults result={result} />
								) : (
									<Card className="flex h-full min-h-96 flex-col items-center justify-center border-dashed">
										<CardContent className="text-center">
											<Stethoscope className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
											<h3 className="mb-2 font-medium text-lg">
												No Analysis Yet
											</h3>
											<p className="text-muted-foreground text-sm">
												Add your symptoms and click "Analyze Symptoms" to get
												AI-powered diagnosis results.
											</p>
										</CardContent>
									</Card>
								)}
							</div>
						</div>
					</TabsContent>

					{/* Health Profile Tab */}
					<TabsContent value="health-profile" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Save Your Health Profile</CardTitle>
								<CardDescription>
									Save your health information for future diagnoses. Your data
									is stored securely.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="grid gap-6 md:grid-cols-2">
									<div className="space-y-4">
										<h3 className="font-medium">Basic Information</h3>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>Age</Label>
												<Input
													type="number"
													placeholder="e.g., 30"
													value={age}
													onChange={(e) => setAge(e.target.value)}
												/>
											</div>
											<div className="space-y-2">
												<Label>Gender</Label>
												<Select value={gender} onValueChange={setGender}>
													<SelectTrigger>
														<SelectValue placeholder="Select" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="male">Male</SelectItem>
														<SelectItem value="female">Female</SelectItem>
														<SelectItem value="other">Other</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>Height (cm)</Label>
												<Input
													type="number"
													placeholder="e.g., 170"
													value={height}
													onChange={(e) => setHeight(e.target.value)}
												/>
											</div>
											<div className="space-y-2">
												<Label>Weight (kg)</Label>
												<Input
													type="number"
													placeholder="e.g., 70"
													value={weight}
													onChange={(e) => setWeight(e.target.value)}
												/>
											</div>
										</div>
									</div>

									<div className="space-y-4">
										<h3 className="font-medium">Lifestyle</h3>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>Smoking</Label>
												<Select
													value={smokingStatus}
													onValueChange={setSmokingStatus}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="false">Non-smoker</SelectItem>
														<SelectItem value="true">Smoker</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label>Alcohol</Label>
												<Select
													value={alcoholConsumption}
													onValueChange={setAlcoholConsumption}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="none">None</SelectItem>
														<SelectItem value="occasional">
															Occasional
														</SelectItem>
														<SelectItem value="moderate">Moderate</SelectItem>
														<SelectItem value="frequent">Frequent</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>Exercise</Label>
												<Select
													value={exerciseLevel}
													onValueChange={setExerciseLevel}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="sedentary">Sedentary</SelectItem>
														<SelectItem value="light">Light</SelectItem>
														<SelectItem value="moderate">Moderate</SelectItem>
														<SelectItem value="active">Active</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label>Diet</Label>
												<Select value={dietType} onValueChange={setDietType}>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="balanced">Balanced</SelectItem>
														<SelectItem value="vegetarian">
															Vegetarian
														</SelectItem>
														<SelectItem value="vegan">Vegan</SelectItem>
														<SelectItem value="keto">Keto</SelectItem>
														<SelectItem value="other">Other</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="font-medium">Medical Background</h3>
									<div className="grid gap-4 md:grid-cols-3">
										<div className="space-y-2">
											<Label>Medical History</Label>
											<TagInput
												id="profile-medical-history"
												tags={medicalHistory}
												setTags={setMedicalHistory}
												placeholder="Enter conditions..."
											/>
										</div>
										<div className="space-y-2">
											<Label>Current Medications</Label>
											<TagInput
												id="profile-medications"
												tags={currentMedications}
												setTags={setCurrentMedications}
												placeholder="Enter medications..."
											/>
										</div>
										<div className="space-y-2">
											<Label>Allergies</Label>
											<TagInput
												id="profile-allergies"
												tags={allergies}
												setTags={setAllergies}
												placeholder="Enter allergies..."
											/>
										</div>
									</div>
								</div>

								<Button onClick={handleSaveProfile} className="w-full">
									<Save className="mr-2 h-4 w-4" />
									Save Health Profile
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					{/* History Tab */}
					<TabsContent value="history" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<History className="h-5 w-5 text-primary" />
									Recent Diagnoses
								</CardTitle>
								<CardDescription>
									View your past symptom analyses and diagnoses
								</CardDescription>
							</CardHeader>
							<CardContent>
								{recentDiagnoses && recentDiagnoses.length > 0 ? (
									<div className="space-y-4">
										{recentDiagnoses.map((diagnosis) => (
											<Card key={diagnosis._id} className="shadow-sm">
												<CardHeader className="pb-3">
													<div className="flex items-center justify-between">
														<CardTitle className="text-base">
															{new Date(diagnosis.createdAt).toLocaleDateString(
																"en-US",
																{
																	year: "numeric",
																	month: "short",
																	day: "numeric",
																	hour: "2-digit",
																	minute: "2-digit",
																},
															)}
														</CardTitle>
														<Badge variant="outline">
															{diagnosis.symptoms.length} symptoms
														</Badge>
													</div>
												</CardHeader>
												<CardContent>
													<div className="flex flex-wrap gap-2">
														{diagnosis.symptoms.map((symptom) => (
															<Badge key={symptom} variant="secondary">
																{symptom}
															</Badge>
														))}
													</div>
													{diagnosis.result?.result?.analysis
														?.possibleConditions && (
														<div className="mt-4">
															<p className="mb-2 font-medium text-muted-foreground text-sm">
																Possible Conditions:
															</p>
															<div className="flex flex-wrap gap-2">
																{diagnosis.result.result.analysis.possibleConditions
																	.slice(0, 3)
																	.map((condition: { condition: string }) => (
																		<Badge key={condition.condition}>
																			{condition.condition}
																		</Badge>
																	))}
															</div>
														</div>
													)}
												</CardContent>
											</Card>
										))}
									</div>
								) : (
									<div className="py-12 text-center">
										<History className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
										<h3 className="mb-2 font-medium text-lg">
											No Diagnosis History
										</h3>
										<p className="text-muted-foreground text-sm">
											Your diagnosis history will appear here after you analyze
											your symptoms.
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</ScrollArea>
	);
}
