import { Plus, Star, Calendar } from 'lucide-react';

interface Movie {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type: string;
  Plot?: string;
}

interface MovieCardProps {
  movie: Movie;
  onAddToWatchlist: () => void;
  isInWatchlist: boolean;
}

export default function MovieCard({ movie, onAddToWatchlist, isInWatchlist }: MovieCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        <img
          src={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder-movie.jpg'}
          alt={movie.Title}
          className="w-full h-64 object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-movie.jpg';
          }}
        />
        <div className="absolute top-2 right-2">
          <span className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            {movie.Type.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2" title={movie.Title}>
          {movie.Title}
        </h3>

        <div className="flex items-center text-gray-600 text-sm mb-3">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{movie.Year}</span>
        </div>

        <button
          onClick={onAddToWatchlist}
          disabled={isInWatchlist}
          className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            isInWatchlist
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Plus className="h-4 w-4" />
          <span>{isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
        </button>
      </div>
    </div>
  );
}