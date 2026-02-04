"use client";

import { OrnateCard } from "@/components/ui/premium-components";
import { format } from "date-fns";
import { ArrowUpRight, Receipt } from "lucide-react";

interface Transaction {
    id: string;
    amount: number;
    date: Date;
    mode: string;
    note: string | null;
    reference: string | null;
    allocations: {
        feeRecord: {
            month: number;
            year: number;
        } | null;
        eventContribution: {
            title: string;
        } | null;
    }[];
}

export function TransactionHistory({ transactions }: { transactions: Transaction[] }) {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="text-center py-8 bg-neutral-50 rounded-lg border border-neutral-100">
                <Receipt className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-neutral-500 text-sm">No transaction history found</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {transactions.map((tx) => (
                <OrnateCard key={tx.id} className="p-4 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900">₹{tx.amount}</div>
                            <div className="text-xs text-gray-500">
                                {format(new Date(tx.date), "PPP")} • {tx.mode}
                            </div>
                            {tx.allocations.length > 0 && (
                                <div className="text-xs text-gray-400 mt-1">
                                    Covers: {tx.allocations.map(a => {
                                        if (a.feeRecord) {
                                            return `${new Date(a.feeRecord.year, a.feeRecord.month).toLocaleString('default', { month: 'short' })} '${a.feeRecord.year.toString().slice(2)}`;
                                        } else if (a.eventContribution) {
                                            return a.eventContribution.title;
                                        }
                                        return "Unknown";
                                    }).join(", ")}
                                </div>
                            )}
                        </div>
                    </div>
                    {tx.reference && (
                        <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">
                            Ref: {tx.reference}
                        </div>
                    )}
                </OrnateCard>
            ))}
        </div>
    );
}
