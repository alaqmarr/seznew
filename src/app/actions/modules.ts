"use server";

import { prisma } from "@/lib/db";
import { fetchBridgeHalls } from "@/lib/jamatevents-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { slugify, getHallModuleId } from "@/lib/utils";
import { hasModuleAccess } from "@/lib/access-control";

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
  targetUserIts?: string[];
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const trimmedName = data.name.trim();
  const moduleId =
    trimmedName.toLowerCase() === "event_charges"
      ? "event_charges"
      : slugify(trimmedName);

  try {
    const module = await prisma.$transaction(async (tx) => {
      const newModule = await tx.module.create({
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

      if (data.targetUserIts && data.targetUserIts.length > 0) {
        const users = await tx.user.findMany({
          where: { its: { in: data.targetUserIts } },
          select: { id: true },
        });

        if (users.length > 0) {
          await tx.userModuleAccess.createMany({
            data: users.map((u) => ({
              userId: u.id,
              moduleId: newModule.id,
            })),
          });
        }
      }

      return newModule;
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

export async function updateModuleLink(
  linkId: string,
  data: { path: string; label?: string; order?: number },
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const updatedLink = await prisma.moduleLink.update({
      where: { id: linkId },
      data: {
        path: data.path,
        label: data.label || null,
      },
    });
    revalidatePath("/admin/modules");
    return { success: true, link: updatedLink };
  } catch (error) {
    console.error("Failed to update link:", error);
    return { success: false, error: "Failed to update link" };
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
    await prisma.userModuleAccess.deleteMany({
      where: { userId },
    });

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

// ============ Hall Module Generator (Fetched from jamatevents) ============

export async function getHallModuleStatus() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return [];
  }

  const halls = await fetchBridgeHalls().catch((err) => {
    console.error("Failed to fetch halls from jamatevents:", err);
    return [];
  });

  const [modules, chargesMod] = await Promise.all([
    prisma.module.findMany({
      where: { id: { startsWith: "hall-" } },
      select: { id: true, name: true },
    }),
    prisma.module.findUnique({
      where: { id: "event_charges" },
      select: { id: true, name: true },
    }),
  ]);

  const existingModuleIds = new Set(modules.map((m) => m.id));

  const hallEntries = halls.map((h) => {
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

  return [
    {
      hallName: "Event Charges (OTP Access on Events Portal)",
      moduleId: "event_charges",
      exists: Boolean(chargesMod),
      existingName: chargesMod?.name || null,
    },
    ...hallEntries,
  ];
}

export async function createHallModule(hallName: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const isEventCharges =
    hallName === "event_charges" ||
    hallName.startsWith("Event Charges");
  const moduleId = isEventCharges ? "event_charges" : getHallModuleId(hallName);

  try {
    const exists = await prisma.module.findUnique({ where: { id: moduleId } });
    if (exists) {
      return { success: false, error: "Module already exists" };
    }

    await prisma.module.create({
      data: {
        id: moduleId,
        name: isEventCharges ? "Event Charges" : `Manage ${hallName}`,
        description: isEventCharges
          ? "Allow viewing, editing, and printing booking rupee charges via 6-digit email OTP on Jamaat Events"
          : `Access to update thaal counts for ${hallName}`,
        icon: isEventCharges ? "IndianRupee" : "Utensils",
        links: {
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

// ============ Access Management Helpers ============

export async function getModuleUsers(moduleId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN")
    return { success: false, error: "Unauthorized" };

  try {
    const accesslist = await prisma.userModuleAccess.findMany({
      where: { moduleId },
      include: {
        user: { select: { id: true, name: true, username: true, its: true } },
      },
    });
    return { success: true, data: accesslist.map((a) => a.user) };
  } catch (error) {
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function searchUsers(query: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  let isAuthorized = role === "ADMIN";
  if (!isAuthorized) {
    isAuthorized = await hasModuleAccess(userId, "/admin/floors");
  }

  if (!isAuthorized) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
          { its: { contains: query } },
        ],
      },
      take: 10,
      select: { id: true, name: true, username: true, its: true },
    });
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: "Failed to search users" };
  }
}
