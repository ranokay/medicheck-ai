/**
 * AnatomySelector Component (Step 1)
 *
 * Allows user to select a body part/anatomical location (UBERON).
 * This filters the phenotype search in the next step.
 */

import { ArrowRight, Loader2, MapPin, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { type MonarchEntity, monarchAPI } from "@/lib/monarch-api";
import { cn } from "@/lib/utils";

// Common body parts for quick selection
const COMMON_BODY_PARTS = [
	{ id: "UBERON:0000970", name: "Eye", icon: "👁️" },
	{ id: "UBERON:0001690", name: "Ear", icon: "👂" },
	{ id: "UBERON:0000004", name: "Nose", icon: "👃" },
	{ id: "UBERON:0000165", name: "Mouth", icon: "👄" },
	{ id: "UBERON:0000033", name: "Head", icon: "🧠" },
	{ id: "UBERON:0001137", name: "Neck", icon: "🦒" },
	{ id: "UBERON:0000948", name: "Heart", icon: "❤️" },
	{ id: "UBERON:0002048", name: "Lung", icon: "🫁" },
	{ id: "UBERON:0000945", name: "Stomach", icon: "🫃" },
	{ id: "UBERON:0002113", name: "Kidney", icon: "🫘" },
	{ id: "UBERON:0002107", name: "Liver", icon: "🫀" },
	{ id: "UBERON:0001434", name: "Skeletal system", icon: "🦴" },
	{ id: "UBERON:0002097", name: "Skin", icon: "🖐️" },
	{ id: "UBERON:0001016", name: "Nervous system", icon: "🧠" },
];

interface AnatomySelectorProps {
	selectedAnatomy: MonarchEntity[];
	onAdd: (anatomy: MonarchEntity) => void;
	onRemove: (anatomyId: string) => void;
	onProceed: () => void;
	className?: string;
}

export function AnatomySelector({
	selectedAnatomy,
	onAdd,
	onRemove,
	onProceed,
	className,
}: AnatomySelectorProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<MonarchEntity[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [showResults, setShowResults] = useState(false);

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
				const result = await monarchAPI.searchAnatomy(searchQuery, 15);
				setSearchResults(result.items);
				setShowResults(true);
			} catch (error) {
				console.error("Anatomy search failed:", error);
				setSearchResults([]);
			} finally {
				setIsSearching(false);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	const handleSelect = useCallback(
		(anatomy: MonarchEntity) => {
			// Don't add if already selected
			if (selectedAnatomy.some((a) => a.id === anatomy.id)) return;
			onAdd(anatomy);
			setSearchQuery("");
			setShowResults(false);
		},
		[onAdd, selectedAnatomy],
	);

	const handleQuickSelect = useCallback(
		async (bodyPart: (typeof COMMON_BODY_PARTS)[0]) => {
			// Don't add if already selected
			if (selectedAnatomy.some((a) => a.id === bodyPart.id)) {
				// If already selected, remove it
				onRemove(bodyPart.id);
				return;
			}
			try {
				// Fetch full entity details
				const entity = await monarchAPI.getEntity(bodyPart.id);
				onAdd(entity);
			} catch {
				// Fallback to basic info
				onAdd({
					id: bodyPart.id,
					name: bodyPart.name,
					category: "biolink:AnatomicalEntity",
				});
			}
		},
		[onAdd, onRemove, selectedAnatomy],
	);

	return (
		<Card className={cn("w-full", className)}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<MapPin className="h-5 w-5 text-primary" />
					Identify Location
				</CardTitle>
				<CardDescription>
					Where in the body are you experiencing symptoms? Select an anatomical
					location to help narrow down possible conditions.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Search input */}
				<div className="relative">
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search for a body part (e.g., 'eye', 'chest', 'abdomen')..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pr-10 pl-10"
						/>
						{isSearching && (
							<Loader2 className="-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 animate-spin text-muted-foreground" />
						)}
					</div>

					{/* Search results dropdown */}
					{showResults && searchResults.length > 0 && (
						<div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-auto rounded-md border bg-popover p-1 shadow-lg">
							{searchResults.map((result) => (
								<button
									key={result.id}
									type="button"
									className="flex w-full cursor-pointer items-start gap-2 rounded-sm px-2 py-2 text-left hover:bg-accent"
									onClick={() => handleSelect(result)}
								>
									<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
									<div className="min-w-0 flex-1">
										<p className="font-medium">{result.name}</p>
										<p className="truncate text-muted-foreground text-xs">
											{result.id}
										</p>
									</div>
								</button>
							))}
						</div>
					)}
				</div>

				{/* Quick selection grid */}
				<div>
					<p className="mb-3 font-medium text-muted-foreground text-sm">
						Common body parts
					</p>
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
						{COMMON_BODY_PARTS.map((part) => {
							const isSelected = selectedAnatomy.some((a) => a.id === part.id);
							return (
								<Button
									key={part.id}
									variant={isSelected ? "default" : "outline"}
									className="h-auto flex-col gap-1 py-3"
									onClick={() => handleQuickSelect(part)}
								>
									<span className="text-xl">{part.icon}</span>
									<span className="text-xs">{part.name}</span>
								</Button>
							);
						})}
					</div>
				</div>

				{/* Selected anatomy display */}
				{selectedAnatomy.length > 0 && (
					<div className="rounded-lg border bg-muted/50 p-4">
						<div className="mb-2 flex items-center justify-between">
							<p className="font-medium text-sm">
								Selected body parts ({selectedAnatomy.length})
							</p>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									for (const a of selectedAnatomy) {
										onRemove(a.id);
									}
								}}
							>
								Clear all
							</Button>
						</div>
						<div className="flex flex-wrap gap-2">
							{selectedAnatomy.map((anatomy) => (
								<Badge
									key={anatomy.id}
									variant="secondary"
									className="cursor-pointer gap-1 pr-1"
									onClick={() => onRemove(anatomy.id)}
								>
									{anatomy.name}
									<X className="h-3 w-3" />
								</Badge>
							))}
						</div>
					</div>
				)}

				{/* Proceed button */}
				<div className="flex justify-end">
					<Button
						onClick={onProceed}
						disabled={selectedAnatomy.length === 0}
						className="gap-2"
					>
						Continue to Symptoms
						<ArrowRight className="h-4 w-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
