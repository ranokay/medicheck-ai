import { createFileRoute, redirect } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Loader2, Stethoscope } from "lucide-react";
import { useState } from "react";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
	component: HomePage,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (session.data) {
			throw redirect({
				to: "/dashboard",
			});
		}
	},
});

function HomePage() {
	const [showSignIn, setShowSignIn] = useState(false);

	return (
		<div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-4">
			<Authenticated>
				<div className="text-center">
					<Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
					<p className="mt-2 text-muted-foreground">Redirecting...</p>
				</div>
			</Authenticated>

			<Unauthenticated>
				<div className="mb-8 text-center">
					<div className="mb-4 flex items-center justify-center gap-3">
						<Stethoscope className="h-12 w-12 text-primary" />
						<h1 className="font-bold text-4xl">MediCheck AI</h1>
					</div>
					<p className="max-w-md text-muted-foreground">
						AI-powered symptom analysis and health insights. Get personalized
						health recommendations based on your symptoms.
					</p>
				</div>

				{showSignIn ? (
					<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
				) : (
					<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
				)}
			</Unauthenticated>

			<AuthLoading>
				<div className="text-center">
					<Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
					<p className="mt-2 text-muted-foreground">Loading...</p>
				</div>
			</AuthLoading>
		</div>
	);
}
