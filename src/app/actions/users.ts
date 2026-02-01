"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Role } from "@/generated/prisma/client";
import { hasModuleAccess } from "@/lib/access-control";

// Update current user's profile
export async function updateProfile(data: {
  name?: string;
  email?: string;
  mobile?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        name: data.name || null,
        email: data.email || null,
        mobile: data.mobile || null,
      },
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Create single user (admin or users with module access)
export async function createUser(data: {
  username: string;
  password: string;
  name?: string;
  email?: string;
  mobile?: string;
  role?: Role;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).role === "ADMIN";
  const canAccess = isAdmin || (await hasModuleAccess(userId, "/admin/users"));

  if (!canAccess) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        name: data.name || null,
        email: data.email || null,
        mobile: data.mobile || null,
        role: data.role || "USER",
      },
    });

    revalidatePath("/admin/users");
    return { success: true, userId: user.id };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Username already exists" };
    }
    return { success: false, error: error.message };
  }
}

// Bulk create users (admin or users with module access)
export async function bulkCreateUsers(
  users: Array<{
    username: string;
    password: string;
    name?: string;
    email?: string;
    mobile?: string;
    role?: string;
  }>,
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized", created: 0, failed: 0 };
  }

  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).role === "ADMIN";
  const canAccess = isAdmin || (await hasModuleAccess(userId, "/admin/users"));

  if (!canAccess) {
    return { success: false, error: "Unauthorized", created: 0, failed: 0 };
  }

  let created = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      if (!user.username || !user.password) {
        failed++;
        errors.push(`Missing username or password for row`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);
      const role = [
        "ADMIN",
        "ADMIN_CUSTOM",
        "MANAGER",
        "STAFF",
        "WATCHER",
        "USER",
      ].includes(user.role || "")
        ? (user.role as Role)
        : "USER";

      await prisma.user.create({
        data: {
          username: user.username.toString().trim(),
          password: hashedPassword,
          name: user.name?.toString().trim() || null,
          email: user.email?.toString().trim() || null,
          mobile: user.mobile?.toString().trim() || null,
          role,
        },
      });
      created++;
    } catch (error: any) {
      failed++;
      if (error.code === "P2002") {
        errors.push(`Username "${user.username}" already exists`);
      } else {
        errors.push(`Error for "${user.username}": ${error.message}`);
      }
    }
  }

  revalidatePath("/admin/users");
  return { success: true, created, failed, errors: errors.slice(0, 10) };
}

// Update user role
export async function updateUserRole(userId: string, role: Role) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const currentUserId = (session.user as any).id;
  const isAdmin = (session.user as any).role === "ADMIN";
  const canAccess =
    isAdmin || (await hasModuleAccess(currentUserId, "/admin/users"));

  if (!canAccess) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/manage-access");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete user
export async function deleteUser(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const currentUserId = (session.user as any).id;
  const isAdmin = (session.user as any).role === "ADMIN";
  const canAccess =
    isAdmin || (await hasModuleAccess(currentUserId, "/admin/users"));

  if (!canAccess) {
    return { success: false, error: "Unauthorized" };
  }

  // Prevent self-deletion
  if (userId === (session.user as any).id) {
    return { success: false, error: "Cannot delete yourself" };
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get all users (for admin or authorized users)
export async function getAllUsers() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return [];
  }

  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).role === "ADMIN";
  const canAccess = isAdmin || (await hasModuleAccess(userId, "/admin/users"));

  if (!canAccess) {
    return [];
  }

  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      mobile: true,
      role: true,
      createdAt: true,
    },
  });
}
