# backend/movies/views.py - FIXED VERSION
from django.conf import settings
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Movie
from .serializers import MovieSerializer


class SearchMoviesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('query', '')
        if not query:
            return Response(
                {"error": "Query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            omdb_api_key = settings.OMDB_API_KEY
            if not omdb_api_key:
                return Response(
                    {"error": "OMDB API key is not configured"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            response = requests.get(
                f"http://www.omdbapi.com/?s={query}&apikey={omdb_api_key}"
            )
            response.raise_for_status()
            data = response.json()

            if data.get('Response') == 'False':
                return Response(
                    {"error": data.get('Error', 'No results found')},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Transform OMDB data to match your frontend expectations
            movies = []
            if 'Search' in data:
                for movie in data['Search']:
                    movies.append({
                        'imdb_id': movie.get('imdbID'),
                        'title': movie.get('Title'),
                        'year': movie.get('Year'),
                        'poster': movie.get('Poster'),
                        'type': movie.get('Type')
                    })

            return Response({
                'movies': movies,
                'total_results': data.get('totalResults', 0)
            })

        except requests.RequestException as e:
            return Response(
                {"error": f"Error fetching from OMDB: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MovieDetailView(APIView):
    """Get detailed movie information from OMDB API"""
    permission_classes = [IsAuthenticated]

    def get(self, request, imdb_id):
        try:
            omdb_api_key = settings.OMDB_API_KEY
            response = requests.get(
                f"http://www.omdbapi.com/?i={imdb_id}&apikey={omdb_api_key}"
            )
            response.raise_for_status()
            data = response.json()

            if data.get('Response') == 'False':
                return Response(
                    {"error": data.get('Error', 'Movie not found')},
                    status=status.HTTP_404_NOT_FOUND
                )

            return Response(data)

        except requests.RequestException as e:
            return Response(
                {"error": f"Error fetching movie details: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CreateMovieView(APIView):
    """Create a movie record from OMDB data"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        imdb_id = request.data.get('imdb_id')
        if not imdb_id:
            return Response(
                {'error': 'imdb_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if movie already exists
        try:
            movie = Movie.objects.get(imdb_id=imdb_id)
            return Response({
                'movie': MovieSerializer(movie).data,
                'created': False
            })
        except Movie.DoesNotExist:
            pass

        # Fetch movie details from OMDB
        try:
            omdb_api_key = settings.OMDB_API_KEY
            response = requests.get(
                f"http://www.omdbapi.com/?i={imdb_id}&apikey={omdb_api_key}"
            )
            response.raise_for_status()
            omdb_data = response.json()

            if omdb_data.get('Response') == 'False':
                return Response(
                    {"error": omdb_data.get('Error', 'Movie not found')},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Transform OMDB data to your Movie model format
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

            # Create movie
            movie = Movie.objects.create(**movie_data)

            return Response({
                'movie': MovieSerializer(movie).data,
                'created': True
            })

        except requests.RequestException as e:
            return Response(
                {"error": f"Error fetching from OMDB: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {'error': f'Error creating movie: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _parse_date(self, date_str):
        """Parse OMDB date format to Django date"""
        if not date_str or date_str == 'N/A':
            return None
        try:
            from datetime import datetime
            return datetime.strptime(date_str, '%d %b %Y').date()
        except:
            return None

    def _parse_rating(self, rating_str):
        """Parse OMDB rating to float"""
        if not rating_str or rating_str == 'N/A':
            return 0.0
        try:
            return float(rating_str)
        except:
            return 0.0

    def _parse_votes(self, votes_str):
        """Parse OMDB votes to integer"""
        if not votes_str or votes_str == 'N/A':
            return 0
        try:
            return int(votes_str.replace(',', ''))
        except:
            return 0

    def _parse_runtime(self, runtime_str):
        """Parse OMDB runtime to minutes"""
        if not runtime_str or runtime_str == 'N/A':
            return None
        try:
            return int(runtime_str.split()[0])
        except:
            return None

    def _parse_genres(self, genre_str):
        """Parse OMDB genres to list"""
        if not genre_str or genre_str == 'N/A':
            return []
        return [g.strip() for g in genre_str.split(',')]

    def _parse_actors(self, actors_str):
        """Parse OMDB actors to list"""
        if not actors_str or actors_str == 'N/A':
            return []
        return [a.strip() for a in actors_str.split(',')]  # FIX: Added missing return