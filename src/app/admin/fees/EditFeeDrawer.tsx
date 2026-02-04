"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerClose,
} from "@/components/ui/drawer";
import {
    recordPayment,
    getFeeRecordTransactions,
    revokeTransaction,
    upsertFeeConfig,
    updateFeeRecord,
    createFeeRecord,
    payUserMonths,
    getPendingFeeRecords
} from "@/app/actions/fees";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface EditFeeDrawerProps {
    userId: string;
    userName: string;
    month: number;
    year: number;
    initialConfigAmount: number;
    initialRecord: {
        id: string;
        amount: number;
        paidAmount: number;
        status: "PENDING" | "PARTIAL" | "PAID";
    } | null;
    adminName: string;
    children: React.ReactNode;
}

export function EditFeeDrawer({
    userId,
    userName,
    month,
    year,
    initialConfigAmount,
    initialRecord,
    adminName,
    children
}: EditFeeDrawerProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("single");

    // Single Pay State
    const [configAmount, setConfigAmount] = useState(initialConfigAmount.toString());
    const [recordAmount, setRecordAmount] = useState(initialRecord?.amount.toString() || initialConfigAmount.toString());
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("CASH");
    const [paymentReference, setPaymentReference] = useState("");

    const [transactions, setTransactions] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

    // Multi Pay State
    const [multiPayMonths, setMultiPayMonths] = useState<{ month: number, year: number, label: string, amount: number, selected: boolean, recordId: string }[]>([]);
    const [multiTotal, setMultiTotal] = useState(0);
    const [multiPayMode, setMultiPayMode] = useState("CASH");
    const [multiPayReference, setMultiPayReference] = useState("");

    // Initialize Multi Pay Options when drawer opens or tab changes
    const loadPendingDues = async () => {
        setLoading(true);
        const res = await getPendingFeeRecords(userId);
        if (res.success && res.data) {
            const options = res.data.map((rec: any) => {
                const d = new Date(rec.year, rec.month);
                const due = rec.amount - rec.paidAmount;
                return {
                    month: rec.month,
                    year: rec.year,
                    label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
                    amount: due,
                    selected: false,
                    recordId: rec.id
                };
            });
            setMultiPayMonths(options);
            setMultiTotal(0);
        }
        setMultiPayMode("CASH");
        setMultiPayReference("");
        setLoading(false);
    };

    const handleMultiSelect = (index: number, checked: boolean) => {
        const newMonths = [...multiPayMonths];
        newMonths[index].selected = checked;
        setMultiPayMonths(newMonths);
        setMultiTotal(newMonths.filter(m => m.selected).reduce((sum, m) => sum + m.amount, 0));
    };

    const handleMultiPaySubmit = async () => {
        if (multiTotal <= 0) return;
        if (!confirm(`Confirm payment of ₹${multiTotal} for ${multiPayMonths.filter(m => m.selected).length} months?`)) return;

        setLoading(true);
        try {
            const payments = multiPayMonths.filter(m => m.selected).map(m => ({
                month: m.month,
                year: m.year,
                amount: m.amount
            }));

            const res = await payUserMonths(userId, payments, adminName, multiPayMode, multiPayReference);

            if (res.success) {
                toast.success(`Successfully recorded payments for ${res.count} months`);
                setOpen(false);
                router.refresh();
            } else {
                toast.error(res.error || "Failed to process payments");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const loadTransactions = async () => {
        if (!initialRecord?.id) return;
        const res = await getFeeRecordTransactions(initialRecord.id);
        if (res.success && res.data) {
            setTransactions(res.data);
        }
    };

    const handleSaveConfig = async () => {
        setLoading(true);
        const res = await upsertFeeConfig(userId, parseFloat(configAmount));
        if (res.success) {
            toast.success("Fee configuration updated");
            router.refresh();
        } else {
            toast.error(res.error || "Failed");
        }
        setLoading(false);
    };

    const handleUpdateRecord = async () => {
        if (!initialRecord?.id) return;
        setLoading(true);
        const res = await updateFeeRecord(initialRecord.id, { amount: parseFloat(recordAmount) });
        if (res.success) {
            toast.success("Fee record updated");
            router.refresh();
        } else {
            toast.error(res.error || "Failed");
        }
        setLoading(false);
    };

    const handleSaveRecord = async () => {
        setLoading(true);
        try {
            // 1. Ensure Record Exists (if not generated)
            let recordId = initialRecord?.id;

            if (!recordId) {
                // We don't have a direct create-and-return action easily available without modifying actions slightly or making a guess.
                // But wait, createFeeRecord is void/boolean return.
                // We need to reload the page to get the ID usually.
                // Ideally we should update createFeeRecord to return ID.
                // For now, let's stop and ask user to generate first.
                // OR, since we are in a rush, just create it and refresh, then ask to pay.
                await createFeeRecord(userId, month, year, parseFloat(configAmount));
                router.refresh();
                toast.success("Record created. Please try payment again.");
                setLoading(false);
                return;
            }

            // If we have an amount to pay
            if (parseFloat(paymentAmount) > 0 && recordId) {
                const payResult = await recordPayment(
                    userId,
                    parseFloat(paymentAmount),
                    paymentMode,
                    paymentReference || `Manual Entry by ${adminName}`,
                    `Manual Entry: ${monthName} ${year} (Logged by ${adminName})`,
                    undefined,
                    recordId
                );

                if (payResult.success) {
                    toast.success("Payment recorded");
                    setPaymentAmount("");
                    setPaymentReference("");
                    loadTransactions(); // Reload history
                    router.refresh();
                } else {
                    toast.error(payResult.error || "Payment failed");
                }
            } else {
                toast.error("Invalid amount or record missing.");
            }

        } catch (e) {
            toast.error("Error saving");
        }
        setLoading(false);
    };

    const handleRevoke = async (txId: string) => {
        if (!confirm("Are you sure you want to revoke this transaction?")) return;
        setLoading(true);
        const res = await revokeTransaction(txId);
        if (res.success) {
            toast.success("Transaction revoked");
            loadTransactions();
            router.refresh();
        } else {
            toast.error(res.error || "Failed");
        }
        setLoading(false);
    };

    return (
        <Drawer open={open} onOpenChange={(o) => {
            setOpen(o);
            if (o) {
                loadTransactions();
                loadPendingDues();
                setPaymentReference(`Manual Entry by ${adminName}`);
            }
        }}>
            <DrawerTrigger asChild>
                {children}
            </DrawerTrigger>
            <DrawerContent className="h-[95vh] rounded-t-3xl">
                <div className="mx-auto w-full max-w-lg h-full flex flex-col bg-white/60 backdrop-blur-md">
                    <DrawerHeader className="text-left pt-6 px-6">
                        <DrawerTitle className="text-3xl font-serif text-primary-dark">
                            {userName}
                        </DrawerTitle>
                        <DrawerDescription className="text-base">
                            Manage fees for {monthName} {year}
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="px-6 flex-1 overflow-y-auto scrollbar-hide">
                        <Tabs value={activeTab} onValueChange={(val) => {
                            setActiveTab(val);
                            if (val === "multi") {
                                loadPendingDues();
                            } else {
                                loadTransactions();
                            }
                        }} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-gray-100/50 rounded-full">
                                <TabsTrigger value="single" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Single Month</TabsTrigger>
                                <TabsTrigger value="multi" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Multi-Month</TabsTrigger>
                            </TabsList>

                            <TabsContent value="single" className="space-y-6 focus-visible:ring-0 outline-none">
                                {/* Config Section */}
                                <div className="space-y-3 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Fee Configuration</Label>
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                                            <Input
                                                type="number"
                                                value={configAmount}
                                                onChange={e => setConfigAmount(e.target.value)}
                                                className="bg-gray-50 pl-7 border-none focus:ring-1 focus:ring-gold"
                                            />
                                        </div>
                                        <Button size="sm" variant="outline" onClick={handleSaveConfig} disabled={loading} className="border-gold/30 text-gold-dark hover:bg-gold/5">
                                            Update Config
                                        </Button>
                                    </div>
                                </div>

                                {/* Record Section */}
                                <div className="space-y-4 p-5 bg-white rounded-2xl border border-gold/20 shadow-[0_4px_20px_-10px_rgba(184,134,11,0.2)]">
                                    <div className="flex justify-between items-center mb-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-gold-dark">
                                            Current Month ({monthName})
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-[10px] text-gray-400 uppercase">Bill Amount</Label>
                                            <Input
                                                type="number"
                                                value={recordAmount}
                                                onChange={e => setRecordAmount(e.target.value)}
                                                className="w-20 h-7 text-right bg-gray-50 border-none focus:ring-1 focus:ring-gold"
                                            />
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-gold-dark hover:bg-gold/10" onClick={handleUpdateRecord} disabled={loading}>
                                                <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

                                    <div className="space-y-4">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-green-700">Record Payment</Label>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-gray-500 font-medium">Amount Received</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                                                    <Input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={paymentAmount}
                                                        onChange={e => setPaymentAmount(e.target.value)}
                                                        className="pl-7 bg-gray-50 border-gray-100"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-gray-500 font-medium">Payment Mode</Label>
                                                <Select value={paymentMode} onValueChange={setPaymentMode}>
                                                    <SelectTrigger className="bg-gray-50 border-gray-100">
                                                        <SelectValue placeholder="Mode" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="CASH">Cash</SelectItem>
                                                        <SelectItem value="ONLINE">Online</SelectItem>
                                                        <SelectItem value="BANK">Bank Transfer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-gray-500 font-medium">Reference or Note</Label>
                                            <Input
                                                placeholder="Optional note e.g. Transaction ID"
                                                value={paymentReference}
                                                onChange={e => setPaymentReference(e.target.value)}
                                                className="bg-gray-50 border-gray-100"
                                            />
                                        </div>

                                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20" onClick={handleSaveRecord} disabled={loading}>
                                            Record Payment
                                        </Button>
                                    </div>
                                </div>

                                {/* History Section */}
                                {transactions.length > 0 && (
                                    <div className="space-y-3 pb-6">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 px-2">Recent Transactions</Label>
                                        <div className="space-y-2">
                                            {transactions.map(tx => (
                                                <div key={tx.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                                    <div className="flex gap-3 items-center">
                                                        <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs">
                                                            ₹
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">₹{tx.amount.toLocaleString()}</div>
                                                            <div className="text-[10px] text-gray-400 flex gap-2">
                                                                <span>{new Date(tx.date).toLocaleDateString()}</span>
                                                                <span>•</span>
                                                                <span className="uppercase">{tx.mode}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button size="icon" variant="ghost" className="text-gray-300 hover:text-red-500 hover:bg-red-50" onClick={() => handleRevoke(tx.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="multi" className="space-y-4 focus-visible:ring-0 outline-none pb-6">
                                <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-4">
                                    <div>
                                        <h4 className="font-serif text-xl text-amber-900">Bulk Payment</h4>
                                        <p className="text-sm text-amber-700/80">
                                            Select multiple months to pay at once.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase text-amber-800 font-semibold">Mode</Label>
                                            <Select value={multiPayMode} onValueChange={setMultiPayMode}>
                                                <SelectTrigger className="bg-white border-amber-200 h-9">
                                                    <SelectValue placeholder="Mode" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CASH">Cash</SelectItem>
                                                    <SelectItem value="ONLINE">Online</SelectItem>
                                                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase text-amber-800 font-semibold">Reference</Label>
                                            <Input
                                                placeholder="Transaction ID"
                                                value={multiPayReference}
                                                onChange={e => setMultiPayReference(e.target.value)}
                                                className="bg-white border-amber-200 h-9"
                                            />
                                        </div>
                                    </div>

                                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {multiPayMonths.map((opt, idx) => (
                                            <div key={`${opt.month}-${opt.year}`} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${opt.selected ? 'bg-amber-100/50 border-amber-300 shadow-sm' : 'bg-white border-transparent hover:border-amber-200'}`}>
                                                <Checkbox
                                                    checked={opt.selected}
                                                    onCheckedChange={(c) => handleMultiSelect(idx, c as boolean)}
                                                    id={`multi-${idx}`}
                                                    className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                                                />
                                                <div className="flex-1">
                                                    <label htmlFor={`multi-${idx}`} className="text-sm font-medium cursor-pointer block text-gray-900">
                                                        {opt.label}
                                                    </label>
                                                    <div className="text-[10px] text-gray-400 font-mono">
                                                        Due: ₹{opt.amount}
                                                    </div>
                                                </div>
                                                <div className="relative w-24">
                                                    <span className="absolute left-2 top-1.5 text-xs text-gray-400">₹</span>
                                                    <Input
                                                        type="number"
                                                        className="h-7 text-right pl-5 bg-white/50"
                                                        value={opt.amount}
                                                        onChange={e => {
                                                            const newMonths = [...multiPayMonths];
                                                            newMonths[idx].amount = parseFloat(e.target.value) || 0;
                                                            setMultiPayMonths(newMonths);
                                                            setMultiTotal(newMonths.filter(m => m.selected).reduce((sum, m) => sum + m.amount, 0));
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-white/80 backdrop-blur sticky bottom-0 z-20">
                        {activeTab === 'multi' ? (
                            <div className="flex justify-between items-center gap-4">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-gray-400">Total Selection</div>
                                    <div className="text-2xl font-serif text-amber-900">₹{multiTotal.toLocaleString('en-IN')}</div>
                                </div>
                                <Button onClick={handleMultiPaySubmit} disabled={loading || multiTotal <= 0} className="flex-1 bg-amber-900 text-white hover:bg-amber-800 h-12 text-lg font-medium shadow-lg shadow-amber-900/20">
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : `Pay ₹${multiTotal}`}
                                </Button>
                            </div>
                        ) : (
                            <DrawerClose asChild>
                                <Button variant="outline" className="w-full h-12 text-gray-500 hover:text-gray-900">Close Drawer</Button>
                            </DrawerClose>
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
