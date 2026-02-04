import { OrnateCard, OrnateHeading } from "@/components/ui/premium-components";
import { JoinForm } from "@/components/forms/JoinForm";

// Server Component
export default function JoinPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-12 mt-12 gap-8">
            <OrnateHeading
                arabic="بسم الله الرحمن الرحيم"
                title="Join the Committee"
            />
            <OrnateCard className="w-full max-w-4xl p-8 md:p-12">
                <JoinForm />
            </OrnateCard>
        </div>
    );
}
