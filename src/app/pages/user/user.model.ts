export type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};