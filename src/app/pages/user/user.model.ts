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
  | "user:delete"
  | "user:permissions:edit";

export type UserItem = {
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
  if (Array.isArray(source?.permissions)) {
    return Array.from(
      new Set(
        source.permissions.filter((permission: string) =>
          ALL_PERMISSIONS.includes(permission as Permission)
        )
      )
    ) as Permission[];
  }

  return [];
}

export function hasPermission(
  user: UserItem | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false;

  const permissions = normalizePermissions(user);
  return permissions.includes(permission);
}

export function hasAnyPermission(
  user: UserItem | null | undefined,
  permissionsToCheck: Permission[]
): boolean {
  if (!user) return false;

  const permissions = normalizePermissions(user);
  return permissionsToCheck.some((permission) =>
    permissions.includes(permission)
  );
}