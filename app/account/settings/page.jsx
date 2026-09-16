import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Icon from "@/components/ui/Icon";
import ProfileForm from "@/components/account/ProfileForm";
import PasswordForm from "@/components/account/PasswordForm";

export const metadata = { title: "Account Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/account/settings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      hashedPassword: true,
      image: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/auth/login");

  const hasPassword = !!user.hashedPassword;
  const googleAccount = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
    select: { id: true },
  });
  const hasGoogle = !!googleAccount;

  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline text-2xl sm:text-3xl text-forest-deep">Account Settings</h1>
        <p className="text-sm text-on-surface-variant mt-1">Manage your profile and security</p>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/40">
            <div className="w-9 h-9 rounded-lg bg-forest-base/10 flex items-center justify-center">
              <Icon name="person" size={18} className="text-forest-base" />
            </div>
            <div>
              <h2 className="font-semibold text-forest-deep">Profile</h2>
              <p className="text-xs text-on-surface-variant">Update your personal information</p>
            </div>
          </div>
          <div className="px-5 py-5">
            <ProfileForm
              initialData={{
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email,
                phone: user.phone || "",
              }}
              image={user.image}
            />
          </div>
        </section>

        {/* Security */}
        <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/40">
            <div className="w-9 h-9 rounded-lg bg-antique-gold/10 flex items-center justify-center">
              <Icon name="lock" size={18} className="text-antique-gold" />
            </div>
            <div>
              <h2 className="font-semibold text-forest-deep">Security</h2>
              <p className="text-xs text-on-surface-variant">
                {hasGoogle && !hasPassword
                  ? "You signed in with Google"
                  : "Change your password"}
              </p>
            </div>
          </div>
          <div className="px-5 py-5">
            {hasGoogle && !hasPassword ? (
              <div className="flex items-start gap-3 text-sm text-on-surface-variant">
                <Icon name="info" size={18} className="text-forest-base mt-0.5 shrink-0" />
                <p>
                  Your account is linked to Google. You sign in using your Google account
                  and don't have a separate password.
                </p>
              </div>
            ) : (
              <PasswordForm />
            )}
            {hasGoogle && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-outline-variant/40 text-sm text-on-surface-variant">
                <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google account connected
              </div>
            )}
          </div>
        </section>

        {/* Account info */}
        <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/40">
            <div className="w-9 h-9 rounded-lg bg-herbal-jade/10 flex items-center justify-center">
              <Icon name="info" size={18} className="text-herbal-jade" />
            </div>
            <div>
              <h2 className="font-semibold text-forest-deep">Account Info</h2>
            </div>
          </div>
          <div className="px-5 py-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Email</span>
              <span className="text-forest-deep">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Member since</span>
              <span className="text-forest-deep">{joinedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Sign-in method</span>
              <span className="text-forest-deep">
                {hasGoogle && hasPassword ? "Google + Password" : hasGoogle ? "Google" : "Password"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
