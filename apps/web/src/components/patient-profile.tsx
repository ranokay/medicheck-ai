import { api } from "@medicheck-ai/backend/convex/_generated/api";
import type { Id } from "@medicheck-ai/backend/convex/_generated/dataModel";
import { Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	Activity,
	AlertCircle,
	Calendar,
	Clock,
	FileText,
	Heart,
	Loader2,
	Pencil,
	Phone,
	Pill,
	Play,
	Plus,
	User,
} from "lucide-react";
import {
	calculateAge,
	formatDateTime,
	getStatusColor,
	getStatusLabel,
} from "@/lib/types";
import { EditPatientDialog } from "./edit-patient-dialog";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

interface PatientProfileProps {
	patientId: Id<"patients">;
	onStartConsultation?: () => void;
}

export function PatientProfile({
	patientId,
	onStartConsultation,
}: PatientProfileProps) {
	const patient = useQuery(api.patients.getPatient, { id: patientId });
	const consultations = useQuery(api.consultations.getPatientConsultations, {
		patientId,
		limit: 10,
	});

	if (patient === undefined) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!patient) {
		return (
			<div className="py-12 text-center">
				<p className="text-muted-foreground">Pacientul nu a fost găsit.</p>
			</div>
		);
	}

	const age = calculateAge(patient.dateOfBirth);

	return (
		<div className="space-y-6">
			{/* Patient header */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col gap-6 sm:flex-row sm:items-start">
						<Avatar className="h-20 w-20">
							<AvatarFallback className="text-2xl">
								{patient.firstName[0]}
								{patient.lastName[0]}
							</AvatarFallback>
						</Avatar>

						<div className="flex-1 space-y-4">
							<div>
								<h1 className="font-bold text-2xl">
									{patient.lastName} {patient.firstName}
								</h1>
								<div className="mt-1 flex flex-wrap items-center gap-3 text-muted-foreground">
									<span className="flex items-center gap-1">
										<User className="h-4 w-4" />
										{patient.sex === "male" ? "Masculin" : "Feminin"}, {age} ani
									</span>
									<span className="flex items-center gap-1">
										<Calendar className="h-4 w-4" />
										{new Date(patient.dateOfBirth).toLocaleDateString("ro-RO")}
									</span>
									{patient.phone && (
										<span className="flex items-center gap-1">
											<Phone className="h-4 w-4" />
											{patient.phone}
										</span>
									)}
								</div>
							</div>

							<div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
								<FileText className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium text-sm">CNP:</span>
								<code className="rounded bg-background px-2 py-0.5 font-mono text-sm">
									{patient.cnp}
								</code>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								{onStartConsultation && (
									<Button onClick={onStartConsultation} className="gap-2">
										<Plus className="h-4 w-4" />
										Consultație Nouă
									</Button>
								)}
								<EditPatientDialog
									patientId={patientId}
									trigger={
										<Button variant="outline" className="gap-2">
											<Pencil className="h-4 w-4" />
											Editează Datele
										</Button>
									}
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Medical information */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* Health info */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Heart className="h-5 w-5 text-red-500" />
							Informații Medicale
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{patient.bloodType && (
							<div>
								<span className="text-muted-foreground text-sm">
									Grupa Sanguină
								</span>
								<p className="font-medium">{patient.bloodType}</p>
							</div>
						)}

						{patient.knownAllergies && patient.knownAllergies.length > 0 && (
							<div>
								<span className="text-muted-foreground text-sm">Alergii</span>
								<div className="mt-1 flex flex-wrap gap-1">
									{patient.knownAllergies.map((allergy) => (
										<Badge key={allergy} variant="destructive">
											{allergy}
										</Badge>
									))}
								</div>
							</div>
						)}

						{patient.chronicConditions &&
							patient.chronicConditions.length > 0 && (
								<div>
									<span className="text-muted-foreground text-sm">
										Afecțiuni Cronice
									</span>
									<div className="mt-1 flex flex-wrap gap-1">
										{patient.chronicConditions.map((condition) => (
											<Badge key={condition} variant="outline">
												{condition}
											</Badge>
										))}
									</div>
								</div>
							)}

						{!patient.bloodType &&
							(!patient.knownAllergies ||
								patient.knownAllergies.length === 0) &&
							(!patient.chronicConditions ||
								patient.chronicConditions.length === 0) && (
								<p className="text-muted-foreground text-sm">
									Nu există informații medicale înregistrate.
								</p>
							)}
					</CardContent>
				</Card>

				{/* Current medications */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Pill className="h-5 w-5 text-blue-500" />
							Medicație Curentă
						</CardTitle>
					</CardHeader>
					<CardContent>
						{patient.currentMedications &&
						patient.currentMedications.length > 0 ? (
							<ul className="space-y-2">
								{patient.currentMedications.map((medication) => (
									<li
										key={medication}
										className="flex items-center gap-2 text-sm"
									>
										<div className="h-2 w-2 rounded-full bg-blue-500" />
										{medication}
									</li>
								))}
							</ul>
						) : (
							<p className="text-muted-foreground text-sm">
								Nu există medicație înregistrată.
							</p>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Lifestyle factors */}
			{(patient.smokingStatus || patient.alcoholConsumption) && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5 text-green-500" />
							Factori de Stil de Viață
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-6">
							{patient.smokingStatus && (
								<div>
									<span className="text-muted-foreground text-sm">Fumat</span>
									<p className="font-medium">
										{patient.smokingStatus === "never" && "Nefumător"}
										{patient.smokingStatus === "former" && "Fost fumător"}
										{patient.smokingStatus === "current" && "Fumător activ"}
									</p>
								</div>
							)}
							{patient.alcoholConsumption && (
								<div>
									<span className="text-muted-foreground text-sm">Alcool</span>
									<p className="font-medium">
										{patient.alcoholConsumption === "none" && "Nu consumă"}
										{patient.alcoholConsumption === "occasional" && "Ocazional"}
										{patient.alcoholConsumption === "regular" && "Regulat"}
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Unfinished Consultations - Show prominently if any exist */}
			{consultations &&
				consultations.filter(
					(c) =>
						c.status === "in_progress" || c.status === "awaiting_diagnosis",
				).length > 0 && (
					<Card className="border-amber-500/50 bg-amber-500/5">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
								<AlertCircle className="h-5 w-5" />
								Consultații Nefinalizate
							</CardTitle>
							<CardDescription>
								Aceste consultații sunt încă în desfășurare și pot fi continuate
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{consultations
									.filter(
										(c) =>
											c.status === "in_progress" ||
											c.status === "awaiting_diagnosis",
									)
									.map((consultation) => (
										<Link
											key={consultation._id}
											to="/consultation/$id"
											params={{ id: consultation._id }}
											className="block"
										>
											<div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-background p-4 transition-colors hover:bg-amber-500/10">
												<div className="flex-1">
													<p className="font-medium">
														{consultation.chiefComplaint}
													</p>
													<p className="text-muted-foreground text-sm">
														{formatDateTime(consultation.startedAt)}
													</p>
												</div>
												<div className="flex items-center gap-3">
													<Badge
														className={getStatusColor(consultation.status)}
													>
														{getStatusLabel(consultation.status)}
													</Badge>
													<Button size="sm" variant="outline" className="gap-2">
														<Play className="h-3 w-3" />
														Continuă
													</Button>
												</div>
											</div>
										</Link>
									))}
							</div>
						</CardContent>
					</Card>
				)}

			{/* Consultation history */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="h-5 w-5" />
						Istoric Consultații
					</CardTitle>
					<CardDescription>
						Ultimele consultații ale pacientului
					</CardDescription>
				</CardHeader>
				<CardContent>
					{consultations === undefined ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : consultations.length > 0 ? (
						<div className="space-y-3">
							{consultations.map((consultation) => (
								<Link
									key={consultation._id}
									to="/consultation/$id"
									params={{ id: consultation._id }}
									className="block"
								>
									<div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
										<div>
											<p className="font-medium">
												{consultation.chiefComplaint}
											</p>
											<p className="text-muted-foreground text-sm">
												{formatDateTime(consultation.startedAt)}
											</p>
										</div>
										<Badge className={getStatusColor(consultation.status)}>
											{getStatusLabel(consultation.status)}
										</Badge>
									</div>
								</Link>
							))}
						</div>
					) : (
						<p className="py-8 text-center text-muted-foreground">
							Nu există consultații înregistrate.
						</p>
					)}
				</CardContent>
			</Card>

			{/* Notes */}
			{patient.notes && (
				<Card>
					<CardHeader>
						<CardTitle>Note</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="whitespace-pre-wrap text-sm">{patient.notes}</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
