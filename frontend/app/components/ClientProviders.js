'use client';

import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import Navbar from './Navbar';

export default function ClientProviders({ children }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Navbar />
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-6">
          {children}
        </main>
      </NotificationProvider>
    </AuthProvider>
  );
}
