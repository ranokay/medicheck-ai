/**
 * RefinementTraversal Component (Step 3)
 *
 * Traverses HPO hierarchy to refine selected phenotypes.
 * For each phenotype, offers more specific child terms.
 */

import {
	ArrowRight,
	ChevronLeft,
	ChevronRight,
	GitBranch,
	Loader2,
	SkipForward,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type MonarchEntity, monarchAPI } from "@/lib/monarch-api";
import { cn } from "@/lib/utils";

interface RefinementQuestion {
	parentPhenotype: MonarchEntity;
	children: MonarchEntity[];
	isLoading: boolean;
	error: string | null;
}

interface RefinementTraversalProps {
	selectedPhenotypes: MonarchEntity[];
	onAddRefinement: (phenotype: MonarchEntity) => void;
	onRemoveRefinement: (phenotypeId: string) => void;
	refinedPhenotypes: MonarchEntity[];
	onProceed: () => void;
	onBack: () => void;
	className?: string;
}

export function RefinementTraversal({
	selectedPhenotypes,
	onAddRefinement,
	onRemoveRefinement,
	refinedPhenotypes,
	onProceed,
	onBack,
	className,
}: RefinementTraversalProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [questions, setQuestions] = useState<RefinementQuestion[]>([]);
	const [selectedChildren, setSelectedChildren] = useState<Set<string>>(
		new Set(),
	);

	// Fetch children for all phenotypes
	useEffect(() => {
		const fetchAllChildren = async () => {
			const newQuestions: RefinementQuestion[] = selectedPhenotypes.map(
				(p) => ({
					parentPhenotype: p,
					children: [],
					isLoading: true,
					error: null,
				}),
			);
			setQuestions(newQuestions);

			for (let i = 0; i < selectedPhenotypes.length; i++) {
				const phenotype = selectedPhenotypes[i];
				try {
					const result = await monarchAPI.getHPOChildren(phenotype.id, 50);
					// Convert associations to entities
					const children: MonarchEntity[] = result.children.map((assoc) => ({
						id: assoc.subject,
						name: assoc.subject_label || assoc.subject,
						category: assoc.subject_category || "biolink:PhenotypicFeature",
					}));

					setQuestions((prev) => {
						const updated = [...prev];
						updated[i] = {
							...updated[i],
							children,
							isLoading: false,
						};
						return updated;
					});
				} catch (error) {
					console.error(`Failed to fetch children for ${phenotype.id}:`, error);
					setQuestions((prev) => {
						const updated = [...prev];
						updated[i] = {
							...updated[i],
							isLoading: false,
							error: "Failed to load refinement options",
						};
						return updated;
					});
				}
			}
		};

		if (selectedPhenotypes.length > 0) {
			fetchAllChildren();
		}
	}, [selectedPhenotypes]);

	const currentQuestion = questions[currentIndex];
	const progress = ((currentIndex + 1) / Math.max(questions.length, 1)) * 100;

	const handleChildToggle = useCallback(
		(child: MonarchEntity, checked: boolean) => {
			setSelectedChildren((prev) => {
				const next = new Set(prev);
				if (checked) {
					next.add(child.id);
					onAddRefinement(child);
				} else {
					next.delete(child.id);
					onRemoveRefinement(child.id);
				}
				return next;
			});
		},
		[onAddRefinement, onRemoveRefinement],
	);

	const handleNext = useCallback(() => {
		if (currentIndex < questions.length - 1) {
			setCurrentIndex(currentIndex + 1);
		}
	}, [currentIndex, questions.length]);

	const handlePrev = useCallback(() => {
		if (currentIndex > 0) {
			setCurrentIndex(currentIndex - 1);
		}
	}, [currentIndex]);

	const handleSkip = useCallback(() => {
		handleNext();
	}, [handleNext]);

	const isLastQuestion = currentIndex >= questions.length - 1;

	return (
		<Card className={cn("w-full", className)}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<GitBranch className="h-5 w-5 text-primary" />
					Refine Symptoms
				</CardTitle>
				<CardDescription>
					Help us understand your symptoms more precisely by selecting more
					specific descriptions when applicable.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Progress */}
				<div className="space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							Question {currentIndex + 1} of {questions.length}
						</span>
						<span className="text-muted-foreground">
							{Math.round(progress)}%
						</span>
					</div>
					<Progress value={progress} className="h-2" />
				</div>

				{/* Current question */}
				{currentQuestion ? (
					<div className="space-y-4">
						<div className="rounded-lg border bg-muted/50 p-4">
							<p className="text-muted-foreground text-sm">
								Can you describe this symptom more specifically?
							</p>
							<p className="mt-1 font-medium text-lg">
								{currentQuestion.parentPhenotype.name}
							</p>
							{currentQuestion.parentPhenotype.description && (
								<p className="mt-1 text-muted-foreground text-sm">
									{currentQuestion.parentPhenotype.description}
								</p>
							)}
						</div>

						{currentQuestion.isLoading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								<span className="ml-2 text-muted-foreground">
									Loading options...
								</span>
							</div>
						) : currentQuestion.error ? (
							<div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
								<p className="text-destructive text-sm">
									{currentQuestion.error}
								</p>
							</div>
						) : currentQuestion.children.length === 0 ? (
							<div className="rounded-lg border border-dashed p-6 text-center">
								<p className="text-muted-foreground text-sm">
									No more specific options available for this symptom.
								</p>
							</div>
						) : (
							<ScrollArea className="max-h-[300px]">
								<div className="space-y-2">
									{currentQuestion.children.map((child) => (
										<label
											key={child.id}
											className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-accent"
										>
											<Checkbox
												checked={selectedChildren.has(child.id)}
												onCheckedChange={(checked) =>
													handleChildToggle(child, checked as boolean)
												}
												className="mt-0.5"
											/>
											<div className="min-w-0 flex-1">
												<p className="font-medium">{child.name}</p>
												<p className="text-muted-foreground text-xs">
													{child.id}
												</p>
											</div>
										</label>
									))}
								</div>
							</ScrollArea>
						)}

						{/* Refinement summary */}
						{refinedPhenotypes.length > 0 && (
							<div className="rounded-lg border bg-primary/5 p-3">
								<p className="font-medium text-sm">
									{refinedPhenotypes.length} refinement
									{refinedPhenotypes.length > 1 ? "s" : ""} added
								</p>
								<div className="mt-2 flex flex-wrap gap-1">
									{refinedPhenotypes.slice(0, 5).map((p) => (
										<Badge key={p.id} variant="secondary" className="text-xs">
											{p.name}
										</Badge>
									))}
									{refinedPhenotypes.length > 5 && (
										<Badge variant="outline" className="text-xs">
											+{refinedPhenotypes.length - 5} more
										</Badge>
									)}
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="flex items-center justify-center py-8">
						<p className="text-muted-foreground">No symptoms to refine</p>
					</div>
				)}
			</CardContent>
			<CardFooter className="flex justify-between">
				<div className="flex gap-2">
					<Button variant="outline" onClick={onBack}>
						<ChevronLeft className="mr-2 h-4 w-4" />
						Back
					</Button>
					{currentIndex > 0 && (
						<Button variant="ghost" onClick={handlePrev}>
							Previous
						</Button>
					)}
				</div>
				<div className="flex gap-2">
					{!isLastQuestion && (
						<>
							<Button variant="ghost" onClick={handleSkip}>
								<SkipForward className="mr-2 h-4 w-4" />
								Skip
							</Button>
							<Button onClick={handleNext}>
								Next
								<ChevronRight className="ml-2 h-4 w-4" />
							</Button>
						</>
					)}
					{isLastQuestion && (
						<Button onClick={onProceed} className="gap-2">
							Get Diagnosis
							<ArrowRight className="h-4 w-4" />
						</Button>
					)}
				</div>
			</CardFooter>
		</Card>
	);
}
