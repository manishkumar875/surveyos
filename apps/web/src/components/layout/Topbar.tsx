'use client';

import React from 'react';
import { clearAccessToken } from '@/lib/auth-storage';
import { LogOut } from 'lucide-react';

export function Topbar() {
  const handleLogout = () => {
    clearAccessToken();
    window.location.href = '/signin';
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <div className="flex flex-1 items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        {/* Search could go here in the future */}
        <div className="ml-auto flex-1 sm:flex-initial"></div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
