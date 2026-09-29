import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import FeedbackForm from "@/components/account/FeedbackForm";

export const metadata = { title: "Give Feedback" };

export default async function FeedbackPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/account/feedback");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, firstName: true, lastName: true, email: true },
  });

  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.name || "";

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-headline text-2xl sm:text-3xl text-forest-deep">Give Feedback</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          We read every message. Tell us how we are doing.
        </p>
      </div>
      <FeedbackForm userName={userName} userEmail={user?.email || ""} />
    </div>
  );
}
