"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Khidmat Request Actions
export async function updateKhidmatStatus(
  id: string,
  status: "APPROVED" | "REJECTED",
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.khidmatRequest.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/admin/khidmat");
    return { success: true };
  } catch (error) {
    console.error("Failed to update khidmat status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function deleteKhidmatRequest(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.khidmatRequest.delete({ where: { id } });
    revalidatePath("/admin/khidmat");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete khidmat request:", error);
    return { success: false, error: "Failed to delete request" };
  }
}

// Member Registration Actions
export async function updateMemberStatus(
  id: string,
  status: "APPROVED" | "REJECTED",
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.memberRegistration.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/admin/members");
    return { success: true };
  } catch (error) {
    console.error("Failed to update member status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function deleteMemberRegistration(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.memberRegistration.delete({ where: { id } });
    revalidatePath("/admin/members");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete member registration:", error);
    return { success: false, error: "Failed to delete registration" };
  }
}
