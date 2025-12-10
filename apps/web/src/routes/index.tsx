import { createFileRoute, redirect } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import {
	Activity,
	ClipboardList,
	Loader2,
	Shield,
	Stethoscope,
	Users,
} from "lucide-react";
import { useState } from "react";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { Card, CardContent } from "@/components/ui/card";
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

const features = [
	{
		icon: Users,
		title: "Gestionare Pacienți",
		description:
			"Căutare rapidă după CNP sau nume, istoric complet al consultațiilor",
	},
	{
		icon: ClipboardList,
		title: "Verificator Simptome",
		description:
			"Înregistrare simptome și semne vitale cu diagnostic asistat AI",
	},
	{
		icon: Activity,
		title: "Analiză Inteligentă",
		description: "Sugestii diagnostic bazate pe simptome și istoric medical",
	},
	{
		icon: Shield,
		title: "Acces Securizat",
		description: "Roluri separate pentru asistente, medici și administratori",
	},
];

function HomePage() {
	const [showSignIn, setShowSignIn] = useState(false);

	return (
		<div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-4">
			<Authenticated>
				<div className="text-center">
					<Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
					<p className="mt-2 text-muted-foreground">Se redirecționează...</p>
				</div>
			</Authenticated>

			<Unauthenticated>
				<div className="w-full max-w-5xl">
					{/* Hero */}
					<div className="mb-12 text-center">
						<div className="mb-4 flex items-center justify-center gap-3">
							<div className="rounded-xl bg-primary/10 p-3">
								<Stethoscope className="h-10 w-10 text-primary" />
							</div>
						</div>
						<h1 className="mb-3 font-bold text-4xl tracking-tight md:text-5xl">
							MediCheck AI
						</h1>
						<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
							Platformă inteligentă de triaj și diagnostic pentru cabinetele
							medicale. Ajută personalul medical să gestioneze eficient
							pacienții și să identifice rapid posibilele diagnostice.
						</p>
					</div>

					{/* Features */}
					<div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{features.map((feature, index) => (
							<Card key={index} className="border-muted/50">
								<CardContent className="pt-6">
									<feature.icon className="mb-3 h-8 w-8 text-primary" />
									<h3 className="mb-1 font-semibold">{feature.title}</h3>
									<p className="text-muted-foreground text-sm">
										{feature.description}
									</p>
								</CardContent>
							</Card>
						))}
					</div>

					{/* Auth Forms */}
					<div className="mx-auto max-w-md">
						{showSignIn ? (
							<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
						) : (
							<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
						)}
					</div>
				</div>
			</Unauthenticated>

			<AuthLoading>
				<div className="text-center">
					<Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
					<p className="mt-2 text-muted-foreground">Se încarcă...</p>
				</div>
			</AuthLoading>
		</div>
	);
}
