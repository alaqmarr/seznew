"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Syncs the 'its' field to match the 'username' field for all users.
 * Useful for bulk updates or fixing data inconsistencies.
 */
export async function syncUsernameToIts() {
  try {
    // We can do this with a raw query for efficiency, or a transaction
    // Since Prisma updateMany doesn't support setting column = other_column directly easily without raw,
    // we might iterate or use executeRaw.
    // Let's use executeRaw for performance on large datasets.

    // Postgres syntax
    const count = await prisma.$executeRawUnsafe(`
            UPDATE users 
            SET its = username 
            WHERE its IS DISTINCT FROM username
        `);

    revalidatePath("/admin/users");
    revalidatePath("/admin/settings");

    return { success: true, count: Number(count) };
  } catch (error) {
    console.error("Error syncing ITS with Username:", error);
    return { success: false, error: "Failed to sync data." };
  }
}
