# watchlist/serializers.py - FIXED VERSION
from rest_framework import serializers
from .models import WatchlistItem
from movies.serializers import MovieSerializer
from movies.models import Movie


class WatchlistItemSerializer(serializers.ModelSerializer):
    movie = MovieSerializer(read_only=True)

    class Meta:
        model = WatchlistItem
        fields = ('id', 'movie', 'is_watched', 'rating', 'note',
                  'added_at', 'watched_at', 'updated_at')
        read_only_fields = ('id', 'added_at', 'watched_at', 'updated_at')


class WatchlistItemCreateSerializer(serializers.ModelSerializer):
    """Separate serializer for creating watchlist items"""
    imdb_id = serializers.CharField(write_only=True)

    class Meta:
        model = WatchlistItem
        fields = ('imdb_id', 'rating', 'note')

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        imdb_id = validated_data.pop('imdb_id')

        # Get or create the movie
        try:
            movie = Movie.objects.get(imdb_id=imdb_id)
        except Movie.DoesNotExist:
            raise serializers.ValidationError({
                'imdb_id': 'Movie not found. Please create the movie first using the /api/movies/create/ endpoint.'
            })

        # Check for duplicates
        if WatchlistItem.objects.filter(user=user, movie=movie).exists():
            raise serializers.ValidationError({
                'imdb_id': 'This movie is already in your watchlist.'
            })

        return WatchlistItem.objects.create(
            user=user,
            movie=movie,
            **validated_data
        )


class WatchlistItemUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating watchlist items"""

    class Meta:
        model = WatchlistItem
        fields = ('is_watched', 'rating', 'note')

    def update(self, instance, validated_data):
        # Auto-set watched_at when marking as watched
        if validated_data.get('is_watched') and not instance.is_watched:
            from django.utils import timezone
            instance.watched_at = timezone.now()
        elif not validated_data.get('is_watched', instance.is_watched):
            instance.watched_at = None

        return super().update(instance, validated_data)


# FIX: Move this outside the WatchlistItemUpdateSerializer class
class AddFromOMDBSerializer(serializers.Serializer):
    """
    Serializer for adding movies to watchlist directly from OMDB.
    This is the key serializer for your workflow.
    """
    imdb_id = serializers.CharField(max_length=20)
    rating = serializers.IntegerField(
        min_value=1,
        max_value=5,
        required=False,
        allow_null=True
    )
    note = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True
    )

    def validate_imdb_id(self, value):
        """Validate IMDB ID format"""
        if not value.startswith('tt'):
            raise serializers.ValidationError("Invalid IMDB ID format. Should start with 'tt'")
        return value