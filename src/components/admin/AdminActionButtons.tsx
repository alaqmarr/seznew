"use client";

import { useState } from "react";
import { Check, X, Trash2, Loader2 } from "lucide-react";
import { updateKhidmatStatus, deleteKhidmatRequest, updateMemberStatus, deleteMemberRegistration } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

interface ActionButtonsProps {
    id: string;
    currentStatus: string;
    type: "khidmat" | "member";
}

export function AdminActionButtons({ id, currentStatus, type }: ActionButtonsProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleApprove = async () => {
        setIsLoading("approve");
        const result = type === "khidmat"
            ? await updateKhidmatStatus(id, "APPROVED")
            : await updateMemberStatus(id, "APPROVED");
        if (!result.success) {
            alert(result.error);
        }
        setIsLoading(null);
    };

    const handleReject = async () => {
        setIsLoading("reject");
        const result = type === "khidmat"
            ? await updateKhidmatStatus(id, "REJECTED")
            : await updateMemberStatus(id, "REJECTED");
        if (!result.success) {
            alert(result.error);
        }
        setIsLoading(null);
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this request? This action cannot be undone.")) {
            return;
        }
        setIsLoading("delete");
        const result = type === "khidmat"
            ? await deleteKhidmatRequest(id)
            : await deleteMemberRegistration(id);
        if (!result.success) {
            alert(result.error);
        }
        setIsLoading(null);
    };

    // If already approved or rejected, show status badge with delete option
    if (currentStatus !== "PENDING") {
        return (
            <div className="flex items-center gap-2">
                <span className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                    currentStatus === "APPROVED"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-red-100 text-red-700 border border-red-200"
                )}>
                    {currentStatus}
                </span>
                <button
                    onClick={handleDelete}
                    disabled={isLoading === "delete"}
                    className="p-1.5 rounded-md hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Delete"
                >
                    {isLoading === "delete"
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                    }
                </button>
            </div>
        );
    }

    // Pending: show approve/reject buttons
    return (
        <div className="flex items-center gap-1.5">
            <button
                onClick={handleApprove}
                disabled={isLoading !== null}
                className={cn(
                    "inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all",
                    "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
            >
                {isLoading === "approve"
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Check className="w-3.5 h-3.5" />
                }
                Approve
            </button>
            <button
                onClick={handleReject}
                disabled={isLoading !== null}
                className={cn(
                    "inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all",
                    "bg-red-500 hover:bg-red-600 text-white shadow-sm",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
            >
                {isLoading === "reject"
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <X className="w-3.5 h-3.5" />
                }
                Reject
            </button>
            <button
                onClick={handleDelete}
                disabled={isLoading !== null}
                className="p-1.5 rounded-md hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
                title="Delete"
            >
                {isLoading === "delete"
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                }
            </button>
        </div>
    );
}
