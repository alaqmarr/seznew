"use client";

import { AlertTriangle, X, ShieldAlert } from "lucide-react";
import { GoldenButton } from "./premium-components";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface GlobalErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    type?: "error" | "access-denied" | "warning";
}

export function GlobalErrorModal({
    isOpen,
    onClose,
    title,
    message,
    type = "access-denied"
}: GlobalErrorModalProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            document.body.style.overflow = "hidden"; // Prevent scrolling
        } else {
            const timer = setTimeout(() => setVisible(false), 200); // Wait for exit animation
            document.body.style.overflow = "unset";
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!visible && !isOpen) return null;

    const isAccessDenied = type === "access-denied";
    const displayTitle = title || (isAccessDenied ? "Action Not Allowed" : "Error Occurred");
    const displayMessage = message || (isAccessDenied ? "You do not have the required permissions to perform this action. Only administrators can use this feature." : "An unexpected error occurred.");

    return (
        <div className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200",
            isOpen ? "bg-black/60 backdrop-blur-sm opacity-100" : "bg-black/0 backdrop-blur-none opacity-0 pointer-events-none"
        )}>
            <div className={cn(
                "bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-300 transform",
                isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
            )}>
                {/* Header */}
                <div className={cn(
                    "p-6 flex flex-col items-center text-center pb-0",
                    isAccessDenied ? "text-red-900" : "text-neutral-800"
                )}>
                    <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner",
                        isAccessDenied ? "bg-red-50 text-red-500" : "bg-neutral-100 text-neutral-500"
                    )}>
                        {isAccessDenied ? <ShieldAlert className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                    </div>

                    <h3 className="text-xl font-bold font-serif">{displayTitle}</h3>
                </div>

                {/* Body */}
                <div className="p-6 pt-2 text-center">
                    <p className="text-neutral-500 leading-relaxed text-sm">
                        {displayMessage}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-center">
                    <GoldenButton
                        onClick={onClose}
                        className={cn(
                            "w-full md:w-auto min-w-[120px]",
                            isAccessDenied && "from-red-600 via-red-500 to-red-600 border-red-700 text-white shadow-red-200 hover:shadow-red-300"
                        )}
                    >
                        Okay, I Understand
                    </GoldenButton>
                </div>
            </div>
        </div>
    );
}
