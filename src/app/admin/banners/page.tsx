import { prisma } from "@/lib/db";
import { toggleBannerStatus, deleteBanner } from "@/app/actions/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BannerForm } from "@/components/forms/BannerForm";
import { OrnateHeading, OrnateCard } from "@/components/ui/premium-components";

export const dynamic = 'force-dynamic';

export default async function BannerAdminPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        redirect("/login");
    }

    const banners = await prisma.banner.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="min-h-screen bg-background-light py-12 px-6 mt-12">
            <div className="max-w-4xl mx-auto space-y-12">
                <OrnateHeading title="Banner Management" subtitle="Manage Homepage Sliders" />

                {/* Create Form */}
                <BannerForm />

                {/* List */}
                <div className="space-y-6">
                    {banners.map(banner => (
                        <OrnateCard key={banner.id} className="flex flex-col md:flex-row items-center p-6 gap-6 transition-all hover:shadow-xl">
                            <div className="w-full md:w-64 aspect-[4/1] bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gold/20 shadow-sm relative group">
                                <img src={banner.imageUrl} alt="Banner" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>
                            <div className="flex-grow space-y-3 text-center md:text-left w-full">
                                <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                    <Badge className={`${banner.isActive ? "bg-green-600 hover:bg-green-700" : "bg-neutral-400 hover:bg-neutral-500"} text-white border-0`}>
                                        {banner.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    {banner.href && (
                                        <span className="text-xs font-medium text-gold bg-gold/5 px-2 py-1 rounded border border-gold/20 truncate max-w-[200px]">
                                            Link: {banner.href}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-neutral-400 font-mono">ID: {banner.id}</p>
                            </div>
                            <div className="flex flex-row md:flex-col gap-3 min-w-[120px]">
                                <form action={async () => {
                                    "use server";
                                    await toggleBannerStatus(banner.id, banner.isActive);
                                }} className="w-full">
                                    <Button variant="outline" size="sm" className="w-full border-gold/30 hover:bg-gold/5 hover:text-gold text-neutral-600">
                                        {banner.isActive ? "Deactivate" : "Activate"}
                                    </Button>
                                </form>
                                <form action={async () => {
                                    "use server";
                                    await deleteBanner(banner.id);
                                }} className="w-full">
                                    <Button variant="destructive" size="sm" className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200">Delete</Button>
                                </form>
                            </div>
                        </OrnateCard>
                    ))}
                </div>
            </div>
        </div>
    );
}
