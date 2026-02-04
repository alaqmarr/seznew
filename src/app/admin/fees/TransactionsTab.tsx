"use client";

import { OrnateCard } from "@/components/ui/premium-components";
import { format } from "date-fns";
import { ArrowUpRight, Search, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { revokeTransaction } from "@/app/actions/fees";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Transaction {
    id: string;
    amount: number;
    mode: string;
    reference: string | null;
    note: string | null;
    date: Date;
    user: {
        name: string | null;
        username: string;
    };
    allocations: {
        feeRecord?: {
            month: number;
            year: number;
        } | null;
        eventContribution?: {
            title: string;
        } | null;
    }[];
}

export function TransactionsTab({ transactions }: { transactions: Transaction[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const router = useRouter();

    const filteredTransactions = transactions.filter(tx =>
        tx.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.user.name && tx.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.reference && tx.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleRevoke = async (id: string) => {
        if (!confirm("Are you sure you want to revoke this transaction? This will revert the payment status.")) return;

        setRevokingId(id);
        try {
            const result = await revokeTransaction(id);
            if (result.success) {
                toast.success("Transaction revoked");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to revoke");
            }
        } catch (error) {
            toast.error("Error revoking transaction");
        } finally {
            setRevokingId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 max-w-sm">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                    placeholder="Search by User or Ref..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 bg-white/50 border-gold/20 focus-visible:ring-gold"
                />
            </div>

            <OrnateCard className="p-0 overflow-hidden border border-gold/20 shadow-2xl bg-white/90 backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Member</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Mode</th>
                                <th className="px-6 py-3">Allocation</th>
                                <th className="px-6 py-3">Ref/Note</th>
                                <th className="px-6 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                        {format(new Date(tx.date), "dd MMM yyyy")}
                                        <div className="text-xs opacity-70">{format(new Date(tx.date), "hh:mm a")}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{tx.user.name || tx.user.username}</div>
                                        <div className="text-xs text-gray-500 font-mono">{tx.user.username}</div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-green-700">
                                        ₹{tx.amount}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {tx.mode}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {tx.allocations.length > 0 ? (
                                            <div className="space-y-1">
                                                {tx.allocations.map((a, i) => (
                                                    <div key={i}>
                                                        {a.feeRecord ? (
                                                            <span>Contribution: {new Date(a.feeRecord.year, a.feeRecord.month).toLocaleString('default', { month: 'short' })} '{a.feeRecord.year.toString().slice(2)}</span>
                                                        ) : a.eventContribution ? (
                                                            <span>Event: {a.eventContribution.title}</span>
                                                        ) : (
                                                            <span>Unallocated</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">Unallocated</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                                        {tx.reference && <div>Ref: {tx.reference}</div>}
                                        {tx.note && <div>Note: {tx.note}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleRevoke(tx.id)}
                                            disabled={revokingId === tx.id}
                                        >
                                            {revokingId === tx.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </OrnateCard>
        </div>
    );
}
