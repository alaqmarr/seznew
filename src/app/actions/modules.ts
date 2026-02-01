"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Slugify helper - converts "Manage Banners" to "manage-banners"
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

// ============ Module Actions ============

export async function createModule(data: {
  name: string;
  path?: string;
  elementId?: string;
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
        path: data.path || null,
        elementId: data.elementId || null,
        description: data.description || null,
        icon: data.icon || null,
      },
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
    path?: string;
    elementId?: string | null;
    description?: string | null;
    icon?: string | null;
  },
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.module.update({
      where: { id },
      data,
    });
    revalidatePath("/admin/modules");
    return { success: true };
  } catch (error) {
    console.error("Failed to update module:", error);
    return { success: false, error: "Failed to update module" };
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
