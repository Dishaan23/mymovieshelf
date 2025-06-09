'use client';
import { useState, useEffect } from 'react';

interface WatchlistMovie {
  id: number;
  movie: {
    imdb_id: string;
    title: string;
    overview: string;
    poster_path: string;
    release_date: string;
    vote_average: number;
    runtime: number;
    genres: string[];
    director: string;
    cast: string[];
  };
  is_watched: boolean;
  rating: number | null;
  note: string;
  added_at: string;
  watched_at: string | null;
}

interface MyWatchlistProps {
  onError: (message: string) => void;
}

export default function MyWatchlist({ onError }: MyWatchlistProps) {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'watched' | 'unwatched'>('all');
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editData, setEditData] = useState<{rating: number | null, note: string}>({
    rating: null,
    note: ''
  });

  // Fetch watchlist on component mount
  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      let url = `${process.env.NEXT_PUBLIC_API_URL}/watchlist/`;
      if (filter === 'watched') {
        url = `${process.env.NEXT_PUBLIC_API_URL}/watchlist/watched/`;
      } else if (filter === 'unwatched') {
        url = `${process.env.NEXT_PUBLIC_API_URL}/watchlist/unwatched/`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both array response and paginated response
        const items = Array.isArray(data) ? data : (data.results || []);
        setWatchlistItems(items);
      } else {
        throw new Error('Failed to fetch watchlist');
      }
    } catch (err: any) {
      onError(err.message || 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  // Refetch when filter changes
  useEffect(() => {
    fetchWatchlist();
  }, [filter]);

  const toggleWatchedStatus = async (itemId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = currentStatus ? 'unmark_watched' : 'mark_watched';

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/watchlist/${itemId}/${endpoint}/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const updatedItem = await response.json();
        setWatchlistItems(prev =>
          prev.map(item =>
            item.id === itemId ? updatedItem : item
          )
        );
      } else {
        throw new Error('Failed to update watch status');
      }
    } catch (err: any) {
      onError(err.message || 'Failed to update movie status');
    }
  };

  const removeFromWatchlist = async (itemId: number) => {
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/watchlist/${itemId}/`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setWatchlistItems(prev => prev.filter(item => item.id !== itemId));
      } else {
        throw new Error('Failed to remove from watchlist');
      }
    } catch (err: any) {
      onError(err.message || 'Failed to remove movie');
    }
  };

  const startEditing = (item: WatchlistMovie) => {
    setEditingItem(item.id);
    setEditData({
      rating: item.rating,
      note: item.note
    });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditData({ rating: null, note: '' });
  };

  const saveEditing = async (itemId: number) => {
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/watchlist/${itemId}/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(editData)
        }
      );

      if (response.ok) {
        const updatedItem = await response.json();
        setWatchlistItems(prev =>
          prev.map(item =>
            item.id === itemId ? updatedItem : item
          )
        );
        setEditingItem(null);
        setEditData({ rating: null, note: '' });
      } else {
        throw new Error('Failed to update movie details');
      }
    } catch (err: any) {
      onError(err.message || 'Failed to save changes');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderStars = (rating: number | null, isEditing: boolean = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => isEditing && setEditData(prev => ({ ...prev, rating: i }))}
          className={`text-2xl ${
            rating && i <= rating ? 'text-yellow-400' : 'text-gray-300'
          } ${isEditing ? 'hover:text-yellow-400 cursor-pointer' : ''}`}
          disabled={!isEditing}
        >
          ★
        </button>
      );
    }
    return <div className="flex">{stars}</div>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Controls */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Movies ({watchlistItems.length})
        </button>
        <button
          onClick={() => setFilter('unwatched')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'unwatched' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          To Watch
        </button>
        <button
          onClick={() => setFilter('watched')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'watched' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Watched
        </button>
      </div>

      {/* Watchlist Items */}
      {watchlistItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {filter === 'all'
              ? 'Your watchlist is empty. Start by searching and adding some movies!'
              : `No ${filter} movies in your watchlist.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {watchlistItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="md:flex">
                {/* Movie Poster */}
                <div className="md:flex-shrink-0">
                  {item.movie.poster_path && item.movie.poster_path !== 'N/A' ? (
                    <img
                      src={item.movie.poster_path}
                      alt={item.movie.title}
                      className="h-48 w-full object-cover md:h-full md:w-48"
                    />
                  ) : (
                    <div className="h-48 w-full md:h-full md:w-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No poster</span>
                    </div>
                  )}
                </div>

                {/* Movie Details */}
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{item.movie.title}</h3>
                      <p className="text-sm text-gray-600">
                        {item.movie.release_date && formatDate(item.movie.release_date)}
                        {item.movie.director && ` • Directed by ${item.movie.director}`}
                        {item.movie.runtime && ` • ${item.movie.runtime} min`}
                      </p>
                    </div>

                    {/* Watch Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.is_watched 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.is_watched ? 'Watched' : 'To Watch'}
                    </span>
                  </div>

                  {/* Movie Overview */}
                  {item.movie.overview && (
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {item.movie.overview}
                    </p>
                  )}

                  {/* Genres */}
                  {item.movie.genres && item.movie.genres.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {item.movie.genres.slice(0, 3).map((genre, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rating & Notes */}
                  <div className="mb-4">
                    {editingItem === item.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Your Rating:
                          </label>
                          {renderStars(editData.rating, true)}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes:
                          </label>
                          <textarea
                            value={editData.note}
                            onChange={(e) => setEditData(prev => ({ ...prev, note: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-md resize-none"
                            rows={2}
                            placeholder="Add your thoughts about this movie..."
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        {item.rating && (
                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-700">Your Rating: </span>
                            {renderStars(item.rating)}
                          </div>
                        )}
                        {item.note && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Notes: </span>
                            <p className="text-sm text-gray-600 mt-1">{item.note}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {editingItem === item.id ? (
                      <>
                        <button
                          onClick={() => saveEditing(item.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleWatchedStatus(item.id, item.is_watched)}
                          className={`px-3 py-1 rounded text-sm text-white ${
                            item.is_watched 
                              ? 'bg-yellow-500 hover:bg-yellow-600' 
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {item.is_watched ? 'Mark as Unwatched' : 'Mark as Watched'}
                        </button>
                        <button
                          onClick={() => startEditing(item)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit Rating & Notes
                        </button>
                        <button
                          onClick={() => removeFromWatchlist(item.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>

                  {/* Added Date */}
                  <p className="text-xs text-gray-400 mt-3">
                    Added on {formatDate(item.added_at)}
                    {item.watched_at && ` • Watched on ${formatDate(item.watched_at)}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}