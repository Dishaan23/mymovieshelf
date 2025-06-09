'use client';

import { useEffect, useState } from 'react';
import Layout from '../layout';

interface WatchlistItem {
  id: number;
  is_watched: boolean;
  movie: {
    id: number;
    tmdb_id: string;
    title: string;
    year: string;
    poster_url: string;
  };
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [error, setError] = useState('');

  const fetchWatchlist = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/watchlist/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setItems(data);
    } catch (err) {
      setError('Failed to load watchlist');
    }
  };

  const toggleWatched = async (id: number, watched: boolean) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const url = `${process.env.NEXT_PUBLIC_API_URL}/watchlist/${id}/${watched ? 'mark_unwatched' : 'mark_watched'}/`;

    try {
      await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchWatchlist();
    } catch {
      alert('Failed to update status');
    }
  };

  const removeFromWatchlist = async (id: number) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/watchlist/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchWatchlist();
    } catch {
      alert('Failed to delete item');
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">My Watchlist</h1>
      {error && <p className="text-red-500">{error}</p>}
      {items.length === 0 && <p>No movies in your watchlist yet.</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">{item.movie.title} ({item.movie.year})</h2>
            {item.movie.poster_url && (
              <img
                src={item.movie.poster_url}
                alt={item.movie.title}
                className="w-full h-64 object-cover mt-2 mb-2"
              />
            )}
            <p>Status: {item.is_watched ? 'Watched ✅' : 'Unwatched ❌'}</p>

            <div className="mt-3 flex gap-2">
              <button
                className="bg-green-600 text-white px-2 py-1 rounded text-sm"
                onClick={() => toggleWatched(item.id, item.is_watched)}
              >
                Mark as {item.is_watched ? 'Unwatched' : 'Watched'}
              </button>
              <button
                className="bg-red-600 text-white px-2 py-1 rounded text-sm"
                onClick={() => removeFromWatchlist(item.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
