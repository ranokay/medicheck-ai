/**
 * DiagnosisSimSearch Component (Step 4)
 *
 * Runs semantic similarity search using the selected phenotypes
 * and displays matching diseases.
 */

import {
	AlertTriangle,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ExternalLink,
	Loader2,
	MessageSquare,
	RefreshCcw,
	Stethoscope,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	calculateConfidenceWithContext,
	getMonarchURL,
	type MonarchEntity,
	monarchAPI,
	type PatientContext,
	type SimilarityMatch,
} from "@/lib/monarch-api";
import { cn } from "@/lib/utils";

interface DiagnosisSimSearchProps {
	selectedPhenotypes: MonarchEntity[];
	refinedPhenotypes: MonarchEntity[];
	patientContext?: PatientContext;
	onProceedToChat: () => void;
	onFinishConsultation?: () => void;
	isSaving?: boolean;
	onBack: () => void;
	onReset: () => void;
	diagnosisResults: SimilarityMatch[];
	onResultsLoaded: (results: SimilarityMatch[]) => void;
	className?: string;
}

export function DiagnosisSimSearch({
	selectedPhenotypes,
	refinedPhenotypes,
	patientContext,
	onProceedToChat,
	onFinishConsultation,
	isSaving,
	onBack,
	onReset,
	diagnosisResults,
	onResultsLoaded,
	className,
}: DiagnosisSimSearchProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

	// Combine all phenotypes for the search
	const allPhenotypes = [
		...selectedPhenotypes,
		...refinedPhenotypes.filter(
			(rp) => !selectedPhenotypes.some((sp) => sp.id === rp.id),
		),
	];

	const runDiagnosis = useCallback(async () => {
		if (allPhenotypes.length === 0) {
			setError("No phenotypes selected");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const phenotypeIds = allPhenotypes.map((p) => p.id);
			const results = await monarchAPI.getPhenotypeProfile(phenotypeIds, {
				searchGroup: "Human Diseases",
				metric: "ancestor_information_content",
				limit: 20,
			});

			onResultsLoaded(results);
		} catch (err) {
			console.error("Diagnosis failed:", err);
			setError(err instanceof Error ? err.message : "Diagnosis failed");
		} finally {
			setIsLoading(false);
		}
	}, [allPhenotypes, onResultsLoaded]);

	// Run diagnosis on mount if no results yet
	useEffect(() => {
		if (
			diagnosisResults.length === 0 &&
			allPhenotypes.length > 0 &&
			!isLoading
		) {
			runDiagnosis();
		}
	}, [allPhenotypes.length, diagnosisResults.length, isLoading, runDiagnosis]);

	const toggleExpanded = useCallback((id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	// Loading state
	if (isLoading) {
		return (
			<Card className={cn("w-full", className)}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Stethoscope className="h-5 w-5 text-primary" />
						Analyzing Symptoms...
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center gap-3">
						<Loader2 className="h-5 w-5 animate-spin text-primary" />
						<p className="text-muted-foreground">
							Running semantic similarity search on {allPhenotypes.length}{" "}
							phenotypes...
						</p>
					</div>
					<div className="space-y-2">
						{[1, 2, 3, 4, 5].map((_, i) => (
							<div
								key={`skeleton-${i}`}
								className="h-16 w-full animate-pulse rounded bg-muted"
							/>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	// Error state
	if (error) {
		return (
			<Card className={cn("w-full", className)}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-destructive">
						<AlertTriangle className="h-5 w-5" />
						Analysis Error
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground">{error}</p>
				</CardContent>
				<CardFooter className="flex justify-between">
					<Button variant="outline" onClick={onBack}>
						<ChevronLeft className="mr-2 h-4 w-4" />
						Back
					</Button>
					<Button onClick={runDiagnosis}>
						<RefreshCcw className="mr-2 h-4 w-4" />
						Retry
					</Button>
				</CardFooter>
			</Card>
		);
	}

	return (
		<Card className={cn("w-full", className)}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Stethoscope className="h-5 w-5 text-primary" />
					Diagnosis Results
				</CardTitle>
				<CardDescription>
					Based on {allPhenotypes.length} symptom
					{allPhenotypes.length > 1 ? "s" : ""}, ordered by semantic similarity.
					{patientContext?.ageCategory && (
						<>
							{" "}
							Filtered for{" "}
							<Badge variant="outline" className="mx-1">
								{patientContext.ageCategory}
							</Badge>
							patients.
						</>
					)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{diagnosisResults.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<Stethoscope className="mb-2 h-8 w-8 text-muted-foreground/50" />
						<p className="text-muted-foreground">No matching diseases found</p>
						<p className="text-muted-foreground/70 text-xs">
							Try adding more symptoms or adjusting your selections
						</p>
					</div>
				) : (
					<ScrollArea className="h-[450px]">
						<div className="space-y-3 pr-4">
							{(() => {
								// Get all scores for context-aware confidence calculation
								const allScores = diagnosisResults.map((m) => m.score);

								return diagnosisResults.map((match, index) => {
									const confidence = calculateConfidenceWithContext(
										match.score,
										allScores,
										index,
									);
									const isExpanded = expandedIds.has(match.subject.id);

									return (
										<div
											key={match.subject.id}
											className={cn(
												"rounded-lg border p-4 transition-colors",
												isExpanded && "bg-muted/50",
											)}
										>
											<button
												type="button"
												className="flex w-full items-start justify-between text-left"
												onClick={() => toggleExpanded(match.subject.id)}
											>
												<div className="flex-1 space-y-2">
													<div className="flex items-center gap-2">
														<Badge
															variant={index === 0 ? "default" : "secondary"}
															className="text-xs"
														>
															#{index + 1}
														</Badge>
														<span className="font-medium">
															{match.subject.name}
														</span>
													</div>
													<div className="flex items-center gap-4">
														<div className="flex items-center gap-2">
															<span className="text-muted-foreground text-xs">
																Match:
															</span>
															<Progress
																value={confidence}
																className="h-2 w-24"
															/>
															<span className="font-medium text-sm">
																{confidence}%
															</span>
														</div>
														<span className="text-muted-foreground text-xs">
															Score: {match.score.toFixed(2)}
														</span>
													</div>
												</div>
												<ChevronDown
													className={cn(
														"h-5 w-5 text-muted-foreground transition-transform",
														isExpanded && "rotate-180",
													)}
												/>
											</button>

											{isExpanded && (
												<div className="mt-3 space-y-3 border-t pt-3">
													{match.subject.description && (
														<p className="text-muted-foreground text-sm">
															{match.subject.description}
														</p>
													)}
													<div className="flex items-center gap-2 text-xs">
														<span className="text-muted-foreground">ID:</span>
														<code className="rounded bg-muted px-1.5 py-0.5">
															{match.subject.id}
														</code>
														<a
															href={getMonarchURL(match.subject.id)}
															target="_blank"
															rel="noopener noreferrer"
															className="flex items-center gap-1 text-primary hover:underline"
														>
															View on Monarch
															<ExternalLink className="h-3 w-3" />
														</a>
													</div>
												</div>
											)}
										</div>
									);
								});
							})()}
						</div>
					</ScrollArea>
				)}
			</CardContent>
			<CardFooter className="flex justify-between gap-2">
				<Button variant="outline" onClick={onBack}>
					<ChevronLeft className="mr-2 h-4 w-4" />
					Back
				</Button>
				<div className="flex gap-2">
					<Button variant="outline" onClick={onReset}>
						<RefreshCcw className="mr-2 h-4 w-4" />
						Start Over
					</Button>
					<Button variant="outline" onClick={onProceedToChat} className="gap-2">
						<MessageSquare className="h-4 w-4" />
						Ask AI
					</Button>
					{onFinishConsultation && (
						<Button
							onClick={onFinishConsultation}
							disabled={isSaving || diagnosisResults.length === 0}
							className="gap-2"
						>
							{isSaving ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<CheckCircle2 className="h-4 w-4" />
							)}
							Finish Consultation
						</Button>
					)}
				</div>
			</CardFooter>
		</Card>
	);
}
