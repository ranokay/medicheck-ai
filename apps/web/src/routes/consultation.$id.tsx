import { api } from "@medicheck-ai/backend/convex/_generated/api";
import type { Id } from "@medicheck-ai/backend/convex/_generated/dataModel";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
	Activity,
	AlertTriangle,
	ArrowLeft,
	Calendar,
	CheckCircle2,
	Clock,
	FileText,
	MessageSquare,
	Stethoscope,
	User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import {
	calculateAge,
	formatDateTime,
	getStatusColor,
	getStatusLabel,
} from "@/lib/types";

export const Route = createFileRoute("/consultation/$id")({
	component: ConsultationDetailPage,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			throw redirect({ to: "/" });
		}
	},
});

function ConsultationDetailPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const [isCompleting, setIsCompleting] = useState(false);

	const consultation = useQuery(api.consultations.getConsultation, {
		id: id as Id<"consultations">,
	});

	const patient = useQuery(
		api.patients.getPatient,
		consultation?.patientId ? { id: consultation.patientId } : "skip",
	);

	const completeConsultation = useMutation(
		api.consultations.completeConsultation,
	);

	const handleComplete = async () => {
		if (!consultation) return;

		setIsCompleting(true);
		try {
			await completeConsultation({
				id: consultation._id,
				diagnosisResults: consultation.diagnosisResults ?? [],
			});
			toast.success("Consultația a fost finalizată");
			navigate({ to: "/dashboard" });
		} catch (error) {
			toast.error("Eroare la finalizarea consultației");
			console.error(error);
		} finally {
			setIsCompleting(false);
		}
	};

	if (!consultation || !patient) {
		return (
			<div className="container flex min-h-[60vh] items-center justify-center">
				<div className="text-center">
					<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
					<p className="text-muted-foreground">Se încarcă...</p>
				</div>
			</div>
		);
	}

	const severityColors: Record<string, string> = {
		critical: "bg-red-500",
		high: "bg-orange-500",
		medium: "bg-yellow-500",
		low: "bg-green-500",
	};

	const severityLabels: Record<string, string> = {
		critical: "Critic",
		high: "Ridicat",
		medium: "Mediu",
		low: "Scăzut",
	};

	return (
		<div className="container max-w-5xl py-6">
			<div className="mb-6 flex items-center justify-between">
				<Button asChild variant="ghost" size="sm">
					<Link to="/dashboard">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Înapoi la Dashboard
					</Link>
				</Button>

				<Badge
					variant="outline"
					className={getStatusColor(consultation.status)}
				>
					{getStatusLabel(consultation.status)}
				</Badge>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				{/* Main content */}
				<div className="space-y-6 md:col-span-2">
					{/* Header */}
					<Card>
						<CardHeader>
							<div className="flex items-center gap-4">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
									<Stethoscope className="h-6 w-6" />
								</div>
								<div>
									<CardTitle>Consultație #{id.slice(-6)}</CardTitle>
									<CardDescription className="flex items-center gap-2">
										<Calendar className="h-3.5 w-3.5" />
										{formatDateTime(consultation.startedAt)}
									</CardDescription>
								</div>
							</div>
						</CardHeader>
					</Card>

					{/* Chief Complaint */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<MessageSquare className="h-4 w-4" />
								Motivul Vizitei
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground">
								{consultation.chiefComplaint}
							</p>
						</CardContent>
					</Card>

					{/* Symptoms */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<Activity className="h-4 w-4" />
								Simptome Raportate
							</CardTitle>
						</CardHeader>
						<CardContent>
							{consultation.symptoms && consultation.symptoms.length > 0 ? (
								<div className="space-y-3">
									{consultation.symptoms.map((symptom, index) => (
										<div
											key={`${symptom.name}-${index}`}
											className="flex items-start gap-3 rounded-lg border p-3"
										>
											<div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs">
												{index + 1}
											</div>
											<div className="flex-1">
												<p className="font-medium">{symptom.name}</p>
												<div className="mt-1 flex items-center gap-4 text-muted-foreground text-xs">
													{symptom.severity && (
														<span>
															Severitate:{" "}
															{symptom.severity === "mild"
																? "Ușoară"
																: symptom.severity === "moderate"
																	? "Moderată"
																	: "Severă"}
														</span>
													)}
													{symptom.duration && (
														<span>Durată: {symptom.duration}</span>
													)}
												</div>
												{symptom.notes && (
													<p className="mt-1 text-muted-foreground text-sm">
														{symptom.notes}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							) : (
								<p className="text-muted-foreground">
									Nu au fost înregistrate simptome
								</p>
							)}
						</CardContent>
					</Card>

					{/* Vital Signs */}
					{consultation.vitalSigns && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Activity className="h-4 w-4" />
									Semne Vitale
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
									{consultation.vitalSigns.bloodPressureSystolic && (
										<div className="rounded-lg border p-3 text-center">
											<p className="font-bold text-2xl">
												{consultation.vitalSigns.bloodPressureSystolic}/
												{consultation.vitalSigns.bloodPressureDiastolic}
											</p>
											<p className="text-muted-foreground text-xs">
												Tensiune (mmHg)
											</p>
										</div>
									)}
									{consultation.vitalSigns.heartRate && (
										<div className="rounded-lg border p-3 text-center">
											<p className="font-bold text-2xl">
												{consultation.vitalSigns.heartRate}
											</p>
											<p className="text-muted-foreground text-xs">
												Puls (bpm)
											</p>
										</div>
									)}
									{consultation.vitalSigns.temperature && (
										<div className="rounded-lg border p-3 text-center">
											<p className="font-bold text-2xl">
												{consultation.vitalSigns.temperature}°C
											</p>
											<p className="text-muted-foreground text-xs">
												Temperatură
											</p>
										</div>
									)}
									{consultation.vitalSigns.oxygenSaturation && (
										<div className="rounded-lg border p-3 text-center">
											<p className="font-bold text-2xl">
												{consultation.vitalSigns.oxygenSaturation}%
											</p>
											<p className="text-muted-foreground text-xs">
												Saturație O2
											</p>
										</div>
									)}
									{consultation.vitalSigns.weight && (
										<div className="rounded-lg border p-3 text-center">
											<p className="font-bold text-2xl">
												{consultation.vitalSigns.weight} kg
											</p>
											<p className="text-muted-foreground text-xs">Greutate</p>
										</div>
									)}
									{consultation.vitalSigns.height && (
										<div className="rounded-lg border p-3 text-center">
											<p className="font-bold text-2xl">
												{consultation.vitalSigns.height} cm
											</p>
											<p className="text-muted-foreground text-xs">Înălțime</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Diagnosis Results */}
					{consultation.diagnosisResults &&
						consultation.diagnosisResults.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2 text-lg">
										<FileText className="h-4 w-4" />
										Rezultate Diagnostic
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-3">
										{consultation.diagnosisResults.map((result, index) => (
											<div
												key={`${result.conditionName}-${index}`}
												className="rounded-lg border p-4"
											>
												<div className="mb-2 flex items-center justify-between">
													<h4 className="font-medium">
														{result.conditionName}
													</h4>
													<Badge className={severityColors[result.severity]}>
														{severityLabels[result.severity]}
													</Badge>
												</div>
												<div className="mb-2 flex items-center gap-2">
													<Progress
														value={result.probability}
														className="h-2 flex-1"
													/>
													<span className="font-medium text-sm">
														{result.probability}%
													</span>
												</div>
												{result.description && (
													<p className="text-muted-foreground text-sm">
														{result.description}
													</p>
												)}
												{result.recommendedActions &&
													result.recommendedActions.length > 0 && (
														<div className="mt-3">
															<p className="mb-1 font-medium text-sm">
																Acțiuni recomandate:
															</p>
															<ul className="list-inside list-disc text-muted-foreground text-sm">
																{result.recommendedActions.map((action, i) => (
																	<li key={`action-${i}`}>{action}</li>
																))}
															</ul>
														</div>
													)}
												{result.specialistRecommendation && (
													<p className="mt-2 text-primary text-sm">
														<strong>Specialist recomandat:</strong>{" "}
														{result.specialistRecommendation}
													</p>
												)}
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}

					{/* Referral Info */}
					{consultation.referredToDoctor && (
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Trimitere</CardTitle>
							</CardHeader>
							<CardContent>
								<p>
									<strong>Trimis către:</strong> {consultation.referredToDoctor}
								</p>
								{consultation.referralNotes && (
									<p className="mt-2 text-muted-foreground">
										{consultation.referralNotes}
									</p>
								)}
							</CardContent>
						</Card>
					)}

					{/* Complete Consultation Button */}
					{consultation.status === "in_progress" && (
						<Card>
							<CardContent className="pt-6">
								<Button
									onClick={handleComplete}
									disabled={isCompleting}
									className="w-full"
								>
									{isCompleting ? (
										<>
											<Clock className="mr-2 h-4 w-4 animate-spin" />
											Se finalizează...
										</>
									) : (
										<>
											<CheckCircle2 className="mr-2 h-4 w-4" />
											Finalizează Consultația
										</>
									)}
								</Button>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Sidebar - Patient Info */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<User className="h-4 w-4" />
								Pacient
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="font-semibold text-lg">
									{patient.firstName} {patient.lastName}
								</p>
								<p className="text-muted-foreground text-sm">
									CNP: {patient.cnp}
								</p>
							</div>

							<Separator />

							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Vârstă</span>
									<span className="font-medium">
										{calculateAge(patient.dateOfBirth)} ani
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Sex</span>
									<span className="font-medium">
										{patient.sex === "male" ? "Masculin" : "Feminin"}
									</span>
								</div>
								{patient.bloodType && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Grupa sanguină
										</span>
										<span className="font-medium">{patient.bloodType}</span>
									</div>
								)}
							</div>

							{patient.knownAllergies && patient.knownAllergies.length > 0 && (
								<>
									<Separator />
									<div>
										<div className="mb-2 flex items-center gap-2 font-medium text-orange-600 text-sm">
											<AlertTriangle className="h-4 w-4" />
											Alergii
										</div>
										<div className="flex flex-wrap gap-1">
											{patient.knownAllergies.map((allergy, index) => (
												<Badge
													key={`allergy-${index}`}
													variant="outline"
													className="border-orange-200 bg-orange-50 text-orange-700"
												>
													{allergy}
												</Badge>
											))}
										</div>
									</div>
								</>
							)}

							{patient.chronicConditions &&
								patient.chronicConditions.length > 0 && (
									<>
										<Separator />
										<div>
											<p className="mb-2 font-medium text-sm">
												Condiții Cronice
											</p>
											<div className="flex flex-wrap gap-1">
												{patient.chronicConditions.map((condition, index) => (
													<Badge key={`chronic-${index}`} variant="secondary">
														{condition}
													</Badge>
												))}
											</div>
										</div>
									</>
								)}

							<Separator />

							<Button asChild variant="outline" className="w-full">
								<Link to="/patients/$id" params={{ id: patient._id }}>
									Vezi Profil Complet
								</Link>
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
