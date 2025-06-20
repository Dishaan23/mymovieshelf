# Generated by Django 5.2.2 on 2025-06-08 20:43

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('movies', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='WatchlistItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_watched', models.BooleanField(default=False)),
                ('rating', models.IntegerField(blank=True, choices=[(1, '1 Star'), (2, '2 Stars'), (3, '3 Stars'), (4, '4 Stars'), (5, '5 Stars')], null=True)),
                ('note', models.TextField(blank=True)),
                ('added_at', models.DateTimeField(auto_now_add=True)),
                ('watched_at', models.DateTimeField(blank=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('movie', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='watchlist_items', to='movies.movie')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='watchlist_items', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'watchlist_items',
                'ordering': ['-added_at'],
                'unique_together': {('user', 'movie')},
            },
        ),
    ]
