import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { Footer } from '../components/layout/Footer';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-ivory-100 text-charcoal-900 selection:bg-maroon-200 selection:text-maroon-900 pb-16 md:pb-0">
      <PublicNavbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-in fade-in duration-200">
        <Outlet />
      </main>
      <MobileBottomNav />
      <Footer />
    </div>
  );
};
