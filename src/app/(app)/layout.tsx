import { requirePageUser } from '@/lib/session';
import { TopNav, BottomNav } from '@/components/Nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  return (
    <div className="app-shell">
      <TopNav email={user.email} />
      <main className="app-main">{children}</main>
      <BottomNav />
    </div>
  );
}
