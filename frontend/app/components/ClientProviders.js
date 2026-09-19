'use client';

import { AuthProvider } from '../context/AuthContext';
import Navbar from './Navbar';

export default function ClientProviders({ children }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-5">
        {children}
      </main>
    </AuthProvider>
  );
}
