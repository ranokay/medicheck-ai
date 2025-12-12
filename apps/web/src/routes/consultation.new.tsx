/**
 * Consultation Route
 *
 * Uses the Monarch API (Python FastAPI backend) for symptom checking.
 * This route uses the DecisionGraphOrchestrator component for the symptom checker.
 */

import { api } from "@medicheck-ai/backend/convex/_generated/api";
import type { Id } from "@medicheck-ai/backend/convex/_generated/dataModel";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Beaker, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { DecisionGraphOrchestrator } from "@/components/decision-graph-orchestrator";
import { PatientSearch } from "@/components/patient-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

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
	const { patientId: initialPatientId } = Route.useSearch();
	const navigate = useNavigate();

	const [step, setStep] = useState<ConsultationStep>(
		initialPatientId ? "symptoms" : "select-patient",
	);
	const [selectedPatientId, setSelectedPatientId] = useState<
		Id<"patients"> | undefined
	>(initialPatientId as Id<"patients"> | undefined);
	const [consultationId, setConsultationId] = useState<
		Id<"consultations"> | undefined
	>();

	const startConsultation = useMutation(api.consultations.startConsultation);

	const selectedPatient = useQuery(
		api.patients.getPatient,
		selectedPatientId ? { id: selectedPatientId } : "skip",
	);

	// Create consultation when navigating with an initial patient ID
	useEffect(() => {
		if (initialPatientId && !consultationId) {
			startConsultation({
				patientId: initialPatientId as Id<"patients">,
				chiefComplaint: "Consultație nouă - simptome în curs de evaluare",
			})
				.then((newConsultationId) => {
					setConsultationId(newConsultationId);
				})
				.catch((error) => {
					console.error("Failed to start consultation:", error);
				});
		}
	}, [initialPatientId, consultationId, startConsultation]);

	const handlePatientSelect = async (patientId: Id<"patients">) => {
		setSelectedPatientId(patientId);

		// Create a new consultation for this patient
		try {
			const newConsultationId = await startConsultation({
				patientId,
				chiefComplaint: "Consultație nouă - simptome în curs de evaluare",
			});
			setConsultationId(newConsultationId);
			setStep("symptoms");
		} catch (error) {
			console.error("Failed to start consultation:", error);
			// Still proceed but without consultation ID
			setStep("symptoms");
		}
	};

	return (
		<div className="container mx-auto max-w-4xl px-4 py-6">
			<div className="mb-6 flex items-center justify-between">
				<Button asChild variant="ghost" size="sm">
					<Link to="/dashboard">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Înapoi la Dashboard
					</Link>
				</Button>
				<Badge variant="secondary" className="gap-1">
					<Beaker className="h-3 w-3" />
					Monarch API
				</Badge>
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
											setConsultationId(undefined);
											setStep("select-patient");
										}}
									>
										Schimbă Pacientul
									</Button>
								</div>
							</CardHeader>
						</Card>
					)}

					{/* Symptom Checker using DecisionGraphOrchestrator */}
					<DecisionGraphOrchestrator
						patient={selectedPatient}
						consultationId={consultationId}
						onComplete={(results) => {
							console.log("Diagnosis results:", results);
							// Navigate to the consultation detail page
							if (consultationId) {
								navigate({
									to: "/consultation/$id",
									params: { id: consultationId },
								});
							} else {
								navigate({ to: "/dashboard" });
							}
						}}
					/>
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
