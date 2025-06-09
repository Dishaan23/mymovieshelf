from django.db import models
from django.contrib.auth import get_user_model
from movies.models import Movie

User = get_user_model()

class WatchlistItem(models.Model):
    RATING_CHOICES = [
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlist_items')
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='watchlist_items')
    is_watched = models.BooleanField(default=False)
    rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    note = models.TextField(blank=True)
    added_at = models.DateTimeField(auto_now_add=True)
    watched_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'watchlist_items'
        unique_together = ('user', 'movie')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.email} - {self.movie.title}"

    def save(self, *args, **kwargs):
        if self.is_watched and not self.watched_at:
            from django.utils import timezone
            self.watched_at = timezone.now()
        elif not self.is_watched:
            self.watched_at = None
        super().save(*args, **kwargs)