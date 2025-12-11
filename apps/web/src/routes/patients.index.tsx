import { api } from "@medicheck-ai/backend/convex/_generated/api";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Plus, Search, UserPlus, X } from "lucide-react";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { calculateAge } from "@/lib/types";

type SearchParams = {
	q?: string;
};

export const Route = createFileRoute("/patients/")({
	component: PatientsPage,
	validateSearch: (search: Record<string, unknown>): SearchParams => {
		return {
			q: typeof search.q === "string" ? search.q : undefined,
		};
	},
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			throw redirect({ to: "/" });
		}
	},
});

function PatientsPage() {
	const navigate = useNavigate();
	const { q } = Route.useSearch();
	const [searchQuery, setSearchQuery] = useState(q ?? "");
	const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);

	const patients = useQuery(api.patients.searchPatients, {
		query: searchQuery,
		limit: 50,
	});

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		navigate({ to: "/patients", search: { q: searchQuery } });
	};

	return (
		<div className="container mx-auto max-w-5xl px-4 py-6">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-2xl">Pacienți</h1>
					<p className="text-muted-foreground">
						Căutați și gestionați pacienții înregistrați
					</p>
				</div>
				<NewPatientDialog
					open={isNewPatientOpen}
					onOpenChange={setIsNewPatientOpen}
					onCreated={(id) => {
						setIsNewPatientOpen(false);
						navigate({ to: "/patients/$id", params: { id } });
					}}
				/>
			</div>
			{/* Search */}
			<Card className="mb-6">
				<CardContent className="pt-6">
					<form onSubmit={handleSearchSubmit} className="flex gap-2">
						<div className="relative flex-1">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Căutați după CNP sau nume..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
							{searchQuery && (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="-translate-y-1/2 absolute top-1/2 right-1 h-7 w-7"
									onClick={() => {
										setSearchQuery("");
										navigate({ to: "/patients", search: {} });
									}}
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
						<Button type="submit">Căutare</Button>
					</form>
				</CardContent>
			</Card>
			{/* Results */}
			<Card>
				<CardHeader>
					<CardTitle>
						{searchQuery
							? `Rezultate pentru "${searchQuery}"`
							: "Toți Pacienții"}
					</CardTitle>
					<CardDescription>
						{patients?.length ?? 0} pacienți găsiți
					</CardDescription>
				</CardHeader>
				<CardContent>
					{patients === undefined ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					) : patients.length > 0 ? (
						<div className="space-y-2">
							{patients.map((patient) => (
								<Link
									key={patient._id}
									to="/patients/$id"
									params={{ id: patient._id }}
									className="block"
								>
									<div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
										<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
											{patient.firstName[0]}
											{patient.lastName[0]}
										</div>
										<div className="flex-1">
											<p className="font-medium">
												{patient.lastName} {patient.firstName}
											</p>
											<p className="text-muted-foreground text-sm">
												CNP: {patient.cnp} •{" "}
												{patient.sex === "male" ? "Masculin" : "Feminin"} •{" "}
												{calculateAge(patient.dateOfBirth)} ani
											</p>
										</div>
										{patient.chronicConditions &&
											patient.chronicConditions.length > 0 && (
												<div className="hidden gap-1 sm:flex">
													{patient.chronicConditions
														.slice(0, 2)
														.map((condition: string) => (
															<Badge key={condition} variant="outline">
																{condition}
															</Badge>
														))}
													{patient.chronicConditions.length > 2 && (
														<Badge variant="outline">
															+{patient.chronicConditions.length - 2}
														</Badge>
													)}
												</div>
											)}
									</div>
								</Link>
							))}
						</div>
					) : (
						<div className="py-12 text-center">
							<p className="text-muted-foreground">
								{searchQuery
									? "Nu s-a găsit niciun pacient cu aceste criterii."
									: "Nu există pacienți înregistrați."}
							</p>
							{searchQuery && /^\d{13}$/.test(searchQuery) && (
								<Button
									className="mt-4"
									onClick={() => setIsNewPatientOpen(true)}
								>
									<UserPlus className="mr-2 h-4 w-4" />
									Înregistrează pacient cu CNP {searchQuery}
								</Button>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

interface NewPatientDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialCnp?: string;
	onCreated: (patientId: string) => void;
}

function NewPatientDialog({
	open,
	onOpenChange,
	initialCnp,
	onCreated,
}: NewPatientDialogProps) {
	const [formData, setFormData] = useState({
		cnp: initialCnp ?? "",
		firstName: "",
		lastName: "",
		dateOfBirth: "",
		sex: "" as "male" | "female" | "",
		phone: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const createPatient = useMutation(api.patients.createPatient);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.sex) return;

		setIsSubmitting(true);
		try {
			const patientId = await createPatient({
				cnp: formData.cnp,
				firstName: formData.firstName,
				lastName: formData.lastName,
				dateOfBirth: formData.dateOfBirth,
				sex: formData.sex,
				phone: formData.phone || undefined,
			});
			onCreated(patientId);
			setFormData({
				cnp: "",
				firstName: "",
				lastName: "",
				dateOfBirth: "",
				sex: "",
				phone: "",
			});
		} catch (error) {
			console.error("Failed to create patient:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Plus className="h-4 w-4" />
					Pacient Nou
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Înregistrare Pacient Nou</DialogTitle>
					<DialogDescription>
						Completați datele pacientului pentru a-l înregistra în sistem.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<Label htmlFor="cnp">CNP *</Label>
							<Input
								id="cnp"
								value={formData.cnp}
								onChange={(e) =>
									setFormData({ ...formData, cnp: e.target.value })
								}
								placeholder="1234567890123"
								maxLength={13}
								required
							/>
						</div>
						<div>
							<Label htmlFor="lastName">Nume *</Label>
							<Input
								id="lastName"
								value={formData.lastName}
								onChange={(e) =>
									setFormData({ ...formData, lastName: e.target.value })
								}
								required
							/>
						</div>
						<div>
							<Label htmlFor="firstName">Prenume *</Label>
							<Input
								id="firstName"
								value={formData.firstName}
								onChange={(e) =>
									setFormData({ ...formData, firstName: e.target.value })
								}
								required
							/>
						</div>
						<div>
							<Label htmlFor="dateOfBirth">Data Nașterii *</Label>
							<Input
								id="dateOfBirth"
								type="date"
								value={formData.dateOfBirth}
								onChange={(e) =>
									setFormData({ ...formData, dateOfBirth: e.target.value })
								}
								required
							/>
						</div>
						<div>
							<Label htmlFor="sex">Sex *</Label>
							<Select
								value={formData.sex}
								onValueChange={(value: "male" | "female") =>
									setFormData({ ...formData, sex: value })
								}
							>
								<SelectTrigger id="sex">
									<SelectValue placeholder="Selectați" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="male">Masculin</SelectItem>
									<SelectItem value="female">Feminin</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="sm:col-span-2">
							<Label htmlFor="phone">Telefon</Label>
							<Input
								id="phone"
								type="tel"
								value={formData.phone}
								onChange={(e) =>
									setFormData({ ...formData, phone: e.target.value })
								}
								placeholder="07xxxxxxxx"
							/>
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Anulare
						</Button>
						<Button type="submit" disabled={isSubmitting || !formData.sex}>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Înregistrare
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
