export type Permission =
  | "home:view"
  | "profile:view"
  | "group:view"
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
  | "user:delete";

export type UserRole = "member" | "admin" | "superadmin";

export type UserItem = {
  username: string;
  password: string;
  email: string;
  fullName: string;
  address: string;
  phone: string;
  birthDate: string;
  createdAt: string;
  role: UserRole;
  permissions: Permission[];
};

export const ALL_PERMISSIONS: Permission[] = [
  "home:view",
  "profile:view",
  "group:view",
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

export const SUPERADMIN_DEFAULT_PERMISSIONS: Permission[] = [
  ...ALL_PERMISSIONS,
];

export function normalizeRole(source: any): UserRole {
  if (source?.role === "superadmin") return "superadmin";
  if (source?.role === "admin") return "admin";
  return "member";
}

export function getDefaultPermissionsByRole(role: UserRole): Permission[] {
  if (role === "superadmin") return [...SUPERADMIN_DEFAULT_PERMISSIONS];
  if (role === "admin") return [...ADMIN_DEFAULT_PERMISSIONS];
  return [...MEMBER_DEFAULT_PERMISSIONS];
}

export function normalizePermissions(source: any): Permission[] {
  if (Array.isArray(source?.permissions)) {
    return Array.from(
      new Set(
        source.permissions.filter((permission: string) =>
          ALL_PERMISSIONS.includes(permission as Permission)
        )
      )
    ) as Permission[];
  }

  const role = normalizeRole(source);
  return getDefaultPermissionsByRole(role);
}