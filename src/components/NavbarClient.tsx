"use client";

import Link from "next/link";
import { GoldenButton } from "./ui/premium-components";
import { Menu, X, ChevronDown, LayoutDashboard, FileText, Users, Box, LogOut, Settings, Shield, User, Calendar, Image } from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

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
    const adminModules: ModuleInfo[] = isAdmin ? [
        { id: "banners", name: "Banners", links: [{ id: "1", path: "/admin/banners", label: null }], icon: "Image" },
        { id: "blogs", name: "Blogs", links: [{ id: "2", path: "/admin/blogs", label: null }], icon: "FileText" },
        { id: "khidmat", name: "Khidmat Requests", links: [{ id: "3", path: "/admin/khidmat", label: null }], icon: "FileText" },
        { id: "members", name: "Members", links: [{ id: "4", path: "/admin/members", label: null }], icon: "Users" },
        { id: "users", name: "Users", links: [{ id: "8", path: "/admin/users", label: null }], icon: "User" },
        { id: "inventory", name: "Inventory", links: [{ id: "5", path: "/inventory", label: null }], icon: "Box" },
        { id: "modules", name: "Modules", links: [{ id: "6", path: "/admin/modules", label: null }], icon: "Settings" },
        { id: "manage-access", name: "Manage Access", links: [{ id: "7", path: "/admin/manage-access", label: null }], icon: "Shield" },
    ] : userModules;

    const getIcon = (iconName: string | null) => {
        switch (iconName) {
            case "LayoutDashboard": return <LayoutDashboard className="w-4 h-4" />;
            case "FileText": return <FileText className="w-4 h-4" />;
            case "Users": return <Users className="w-4 h-4" />;
            case "Box": return <Box className="w-4 h-4" />;
            case "Settings": return <Settings className="w-4 h-4" />;
            case "Shield": return <Shield className="w-4 h-4" />;
            case "Image": return <Image className="w-4 h-4" />;
            case "Calendar": return <Calendar className="w-4 h-4" />;
            case "User": return <User className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
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
                            <div className="absolute top-full right-0 mt-4 w-64 bg-white rounded-xl shadow-xl border border-gold/20 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                                <div className="p-2 space-y-1">
                                    {/* Profile link for all logged-in users */}
                                    {session && (
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-gold/10 hover:text-primary-dark rounded-lg"
                                        >
                                            <User className="w-4 h-4" /> My Profile
                                        </Link>
                                    )}

                                    {adminModules.length > 0 && <div className="h-px bg-neutral-100 my-1" />}

                                    {adminModules.map((module) => {
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

                {/* Mobile Menu Toggle */}
                <button className="md:hidden text-gold shrink-0 ml-auto" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </nav>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-primary-dark/95 backdrop-blur-xl border-b border-gold/20 p-6 shadow-2xl md:hidden flex flex-col gap-4 animate-in slide-in-from-top-4 z-[60]">
                    {links.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className="text-lg font-medium text-white hover:text-gold border-b border-gold/10 pb-2"
                        >
                            {link.label}
                        </Link>
                    ))}

                    {/* Profile link for logged-in users */}
                    {session && (
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className="text-lg font-medium text-gold hover:text-cream border-b border-gold/10 pb-2"
                        >
                            My Profile
                        </Link>
                    )}

                    {hasModuleAccess && (
                        <div className="pt-2 border-t border-gold/20">
                            <p className="text-sm font-bold text-gold mb-2 uppercase tracking-wide">
                                {isAdmin ? "Admin Access" : "My Access"}
                            </p>
                            {adminModules.map((module) => {
                                const primaryLink = getPrimaryLink(module);
                                if (!primaryLink) return null;

                                if (module.links.length > 1) {
                                    return (
                                        <div key={module.id} className="mb-2">
                                            <p className="text-xs text-gold/70 uppercase tracking-wide mb-1">{module.name}</p>
                                            {module.links.map((link) => (
                                                <Link
                                                    key={link.id}
                                                    href={link.path}
                                                    onClick={() => setIsOpen(false)}
                                                    className="block py-1.5 pl-3 text-white/80 hover:text-gold"
                                                >
                                                    {link.label || link.path}
                                                </Link>
                                            ))}
                                        </div>
                                    );
                                }

                                return (
                                    <Link
                                        key={module.id}
                                        href={primaryLink}
                                        onClick={() => setIsOpen(false)}
                                        className="block py-2 text-white/80 hover:text-gold"
                                    >
                                        {module.name}
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    <div className="pt-2 flex flex-col gap-3">
                        {session ? (
                            <button
                                onClick={() => signOut()}
                                className="w-full py-3 text-center text-red-400 font-bold border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                                Logout
                            </button>
                        ) : (
                            <Link href="/login" onClick={() => setIsOpen(false)} className="w-full block">
                                <button className="w-full py-3 text-center text-gold font-bold border border-gold/30 rounded-lg hover:bg-gold/10 transition-colors">
                                    Login
                                </button>
                            </Link>
                        )}

                        <Link href="/join" onClick={() => setIsOpen(false)} className="w-full block">
                            <GoldenButton className="w-full">Join Committee</GoldenButton>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
