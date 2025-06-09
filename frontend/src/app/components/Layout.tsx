'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return router.push('/login');

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setProfile)
      .catch(console.error);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4 space-y-4">
        <h2 className="text-2xl font-bold mb-6">🎬 Watchlist App</h2>
        <Link className={pathname === '/dashboard' ? 'font-bold' : ''} href="/dashboard">Dashboard</Link>
        <Link className={pathname === '/search' ? 'font-bold' : ''} href="/search">Search Movies</Link>
        <Link className={pathname === '/watchlist' ? 'font-bold' : ''} href="/watchlist">My Watchlist</Link>
        <button
          onClick={() => {
            localStorage.removeItem('accessToken');
            router.push('/login');
          }}
          className="mt-4 bg-red-600 px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100">
        {profile ? children : <p>Loading profile...</p>}
      </div>
    </div>
  );
}
