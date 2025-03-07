"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, Image, Key, LogOut, Menu, Settings, User } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    ...(process.env.SAAS_MODE === "false"
      ? [{ name: "Dashboard", href: "/dashboard", icon: Home }]
      : []),
    { name: "Projects", href: "/dashboard/projects", icon: Image },
    { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
    // { name: "Settings", href: "/dashboard/settings", icon: Settings },
    // { name: "Profile", href: "/dashboard/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold">ResizeIt</h1>
            <p className="text-sm text-gray-500">Image Resizing Service</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/auth/sign-out">
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </Link>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`lg:ml-64 transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "ml-64" : "ml-0"
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
