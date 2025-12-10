import { api } from "@medicheck-ai/backend/convex/_generated/api";
import type { Id } from "@medicheck-ai/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Search, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { calculateAge } from "@/lib/types";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";

interface PatientSearchProps {
	onSelectPatient: (patientId: string) => void;
}

export function PatientSearch({ onSelectPatient }: PatientSearchProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);

	const patients = useQuery(api.patients.searchPatients, {
		query: searchQuery,
		limit: 10,
	});

	const recentPatients = useQuery(api.patients.getRecentPatients, { limit: 5 });

	return (
		<div className="space-y-4">
			<div className="relative">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Căutați după CNP sau nume..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-10"
				/>
				{searchQuery && (
					<Button
						variant="ghost"
						size="icon"
						className="-translate-y-1/2 absolute top-1/2 right-1 h-7 w-7"
						onClick={() => setSearchQuery("")}
					>
						<X className="h-4 w-4" />
					</Button>
				)}
			</div>

			{!searchQuery && recentPatients && recentPatients.length > 0 && (
				<div>
					<h3 className="mb-2 font-medium text-muted-foreground text-sm">
						Pacienți Recenți
					</h3>
					<div className="space-y-2">
						{recentPatients.map((patient) => (
							<PatientListItem
								key={patient._id}
								patient={patient}
								onSelect={() => onSelectPatient(patient._id)}
							/>
						))}
					</div>
				</div>
			)}

			{searchQuery && (
				<div>
					{patients === undefined ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : patients.length > 0 ? (
						<div className="space-y-2">
							{patients.map((patient) => (
								<PatientListItem
									key={patient._id}
									patient={patient}
									onSelect={() => onSelectPatient(patient._id)}
								/>
							))}
						</div>
					) : (
						<div className="py-8 text-center">
							<p className="text-muted-foreground">
								Nu s-a găsit niciun pacient
							</p>
							<NewPatientDialog
								open={isNewPatientOpen}
								onOpenChange={setIsNewPatientOpen}
								initialCnp={
									/^\d{13}$/.test(searchQuery) ? searchQuery : undefined
								}
								onCreated={onSelectPatient}
							/>
						</div>
					)}
				</div>
			)}

			{!searchQuery && <Separator />}

			<NewPatientDialog
				open={isNewPatientOpen}
				onOpenChange={setIsNewPatientOpen}
				onCreated={onSelectPatient}
			/>
		</div>
	);
}

interface PatientListItemProps {
	patient: {
		_id: Id<"patients">;
		cnp: string;
		firstName: string;
		lastName: string;
		dateOfBirth: string;
		sex: "male" | "female";
	};
	onSelect: () => void;
}

function PatientListItem({ patient, onSelect }: PatientListItemProps) {
	const age = calculateAge(patient.dateOfBirth);

	return (
		<button
			type="button"
			onClick={onSelect}
			className="flex w-full items-center gap-4 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
		>
			<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
				{patient.firstName[0]}
				{patient.lastName[0]}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium">
					{patient.lastName} {patient.firstName}
				</p>
				<p className="text-muted-foreground text-sm">
					CNP: {patient.cnp} • {age} ani • {patient.sex === "male" ? "M" : "F"}
				</p>
			</div>
		</button>
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
			onOpenChange(false);
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
				<Button variant="outline" className="w-full gap-2">
					<UserPlus className="h-4 w-4" />
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
