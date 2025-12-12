/**
 * PhenotypeFilter Component (Step 2)
 *
 * Allows user to search and select phenotypes (symptoms).
 * Can optionally filter by the selected anatomy.
 */

import {
	Activity,
	ArrowRight,
	ChevronLeft,
	Loader2,
	Plus,
	Search,
	Sparkles,
	X,
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	type BodyPart,
	type MonarchEntity,
	monarchAPI,
} from "@/lib/monarch-api";
import { cn } from "@/lib/utils";

interface PhenotypeFilterProps {
	selectedAnatomy: MonarchEntity[];
	selectedPhenotypes: MonarchEntity[];
	onAddPhenotype: (phenotype: MonarchEntity) => void;
	onRemovePhenotype: (phenotypeId: string) => void;
	onProceed: () => void;
	onBack: () => void;
	maxPhenotypes?: number;
	className?: string;
}

interface SuggestedPhenotypes {
	grouped: Record<string, { bodyPart: BodyPart; phenotypes: MonarchEntity[] }>;
	common: MonarchEntity[];
}

export function PhenotypeFilter({
	selectedAnatomy,
	selectedPhenotypes,
	onAddPhenotype,
	onRemovePhenotype,
	onProceed,
	onBack,
	maxPhenotypes = 20,
	className,
}: PhenotypeFilterProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<MonarchEntity[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [showResults, setShowResults] = useState(false);

	// Suggested symptoms from body parts
	const [suggestedPhenotypes, setSuggestedPhenotypes] =
		useState<SuggestedPhenotypes | null>(null);
	const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

	// Fetch suggested symptoms when anatomy selection changes
	useEffect(() => {
		if (selectedAnatomy.length === 0) {
			setSuggestedPhenotypes(null);
			return;
		}

		const fetchSuggestions = async () => {
			setIsLoadingSuggestions(true);
			try {
				const bodyParts = selectedAnatomy.map((a) => ({
					id: a.id,
					name: a.name,
				}));
				const result = await monarchAPI.getPhenotypesForBodyParts(bodyParts);
				setSuggestedPhenotypes(result);
			} catch (error) {
				console.error("Failed to fetch suggested phenotypes:", error);
				setSuggestedPhenotypes(null);
			} finally {
				setIsLoadingSuggestions(false);
			}
		};

		fetchSuggestions();
	}, [selectedAnatomy]);

	// Debounced search
	useEffect(() => {
		if (!searchQuery.trim() || searchQuery.length < 2) {
			setSearchResults([]);
			setShowResults(false);
			return;
		}

		const timer = setTimeout(async () => {
			setIsSearching(true);
			try {
				const result = await monarchAPI.searchPhenotypes(searchQuery, {
					limit: 20,
				});
				// Filter out already selected phenotypes
				const filtered = result.filter(
					(item) => !selectedPhenotypes.some((p) => p.id === item.id),
				);
				setSearchResults(filtered);
				setShowResults(true);
			} catch (error) {
				console.error("Phenotype search failed:", error);
				setSearchResults([]);
			} finally {
				setIsSearching(false);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery, selectedPhenotypes]);

	const handleSelect = useCallback(
		(phenotype: MonarchEntity) => {
			if (selectedPhenotypes.length >= maxPhenotypes) {
				return;
			}
			onAddPhenotype(phenotype);
			setSearchQuery("");
			setShowResults(false);
		},
		[onAddPhenotype, selectedPhenotypes.length, maxPhenotypes],
	);

	const canProceed = selectedPhenotypes.length >= 1;

	// Filter out already selected phenotypes from suggestions
	const filterSelected = (phenotypes: MonarchEntity[]) =>
		phenotypes.filter((p) => !selectedPhenotypes.some((sp) => sp.id === p.id));

	return (
		<Card className={cn("w-full", className)}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Activity className="h-5 w-5 text-primary" />
					Select Symptoms
				</CardTitle>
				<CardDescription>
					{selectedAnatomy.length > 0 ? (
						<>
							Search for symptoms related to{" "}
							{selectedAnatomy.map((a) => (
								<Badge key={a.id} variant="secondary" className="mx-0.5">
									{a.name}
								</Badge>
							))}{" "}
							or describe what you're experiencing.
						</>
					) : (
						"Search for symptoms or describe what you're experiencing."
					)}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Suggested symptoms from body parts */}
				{isLoadingSuggestions && (
					<div className="flex items-center gap-2 rounded-lg border border-dashed p-4">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
						<p className="text-muted-foreground text-sm">
							Loading common symptoms for selected body parts...
						</p>
					</div>
				)}

				{!isLoadingSuggestions && suggestedPhenotypes && (
					<div className="space-y-3">
						{/* Common symptoms (if multiple body parts) */}
						{suggestedPhenotypes.common.length > 0 && (
							<div className="rounded-lg border bg-muted/30 p-3">
								<div className="mb-2 flex items-center gap-2">
									<Sparkles className="h-4 w-4 text-primary" />
									<p className="font-medium text-sm">Common Symptoms</p>
								</div>
								<div className="flex flex-wrap gap-1.5">
									{filterSelected(suggestedPhenotypes.common)
										.slice(0, 8)
										.map((phenotype) => (
											<Badge
												key={phenotype.id}
												variant="outline"
												className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
												onClick={() => handleSelect(phenotype)}
											>
												<Plus className="mr-1 h-3 w-3" />
												{phenotype.name}
											</Badge>
										))}
								</div>
							</div>
						)}

						{/* Symptoms grouped by body part */}
						{Object.entries(suggestedPhenotypes.grouped).map(
							([partId, { bodyPart, phenotypes }]) => {
								const filtered = filterSelected(phenotypes);
								if (filtered.length === 0) return null;

								return (
									<div key={partId} className="rounded-lg border p-3">
										<div className="mb-2 flex items-center gap-2">
											<Activity className="h-4 w-4 text-muted-foreground" />
											<p className="font-medium text-sm">{bodyPart.name}</p>
											<Badge variant="secondary" className="text-xs">
												{filtered.length} symptoms
											</Badge>
										</div>
										<div className="flex flex-wrap gap-1.5">
											{filtered.slice(0, 8).map((phenotype) => (
												<Badge
													key={phenotype.id}
													variant="outline"
													className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
													onClick={() => handleSelect(phenotype)}
												>
													<Plus className="mr-1 h-3 w-3" />
													{phenotype.name}
												</Badge>
											))}
										</div>
									</div>
								);
							},
						)}
					</div>
				)}

				{/* Search input */}
				<div className="relative">
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search symptoms (e.g., 'headache', 'fatigue', 'pain')..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pr-10 pl-10"
							disabled={selectedPhenotypes.length >= maxPhenotypes}
						/>
						{isSearching && (
							<Loader2 className="-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 animate-spin text-muted-foreground" />
						)}
					</div>

					{/* Search results dropdown */}
					{showResults && searchResults.length > 0 && (
						<div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-md border bg-popover shadow-lg">
							<ScrollArea className="max-h-64">
								<div className="p-1">
									{searchResults.map((result) => (
										<button
											key={result.id}
											type="button"
											className="flex w-full cursor-pointer items-start gap-2 rounded-sm px-2 py-2 text-left hover:bg-accent"
											onClick={() => handleSelect(result)}
										>
											<Plus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
											<div className="min-w-0 flex-1">
												<p className="font-medium">{result.name}</p>
												{result.description && (
													<p className="line-clamp-2 text-muted-foreground text-xs">
														{result.description}
													</p>
												)}
												<p className="mt-0.5 text-muted-foreground/70 text-xs">
													{result.id}
												</p>
											</div>
										</button>
									))}
								</div>
							</ScrollArea>
						</div>
					)}
				</div>

				{/* Selected phenotypes count */}
				<div className="flex items-center justify-between">
					<p className="text-muted-foreground text-sm">
						{selectedPhenotypes.length} of {maxPhenotypes} symptoms selected
					</p>
					{selectedPhenotypes.length > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								for (const p of selectedPhenotypes) {
									onRemovePhenotype(p.id);
								}
							}}
						>
							Clear all
						</Button>
					)}
				</div>

				{/* Selected phenotypes list */}
				{selectedPhenotypes.length > 0 ? (
					<ScrollArea className="max-h-[300px]">
						<div className="space-y-2">
							{selectedPhenotypes.map((phenotype) => (
								<div
									key={phenotype.id}
									className="flex items-start justify-between gap-2 rounded-lg border p-3"
								>
									<div className="min-w-0 flex-1">
										<p className="font-medium">{phenotype.name}</p>
										{phenotype.description && (
											<p className="line-clamp-2 text-muted-foreground text-xs">
												{phenotype.description}
											</p>
										)}
										<Badge variant="outline" className="mt-1 text-xs">
											{phenotype.id}
										</Badge>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="shrink-0"
										onClick={() => onRemovePhenotype(phenotype.id)}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					</ScrollArea>
				) : (
					<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
						<Activity className="mb-2 h-8 w-8 text-muted-foreground/50" />
						<p className="text-muted-foreground text-sm">
							No symptoms selected yet
						</p>
						<p className="text-muted-foreground/70 text-xs">
							Search above to add symptoms
						</p>
					</div>
				)}
			</CardContent>
			<CardFooter className="flex justify-between">
				<Button variant="outline" onClick={onBack}>
					<ChevronLeft className="mr-2 h-4 w-4" />
					Back
				</Button>
				<Button onClick={onProceed} disabled={!canProceed} className="gap-2">
					{selectedPhenotypes.length >= 3
						? "Continue to Refinement"
						: `Add ${3 - selectedPhenotypes.length} more symptom${3 - selectedPhenotypes.length > 1 ? "s" : ""}`}
					<ArrowRight className="h-4 w-4" />
				</Button>
			</CardFooter>
		</Card>
	);
}
