"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getAllFloors() {
  try {
    const floors = await prisma.floorConfig.findMany({
      include: {
        heads: { select: { id: true, name: true, username: true, its: true } },
        subHeads: {
          select: { id: true, name: true, username: true, its: true },
        },
        members: {
          select: { id: true, name: true, username: true, its: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return { success: true, data: floors };
  } catch (error) {
    console.error("Error fetching floors:", error);
    return { success: false, error: "Failed to fetch floors" };
  }
}

export async function createFloor(name: string) {
  try {
    const floor = await prisma.floorConfig.create({
      data: { name },
    });
    revalidatePath("/admin/floors");
    return { success: true, data: floor };
  } catch (error) {
    console.error("Error creating floor:", error);
    return { success: false, error: "Failed to create floor" };
  }
}

export async function updateFloor(id: string, name: string) {
  try {
    const floor = await prisma.floorConfig.update({
      where: { id },
      data: { name },
    });
    revalidatePath("/admin/floors");
    return { success: true, data: floor };
  } catch (error) {
    console.error("Error updating floor:", error);
    return { success: false, error: "Failed to update floor" };
  }
}

export async function deleteFloor(id: string) {
  try {
    await prisma.floorConfig.delete({
      where: { id },
    });
    revalidatePath("/admin/floors");
    return { success: true };
  } catch (error) {
    console.error("Error deleting floor:", error);
    return { success: false, error: "Failed to delete floor" };
  }
}

// Assignment Actions
// We will assign by ITS numbers (comma separated or array) for bulk operations ideally,
// but for now, let's look up a single user by ITS or Username.

export async function assignUserToFloor(
  floorId: string,
  identifier: string,
  role: "HEAD" | "SUBHEAD" | "MEMBER",
) {
  try {
    // Find user by ITS or Username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ its: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      return { success: false, error: "User not found with this ITS/Username" };
    }

    // Connect based on role
    if (role === "HEAD") {
      await prisma.floorConfig.update({
        where: { id: floorId },
        data: { heads: { connect: { id: user.id } } },
      });
    } else if (role === "SUBHEAD") {
      await prisma.floorConfig.update({
        where: { id: floorId },
        data: { subHeads: { connect: { id: user.id } } },
      });
    } else {
      await prisma.floorConfig.update({
        where: { id: floorId },
        data: { members: { connect: { id: user.id } } },
      });
    }

    revalidatePath("/admin/floors");
    return {
      success: true,
      message: `Added ${user.name || user.username} as ${role}`,
    };
  } catch (error) {
    console.error("Error assigning user:", error);
    return { success: false, error: "Failed to assign user" };
  }
}

export async function removeUserFromFloor(
  floorId: string,
  userId: string,
  role: "HEAD" | "SUBHEAD" | "MEMBER",
) {
  try {
    if (role === "HEAD") {
      await prisma.floorConfig.update({
        where: { id: floorId },
        data: { heads: { disconnect: { id: userId } } },
      });
    } else if (role === "SUBHEAD") {
      await prisma.floorConfig.update({
        where: { id: floorId },
        data: { subHeads: { disconnect: { id: userId } } },
      });
    } else {
      await prisma.floorConfig.update({
        where: { id: floorId },
        data: { members: { disconnect: { id: userId } } },
      });
    }

    revalidatePath("/admin/floors");
    return { success: true };
  } catch (error) {
    console.error("Error removing user:", error);
    return { success: false, error: "Failed to remove user" };
  }
}
