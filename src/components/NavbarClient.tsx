"use client";

import Link from "next/link";
import { GoldenButton } from "./ui/premium-components";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface ModuleLinkInfo {
    id: string;
    path: string;
    label: string | null;
}

interface ModuleInfo {
    id: string;
    name: string;
    links: ModuleLinkInfo[];
    icon: string | null;
}

interface NavbarClientProps {
    session: any;
    userModules: ModuleInfo[];
}

export function NavbarClient({ session, userModules }: NavbarClientProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showAdminMenu, setShowAdminMenu] = useState(false);

    const links = [
        { href: "/", label: "Home" },
        { href: "/events", label: "Calendar" },
        { href: "/menu", label: "Menu" },
        { href: "/our-events", label: "Blogs" },
        { href: "/khidmat", label: "Khidmat Invitation" },
    ];

    const role = session?.user?.role;
    const isAdmin = role === "ADMIN";

    // Any logged-in user with modules gets access panel
    const hasModuleAccess = isAdmin || userModules.length > 0;

    // For ADMIN, show all default modules; for others, use their granted modules
    const displayModules = userModules;

    const getIcon = (iconName: string | null) => {
        if (!iconName) return <LucideIcons.FileText className="w-4 h-4" />;

        // Dynamically access the icon from the library
        // We cast to any because accessing by string index isn't strictly typed on the namespace import
        const IconComponent = (LucideIcons as any)[iconName];

        if (IconComponent) {
            return <IconComponent className="w-4 h-4" />;
        }

        // Fallback default
        return <LucideIcons.FileText className="w-4 h-4" />;
    };


    // Get the primary link for a module (first link or the one without label)
    const getPrimaryLink = (module: ModuleInfo): string | null => {
        if (module.links.length === 0) return null;
        return module.links[0].path;
    };

    return (
        <header className="sticky top-0 z-50 w-full shadow-lg">
            <nav className="bg-gradient-to-r from-primary to-primary-dark backdrop-blur-md border-b border-gold/30 px-4 md:px-8 py-4 flex items-center justify-between text-white w-full">

                {/* 1. Logo Section */}
                <Link href="/" className="flex items-center gap-3 shrink-0">
                    <img src="/logo-no-bg.png" alt="SEZ" className="h-10 w-auto brightness-0 invert" />
                    <div className="flex flex-col">
                        <span className="font-serif font-bold text-lg leading-none hover:text-gold transition-colors">SEZ</span>
                        <span className="text-[10px] tracking-widest text-gold opacity-80 uppercase hidden sm:block">Secunderabad</span>
                    </div>
                </Link>

                {/* 2. Desktop Links - Standard Flex */}
                <div className="hidden md:flex items-center gap-6 lg:gap-8 mx-auto">
                    {links.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium hover:text-gold transition-colors whitespace-nowrap uppercase tracking-wider"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* 3. Right Section - CTA & Auth */}
                <div className="hidden md:flex items-center gap-4 shrink-0 relative">
                    {hasModuleAccess ? (
                        <div className="relative group">
                            <button
                                onClick={() => setShowAdminMenu(!showAdminMenu)}
                                className="flex items-center gap-2 text-sm font-bold text-gold hover:text-cream transition-colors"
                            >
                                {isAdmin ? "Admin Panel" : "My Access"} <ChevronDown className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute top-full right-0 mt-4 w-72 bg-white rounded-xl shadow-xl border border-gold/20 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                                <div className="max-h-[75vh] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                    {/* Profile link for all logged-in users */}
                                    {session && (
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-gold/10 hover:text-primary-dark rounded-lg"
                                        >
                                            <User className="w-4 h-4" /> My Profile
                                        </Link>
                                    )}

                                    {/* Hardcoded New Feature Links (Accessible to all logged in users) */}
                                    {session && (
                                        <>
                                            <Link
                                                href="/admin/team"
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-gold/10 hover:text-primary-dark rounded-lg"
                                            >
                                                <LucideIcons.Users className="w-4 h-4" /> My Team
                                            </Link>
                                            <Link
                                                href="/admin/my-attendance-history"
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-gold/10 hover:text-primary-dark rounded-lg"
                                            >
                                                <LucideIcons.CalendarCheck className="w-4 h-4" /> My Attendance
                                            </Link>
                                            <Link
                                                href="/admin/contributions"
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-gold/10 hover:text-primary-dark rounded-lg"
                                            >
                                                <LucideIcons.Wallet className="w-4 h-4" /> Contributions
                                            </Link>
                                            <Link
                                                href="/admin/contribution-history"
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-gold/10 hover:text-primary-dark rounded-lg"
                                            >
                                                <LucideIcons.History className="w-4 h-4" /> Transactions
                                            </Link>
                                        </>
                                    )}

                                    {displayModules.length > 0 && <div className="h-px bg-neutral-100 my-1" />}

                                    {displayModules.map((module) => {
                                        const primaryLink = getPrimaryLink(module);
                                        if (!primaryLink) return null;

                                        // If module has multiple links, show sub-items
                                        if (module.links.length > 1) {
                                            return (
                                                <div key={module.id} className="space-y-0.5">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                                        {getIcon(module.icon)} {module.name}
                                                    </div>
                                                    {module.links.map((link) => (
                                                        <Link
                                                            key={link.id}
                                                            href={link.path}
                                                            className="flex items-center gap-2 px-3 py-2 pl-9 text-sm text-neutral-700 hover:bg-gold/10 hover:text-primary-dark rounded-lg"
                                                        >
                                                            {link.label || link.path}
                                                        </Link>
                                                    ))}
                                                </div>
                                            );
                                        }

                                        // Single link module
                                        return (
                                            <Link
                                                key={module.id}
                                                href={primaryLink}
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-gold/10 hover:text-primary-dark rounded-lg"
                                            >
                                                {getIcon(module.icon)} {module.name}
                                            </Link>
                                        );
                                    })}

                                    <div className="h-px bg-neutral-100 my-1" />
                                    <button
                                        onClick={() => signOut()}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left"
                                    >
                                        <LogOut className="w-4 h-4" /> Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : session ? (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/profile"
                                className="text-sm font-medium text-gold hover:text-cream transition-colors"
                            >
                                Profile
                            </Link>
                            <button
                                onClick={() => signOut()}
                                className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link href="/login" className="text-sm font-medium hover:text-gold transition-colors whitespace-nowrap">
                            Login
                        </Link>
                    )}

                    <Link href="/join">
                        <GoldenButton className="px-6 py-2 text-sm whitespace-nowrap">
                            Join Us
                        </GoldenButton>
                    </Link>
                </div>

                {/* Mobile Menu Toggle - Sheet Trigger */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <button className="md:hidden text-gold shrink-0 ml-auto">
                            <Menu className="w-6 h-6" />
                        </button>
                    </SheetTrigger>

                    <SheetContent side="right" className="bg-primary-dark border-l border-gold/20 p-0 w-[300px] sm:w-[350px]">
                        <div className="flex flex-col h-full overflow-y-auto">
                            {/* Header */}
                            <div className="p-6 border-b border-gold/10">
                                <div className="flex items-center gap-3">
                                    <img src="/logo-no-bg.png" alt="SEZ" className="h-8 w-auto brightness-0 invert" />
                                    <span className="font-serif font-bold text-lg text-white">SEZ <span className="text-gold text-xs block font-sans tracking-widest font-normal">Secunderabad</span></span>
                                </div>
                            </div>

                            {/* Links Container */}
                            <div className="flex-1 px-6 py-6 flex flex-col gap-6">
                                <div className="space-y-4">
                                    {links.map(link => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsOpen(false)}
                                            className="block text-lg font-medium text-white hover:text-gold transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-gold/10 w-full" />

                                {/* Auth / User Links */}
                                <div className="space-y-4">
                                    {session && (
                                        <Link
                                            href="/profile"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 text-lg font-medium text-gold hover:text-cream transition-colors"
                                        >
                                            <User className="w-5 h-5" /> My Profile
                                        </Link>
                                    )}

                                    {session && (
                                        <div className="pl-4 space-y-3 border-l border-gold/10 ml-2">
                                            <Link
                                                href="/admin/team"
                                                onClick={() => setIsOpen(false)}
                                                className="block text-base font-medium text-white/80 hover:text-gold transition-colors"
                                            >
                                                My Team
                                            </Link>
                                            <Link
                                                href="/admin/my-attendance-history"
                                                onClick={() => setIsOpen(false)}
                                                className="block text-base font-medium text-white/80 hover:text-gold transition-colors"
                                            >
                                                My Attendance
                                            </Link>
                                            <Link
                                                href="/admin/contributions"
                                                onClick={() => setIsOpen(false)}
                                                className="block text-base font-medium text-white/80 hover:text-gold transition-colors"
                                            >
                                                Contributions
                                            </Link>
                                            <Link
                                                href="/admin/contribution-history"
                                                onClick={() => setIsOpen(false)}
                                                className="block text-base font-medium text-white/80 hover:text-gold transition-colors"
                                            >
                                                Transactions
                                            </Link>
                                        </div>
                                    )}

                                    {hasModuleAccess && (
                                        <div className="space-y-3">
                                            <p className="text-xs font-bold text-gold/50 uppercase tracking-widest">
                                                {isAdmin ? "Admin Access" : "My Access"}
                                            </p>

                                            <div className="space-y-1">
                                                {displayModules.map((module) => {
                                                    const primaryLink = getPrimaryLink(module);
                                                    if (!primaryLink) return null;

                                                    if (module.links.length > 1) {
                                                        return (
                                                            <div key={module.id} className="mb-3">
                                                                <p className="flex items-center gap-2 text-sm text-white/60 mb-1">
                                                                    {getIcon(module.icon)} {module.name}
                                                                </p>
                                                                <div className="pl-6 border-l border-gold/10 space-y-1">
                                                                    {module.links.map((link) => (
                                                                        <Link
                                                                            key={link.id}
                                                                            href={link.path}
                                                                            onClick={() => setIsOpen(false)}
                                                                            className="block py-1 text-sm text-white/80 hover:text-gold"
                                                                        >
                                                                            {link.label || link.path}
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <Link
                                                            key={module.id}
                                                            href={primaryLink}
                                                            onClick={() => setIsOpen(false)}
                                                            className="flex items-center gap-2 py-2 text-sm text-white/80 hover:text-gold"
                                                        >
                                                            {getIcon(module.icon)} {module.name}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-gold/10 space-y-3 bg-black/20">
                                {session ? (
                                    <button
                                        onClick={() => signOut()}
                                        className="w-full flex items-center justify-center gap-2 py-3 text-red-400 font-bold border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" /> Logout
                                    </button>
                                ) : (
                                    <Link href="/login" onClick={() => setIsOpen(false)} className="w-full block">
                                        <button className="w-full py-3 text-center text-gold font-bold border border-gold/30 rounded-lg hover:bg-gold/10 transition-colors">
                                            Login
                                        </button>
                                    </Link>
                                )}

                                <Link href="/join" onClick={() => setIsOpen(false)} className="w-full block">
                                    <GoldenButton className="w-full justify-center">Join Committee</GoldenButton>
                                </Link>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </nav>
        </header>

    );
}