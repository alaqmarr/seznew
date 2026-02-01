"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { slugify, getHallModuleId } from "@/lib/utils";

// ============ Module Actions ============

interface ModuleLinkInput {
  path: string;
  label?: string;
  order?: number;
}

export async function createModule(data: {
  name: string;
  links: ModuleLinkInput[];
  description?: string;
  icon?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const moduleId = slugify(data.name);

  try {
    const module = await prisma.module.create({
      data: {
        id: moduleId,
        name: data.name,
        description: data.description || null,
        icon: data.icon || null,
        links: {
          create: data.links.map((link, index) => ({
            path: link.path,
            label: link.label || null,
            order: link.order ?? index,
          })),
        },
      },
      include: { links: true },
    });
    revalidatePath("/admin/modules");
    return { success: true, module };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Module with this name already exists" };
    }
    console.error("Failed to create module:", error);
    return { success: false, error: "Failed to create module" };
  }
}

export async function deleteModule(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.module.delete({ where: { id } });
    revalidatePath("/admin/modules");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete module:", error);
    return { success: false, error: "Failed to delete module" };
  }
}

export async function updateModule(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    icon?: string | null;
    links?: ModuleLinkInput[];
  },
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // If links are provided, delete existing and recreate
    if (data.links) {
      await prisma.moduleLink.deleteMany({ where: { moduleId: id } });
      await prisma.moduleLink.createMany({
        data: data.links.map((link, index) => ({
          moduleId: id,
          path: link.path,
          label: link.label || null,
          order: link.order ?? index,
        })),
      });
    }

    // Update module fields
    await prisma.module.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
      },
    });

    revalidatePath("/admin/modules");
    return { success: true };
  } catch (error) {
    console.error("Failed to update module:", error);
    return { success: false, error: "Failed to update module" };
  }
}

// ============ Module Link Actions ============

export async function addModuleLink(moduleId: string, link: ModuleLinkInput) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const newLink = await prisma.moduleLink.create({
      data: {
        moduleId,
        path: link.path,
        label: link.label || null,
        order: link.order ?? 0,
      },
    });
    revalidatePath("/admin/modules");
    return { success: true, link: newLink };
  } catch (error) {
    console.error("Failed to add link:", error);
    return { success: false, error: "Failed to add link" };
  }
}

export async function deleteModuleLink(linkId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.moduleLink.delete({ where: { id: linkId } });
    revalidatePath("/admin/modules");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete link:", error);
    return { success: false, error: "Failed to delete link" };
  }
}

// ============ User Module Access Actions ============

export async function grantModuleAccess(userId: string, moduleId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.userModuleAccess.create({
      data: { userId, moduleId },
    });
    revalidatePath(`/admin/manage-access/${userId}`);
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Access already granted" };
    }
    console.error("Failed to grant access:", error);
    return { success: false, error: "Failed to grant access" };
  }
}

export async function revokeModuleAccess(userId: string, moduleId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.userModuleAccess.deleteMany({
      where: { userId, moduleId },
    });
    revalidatePath(`/admin/manage-access/${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to revoke access:", error);
    return { success: false, error: "Failed to revoke access" };
  }
}

export async function updateUserModules(userId: string, moduleIds: string[]) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Delete all existing access
    await prisma.userModuleAccess.deleteMany({
      where: { userId },
    });

    // Create new access records
    if (moduleIds.length > 0) {
      await prisma.userModuleAccess.createMany({
        data: moduleIds.map((moduleId) => ({ userId, moduleId })),
      });
    }

    revalidatePath(`/admin/manage-access/${userId}`);
    revalidatePath("/admin/manage-access");
    return { success: true };
  } catch (error) {
    console.error("Failed to update user modules:", error);
    return { success: false, error: "Failed to update modules" };
  }
}

// ============ Hall Module Generator ============

export async function getHallModuleStatus() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return [];
  }

  const halls = await prisma.hall.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });

  const modules = await prisma.module.findMany({
    where: { id: { startsWith: "hall-" } },
    select: { id: true, name: true },
  });

  const existingModuleIds = new Set(modules.map((m) => m.id));

  return halls.map((h) => {
    const moduleId = getHallModuleId(h.name);
    const exists = existingModuleIds.has(moduleId);
    return {
      hallName: h.name,
      moduleId,
      exists,
      existingName: exists
        ? modules.find((m) => m.id === moduleId)?.name || null
        : null,
    };
  });
}

export async function createHallModule(hallName: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const moduleId = getHallModuleId(hallName);

  try {
    // Check if exists
    const exists = await prisma.module.findUnique({ where: { id: moduleId } });
    if (exists) {
      return { success: false, error: "Module already exists" };
    }

    await prisma.module.create({
      data: {
        id: moduleId,
        name: `Manage ${hallName}`, // e.g. "Manage 1st Floor"
        description: `Access to update thaal counts for ${hallName}`,
        icon: "Utensils", // Default icon
        links: {
          // No specific link for this module, it's a permission module?
          // Ore maybe it links to /menu?
          // Usually these are just permission flags.
          // But our schema requires links?
          // Let's check schema. Link is optional relation?
          // links ModuleLink[]
          // It's a relation, so it can be empty.
          create: [],
        },
      },
    });

    revalidatePath("/admin/modules");
    return { success: true };
  } catch (error) {
    console.error("Failed to create hall module:", error);
    return { success: false, error: "Failed to create hall module" };
  }
}
