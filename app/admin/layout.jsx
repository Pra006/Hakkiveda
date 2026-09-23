import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminShell from "@/components/admin/layout/AdminShell";

export const metadata = { title: "Admin — Hakkiveda" };

export default async function AdminLayout({ children }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/admin");

  const admin = await prisma.adminUser.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { firstName: true, lastName: true, email: true, image: true } } },
  });

  if (!admin?.isActive) redirect("/");

  return (
    <AdminShell
      admin={{
        id: admin.id,
        role: admin.role,
        name: [admin.user.firstName, admin.user.lastName].filter(Boolean).join(" ") || admin.user.email,
        email: admin.user.email,
        image: admin.user.image,
      }}
    >
      {children}
    </AdminShell>
  );
}
