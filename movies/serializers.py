from rest_framework import serializers
from .models import Movie

class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class MovieSearchSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=255)
    page = serializers.IntegerField(default=1, min_value=1)