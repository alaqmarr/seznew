"use client";

import { useState } from "react";
import { AccountsOverview, MemberFinancial } from "@/app/actions/accounts";
import { OrnateCard, OrnateHeading, GoldenButton } from "@/components/ui/premium-components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, IndianRupee, Users, ArrowUpRight, ArrowDownLeft, FileText } from "lucide-react";
import { format } from "date-fns";

interface AccountsDashboardProps {
    overview: AccountsOverview;
    transactions: any[];
    members: MemberFinancial[];
    feeRecords: any[];
    eventContributions: any[];
}

export default function AccountsDashboard({
    overview,
    transactions,
    members,
    feeRecords,
    eventContributions
}: AccountsDashboardProps) {
    const [searchTerm, setSearchTerm] = useState("");

    // Filter logic
    const filteredMembers = members.filter(m =>
        m.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.name && m.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredTransactions = transactions.filter(t =>
        t.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.reference && t.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Collections"
                    value={overview.totalCollections}
                    icon={IndianRupee}
                    subtitle="All Time"
                    color="text-green-700"
                    bg="bg-green-50"
                />
                <StatCard
                    title="Pending Fees"
                    value={overview.totalPendingFees}
                    icon={ArrowDownLeft}
                    subtitle="Monthly Dues"
                    color="text-red-700"
                    bg="bg-red-50"
                />
                <StatCard
                    title="Pending Events"
                    value={overview.totalPendingEvents}
                    icon={FileText}
                    subtitle="Event Funds"
                    color="text-amber-700"
                    bg="bg-amber-50"
                />
                <StatCard
                    title="Today's Coll."
                    value={overview.todayCollection}
                    icon={ArrowUpRight}
                    subtitle={format(new Date(), "dd MMM yyyy")}
                    color="text-primary-dark"
                    bg="bg-gold/10"
                />
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="members" className="w-full">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <TabsList className="bg-white/50 border border-gold/20 p-1">
                        <TabsTrigger value="members" className="data-[state=active]:bg-primary data-[state=active]:text-white">Members</TabsTrigger>
                        <TabsTrigger value="transactions" className="data-[state=active]:bg-primary data-[state=active]:text-white">Transactions</TabsTrigger>
                        <TabsTrigger value="fees" className="data-[state=active]:bg-primary data-[state=active]:text-white">Fee Records</TabsTrigger>
                        <TabsTrigger value="events" className="data-[state=active]:bg-primary data-[state=active]:text-white">Event Funds</TabsTrigger>
                    </TabsList>

                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search user, ref..."
                            className="pl-9 w-full sm:w-[300px] bg-white border-gold/20 focus-visible:ring-gold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <TabsContent value="members" className="space-y-4">
                    <OrnateCard className="bg-white/80 p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-primary/5 text-primary-dark font-serif">
                                    <tr>
                                        <th className="p-4 text-left">User</th>
                                        <th className="p-4 text-left">Mobile</th>
                                        <th className="p-4 text-right">Total Due</th>
                                        <th className="p-4 text-right">Total Paid</th>
                                        <th className="p-4 text-right">Balance</th>
                                        <th className="p-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredMembers.map((member) => (
                                        <tr key={member.userId} className="hover:bg-gold/5 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900">{member.name || "Unknown"}</div>
                                                <div className="text-xs text-gray-500">{member.username}</div>
                                            </td>
                                            <td className="p-4 text-gray-600">{member.mobile || "-"}</td>
                                            <td className="p-4 text-right">₹{member.totalDue.toLocaleString()}</td>
                                            <td className="p-4 text-right text-green-600">₹{member.totalPaid.toLocaleString()}</td>
                                            <td className="p-4 text-right font-bold">
                                                <span className={member.balance > 0 ? "text-red-600" : "text-gray-400"}>
                                                    ₹{member.balance.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {member.balance <= 0 ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shadow-none">Clear</Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 shadow-none">Pending</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredMembers.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-400">No members found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </OrnateCard>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                    <OrnateCard className="bg-white/80 p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-primary/5 text-primary-dark font-serif">
                                    <tr>
                                        <th className="p-4 text-left">Date</th>
                                        <th className="p-4 text-left">User</th>
                                        <th className="p-4 text-left">Reference</th>
                                        <th className="p-4 text-left">Mode</th>
                                        <th className="p-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gold/5 transition-colors">
                                            <td className="p-4 text-gray-600">
                                                {format(new Date(tx.date), "dd MMM yyyy")}
                                                <div className="text-xs text-gray-400">{format(new Date(tx.date), "hh:mm a")}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900">{tx.user.name}</div>
                                                <div className="text-xs text-gray-500">{tx.user.username}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-mono text-xs">{tx.reference || "-"}</div>
                                                {tx.note && <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{tx.note}</div>}
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="border-gold/30 text-primary-dark">{tx.mode}</Badge>
                                            </td>
                                            <td className="p-4 text-right font-bold text-green-700">
                                                + ₹{tx.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTransactions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-400">No transactions found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </OrnateCard>
                </TabsContent>

                <TabsContent value="fees">
                    <OrnateCard className="bg-white/80 p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-primary/5 text-primary-dark font-serif">
                                    <tr>
                                        <th className="p-4 text-left">Month</th>
                                        <th className="p-4 text-left">User</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-right">Paid</th>
                                        <th className="p-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {feeRecords.slice(0, 100).map((record: any) => ( // Limiting for simple render
                                        <tr key={record.id} className="hover:bg-gold/5 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium">{new Date(record.year, record.month).toLocaleString('default', { month: 'short' })} {record.year}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm">{record.user.username}</div>
                                            </td>
                                            <td className="p-4 text-right">₹{record.amount}</td>
                                            <td className="p-4 text-right text-green-600">₹{record.paidAmount}</td>
                                            <td className="p-4 text-center">
                                                <StatusBadge status={record.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </OrnateCard>
                </TabsContent>

                <TabsContent value="events">
                    <OrnateCard className="bg-white/80 p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-primary/5 text-primary-dark font-serif">
                                    <tr>
                                        <th className="p-4 text-left">Event</th>
                                        <th className="p-4 text-left">User</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-right">Paid</th>
                                        <th className="p-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {eventContributions.slice(0, 100).map((record: any) => (
                                        <tr key={record.id} className="hover:bg-gold/5 transition-colors">
                                            <td className="p-4 font-medium">{record.title}</td>
                                            <td className="p-4 text-sm">{record.user.username}</td>
                                            <td className="p-4 text-right">₹{record.amount}</td>
                                            <td className="p-4 text-right text-green-600">₹{record.paidAmount}</td>
                                            <td className="p-4 text-center">
                                                <StatusBadge status={record.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </OrnateCard>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, subtitle, color, bg }: any) {
    return (
        <OrnateCard className={`p-6 flex items-start justify-between ${bg} border-none shadow-md`}>
            <div>
                <p className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-1">{title}</p>
                <h3 className={`text-3xl font-bold ${color}`}>₹{value.toLocaleString()}</h3>
                <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            </div>
            <div className={`p-3 rounded-full bg-white shadow-sm ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
        </OrnateCard>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case "PAID":
            return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shadow-none">Paid</Badge>;
        case "PARTIAL":
            return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 shadow-none">Partial</Badge>;
        default:
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 shadow-none">Pending</Badge>;
    }
}
