'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Folders, Building2, ShieldAlert, Activity } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Organizations', href: '/dashboard/organizations', icon: Building2 },
    { name: 'Projects', href: '/dashboard/projects', icon: Folders },
    { name: 'Suppliers', href: '/dashboard/suppliers', icon: Users },
    { name: 'Fraud Signals', href: '/dashboard/fraud-signals', icon: ShieldAlert },
    { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: Activity },
  ];

  return (
    <aside className="hidden w-64 flex-col border-r bg-muted/40 md:flex">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">SurveyOS</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href as React.ComponentProps<typeof Link>['href']}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  isActive ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
