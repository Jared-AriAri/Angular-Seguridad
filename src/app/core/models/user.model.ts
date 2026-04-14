export type Permission =
  | "admin"
  | "home:view"
  | "profile:view"
  | "group:view"
  | "group:manage"
  | "group:create"
  | "group:edit"
  | "group:delete"
  | "group:members"
  | "ticket:view"
  | "ticket:create"
  | "ticket:edit"
  | "ticket:delete"
  | "ticket:comment"
  | "ticket:assign"
  | "user:view"
  | "user:create"
  | "user:edit"
  | "user:delete"
  | "user:permissions:edit";

export type UserItem = {
  id: string;
  username: string;
  password: string;
  email: string;
  fullName: string;
  address: string;
  phone: string;
  birthDate: string;
  createdAt: string;
  permissions: Permission[];
};

export const ALL_PERMISSIONS: Permission[] = [
  "admin",
  "home:view",
  "profile:view",
  "group:view",
  "group:manage",
  "group:create",
  "group:edit",
  "group:delete",
  "group:members",
  "ticket:view",
  "ticket:create",
  "ticket:edit",
  "ticket:delete",
  "ticket:comment",
  "ticket:assign",
  "user:view",
  "user:create",
  "user:edit",
  "user:delete",
  "user:permissions:edit",
];

export const MEMBER_DEFAULT_PERMISSIONS: Permission[] = [
  "home:view",
  "profile:view",
  "group:view",
  "ticket:view",
  "ticket:create",
  "ticket:comment",
];

export const ADMIN_DEFAULT_PERMISSIONS: Permission[] = [
  "home:view",
  "profile:view",
  "group:view",
  "group:manage",
  "group:create",
  "group:edit",
  "group:delete",
  "group:members",
  "ticket:view",
  "ticket:create",
  "ticket:edit",
  "ticket:delete",
  "ticket:comment",
  "ticket:assign",
  "user:view",
  "user:create",
  "user:edit",
  "user:delete",
];

export function normalizePermissions(source: any): Permission[] {
  const perms = Array.isArray(source?.permissions) ? source.permissions : [];
  return Array.from(
    new Set(
      perms.filter((p: string) => ALL_PERMISSIONS.includes(p as Permission))
    )
  ) as Permission[];
}

export function hasPermission(
  user: UserItem | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false;
  const permissions = normalizePermissions(user);
  return permissions.includes("admin") || permissions.includes(permission);
}

export function hasAnyPermission(
  user: UserItem | null | undefined,
  permissionsToCheck: Permission[]
): boolean {
  if (!user) return false;
  const permissions = normalizePermissions(user);
  return permissions.includes("admin") || permissionsToCheck.some((p) => permissions.includes(p));
}