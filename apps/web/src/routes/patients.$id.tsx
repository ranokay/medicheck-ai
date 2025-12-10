import { api } from "@medicheck-ai/backend/convex/_generated/api";
import type { Id } from "@medicheck-ai/backend/convex/_generated/dataModel";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { PatientProfile } from "@/components/patient-profile";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/patients/$id")({
	component: PatientDetailPage,
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session.data) {
			throw redirect({ to: "/" });
		}
	},
});

function PatientDetailPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const recordView = useMutation(api.patients.recordPatientView);

	// Record patient view on mount
	if (id) {
		recordView({ patientId: id as Id<"patients"> }).catch(() => {
			// Ignore errors
		});
	}

	const handleStartConsultation = () => {
		navigate({
			to: "/consultation/new",
			search: { patientId: id },
		});
	};

	return (
		<div className="container max-w-5xl py-6">
			<div className="mb-6">
				<Button asChild variant="ghost" size="sm">
					<Link to="/patients">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Înapoi la Pacienți
					</Link>
				</Button>
			</div>

			<PatientProfile
				patientId={id as Id<"patients">}
				onStartConsultation={handleStartConsultation}
			/>
		</div>
	);
}
