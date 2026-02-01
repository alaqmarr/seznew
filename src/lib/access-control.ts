import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface ModuleInfo {
  id: string;
  name: string;
  path: string | null; // Path is optional - modules can be for components
  elementId: string | null;
  icon: string | null;
}

/**
 * Check if a user has access to a specific module by path
 */
export async function hasModuleAccess(
  userId: string,
  path: string,
): Promise<boolean> {
  const access = await prisma.userModuleAccess.findFirst({
    where: {
      userId,
      module: { path },
    },
  });
  return !!access;
}

/**
 * Get all modules a user has access to
 */
export async function getUserModules(userId: string): Promise<ModuleInfo[]> {
  const accessRecords = await prisma.userModuleAccess.findMany({
    where: { userId },
    include: { module: true },
  });

  return accessRecords.map((record) => ({
    id: record.module.id,
    name: record.module.name,
    path: record.module.path,
    elementId: record.module.elementId,
    icon: record.module.icon,
  }));
}

/**
 * Check if the current session can access a path
 * - ADMIN: always true
 * - ADMIN_CUSTOM: check module access
 * - Others: depends on path (public vs admin)
 */
export async function canAccessPath(path: string): Promise<boolean> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return false;
  }

  const role = (session.user as any).role;

  // ADMIN has full access
  if (role === "ADMIN") {
    return true;
  }

  // ADMIN_CUSTOM needs explicit module access
  if (role === "ADMIN_CUSTOM") {
    const userId = (session.user as any).id;
    return await hasModuleAccess(userId, path);
  }

  // Other roles: no admin access
  return false;
}

/**
 * Get modules for navbar display based on user role
 */
export async function getNavModules(): Promise<ModuleInfo[]> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return [];
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  // ADMIN sees all modules
  if (role === "ADMIN") {
    const allModules = await prisma.module.findMany({
      orderBy: { name: "asc" },
    });
    return allModules.map((m) => ({
      id: m.id,
      name: m.name,
      path: m.path,
      elementId: m.elementId,
      icon: m.icon,
    }));
  }

  // ADMIN_CUSTOM sees only assigned modules
  if (role === "ADMIN_CUSTOM") {
    return await getUserModules(userId);
  }

  // Others see nothing in admin menu
  return [];
}

/**
 * Require module access or redirect
 * Use at the top of protected pages
 */
export async function requireAccess(
  path: string,
): Promise<{ authorized: boolean; userId?: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { authorized: false };
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  // ADMIN always authorized
  if (role === "ADMIN") {
    return { authorized: true, userId };
  }

  // ADMIN_CUSTOM check module
  if (role === "ADMIN_CUSTOM") {
    const hasAccess = await hasModuleAccess(userId, path);
    return { authorized: hasAccess, userId };
  }

  return { authorized: false };
}
