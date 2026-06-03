import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import MobileNav from './MobileNav';
import TopBar from './TopBar';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <footer className="mt-8 pt-4 border-t border-border text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Busato HCM Platform. Todos os direitos reservados.
          </footer>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
