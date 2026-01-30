"use client";

import Link from "next/link";
import { GoldenButton } from "./ui/premium-components";
import { Menu, X, ChevronDown, LayoutDashboard, FileText, Users, Box, LogOut } from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

interface NavbarClientProps {
    session: any; // Using any for rough typing, strictly should be Session | null
}

export function NavbarClient({ session }: NavbarClientProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showAdminMenu, setShowAdminMenu] = useState(false);

    const links = [
        { href: "/", label: "Home" },
        { href: "/events", label: "Calendar" },
        { href: "/menu", label: "Menu" },
        { href: "/our-events", label: "Blogs" },
        { href: "/khidmat", label: "Khidmat Invitation" },
    ];

    const isAdmin = session?.user?.role === "ADMIN";

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
                    {isAdmin ? (
                        <div className="relative group">
                            <button
                                onClick={() => setShowAdminMenu(!showAdminMenu)}
                                className="flex items-center gap-2 text-sm font-bold text-gold hover:text-cream transition-colors"
                            >
                                Admin Panel <ChevronDown className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute top-full right-0 mt-4 w-56 bg-white rounded-xl shadow-xl border border-gold/20 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                                <div className="p-2 space-y-1">
                                    <Link href="/admin/banners" className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-gold/10 hover:text-primary-dark rounded-lg">
                                        <LayoutDashboard className="w-4 h-4" /> Banners
                                    </Link>
                                    <Link href="/admin/blogs" className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-gold/10 hover:text-primary-dark rounded-lg">
                                        <FileText className="w-4 h-4" /> Blogs
                                    </Link>
                                    <Link href="/admin/khidmat" className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-gold/10 hover:text-primary-dark rounded-lg">
                                        <FileText className="w-4 h-4" /> Khidmat Requests
                                    </Link>
                                    <Link href="/admin/members" className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-gold/10 hover:text-primary-dark rounded-lg">
                                        <Users className="w-4 h-4" /> Members
                                    </Link>
                                    <Link href="/inventory" className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-gold/10 hover:text-primary-dark rounded-lg">
                                        <Box className="w-4 h-4" /> Inventory
                                    </Link>
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

                    {isAdmin && (
                        <div className="pt-2 border-t border-gold/20">
                            <p className="text-sm font-bold text-gold mb-2 uppercase tracking-wide">Admin Access</p>
                            <Link href="/admin/banners" onClick={() => setIsOpen(false)} className="block py-2 text-white/80 hover:text-gold">Banners</Link>
                            <Link href="/admin/blogs" onClick={() => setIsOpen(false)} className="block py-2 text-white/80 hover:text-gold">Blogs</Link>
                            <Link href="/admin/khidmat" onClick={() => setIsOpen(false)} className="block py-2 text-white/80 hover:text-gold">Khidmat Requests</Link>
                            <Link href="/admin/members" onClick={() => setIsOpen(false)} className="block py-2 text-white/80 hover:text-gold">Members</Link>
                            <Link href="/inventory" onClick={() => setIsOpen(false)} className="block py-2 text-white/80 hover:text-gold">Inventory</Link>
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
