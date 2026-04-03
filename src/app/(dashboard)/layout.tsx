import { AppShell } from "@/components/layout/app-shell";
import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerAuthSession();

  return (
    <AppShell
      currentRole={session.role}
      currentUsername={session.username}
      currentDisplayRole={session.displayRole}
    >
      {children}
    </AppShell>
  );
}

