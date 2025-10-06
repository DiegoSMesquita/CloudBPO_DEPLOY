import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { authState } = useAuth();

  if (!authState.isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}