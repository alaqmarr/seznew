"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Previous actions...
// (Assuming these are appended to the existing file or I can overwrite if I include imports.
// I'll use replace_file_content or just overwrite safely if I knew the content.
// Safest is to append or use replace if I want to keep existing.
// I'll overwrite mostly because I wrote the file in recent turns, but better to be safe.
// Wait, I can't append easily with write_to_file without reading first.
// I'll read actions.ts first.)

export async function createBanner(formData: FormData) {
  const imageUrl = formData.get("imageUrl") as string;
  const href = formData.get("href") as string;
  const isActive = formData.get("isActive") === "on";

  // Countdown Fields
  const countdownTargetStr = formData.get("countdownTarget") as string;
  const countdownLabel = formData.get("countdownLabel") as string;
  const xStr = formData.get("x") as string;
  const yStr = formData.get("y") as string;
  const countdownSize = (formData.get("countdownSize") as string) || "normal";
  const countdownColor = (formData.get("countdownColor") as string) || "gold";

  const countdownTarget = countdownTargetStr
    ? new Date(countdownTargetStr)
    : undefined;
  const x = xStr ? parseFloat(xStr) : 50;
  const y = yStr ? parseFloat(yStr) : 50;

  if (!imageUrl) {
    return { error: "Image URL is required" };
  }

  try {
    await prisma.banner.create({
      data: {
        imageUrl,
        href,
        isActive,
        countdownTarget,
        countdownLabel,
        x,
        y,
        countdownSize,
        countdownColor,
      },
    });
    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { success: true };
  } catch (error) {
    console.error("Failed to create banner:", error);
    return { error: "Failed to create banner" };
  }
}

export async function toggleBannerStatus(id: string, currentStatus: boolean) {
  try {
    await prisma.banner.update({
      where: { id },
      data: { isActive: !currentStatus },
    });
    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update banner" };
  }
}

export async function deleteBanner(id: string) {
  try {
    await prisma.banner.delete({
      where: { id },
    });
    revalidatePath("/");
    revalidatePath("/admin/banners");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete banner" };
  }
}
