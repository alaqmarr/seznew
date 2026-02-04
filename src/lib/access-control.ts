import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface ModuleLinkInfo {
  id: string;
  path: string;
  label: string | null;
}

export interface ModuleInfo {
  id: string;
  name: string;
  links: ModuleLinkInfo[];
  icon: string | null;
}

/**
 * Match a dynamic route pattern against an actual path
 * Pattern: /admin/banners/[id] matches /admin/banners/abc123
 * Pattern: /admin/banners/[id]/edit matches /admin/banners/abc123/edit
 */
function matchDynamicPath(pattern: string, actualPath: string): boolean {
  const patternParts = pattern.split("/").filter(Boolean);
  const actualParts = actualPath.split("/").filter(Boolean);

  if (patternParts.length !== actualParts.length) return false;

  return patternParts.every(
    (part, i) =>
      (part.startsWith("[") && part.endsWith("]")) || part === actualParts[i],
  );
}

/**
 * Check if a user has access to a specific path via any of their module links
 */
export async function hasModuleAccess(
  userId: string,
  path: string,
): Promise<boolean> {
  // Get all module links the user has access to
  const accessRecords = await prisma.userModuleAccess.findMany({
    where: { userId },
    include: {
      module: {
        include: { links: true },
      },
    },
  });

  // Check if any link pattern matches the requested path
  for (const record of accessRecords) {
    for (const link of record.module.links) {
      // Exact match or dynamic route match
      if (link.path === path || matchDynamicPath(link.path, path)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get all modules a user has access to
 */
export async function getUserModules(userId: string): Promise<ModuleInfo[]> {
  const accessRecords = await prisma.userModuleAccess.findMany({
    where: { userId },
    include: {
      module: {
        include: {
          links: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  return accessRecords.map((record) => ({
    id: record.module.id,
    name: record.module.name,
    links: record.module.links.map((link) => ({
      id: link.id,
      path: link.path,
      label: link.label,
    })),
    icon: record.module.icon,
  }));
}

/**
 * Check if the current session can access a path
 * - ADMIN: always true for admin paths
 * - Any role with module access: check module links
 */
export async function canAccessPath(path: string): Promise<boolean> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return false;
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  // ADMIN has full access
  if (role === "ADMIN") {
    return true;
  }

  // Any other role: check module access
  return await hasModuleAccess(userId, path);
}

/**
 * Get modules for navbar display based on user role
 * - ADMIN sees all modules
 * - Any user with assigned modules sees those modules
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
      include: {
        links: { orderBy: { order: "asc" } },
      },
    });
    return allModules.map((m) => ({
      id: m.id,
      name: m.name,
      links: m.links.map((link) => ({
        id: link.id,
        path: link.path,
        label: link.label,
      })),
      icon: m.icon,
    }));
  }

  // Any role with assigned modules sees those modules
  return await getUserModules(userId);
}

/**
 * Require module access or redirect
 * Use at the top of protected pages
 */
export async function requireAccess(
  path: string,
): Promise<{ authorized: boolean; userId?: string; role?: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { authorized: false };
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  // ADMIN always authorized
  if (role === "ADMIN") {
    return { authorized: true, userId, role };
  }

  // Any role: check module access
  const hasAccess = await hasModuleAccess(userId, path);
  return { authorized: hasAccess, userId, role };
}
