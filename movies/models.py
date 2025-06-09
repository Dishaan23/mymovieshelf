
from django.db import models

class Movie(models.Model):
    # Change tmdb_id to CharField to handle both TMDb and IMDb IDs
    tmdb_id = models.CharField(max_length=50, unique=True)
    imdb_id = models.CharField(max_length=20, blank=True, null=True, db_index=True)
    title = models.CharField(max_length=255)
    overview = models.TextField(blank=True)
    release_date = models.DateField(null=True, blank=True)
    poster_path = models.CharField(max_length=255, blank=True)
    backdrop_path = models.CharField(max_length=255, blank=True)
    vote_average = models.FloatField(default=0.0)
    vote_count = models.IntegerField(default=0)
    runtime = models.IntegerField(null=True, blank=True)
    genres = models.JSONField(default=list, blank=True)
    director = models.CharField(max_length=255, blank=True)
    cast = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        db_table = 'movies'
        ordering = ['-created_at']