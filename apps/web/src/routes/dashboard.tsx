import { api } from "@medicheck-ai/backend/convex/_generated/api";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
	Activity,
	ArrowRight,
	Clock,
	Loader2,
	Search,
	Stethoscope,
	UserCheck,
	Users,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import {
	calculateAge,
	formatDateTime,
	getStatusColor,
	getStatusLabel,
} from "@/lib/types";

// Extract types from Convex API
type ConsultationWithPatient = NonNullable<
	FunctionReturnType<typeof api.consultations.getActiveConsultations>
>[number];

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

function DashboardPage() {
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState("");

	const stats = useQuery(api.consultations.getTodaysStats);
	const activeConsultations = useQuery(
		api.consultations.getActiveConsultations,
	);
	const recentConsultations = useQuery(
		api.consultations.getRecentConsultations,
		{
			limit: 5,
		},
	);
	const recentPatients = useQuery(api.patients.getRecentPatients, { limit: 5 });
	const staffProfile = useQuery(api.staff.getMyStaffProfile);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			navigate({ to: "/patients", search: { q: searchQuery } });
		}
	};

	return (
		<div className="container mx-auto max-w-7xl px-4 py-6">
			{/* Header */}
			<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-3xl">
						Bună ziua{staffProfile ? `, ${staffProfile.firstName}` : ""}!
					</h1>
					<p className="text-muted-foreground">
						{new Date().toLocaleDateString("ro-RO", {
							weekday: "long",
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</p>
				</div>
				<div className="flex gap-2">
					<Button asChild variant="outline">
						<Link to="/patients">
							<Users className="mr-2 h-4 w-4" />
							Pacienți
						</Link>
					</Button>
					<Button asChild>
						<Link to="/consultation/new" search={{ patientId: undefined }}>
							<Stethoscope className="mr-2 h-4 w-4" />
							Consultație Nouă
						</Link>
					</Button>
				</div>
			</div>

			{/* Quick search */}
			<Card className="mb-6">
				<CardContent className="pt-6">
					<form onSubmit={handleSearch} className="flex gap-2">
						<div className="relative flex-1">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Căutați pacient după CNP sau nume..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Button type="submit">Căutare</Button>
					</form>
				</CardContent>
			</Card>

			{/* Stats */}
			<div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Consultații Azi
						</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats?.total ?? "—"}</div>
						<p className="text-muted-foreground text-xs">
							{stats?.inProgress ?? 0} în desfășurare
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Finalizate</CardTitle>
						<UserCheck className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats?.completed ?? "—"}</div>
						<p className="text-muted-foreground text-xs">
							{stats?.referred ?? 0} trimiși la medic
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							În Desfășurare
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats?.inProgress ?? "—"}</div>
						<p className="text-muted-foreground text-xs">consultații active</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Trimiși la Medic
						</CardTitle>
						<Stethoscope className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{stats?.referred ?? "—"}</div>
						<p className="text-muted-foreground text-xs">pacienți azi</p>
					</CardContent>
				</Card>
			</div>

			{/* Active consultations */}
			{activeConsultations && activeConsultations.length > 0 && (
				<Card className="mb-6 border-primary/50">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Clock className="h-5 w-5 text-primary" />
							Consultații Active
						</CardTitle>
						<CardDescription>
							Consultații care așteaptă finalizare
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{activeConsultations.map(
								(consultation: ConsultationWithPatient) => (
									<Link
										key={consultation._id}
										to="/consultation/$id"
										params={{ id: consultation._id }}
										className="block"
									>
										<div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10">
											<div className="flex items-center gap-4">
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
													{consultation.patient?.firstName[0]}
													{consultation.patient?.lastName[0]}
												</div>
												<div>
													<p className="font-medium">
														{consultation.patient?.lastName}{" "}
														{consultation.patient?.firstName}
													</p>
													<p className="text-muted-foreground text-sm">
														{consultation.chiefComplaint}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<Badge className={getStatusColor(consultation.status)}>
													{getStatusLabel(consultation.status)}
												</Badge>
												<ArrowRight className="h-4 w-4" />
											</div>
										</div>
									</Link>
								),
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Recent activity */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Recent consultations */}
				<Card>
					<CardHeader>
						<CardTitle>Consultații Recente</CardTitle>
						<CardDescription>Ultimele consultații efectuate</CardDescription>
					</CardHeader>
					<CardContent>
						{recentConsultations === undefined ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : recentConsultations.length > 0 ? (
							<div className="space-y-3">
								{recentConsultations.map(
									(consultation: ConsultationWithPatient) => (
										<Link
											key={consultation._id}
											to="/consultation/$id"
											params={{ id: consultation._id }}
											className="block"
										>
											<div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
												<div>
													<p className="font-medium">
														{consultation.patient?.lastName}{" "}
														{consultation.patient?.firstName}
													</p>
													<p className="text-muted-foreground text-sm">
														{consultation.chiefComplaint}
													</p>
													<p className="text-muted-foreground text-xs">
														{formatDateTime(consultation.startedAt)}
													</p>
												</div>
												<Badge className={getStatusColor(consultation.status)}>
													{getStatusLabel(consultation.status)}
												</Badge>
											</div>
										</Link>
									),
								)}
							</div>
						) : (
							<p className="py-8 text-center text-muted-foreground">
								Nu există consultații recente.
							</p>
						)}
					</CardContent>
				</Card>

				{/* Recent patients */}
				<Card>
					<CardHeader>
						<CardTitle>Pacienți Recenți</CardTitle>
						<CardDescription>Ultimii pacienți vizualizați</CardDescription>
					</CardHeader>
					<CardContent>
						{recentPatients === undefined ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : recentPatients.length > 0 ? (
							<div className="space-y-3">
								{recentPatients.map((patient) =>
									patient ? (
										<Link
											key={patient._id}
											to="/patients/$id"
											params={{ id: patient._id }}
											className="block"
										>
											<div className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50">
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-medium">
													{patient.firstName[0]}
													{patient.lastName[0]}
												</div>
												<div>
													<p className="font-medium">
														{patient.lastName} {patient.firstName}
													</p>
													<p className="text-muted-foreground text-sm">
														{patient.sex === "male" ? "M" : "F"},{" "}
														{calculateAge(patient.dateOfBirth)} ani • CNP:{" "}
														{patient.cnp}
													</p>
												</div>
											</div>
										</Link>
									) : null,
								)}
							</div>
						) : (
							<p className="py-8 text-center text-muted-foreground">
								Nu există pacienți recenți.
							</p>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
