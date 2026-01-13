import { ReactNode, useState } from "react";
import Topbar from "@/react-app/components/Topbar";
import LeftNav from "@/react-app/components/LeftNav";
import { CommandPalette } from "@/react-app/components/CommandPalette";
import { useCommandPalette } from "@/react-app/hooks/useCommandPalette";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isOpen, close } = useCommandPalette();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <Topbar onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <div className="flex">
        <LeftNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-64px)] w-full overflow-x-hidden">
          {children}
        </main>
      </div>
      <CommandPalette isOpen={isOpen} onClose={close} />
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
