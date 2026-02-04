"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

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

// New Helper to check floor access for current user
export async function getUserFloorRole(userId: string) {
  const floor = await prisma.floorConfig.findFirst({
    where: {
      OR: [
        { heads: { some: { id: userId } } },
        { subHeads: { some: { id: userId } } },
        { members: { some: { id: userId } } },
      ],
    },
    select: {
      id: true,
      heads: { select: { id: true } },
      subHeads: { select: { id: true } },
      members: { select: { id: true } },
    },
  });

  if (!floor) return null;

  const isHead = floor.heads.some((h) => h.id === userId);
  const isSubHead = floor.subHeads.some((s) => s.id === userId);
  const isMember = floor.members.some((m) => m.id === userId);

  return {
    floorId: floor.id,
    role: isHead ? "HEAD" : isSubHead ? "SUBHEAD" : "MEMBER",
  };
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
      select: { id: true, name: true, username: true, its: true },
    });

    if (!user) {
      return { success: false, error: "User not found with this ITS/Username" };
    }

    // Connect based on role
    // Validation: Members and Subheads cannot be assigned if already in a floor
    if (role === "MEMBER" || role === "SUBHEAD") {
      const existingAssignment = await prisma.floorConfig.findFirst({
        where: {
          OR: [
            { members: { some: { id: user.id } } },
            { subHeads: { some: { id: user.id } } },
          ],
        },
        select: { name: true },
      });

      if (existingAssignment) {
        return {
          success: false,
          error: `User is already assigned to floor "${existingAssignment.name}". Please remove them first.`,
        };
      }
    }

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
      user, // Return the full user object for optimistic UI
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
