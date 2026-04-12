import { requireAccess } from "@/lib/access-control";
import { redirect } from "next/navigation";
import { OrnateHeading } from "@/components/ui/premium-components";
import { ExportCard } from "./ExportCard";

export default async function ExportsPage() {
    const { authorized } = await requireAccess("/admin/exports");
    if (!authorized) redirect("/unauthorized");

    const exportOptions = [
        {
            title: "Member Database",
            description: "Full list of all registered members with their profile details, ITS numbers, and current fee configuration.",
            type: "USERS",
        },
        {
            title: "Transaction Ledger",
            description: "Complete history of all financial transactions (UPI, Cash, Bank) with timestamps and admin notes.",
            type: "ACCOUNTS",
        },
        {
            title: "Pending Dues",
            description: "List of all unpaid monthly fees organized by month and year. Useful for following up with members.",
            type: "PENDING_FEES",
        },
        {
            title: "Paid History",
            description: "Records of specialized monthly fee payments that have been successfully cleared.",
            type: "PAID_HISTORY",
        },
        {
            title: "Events Master List",
            description: "Overview of all events including dates, halls, and attendance summary statistics.",
            type: "EVENTS",
        },
        {
            title: "Event Contributions",
            description: "Detailed report of event-specific fund requests and their payment status per user.",
            type: "CONTRIBUTIONS",
        }
    ];

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-7xl mx-auto space-y-10">
                <OrnateHeading
                    title="Data Exports"
                    subtitle="Securely download system data in Excel format"
                    arabic="تصدير البيانات"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exportOptions.map((opt) => (
                        <ExportCard
                            key={opt.type}
                            title={opt.title}
                            description={opt.description}
                            type={opt.type}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
