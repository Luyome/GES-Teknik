import { prisma } from "@/lib/prisma";

export function getAllRoles() {
  return prisma.role.findMany({ orderBy: { name: "asc" } });
}
