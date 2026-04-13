import { AppShell } from "@/components/layout/app-shell";
import { getBrandingResource } from "@/lib/api/branding";
import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, brandingResult] = await Promise.all([
    getServerAuthSession(),
    getBrandingResource(),
  ]);

  return (
    <AppShell
      currentRole={session.role}
      currentUsername={session.username}
      currentDisplayRole={session.displayRole}
      branding={brandingResult.data}
    >
      {children}
    </AppShell>
  );
}

