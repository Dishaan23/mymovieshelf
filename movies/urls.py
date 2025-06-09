from django.urls import path, include
#from rest_framework.routers import DefaultRouter
#from . import views

# movies/urls.py
from django.urls import path
from .views import SearchMoviesView, CreateMovieView, MovieDetailView

#router = DefaultRouter()
#router.register(r'', views.MovieViewSet)

urlpatterns = [
    path('search/', SearchMoviesView.as_view(), name='movie-search'),
    path('create/', CreateMovieView.as_view(), name='create-movie'),
    path('detail/<str:imdb_id>/', MovieDetailView.as_view(), name='movie-detail'),
]