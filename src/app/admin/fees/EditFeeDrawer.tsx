"use client";

import { useState, useEffect } from "react";
import {
    Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose, DrawerTrigger
} from "@/components/ui/drawer";
import { GoldenButton } from "@/components/ui/premium-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertFeeConfig, createFeeRecord, updateFeeRecord, recordPayment, getFeeRecordTransactions, revokeTransaction } from "@/app/actions/fees";
import toast from "react-hot-toast";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    children: React.ReactNode;
}

export function EditFeeDrawer({
    userId, userName, month, year, initialConfigAmount, initialRecord, children
}: EditFeeDrawerProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // State for Config
    const [configAmount, setConfigAmount] = useState(initialConfigAmount);

    // State for Record
    const [recordAmount, setRecordAmount] = useState(initialRecord?.amount || initialConfigAmount || 0);
    const [paidAmount, setPaidAmount] = useState(initialRecord?.paidAmount || 0);
    const [status, setStatus] = useState<"PENDING" | "PARTIAL" | "PAID">(initialRecord?.status || "PENDING");

    // State for Payment
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMode, setPaymentMode] = useState("CASH");
    const [paymentReference, setPaymentReference] = useState("");
    const [showManualOverride, setShowManualOverride] = useState(false);

    // State for Transactions
    const [transactions, setTransactions] = useState<any[]>([]);

    const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

    const fetchTransactions = async () => {
        if (!initialRecord?.id) return;
        const res = await getFeeRecordTransactions(initialRecord.id);
        if (res.success && res.data) {
            setTransactions(res.data);
        }
    };

    useEffect(() => {
        if (open && initialRecord?.id) {
            fetchTransactions();
        }
    }, [open, initialRecord?.id]);

    const handleRevoke = async (id: string) => {
        if (!confirm("Are you sure you want to revoke this payment?")) return;
        setLoading(true);
        try {
            const result = await revokeTransaction(id);
            if (result.success) {
                toast.success("Payment revoked");
                fetchTransactions(); // Refresh list
                router.refresh();
            } else {
                toast.error(result.error || "Failed to revoke");
            }
        } catch (error) {
            toast.error("Error revoking payment");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        setLoading(true);
        try {
            const result = await upsertFeeConfig(userId, configAmount);
            if (result.success) {
                toast.success("Default fee updated");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to update config");
            }
        } catch (error) {
            toast.error("Error updating config");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRecord = async () => {
        setLoading(true);
        let successCount = 0;

        try {
            // 1. Handle New Payment (if entered)
            if (paymentAmount > 0 && initialRecord?.id) {
                // If manually paid but no transaction, we must reset the record first so the transaction records correctly
                if (initialRecord.status === "PAID" && transactions.length === 0) {
                    await updateFeeRecord(initialRecord.id, { paidAmount: 0, status: "PENDING" });
                }

                const payResult = await recordPayment(
                    userId,
                    paymentAmount,
                    paymentMode,
                    paymentReference,
                    `Manual Entry: ${monthName} ${year}`,
                    undefined,
                    initialRecord.id
                );
                if (payResult.success) {
                    successCount++;
                } else {
                    toast.error(payResult.error || "Payment recording failed");
                }
            }

            // 2. Handle Manual Override / Create New Record
            if (showManualOverride || !initialRecord) {
                if (initialRecord) {
                    // Only update if manual override is intentionally utilized
                    // If we just recorded a payment, we shouldn't overwrite unless manual override is active
                    const result = await updateFeeRecord(initialRecord.id, {
                        amount: recordAmount,
                        paidAmount: showManualOverride ? paidAmount : undefined,
                        status: showManualOverride ? status : undefined
                    });
                    if (result.success) successCount++;
                    else toast.error("Failed to update manual details");
                } else {
                    // Create new
                    const result = await createFeeRecord(userId, month, year, recordAmount);
                    if (result.success) successCount++;
                    else toast.error("Failed to create record");
                }
            }

            if (successCount > 0 || (paymentAmount === 0 && !showManualOverride && initialRecord)) {
                toast.success("Changes saved successfully");
                setOpen(false);
                router.refresh();
                setPaymentAmount(0);
            }

        } catch (error) {
            toast.error("Error saving record");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {children}
            </DrawerTrigger>
            <DrawerContent>
                <div className="mx-auto w-full max-w-md">
                    <DrawerHeader>
                        <DrawerTitle className="text-xl text-primary-dark">Manage Fees: {userName}</DrawerTitle>
                        <DrawerDescription>
                            Configure default fees or edit the record for {monthName} {year}.
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4">
                        <Tabs defaultValue="record">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="record">{monthName} Fee</TabsTrigger>
                                <TabsTrigger value="config">Default Config</TabsTrigger>
                            </TabsList>

                            {/* Current Month Record */}
                            <TabsContent value="record" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Due Amount</Label>
                                    <Input
                                        type="number"
                                        value={recordAmount}
                                        readOnly
                                        className="bg-gray-100 text-gray-500 cursor-not-allowed"
                                        title="Cannot be edited manually"
                                    />
                                </div>

                                {initialRecord ? (
                                    <>
                                        {/* Transaction History for this Record */}
                                        <div className="space-y-2 mt-4">
                                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment History</Label>
                                            {transactions.length > 0 ? (
                                                <div className="space-y-2">
                                                    {transactions.map(tx => (
                                                        <div key={tx.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                            <div>
                                                                <div className="font-bold text-gray-900">₹{tx.amount.toLocaleString('en-IN')}</div>
                                                                <div className="text-xs text-gray-500">{tx.mode} • {new Date(tx.date).toLocaleDateString()}</div>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleRevoke(tx.id)}
                                                                disabled={loading}
                                                            >
                                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-400 italic">No payments recorded yet.</div>
                                            )}
                                        </div>

                                        {/* Payment Section - Only if not fully paid OR if transaction is missing */}
                                        {(status !== "PAID" || transactions.length === 0) && (
                                            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 mt-4 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-bold text-sm text-primary-dark">
                                                        {status === "PAID" ? "Record Missing Transaction" : "Record New Payment"}
                                                    </h4>
                                                </div>

                                                {status === "PAID" && transactions.length === 0 && (
                                                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                                                        Note: This record is marked as PAID but has no transactions. Recording a payment here will fix this discrepancy.
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Amount</Label>
                                                        <Input
                                                            type="number"
                                                            value={paymentAmount}
                                                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                                            className="bg-white"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Mode</Label>
                                                        <Select value={paymentMode} onValueChange={setPaymentMode}>
                                                            <SelectTrigger className="bg-white">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="CASH">Cash</SelectItem>
                                                                <SelectItem value="UPI">UPI</SelectItem>
                                                                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs">Reference / Note</Label>
                                                    <Input
                                                        value={paymentReference}
                                                        onChange={(e) => setPaymentReference(e.target.value)}
                                                        placeholder="Optional transaction ID..."
                                                        className="bg-white"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Manual Override Toggle */}
                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowManualOverride(!showManualOverride)}
                                                className="text-xs text-neutral-400 hover:text-neutral-600 underline"
                                            >
                                                {showManualOverride ? "Hide Manual Correction" : "Show Manual Correction (Advanced)"}
                                            </button>
                                        </div>

                                        {showManualOverride && (
                                            <div className="p-3 border border-red-100 bg-red-50 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                                                <p className="text-xs text-red-600 font-bold">⚠️ Updating these directly will NOT create a transaction log.</p>
                                                <div className="space-y-2">
                                                    <Label>Due Amount (Manual Override)</Label>
                                                    <Input
                                                        type="number"
                                                        value={recordAmount}
                                                        onChange={(e) => setRecordAmount(Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Paid Amount (Manual)</Label>
                                                    <Input
                                                        type="number"
                                                        value={paidAmount}
                                                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Status (Manual)</Label>
                                                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="PENDING">Pending</SelectItem>
                                                            <SelectItem value="PARTIAL">Partial</SelectItem>
                                                            <SelectItem value="PAID">Paid</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-sm text-neutral-500 italic py-2">
                                        Save explicitly once to initialize record before accepting payments.
                                    </div>
                                )}

                                <GoldenButton onClick={handleSaveRecord} disabled={loading} className="w-full mt-4">
                                    {loading ? <Loader2 className="animate-spin" /> : "Save Changes"}
                                </GoldenButton>
                            </TabsContent>

                            {/* Default Config */}
                            <TabsContent value="config" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Default Monthly Fee</Label>
                                    <Input
                                        type="number"
                                        value={configAmount}
                                        onChange={(e) => setConfigAmount(Number(e.target.value))}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This amount will be used when bulk generating fees for future months.
                                    </p>
                                </div>
                                <Button onClick={handleSaveConfig} disabled={loading} className="w-full mt-4">
                                    {loading ? <Loader2 className="animate-spin" /> : "Update Configuration"}
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="ghost">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
