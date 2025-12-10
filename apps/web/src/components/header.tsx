import { Link } from "@tanstack/react-router";
import { Authenticated } from "convex/react";
import { Stethoscope } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	return (
		<header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="container flex h-14 items-center justify-between">
				<Link to="/" className="flex items-center gap-2 font-semibold">
					<Stethoscope className="h-5 w-5 text-primary" />
					<span>MediCheck AI</span>
				</Link>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<Authenticated>
						<UserMenu />
					</Authenticated>
				</div>
			</div>
		</header>
	);
}
