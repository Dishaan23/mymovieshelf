# watchlist/views.py - Updated with add-from-omdb endpoint
from django.conf import settings
import requests
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import WatchlistItem
from movies.models import Movie
from .serializers import (
    WatchlistItemSerializer,
    WatchlistItemCreateSerializer,
    WatchlistItemUpdateSerializer,
    AddFromOMDBSerializer  # New serializer
)


class WatchlistViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WatchlistItem.objects.filter(user=self.request.user).select_related('movie')

    def get_serializer_class(self):
        if self.action == 'create':
            return WatchlistItemCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return WatchlistItemUpdateSerializer
        elif self.action == 'add_from_omdb':
            return AddFromOMDBSerializer
        return WatchlistItemSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='add-from-omdb')
    def add_from_omdb(self, request):
        """
        Add a movie to watchlist directly from OMDB.
        This is the key endpoint for your workflow.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        imdb_id = serializer.validated_data['imdb_id']
        user = request.user

        try:
            # Check if already in watchlist
            existing_item = WatchlistItem.objects.filter(
                user=user,
                movie__imdb_id=imdb_id
            ).first()

            if existing_item:
                return Response(
                    {
                        'error': 'Movie already in your watchlist',
                        'watchlist_item': WatchlistItemSerializer(existing_item).data
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get or create movie from OMDB
            movie = self._get_or_create_movie_from_omdb(imdb_id)

            # Create watchlist item
            watchlist_item = WatchlistItem.objects.create(
                user=user,
                movie=movie,
                rating=serializer.validated_data.get('rating'),
                note=serializer.validated_data.get('note', '')
            )

            return Response(
                {
                    'message': 'Movie added to watchlist successfully',
                    'watchlist_item': WatchlistItemSerializer(watchlist_item).data
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {'error': f'Failed to add movie to watchlist: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _get_or_create_movie_from_omdb(self, imdb_id):
        """
        Get movie from database or fetch from OMDB and create it.
        This handles the "lazy loading" of movies.
        """
        # Try to get existing movie
        try:
            return Movie.objects.get(imdb_id=imdb_id)
        except Movie.DoesNotExist:
            pass

        # Fetch from OMDB and create
        omdb_api_key = settings.OMDB_API_KEY
        if not omdb_api_key:
            raise Exception("OMDB API key not configured")

        response = requests.get(
            f"http://www.omdbapi.com/?i={imdb_id}&apikey={omdb_api_key}"
        )
        response.raise_for_status()
        omdb_data = response.json()

        if omdb_data.get('Response') == 'False':
            raise Exception(f"Movie not found in OMDB: {omdb_data.get('Error', 'Unknown error')}")

        # Transform OMDB data to Movie model format
        movie_data = {
            'tmdb_id': imdb_id,  # Using imdb_id as primary identifier
            'imdb_id': imdb_id,
            'title': omdb_data.get('Title', ''),
            'overview': omdb_data.get('Plot', ''),
            'poster_path': omdb_data.get('Poster', ''),
            'release_date': self._parse_date(omdb_data.get('Released')),
            'vote_average': self._parse_rating(omdb_data.get('imdbRating')),
            'vote_count': self._parse_votes(omdb_data.get('imdbVotes')),
            'runtime': self._parse_runtime(omdb_data.get('Runtime')),
            'genres': self._parse_genres(omdb_data.get('Genre')),
            'director': omdb_data.get('Director', ''),
            'cast': self._parse_actors(omdb_data.get('Actors')),
        }

        return Movie.objects.create(**movie_data)

    # Keep your existing parsing methods from CreateMovieView
    def _parse_date(self, date_str):
        if not date_str or date_str == 'N/A':
            return None
        try:
            from datetime import datetime
            return datetime.strptime(date_str, '%d %b %Y').date()
        except:
            return None

    def _parse_rating(self, rating_str):
        if not rating_str or rating_str == 'N/A':
            return 0.0
        try:
            return float(rating_str)
        except:
            return 0.0

    def _parse_votes(self, votes_str):
        if not votes_str or votes_str == 'N/A':
            return 0
        try:
            return int(votes_str.replace(',', ''))
        except:
            return 0

    def _parse_runtime(self, runtime_str):
        if not runtime_str or runtime_str == 'N/A':
            return None
        try:
            return int(runtime_str.split()[0])
        except:
            return None

    def _parse_genres(self, genre_str):
        if not genre_str or genre_str == 'N/A':
            return []
        return [g.strip() for g in genre_str.split(',')]

    def _parse_actors(self, actors_str):
        if not actors_str or actors_str == 'N/A':
            return []
        return [a.strip() for a in actors_str.split(',')]

    # Keep all your existing actions (mark_watched, unmark_watched, etc.)
    @action(detail=True, methods=['patch'])
    def mark_watched(self, request, pk=None):
        """Mark a watchlist item as watched"""
        try:
            watchlist_item = self.get_object()
            watchlist_item.is_watched = True
            watchlist_item.save()

            serializer = WatchlistItemSerializer(watchlist_item)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['patch'])
    def unmark_watched(self, request, pk=None):
        """Unmark a watchlist item as watched"""
        try:
            watchlist_item = self.get_object()
            watchlist_item.is_watched = False
            watchlist_item.save()

            serializer = WatchlistItemSerializer(watchlist_item)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def watched(self, request):
        """Get only watched movies"""
        watched_items = self.get_queryset().filter(is_watched=True)
        serializer = WatchlistItemSerializer(watched_items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unwatched(self, request):
        """Get only unwatched movies"""
        unwatched_items = self.get_queryset().filter(is_watched=False)
        serializer = WatchlistItemSerializer(unwatched_items, many=True)
        return Response(serializer.data)