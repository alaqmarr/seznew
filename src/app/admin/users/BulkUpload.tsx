"use client";

import { useState, useRef } from "react";
import { bulkCreateUsers } from "@/app/actions/users";
import { Upload, FileSpreadsheet, Loader2, Check, AlertCircle, Download } from "lucide-react";
import * as XLSX from "xlsx";

interface ParsedUser {
    username: string;
    password: string;
    name?: string;
    email?: string;
    mobile?: string;
    role?: string;
}

export function BulkUpload() {
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState<ParsedUser[]>([]);
    const [result, setResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setResult(null);
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

                const users: ParsedUser[] = jsonData.map((row: any) => ({
                    username: row.username?.toString() || row.Username?.toString() || "",
                    password: row.password?.toString() || row.Password?.toString() || "",
                    name: row.name?.toString() || row.Name?.toString() || "",
                    email: row.email?.toString() || row.Email?.toString() || "",
                    mobile: row.mobile?.toString() || row.Mobile?.toString() || row.phone?.toString() || row.Phone?.toString() || "",
                    role: row.role?.toString() || row.Role?.toString() || "USER",
                })).filter((u: ParsedUser) => u.username && u.password);

                setPreview(users);
            } catch (error) {
                console.error("Error parsing file:", error);
                setResult({ created: 0, failed: 0, errors: ["Failed to parse Excel file"] });
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const handleUpload = async () => {
        if (preview.length === 0) return;

        setIsLoading(true);
        const result = await bulkCreateUsers(preview);
        setResult({ created: result.created, failed: result.failed, errors: result.errors || [] });
        setPreview([]);
        setIsLoading(false);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const downloadTemplate = () => {
        const template = [
            { username: "user1", password: "pass123", name: "John Doe", email: "john@example.com", mobile: "9876543210", role: "USER" },
            { username: "user2", password: "pass456", name: "Jane Doe", email: "jane@example.com", mobile: "9876543211", role: "STAFF" },
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Users");
        XLSX.writeFile(wb, "user_upload_template.xlsx");
    };

    return (
        <div className="space-y-4">
            {/* File Input */}
            <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center hover:border-gold/50 transition-colors">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-upload"
                />
                <label
                    htmlFor="excel-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                >
                    <FileSpreadsheet className="w-10 h-10 text-neutral-400" />
                    <span className="text-sm text-neutral-600 font-medium">
                        Click to upload Excel file
                    </span>
                    <span className="text-xs text-neutral-400">
                        .xlsx or .xls files only
                    </span>
                </label>
            </div>

            {/* Download Template */}
            <button
                type="button"
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-primary hover:text-primary-dark border border-primary/20 hover:border-primary/40 rounded-lg transition-colors"
            >
                <Download className="w-4 h-4" />
                Download Template
            </button>

            {/* Preview */}
            {preview.length > 0 && (
                <div className="space-y-3">
                    <div className="p-3 bg-neutral-50 rounded-lg">
                        <p className="text-sm font-medium text-neutral-700">
                            Found {preview.length} users to import
                        </p>
                        <div className="mt-2 max-h-32 overflow-y-auto text-xs text-neutral-500 space-y-1">
                            {preview.slice(0, 5).map((u, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="font-mono">{u.username}</span>
                                    <span className="text-neutral-300">•</span>
                                    <span>{u.name || "No name"}</span>
                                    <span className="text-neutral-300">•</span>
                                    <span className="text-primary-dark">{u.role}</span>
                                </div>
                            ))}
                            {preview.length > 5 && (
                                <p className="text-neutral-400 italic">...and {preview.length - 5} more</p>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        Import {preview.length} Users
                    </button>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className={`p-3 rounded-lg text-sm ${result.created > 0 ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                    <div className="flex items-center gap-2">
                        {result.created > 0 ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className={result.created > 0 ? "text-emerald-700" : "text-red-700"}>
                            Created: {result.created} | Failed: {result.failed}
                        </span>
                    </div>
                    {result.errors.length > 0 && (
                        <div className="mt-2 text-xs text-red-600 space-y-1">
                            {result.errors.map((err, i) => (
                                <p key={i}>• {err}</p>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
