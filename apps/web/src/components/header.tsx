import { Link, useRouterState } from "@tanstack/react-router";
import { Authenticated } from "convex/react";
import { LayoutDashboard, Plus, Stethoscope, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import UserMenu from "./user-menu";

const navLinks = [
	{
		to: "/dashboard",
		label: "Dashboard",
		icon: LayoutDashboard,
	},
	{
		to: "/patients",
		label: "Pacienți",
		icon: Users,
	},
] as const;

export default function Header() {
	const router = useRouterState();
	const currentPath = router.location.pathname;

	return (
		<header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="container flex h-14 items-center justify-between">
				<div className="flex items-center gap-6">
					<Link
						to="/dashboard"
						className="flex items-center gap-2 font-semibold"
					>
						<Stethoscope className="h-5 w-5 text-primary" />
						<span>MediCheck AI</span>
					</Link>

					<Authenticated>
						<nav className="hidden items-center gap-1 md:flex">
							{navLinks.map((link) => (
								<Link
									key={link.to}
									to={link.to}
									className={cn(
										"flex items-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-colors hover:bg-muted",
										currentPath === link.to
											? "bg-muted text-foreground"
											: "text-muted-foreground",
									)}
								>
									<link.icon className="h-4 w-4" />
									{link.label}
								</Link>
							))}
						</nav>
					</Authenticated>
				</div>

				<div className="flex items-center gap-2">
					<Authenticated>
						<Button asChild size="sm" className="hidden sm:flex">
							<Link to="/consultation/new">
								<Plus className="mr-2 h-4 w-4" />
								Consultație Nouă
							</Link>
						</Button>
					</Authenticated>
					<ModeToggle />
					<Authenticated>
						<UserMenu />
					</Authenticated>
				</div>
			</div>
		</header>
	);
}
