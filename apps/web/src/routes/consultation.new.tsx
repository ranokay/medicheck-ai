import { api } from "@medicheck-ai/backend/convex/_generated/api";
import type { Id } from "@medicheck-ai/backend/convex/_generated/dataModel";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ArrowLeft, Brain, ClipboardList, UserPlus } from "lucide-react";
import { useState } from "react";
import { AISymptomChecker } from "@/components/ai-symptom-checker";
import { PatientSearch } from "@/components/patient-search";
import { SymptomChecker } from "@/components/symptom-checker";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { calculateAge } from "@/lib/types";

type ConsultationStep = "select-patient" | "symptoms";

export const Route = createFileRoute("/consultation/new")({
	component: NewConsultationPage,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			patientId: search.patientId as string | undefined,
		};
	},
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			throw redirect({ to: "/" });
		}
	},
});

function NewConsultationPage() {
	const navigate = useNavigate();
	const { patientId: initialPatientId } = Route.useSearch();

	const [step, setStep] = useState<ConsultationStep>(
		initialPatientId ? "symptoms" : "select-patient",
	);
	const [selectedPatientId, setSelectedPatientId] = useState<
		Id<"patients"> | undefined
	>(initialPatientId as Id<"patients"> | undefined);

	const selectedPatient = useQuery(
		api.patients.getPatient,
		selectedPatientId ? { id: selectedPatientId } : "skip",
	);

	const handlePatientSelect = (patientId: Id<"patients">) => {
		setSelectedPatientId(patientId);
		setStep("symptoms");
	};

	const handleConsultationComplete = (consultationId: Id<"consultations">) => {
		navigate({
			to: "/consultation/$id",
			params: { id: consultationId },
		});
	};

	return (
		<div className="container max-w-4xl py-6">
			<div className="mb-6">
				<Button asChild variant="ghost" size="sm">
					<Link to="/dashboard">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Înapoi la Dashboard
					</Link>
				</Button>
			</div>

			{/* Step indicator */}
			<div className="mb-8">
				<div className="flex items-center gap-4">
					<StepIndicator
						step={1}
						label="Selectează Pacientul"
						isActive={step === "select-patient"}
						isCompleted={step === "symptoms"}
					/>
					<div className="h-px flex-1 bg-border" />
					<StepIndicator
						step={2}
						label="Simptome & Diagnostic"
						isActive={step === "symptoms"}
						isCompleted={false}
					/>
				</div>
			</div>

			{step === "select-patient" && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<UserPlus className="h-5 w-5" />
							Selectează sau Creează Pacient
						</CardTitle>
						<CardDescription>
							Caută un pacient existent după CNP sau nume, sau creează un
							pacient nou
						</CardDescription>
					</CardHeader>
					<CardContent>
						<PatientSearch
							onSelectPatient={(id) =>
								handlePatientSelect(id as Id<"patients">)
							}
						/>
					</CardContent>
				</Card>
			)}

			{step === "symptoms" && selectedPatientId && (
				<div className="space-y-6">
					{selectedPatient && (
						<Card>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<div>
										<CardTitle>
											{selectedPatient.firstName} {selectedPatient.lastName}
										</CardTitle>
										<CardDescription>
											CNP: {selectedPatient.cnp}
										</CardDescription>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setSelectedPatientId(undefined);
											setStep("select-patient");
										}}
									>
										Schimbă Pacientul
									</Button>
								</div>
							</CardHeader>
						</Card>
					)}

					{/* Tabs for AI vs Manual mode */}
					<Tabs defaultValue="ai" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="ai" className="flex items-center gap-2">
								<Brain className="h-4 w-4" />
								Diagnostic AI (Monarch KG)
							</TabsTrigger>
							<TabsTrigger value="manual" className="flex items-center gap-2">
								<ClipboardList className="h-4 w-4" />
								Manual
							</TabsTrigger>
						</TabsList>
						<TabsContent value="ai" className="mt-4">
							{selectedPatient && (
								<AISymptomChecker
									patientId={selectedPatientId}
									patientAge={calculateAge(selectedPatient.dateOfBirth)}
									patientSex={selectedPatient.sex}
									onComplete={handleConsultationComplete}
								/>
							)}
						</TabsContent>
						<TabsContent value="manual" className="mt-4">
							<SymptomChecker
								patientId={selectedPatientId}
								onComplete={handleConsultationComplete}
							/>
						</TabsContent>
					</Tabs>
				</div>
			)}
		</div>
	);
}

function StepIndicator({
	step,
	label,
	isActive,
	isCompleted,
}: {
	step: number;
	label: string;
	isActive: boolean;
	isCompleted: boolean;
}) {
	return (
		<div className="flex items-center gap-2">
			<div
				className={`flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm ${
					isCompleted
						? "bg-primary text-primary-foreground"
						: isActive
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground"
				}`}
			>
				{isCompleted ? "✓" : step}
			</div>
			<span
				className={`font-medium text-sm ${
					isActive ? "text-foreground" : "text-muted-foreground"
				}`}
			>
				{label}
			</span>
		</div>
	);
}
