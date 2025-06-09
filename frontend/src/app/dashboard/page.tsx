'use client';
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import MyWatchlist from '../components/MyWatchlist';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'search' | 'watchlist'>('search');
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  // Fetch user's watchlist on component mount
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/watchlist/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Handle both array response and paginated response
          const items = Array.isArray(data) ? data : (data.results || []);
          const imdbIds = items.map((item: any) => item.movie?.imdb_id).filter(Boolean);
          setWatchlist(new Set(imdbIds));
        }
      } catch (err) {
        console.error('Failed to fetch watchlist:', err);
      }
    };

    fetchWatchlist();
  }, []);

  // Debounced search function
  const searchMovies = debounce(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setMovies([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/movies/search/?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMovies(data.movies || []);
      } else {
        throw new Error('Failed to search movies');
      }
    } catch (err: any) {
      setError(err.message);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, 500);

  useEffect(() => {
    if (activeTab === 'search') {
      searchMovies(query);
    }
    return () => searchMovies.cancel();
  }, [query, activeTab]);

  const addToWatchlist = async (imdbId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/watchlist/add-from-omdb/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imdb_id: imdbId })
        }
      );

      if (response.ok) {
        // Update local watchlist state
        setWatchlist(prev => new Set(prev).add(imdbId));
        // Show success message
        setError(''); // Clear any previous errors
        // Optional: Show a success toast/notification
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add to watchlist');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const removeFromWatchlist = async (imdbId: string) => {
    try {
      const token = localStorage.getItem('access_token');

      // First get the watchlist item ID
      const watchlistResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/watchlist/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (watchlistResponse.ok) {
        const watchlistData = await watchlistResponse.json();
        const items = Array.isArray(watchlistData) ? watchlistData : (watchlistData.results || []);
        const item = items.find((item: any) => item.movie.imdb_id === imdbId);

        if (item) {
          const deleteResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/watchlist/${item.id}/`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (deleteResponse.ok) {
            // Update local watchlist state
            setWatchlist(prev => {
              const newSet = new Set(prev);
              newSet.delete(imdbId);
              return newSet;
            });
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleError = (message: string) => {
    setError(message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent mb-4">
            MyMovieShelf
          </h1>
          <p className="text-gray-300 text-lg">Discover and organize your personal movie collection</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex justify-center space-x-8">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-3 px-6 border-b-2 font-medium text-lg transition-all duration-300 ${
                activeTab === 'search'
                  ? 'border-red-500 text-red-400 bg-red-500/10 rounded-t-lg'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              🔍 Search Movies
            </button>
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`py-3 px-6 border-b-2 font-medium text-lg transition-all duration-300 ${
                activeTab === 'watchlist'
                  ? 'border-red-500 text-red-400 bg-red-500/10 rounded-t-lg'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              ⭐ My Watchlist
            </button>
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 backdrop-blur-sm">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'search' ? (
          <div className="space-y-6">
            {/* Search Input */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for movies..."
                  className="w-full p-4 pl-12 bg-gray-800/50 text-white border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg placeholder-gray-400 backdrop-blur-sm transition-all duration-300"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </div>
              </div>
            </div>

            {/* Search Results */}
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-400">
                    🎬
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {movies.map((movie: any) => (
                  <div
                    key={movie.imdb_id}
                    className="bg-gray-800/50 rounded-xl shadow-xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm border border-gray-700/50 group"
                  >
                    <div className="relative overflow-hidden">
                      {movie.poster && movie.poster !== 'N/A' ? (
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-72 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl mb-2">🎬</div>
                            <span className="text-gray-400 text-sm">No poster available</span>
                          </div>
                        </div>
                      )}

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 text-white group-hover:text-red-400 transition-colors duration-300">
                        {movie.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 flex items-center">
                        <span className="mr-2">📅</span>
                        {movie.year}
                      </p>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 capitalize bg-gray-700/50 px-3 py-1 rounded-full">
                          {movie.type}
                        </span>

                        {watchlist.has(movie.imdb_id) ? (
                          <button
                            onClick={() => removeFromWatchlist(movie.imdb_id)}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm transition-all duration-300 font-medium shadow-lg"
                          >
                            ✓ Added
                          </button>
                        ) : (
                          <button
                            onClick={() => addToWatchlist(movie.imdb_id)}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-4 py-2 rounded-lg text-sm transition-all duration-300 font-medium shadow-lg hover:scale-105"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && query && movies.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎭</div>
                <p className="text-gray-400 text-xl mb-2">No movies found for "{query}"</p>
                <p className="text-gray-500">Try searching with different keywords</p>
              </div>
            )}

            {!query && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🍿</div>
                <p className="text-gray-400 text-xl mb-2">Ready to discover your next favorite movie?</p>
                <p className="text-gray-500">Start typing to search for movies</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50">
            <MyWatchlist onError={handleError} />
          </div>
        )}
      </div>
    </div>
  );
}

// 'use client';
// import { useState, useEffect } from 'react';
// import { debounce } from 'lodash';
// import MyWatchlist from '../components/MyWatchlist';
//
// export default function Dashboard() {
//   const [activeTab, setActiveTab] = useState<'search' | 'watchlist'>('search');
//   const [query, setQuery] = useState('');
//   const [movies, setMovies] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
//
//   // Fetch user's watchlist on component mount
//   useEffect(() => {
//     const fetchWatchlist = async () => {
//       try {
//         const token = localStorage.getItem('access_token');
//         const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/watchlist/`, {
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         });
//
//         if (response.ok) {
//           const data = await response.json();
//           // Handle both array response and paginated response
//           const items = Array.isArray(data) ? data : (data.results || []);
//           const imdbIds = items.map((item: any) => item.movie?.imdb_id).filter(Boolean);
//           setWatchlist(new Set(imdbIds));
//         }
//       } catch (err) {
//         console.error('Failed to fetch watchlist:', err);
//       }
//     };
//
//     fetchWatchlist();
//   }, []);
//
//   // Debounced search function
//   const searchMovies = debounce(async (searchQuery: string) => {
//     if (!searchQuery.trim()) {
//       setMovies([]);
//       return;
//     }
//
//     setLoading(true);
//     setError('');
//
//     try {
//       const token = localStorage.getItem('access_token');
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/movies/search/?query=${encodeURIComponent(searchQuery)}`,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       );
//
//       if (response.ok) {
//         const data = await response.json();
//         setMovies(data.movies || []);
//       } else {
//         throw new Error('Failed to search movies');
//       }
//     } catch (err: any) {
//       setError(err.message);
//       setMovies([]);
//     } finally {
//       setLoading(false);
//     }
//   }, 500);
//
//   useEffect(() => {
//     if (activeTab === 'search') {
//       searchMovies(query);
//     }
//     return () => searchMovies.cancel();
//   }, [query, activeTab]);
//
//   const addToWatchlist = async (imdbId: string) => {
//     try {
//       const token = localStorage.getItem('access_token');
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/watchlist/add-from-omdb/`,
//         {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({ imdb_id: imdbId })
//         }
//       );
//
//       if (response.ok) {
//         // Update local watchlist state
//         setWatchlist(prev => new Set(prev).add(imdbId));
//         // Show success message
//         setError(''); // Clear any previous errors
//         // Optional: Show a success toast/notification
//       } else {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to add to watchlist');
//       }
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };
//
//   const removeFromWatchlist = async (imdbId: string) => {
//     try {
//       const token = localStorage.getItem('access_token');
//
//       // First get the watchlist item ID
//       const watchlistResponse = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/watchlist/`,
//         {
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       );
//
//       if (watchlistResponse.ok) {
//         const watchlistData = await watchlistResponse.json();
//         const items = Array.isArray(watchlistData) ? watchlistData : (watchlistData.results || []);
//         const item = items.find((item: any) => item.movie.imdb_id === imdbId);
//
//         if (item) {
//           const deleteResponse = await fetch(
//             `${process.env.NEXT_PUBLIC_API_URL}/watchlist/${item.id}/`,
//             {
//               method: 'DELETE',
//               headers: {
//                 'Authorization': `Bearer ${token}`
//               }
//             }
//           );
//
//           if (deleteResponse.ok) {
//             // Update local watchlist state
//             setWatchlist(prev => {
//               const newSet = new Set(prev);
//               newSet.delete(imdbId);
//               return newSet;
//             });
//           }
//         }
//       }
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };
//
//   const handleError = (message: string) => {
//     setError(message);
//   };
//
//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">MyMovieShelf</h1>
//           <p className="text-gray-600 mt-2">Discover and organize your personal movie collection</p>
//         </div>
//
//         {/* Tab Navigation */}
//         <div className="mb-8">
//           <nav className="flex space-x-8">
//             <button
//               onClick={() => setActiveTab('search')}
//               className={`py-2 px-1 border-b-2 font-medium text-sm ${
//                 activeTab === 'search'
//                   ? 'border-blue-500 text-blue-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               Search Movies
//             </button>
//             <button
//               onClick={() => setActiveTab('watchlist')}
//               className={`py-2 px-1 border-b-2 font-medium text-sm ${
//                 activeTab === 'watchlist'
//                   ? 'border-blue-500 text-blue-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               My Watchlist
//             </button>
//           </nav>
//         </div>
//
//         {/* Error Display */}
//         {error && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
//             {error}
//           </div>
//         )}
//
//         {/* Tab Content */}
//         {activeTab === 'search' ? (
//           <div>
//             {/* Search Input */}
//             <div className="mb-6">
//               <input
//                 type="text"
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 placeholder="Search for movies..."
//                 className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
//               />
//             </div>
//
//             {/* Search Results */}
//             {loading ? (
//               <div className="flex justify-center items-center h-40">
//                 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//               </div>
//             ) : (
//               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
//                 {movies.map((movie: any) => (
//                   <div key={movie.imdb_id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
//                     {movie.poster && movie.poster !== 'N/A' ? (
//                       <img
//                         src={movie.poster}
//                         alt={movie.title}
//                         className="w-full h-64 object-cover"
//                       />
//                     ) : (
//                       <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
//                         <span className="text-gray-500 text-sm">No poster available</span>
//                       </div>
//                     )}
//
//                     <div className="p-4">
//                       <h3 className="font-bold text-lg mb-1 line-clamp-2">{movie.title}</h3>
//                       <p className="text-gray-600 text-sm mb-3">{movie.year}</p>
//
//                       <div className="flex justify-between items-center">
//                         <span className="text-sm text-gray-500 capitalize">{movie.type}</span>
//
//                         {watchlist.has(movie.imdb_id) ? (
//                           <button
//                             onClick={() => removeFromWatchlist(movie.imdb_id)}
//                             className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
//                           >
//                             ✓ Added
//                           </button>
//                         ) : (
//                           <button
//                             onClick={() => addToWatchlist(movie.imdb_id)}
//                             className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
//                           >
//                             + Add
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//
//             {!loading && query && movies.length === 0 && (
//               <div className="text-center py-12">
//                 <p className="text-gray-500 text-lg">No movies found for "{query}"</p>
//               </div>
//             )}
//
//             {!query && (
//               <div className="text-center py-12">
//                 <p className="text-gray-500 text-lg">Start typing to search for movies</p>
//               </div>
//             )}
//           </div>
//         ) : (
//           <MyWatchlist onError={handleError} />
//         )}
//       </div>
//     </div>
//   );
// }
