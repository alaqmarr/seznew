import { OrnateCard, OrnateHeading } from "@/components/ui/premium-components";
import { KhidmatForm } from "@/components/forms/KhidmatForm";

// Server Component (Default in App Router)
export default function KhidmatPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 mt-12 gap-8">
            <OrnateHeading
                arabic="بسم الله الرحمن الرحيم"
                title="Khidmat Invitation"
            />
            <OrnateCard className="w-full max-w-lg p-8 md:p-12">
                <KhidmatForm />
            </OrnateCard>
        </div>
    );
}
