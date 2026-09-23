import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const metadata = { title: "B2B — Hakkiveda" };

export default async function B2BLayout({ children }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  // Check org membership
  const membership = await prisma.b2BOrganizationMember.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
  });

  // Approved B2B members use the normal storefront — redirect them away
  // from the portal. Only unapproved users may see the /b2b/apply page.
  if (membership) {
    redirect("/");
  }

  return <>{children}</>;
}
