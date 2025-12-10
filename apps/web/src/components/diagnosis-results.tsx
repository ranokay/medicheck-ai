import {
	AlertTriangle,
	ArrowRight,
	CheckCircle,
	Info,
	Stethoscope,
} from "lucide-react";
import { type DiagnosisResult, getSeverityColor } from "@/lib/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";

interface DiagnosisResultsProps {
	results: DiagnosisResult[];
	onReferToDoctor: (doctorId: string, notes: string) => void;
	onComplete: () => void;
}

export function DiagnosisResults({
	results,
	onReferToDoctor,
	onComplete,
}: DiagnosisResultsProps) {
	const sortedResults = [...results].sort(
		(a, b) => b.probability - a.probability,
	);
	const topResult = sortedResults[0];

	return (
		<div className="space-y-6">
			{/* Top diagnosis */}
			{topResult && (
				<Card className="border-2 border-primary/50">
					<CardHeader>
						<div className="flex items-start justify-between">
							<div>
								<CardTitle className="flex items-center gap-2 text-xl">
									<Stethoscope className="h-5 w-5" />
									Diagnostic Principal
								</CardTitle>
								<CardDescription>
									Cel mai probabil diagnostic bazat pe simptomele raportate
								</CardDescription>
							</div>
							<Badge className={getSeverityColor(topResult.severity)}>
								{topResult.severity === "critical" && "Critic"}
								{topResult.severity === "high" && "Ridicat"}
								{topResult.severity === "medium" && "Moderat"}
								{topResult.severity === "low" && "Scăzut"}
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<h3 className="font-bold text-2xl">{topResult.conditionName}</h3>
							{topResult.description && (
								<p className="mt-1 text-muted-foreground">
									{topResult.description}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span>Probabilitate</span>
								<span className="font-bold">{topResult.probability}%</span>
							</div>
							<Progress value={topResult.probability} className="h-3" />
						</div>

						{topResult.recommendedActions &&
							topResult.recommendedActions.length > 0 && (
								<div>
									<h4 className="mb-2 font-medium">Acțiuni Recomandate</h4>
									<ul className="space-y-1">
										{topResult.recommendedActions.map((action, i) => (
											<li key={i} className="flex items-start gap-2 text-sm">
												<CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
												<span>{action}</span>
											</li>
										))}
									</ul>
								</div>
							)}

						{topResult.specialistRecommendation && (
							<div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
								<Info className="h-4 w-4 text-blue-600" />
								<span>
									Recomandare specialist:{" "}
									<strong>{topResult.specialistRecommendation}</strong>
								</span>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Other possible conditions */}
			{sortedResults.length > 1 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5" />
							Alte Diagnostice Posibile
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{sortedResults.slice(1).map((result, index) => (
							<div key={result.conditionName}>
								{index > 0 && <Separator className="my-4" />}
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<h4 className="font-medium">{result.conditionName}</h4>
										<div className="flex items-center gap-2">
											<Badge
												variant="outline"
												className={getSeverityColor(result.severity)}
											>
												{result.severity === "critical" && "Critic"}
												{result.severity === "high" && "Ridicat"}
												{result.severity === "medium" && "Moderat"}
												{result.severity === "low" && "Scăzut"}
											</Badge>
											<span className="font-medium text-sm">
												{result.probability}%
											</span>
										</div>
									</div>
									<Progress value={result.probability} className="h-2" />
									{result.description && (
										<p className="text-muted-foreground text-sm">
											{result.description}
										</p>
									)}
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			)}

			{/* Important notice */}
			<Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10">
				<CardContent className="flex items-start gap-3 pt-6">
					<AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" />
					<div className="text-sm">
						<p className="font-medium text-yellow-800 dark:text-yellow-200">
							Notă Importantă
						</p>
						<p className="mt-1 text-yellow-700 dark:text-yellow-300">
							Acest diagnostic este orientativ și bazat pe simptomele raportate.
							Pacientul trebuie evaluat de un medic specialist pentru confirmare
							și tratament adecvat.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Actions */}
			<div className="flex flex-col gap-3 sm:flex-row">
				<Button
					variant="outline"
					className="flex-1"
					onClick={() => onReferToDoctor("", "")}
				>
					<ArrowRight className="mr-2 h-4 w-4" />
					Trimite la Medic
				</Button>
				<Button className="flex-1" onClick={onComplete}>
					<CheckCircle className="mr-2 h-4 w-4" />
					Finalizare Consultație
				</Button>
			</div>
		</div>
	);
}
