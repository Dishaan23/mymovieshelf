import requests
from django.conf import settings
from .models import Movie
from datetime import datetime


class TMDBService:
    BASE_URL = settings.TMDB_BASE_URL
    API_KEY = settings.TMDB_API_KEY

    @classmethod
    def search_movies(cls, query, page=1):
        """Search movies from TMDB API"""
        url = f"{cls.BASE_URL}/search/movie"
        params = {
            'api_key': cls.API_KEY,
            'query': query,
            'page': page
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise Exception(f"Error fetching movies: {str(e)}")

    @classmethod
    def get_movie_details(cls, tmdb_id):
        """Get detailed movie information from TMDB"""
        url = f"{cls.BASE_URL}/movie/{tmdb_id}"
        params = {
            'api_key': cls.API_KEY,
            'append_to_response': 'credits'
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise Exception(f"Error fetching movie details: {str(e)}")

    @classmethod
    def save_movie_from_tmdb(cls, tmdb_id):
        """Fetch and save movie from TMDB to database"""
        movie_data = cls.get_movie_details(tmdb_id)

        # Extract relevant data
        genres = [genre['name'] for genre in movie_data.get('genres', [])]
        cast = [actor['name'] for actor in movie_data.get('credits', {}).get('cast', [])[:10]]
        director = ''
        for crew_member in movie_data.get('credits', {}).get('crew', []):
            if crew_member['job'] == 'Director':
                director = crew_member['name']
                break

        release_date = None
        if movie_data.get('release_date'):
            try:
                release_date = datetime.strptime(movie_data['release_date'], '%Y-%m-%d').date()
            except ValueError:
                pass

        movie, created = Movie.objects.get_or_create(
            tmdb_id=tmdb_id,
            defaults={
                'title': movie_data.get('title', ''),
                'overview': movie_data.get('overview', ''),
                'release_date': release_date,
                'poster_path': movie_data.get('poster_path', ''),
                'backdrop_path': movie_data.get('backdrop_path', ''),
                'vote_average': movie_data.get('vote_average', 0.0),
                'vote_count': movie_data.get('vote_count', 0),
                'runtime': movie_data.get('runtime'),
                'genres': genres,
                'director': director,
                'cast': cast,
            }
        )
        return movie