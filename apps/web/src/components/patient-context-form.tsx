/**
 * PatientContextForm Component
 *
 * Collects demographic information (age, gender, height, weight)
 * for post-filtering and LLM context (not used in similarity calculation).
 */

import { ChevronRight, Info, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { PatientContext } from "@/lib/monarch-api";
import { cn } from "@/lib/utils";

interface PatientContextFormProps {
	patientContext: PatientContext;
	onUpdateContext: (context: Partial<PatientContext>) => void;
	onProceed: () => void;
	onSkip: () => void;
	className?: string;
}

const AGE_CATEGORIES = [
	{ value: "neonate", label: "Neonate (0-28 days)" },
	{ value: "infant", label: "Infant (1-12 months)" },
	{ value: "child", label: "Child (1-11 years)" },
	{ value: "adolescent", label: "Adolescent (12-17 years)" },
	{ value: "adult", label: "Adult (18-64 years)" },
	{ value: "elderly", label: "Elderly (65+ years)" },
];

const GENDER_OPTIONS = [
	{ value: "male", label: "Male" },
	{ value: "female", label: "Female" },
	{ value: "other", label: "Other / Prefer not to say" },
];

export function PatientContextForm({
	patientContext,
	onUpdateContext,
	onProceed,
	onSkip,
	className,
}: PatientContextFormProps) {
	const [height, setHeight] = useState(
		patientContext.heightCm?.toString() || "",
	);
	const [weight, setWeight] = useState(
		patientContext.weightKg?.toString() || "",
	);

	const handleHeightChange = (value: string) => {
		setHeight(value);
		const num = Number.parseFloat(value);
		if (!Number.isNaN(num) && num > 0) {
			onUpdateContext({ heightCm: num });
		}
	};

	const handleWeightChange = (value: string) => {
		setWeight(value);
		const num = Number.parseFloat(value);
		if (!Number.isNaN(num) && num > 0) {
			onUpdateContext({ weightKg: num });
		}
	};

	// Calculate BMI if height and weight are available
	const bmi =
		patientContext.heightCm && patientContext.weightKg
			? (
					patientContext.weightKg /
					(patientContext.heightCm / 100) ** 2
				).toFixed(1)
			: null;

	const getBMICategory = (bmiValue: number): string => {
		if (bmiValue < 18.5) return "Underweight";
		if (bmiValue < 25) return "Normal";
		if (bmiValue < 30) return "Overweight";
		return "Obese";
	};

	return (
		<Card className={cn("w-full", className)}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<User className="h-5 w-5 text-primary" />
					Patient Information (Optional)
				</CardTitle>
				<CardDescription className="space-y-2">
					<p>
						Provide demographic information to help refine the diagnosis
						results.
					</p>
					<div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
						<Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
						<p className="text-blue-700 text-xs dark:text-blue-300">
							This information is used only for filtering and context. The
							symptom matching algorithm uses phenotype data only.
						</p>
					</div>
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Age Category */}
				<div className="space-y-2">
					<Label htmlFor="age-category">Age Category</Label>
					<Select
						value={patientContext.ageCategory || ""}
						onValueChange={(value) =>
							onUpdateContext({
								ageCategory: value as PatientContext["ageCategory"],
							})
						}
					>
						<SelectTrigger id="age-category">
							<SelectValue placeholder="Select age category..." />
						</SelectTrigger>
						<SelectContent>
							{AGE_CATEGORIES.map((cat) => (
								<SelectItem key={cat.value} value={cat.value}>
									{cat.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Gender */}
				<div className="space-y-2">
					<Label htmlFor="gender">Gender</Label>
					<Select
						value={patientContext.gender || ""}
						onValueChange={(value) =>
							onUpdateContext({
								gender: value as PatientContext["gender"],
							})
						}
					>
						<SelectTrigger id="gender">
							<SelectValue placeholder="Select gender..." />
						</SelectTrigger>
						<SelectContent>
							{GENDER_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Height and Weight */}
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="height">Height (cm)</Label>
						<Input
							id="height"
							type="number"
							placeholder="e.g., 170"
							value={height}
							onChange={(e) => handleHeightChange(e.target.value)}
							min={0}
							max={300}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="weight">Weight (kg)</Label>
						<Input
							id="weight"
							type="number"
							placeholder="e.g., 70"
							value={weight}
							onChange={(e) => handleWeightChange(e.target.value)}
							min={0}
							max={500}
						/>
					</div>
				</div>

				{/* BMI Display */}
				{bmi && (
					<div className="rounded-md border bg-muted/50 p-3">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								Calculated BMI:
							</span>
							<div className="flex items-center gap-2">
								<span className="font-medium">{bmi}</span>
								<span className="text-muted-foreground text-sm">
									({getBMICategory(Number.parseFloat(bmi))})
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Quick Fill Presets (for demo/testing) */}
				<div className="space-y-2">
					<Label className="text-muted-foreground text-xs">Quick Fill</Label>
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								onUpdateContext({
									ageCategory: "adult",
									gender: "male",
									heightCm: 175,
									weightKg: 75,
								});
								setHeight("175");
								setWeight("75");
							}}
						>
							Adult Male
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								onUpdateContext({
									ageCategory: "adult",
									gender: "female",
									heightCm: 165,
									weightKg: 60,
								});
								setHeight("165");
								setWeight("60");
							}}
						>
							Adult Female
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								onUpdateContext({
									ageCategory: "child",
									gender: "male",
									heightCm: 130,
									weightKg: 30,
								});
								setHeight("130");
								setWeight("30");
							}}
						>
							Child
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								onUpdateContext({
									ageCategory: "elderly",
									gender: "female",
									heightCm: 160,
									weightKg: 65,
								});
								setHeight("160");
								setWeight("65");
							}}
						>
							Elderly
						</Button>
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex justify-between">
				<Button variant="ghost" onClick={onSkip}>
					Skip
				</Button>
				<Button onClick={onProceed} className="gap-2">
					Continue
					<ChevronRight className="h-4 w-4" />
				</Button>
			</CardFooter>
		</Card>
	);
}
