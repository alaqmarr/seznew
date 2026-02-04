"use client";

import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid } from "lucide-react";
import { ModuleForm } from "./ModuleForm";

export function AddModuleDrawer() {
    const [open, setOpen] = useState(false);

    // We can pass a callback to close the drawer on success if ModuleForm supports it
    // For now assuming ModuleForm handles its own state or revalidation

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button className="bg-gold hover:bg-gold-dark text-primary-dark font-bold shadow-lg transition-all transform hover:scale-105">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Module
                </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh] bg-white/95 backdrop-blur-sm">
                <DrawerHeader className="pb-6 border-b border-neutral-100 text-left">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center text-primary-dark">
                            <LayoutGrid className="w-5 h-5" />
                        </div>
                        <div>
                            <DrawerTitle className="text-xl font-bold text-primary-dark">Add New Module</DrawerTitle>
                            <DrawerDescription className="text-xs text-neutral-500">
                                Create a new access control module and define its links.
                            </DrawerDescription>
                        </div>
                    </div>
                </DrawerHeader>

                <div className="p-6">
                    <ModuleForm onSuccess={() => setOpen(false)} />
                </div>
            </DrawerContent>
        </Drawer>
    );
}
