import { api } from "@medicheck-ai/backend/convex/_generated/api";
import type { Id } from "@medicheck-ai/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
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
import { Textarea } from "./ui/textarea";

interface EditPatientDialogProps {
	patientId: Id<"patients">;
	trigger?: React.ReactNode;
	onUpdated?: () => void;
}

export function EditPatientDialog({
	patientId,
	trigger,
	onUpdated,
}: EditPatientDialogProps) {
	const [open, setOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const patient = useQuery(api.patients.getPatient, { id: patientId });
	const updatePatient = useMutation(api.patients.updatePatient);

	// Form state
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [dateOfBirth, setDateOfBirth] = useState("");
	const [sex, setSex] = useState<"male" | "female">("male");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [address, setAddress] = useState("");
	const [bloodType, setBloodType] = useState("");
	const [smokingStatus, setSmokingStatus] = useState<
		"never" | "former" | "current" | ""
	>("");
	const [alcoholConsumption, setAlcoholConsumption] = useState<
		"none" | "occasional" | "regular" | ""
	>("");
	const [notes, setNotes] = useState("");

	// Array fields
	const [allergies, setAllergies] = useState<string[]>([]);
	const [newAllergy, setNewAllergy] = useState("");
	const [chronicConditions, setChronicConditions] = useState<string[]>([]);
	const [newCondition, setNewCondition] = useState("");
	const [medications, setMedications] = useState<string[]>([]);
	const [newMedication, setNewMedication] = useState("");
	const [familyHistory, setFamilyHistory] = useState<string[]>([]);
	const [newFamilyHistory, setNewFamilyHistory] = useState("");

	// Populate form when patient data loads
	useEffect(() => {
		if (patient && open) {
			setFirstName(patient.firstName);
			setLastName(patient.lastName);
			setDateOfBirth(patient.dateOfBirth);
			setSex(patient.sex);
			setPhone(patient.phone || "");
			setEmail(patient.email || "");
			setAddress(patient.address || "");
			setBloodType(patient.bloodType || "");
			setSmokingStatus(patient.smokingStatus || "");
			setAlcoholConsumption(patient.alcoholConsumption || "");
			setNotes(patient.notes || "");
			setAllergies(patient.knownAllergies || []);
			setChronicConditions(patient.chronicConditions || []);
			setMedications(patient.currentMedications || []);
			setFamilyHistory(patient.familyHistory || []);
		}
	}, [patient, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			await updatePatient({
				id: patientId,
				firstName,
				lastName,
				dateOfBirth,
				sex,
				phone: phone || undefined,
				email: email || undefined,
				address: address || undefined,
				bloodType: bloodType || undefined,
				smokingStatus: smokingStatus || undefined,
				alcoholConsumption: alcoholConsumption || undefined,
				notes: notes || undefined,
				knownAllergies: allergies.length > 0 ? allergies : undefined,
				chronicConditions:
					chronicConditions.length > 0 ? chronicConditions : undefined,
				currentMedications: medications.length > 0 ? medications : undefined,
				familyHistory: familyHistory.length > 0 ? familyHistory : undefined,
			});

			toast.success("Datele pacientului au fost actualizate");
			setOpen(false);
			onUpdated?.();
		} catch (error) {
			toast.error("Eroare la actualizarea datelor");
			console.error(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const addToArray = (
		value: string,
		array: string[],
		setArray: (arr: string[]) => void,
		setValue: (val: string) => void,
	) => {
		if (value.trim() && !array.includes(value.trim())) {
			setArray([...array, value.trim()]);
			setValue("");
		}
	};

	const removeFromArray = (
		value: string,
		array: string[],
		setArray: (arr: string[]) => void,
	) => {
		setArray(array.filter((item) => item !== value));
	};

	if (!patient) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="outline" size="sm" className="gap-2">
						<Pencil className="h-4 w-4" />
						Editează
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Editează Pacient</DialogTitle>
					<DialogDescription>
						Actualizați informațiile pacientului {patient.lastName}{" "}
						{patient.firstName}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Personal Information */}
					<div className="space-y-4">
						<h3 className="font-medium text-sm">Informații Personale</h3>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="lastName">Nume</Label>
								<Input
									id="lastName"
									value={lastName}
									onChange={(e) => setLastName(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="firstName">Prenume</Label>
								<Input
									id="firstName"
									value={firstName}
									onChange={(e) => setFirstName(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="dateOfBirth">Data Nașterii</Label>
								<Input
									id="dateOfBirth"
									type="date"
									value={dateOfBirth}
									onChange={(e) => setDateOfBirth(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="sex">Sex</Label>
								<Select
									value={sex}
									onValueChange={(v) => setSex(v as "male" | "female")}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="male">Masculin</SelectItem>
										<SelectItem value="female">Feminin</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{/* Contact Information */}
					<div className="space-y-4">
						<h3 className="font-medium text-sm">Contact</h3>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="phone">Telefon</Label>
								<Input
									id="phone"
									type="tel"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="address">Adresă</Label>
							<Input
								id="address"
								value={address}
								onChange={(e) => setAddress(e.target.value)}
							/>
						</div>
					</div>

					{/* Medical Information */}
					<div className="space-y-4">
						<h3 className="font-medium text-sm">Informații Medicale</h3>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="bloodType">Grupa Sanguină</Label>
								<Select value={bloodType} onValueChange={setBloodType}>
									<SelectTrigger>
										<SelectValue placeholder="Selectează" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="A+">A+</SelectItem>
										<SelectItem value="A-">A-</SelectItem>
										<SelectItem value="B+">B+</SelectItem>
										<SelectItem value="B-">B-</SelectItem>
										<SelectItem value="AB+">AB+</SelectItem>
										<SelectItem value="AB-">AB-</SelectItem>
										<SelectItem value="O+">O+</SelectItem>
										<SelectItem value="O-">O-</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Allergies */}
						<div className="space-y-2">
							<Label>Alergii Cunoscute</Label>
							<div className="flex gap-2">
								<Input
									value={newAllergy}
									onChange={(e) => setNewAllergy(e.target.value)}
									placeholder="Adaugă alergie..."
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											addToArray(
												newAllergy,
												allergies,
												setAllergies,
												setNewAllergy,
											);
										}
									}}
								/>
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										addToArray(
											newAllergy,
											allergies,
											setAllergies,
											setNewAllergy,
										)
									}
								>
									Adaugă
								</Button>
							</div>
							{allergies.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{allergies.map((allergy) => (
										<Badge
											key={allergy}
											variant="destructive"
											className="gap-1"
										>
											{allergy}
											<button
												type="button"
												onClick={() =>
													removeFromArray(allergy, allergies, setAllergies)
												}
												className="ml-1 hover:text-destructive-foreground/80"
											>
												<X className="h-3 w-3" />
											</button>
										</Badge>
									))}
								</div>
							)}
						</div>

						{/* Chronic Conditions */}
						<div className="space-y-2">
							<Label>Afecțiuni Cronice</Label>
							<div className="flex gap-2">
								<Input
									value={newCondition}
									onChange={(e) => setNewCondition(e.target.value)}
									placeholder="Adaugă afecțiune..."
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											addToArray(
												newCondition,
												chronicConditions,
												setChronicConditions,
												setNewCondition,
											);
										}
									}}
								/>
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										addToArray(
											newCondition,
											chronicConditions,
											setChronicConditions,
											setNewCondition,
										)
									}
								>
									Adaugă
								</Button>
							</div>
							{chronicConditions.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{chronicConditions.map((condition) => (
										<Badge key={condition} variant="outline" className="gap-1">
											{condition}
											<button
												type="button"
												onClick={() =>
													removeFromArray(
														condition,
														chronicConditions,
														setChronicConditions,
													)
												}
												className="ml-1 hover:text-foreground/80"
											>
												<X className="h-3 w-3" />
											</button>
										</Badge>
									))}
								</div>
							)}
						</div>

						{/* Current Medications */}
						<div className="space-y-2">
							<Label>Medicație Curentă</Label>
							<div className="flex gap-2">
								<Input
									value={newMedication}
									onChange={(e) => setNewMedication(e.target.value)}
									placeholder="Adaugă medicament..."
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											addToArray(
												newMedication,
												medications,
												setMedications,
												setNewMedication,
											);
										}
									}}
								/>
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										addToArray(
											newMedication,
											medications,
											setMedications,
											setNewMedication,
										)
									}
								>
									Adaugă
								</Button>
							</div>
							{medications.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{medications.map((medication) => (
										<Badge
											key={medication}
											variant="secondary"
											className="gap-1"
										>
											{medication}
											<button
												type="button"
												onClick={() =>
													removeFromArray(
														medication,
														medications,
														setMedications,
													)
												}
												className="ml-1 hover:text-foreground/80"
											>
												<X className="h-3 w-3" />
											</button>
										</Badge>
									))}
								</div>
							)}
						</div>

						{/* Family History */}
						<div className="space-y-2">
							<Label>Istoric Familial</Label>
							<div className="flex gap-2">
								<Input
									value={newFamilyHistory}
									onChange={(e) => setNewFamilyHistory(e.target.value)}
									placeholder="Adaugă afecțiune familială..."
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											addToArray(
												newFamilyHistory,
												familyHistory,
												setFamilyHistory,
												setNewFamilyHistory,
											);
										}
									}}
								/>
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										addToArray(
											newFamilyHistory,
											familyHistory,
											setFamilyHistory,
											setNewFamilyHistory,
										)
									}
								>
									Adaugă
								</Button>
							</div>
							{familyHistory.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{familyHistory.map((item) => (
										<Badge key={item} variant="outline" className="gap-1">
											{item}
											<button
												type="button"
												onClick={() =>
													removeFromArray(item, familyHistory, setFamilyHistory)
												}
												className="ml-1 hover:text-foreground/80"
											>
												<X className="h-3 w-3" />
											</button>
										</Badge>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Lifestyle */}
					<div className="space-y-4">
						<h3 className="font-medium text-sm">Stil de Viață</h3>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="smokingStatus">Fumat</Label>
								<Select
									value={smokingStatus}
									onValueChange={(v) =>
										setSmokingStatus(v as "never" | "former" | "current" | "")
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selectează" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="never">Nefumător</SelectItem>
										<SelectItem value="former">Fost fumător</SelectItem>
										<SelectItem value="current">Fumător activ</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="alcoholConsumption">Consum Alcool</Label>
								<Select
									value={alcoholConsumption}
									onValueChange={(v) =>
										setAlcoholConsumption(
											v as "none" | "occasional" | "regular" | "",
										)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selectează" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Nu consumă</SelectItem>
										<SelectItem value="occasional">Ocazional</SelectItem>
										<SelectItem value="regular">Regulat</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{/* Notes */}
					<div className="space-y-2">
						<Label htmlFor="notes">Note</Label>
						<Textarea
							id="notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Note adiționale despre pacient..."
							rows={3}
						/>
					</div>

					{/* Actions */}
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Anulează
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Salvează Modificările
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
