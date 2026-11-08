import { fetchBridgeInventory } from "@/lib/jamatevents-api";
import { OrnateCard, GoldenButton } from "@/components/ui/premium-components";
import { Badge } from "@/components/ui/badge";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        redirect("/login");
    }

    const items = await fetchBridgeInventory().catch((error) => {
        console.error("Failed to fetch inventory from jamatevents:", error);
        return [];
    });

    const jamateventsUrl = (
        process.env.NEXT_PUBLIC_JAMATEVENTS_URL ||
        process.env.JAMATEVENTS_API_URL ||
        "http://localhost:3000"
    ).replace(/\/+$/, "");

    return (
        <div className="min-h-screen py-12 px-6 mt-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-dark tracking-tight">Inventory</h1>
                    <p className="text-neutral-500 mt-2 text-lg">Manage stock and community assets</p>
                </div>
                <div className="flex gap-2">
                    <a
                        href={`${jamateventsUrl}/inventory/add`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <GoldenButton className="px-6 py-3 text-sm flex items-center gap-2 shadow-lg shadow-gold/20">
                            <Plus className="w-4 h-4" /> Add Item
                        </GoldenButton>
                    </a>
                </div>
            </div>

            <OrnateCard className="p-0 overflow-hidden border border-gold/20 shadow-2xl bg-white/90 backdrop-blur-xl">
                <div className="p-1 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-primary-dark/5 text-primary-dark font-bold uppercase tracking-wider text-xs border-b border-primary/10">
                            <tr>
                                <th className="px-8 py-5">Item Name</th>
                                <th className="px-6 py-5">Category</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Available</th>
                                <th className="px-6 py-5 text-right">Total</th>
                                <th className="px-8 py-5 text-right">Unit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200/60">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-24 text-center text-neutral-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400">
                                                <Plus className="w-8 h-8 opacity-50" />
                                            </div>
                                            <p className="font-serif text-lg text-neutral-600">No items found</p>
                                            <p className="text-sm">Manage vessels and stock items on the Jamaat Events &amp; Store portal.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gold/5 transition-colors group">
                                        <td className="px-8 py-5 font-bold text-neutral-800 text-base">{item.name}</td>
                                        <td className="px-6 py-5">
                                            <Badge variant="outline" className="bg-white border-neutral-200 text-neutral-600 px-3 py-1 text-xs font-semibold tracking-wide uppercase shadow-sm">
                                                {item.category}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5">
                                            {item.availableQuantity === 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100/80 text-red-700 text-xs font-bold shadow-sm border border-red-200">Out of Stock</span>
                                            ) : item.availableQuantity < 5 ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100/80 text-amber-700 text-xs font-bold shadow-sm border border-amber-200">Low Stock</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold shadow-sm border border-emerald-200">In Stock</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right font-bold text-primary-dark text-base">{item.availableQuantity}</td>
                                        <td className="px-6 py-5 text-right text-neutral-500 font-medium">{item.totalQuantity}</td>
                                        <td className="px-8 py-5 text-right text-neutral-400 font-mono text-xs">{item.unit}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </OrnateCard>
        </div>
    );
}
