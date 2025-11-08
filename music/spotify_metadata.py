import requests
import os
from refreshToken import getToken, refreshToken, test_valid_token
from nameToLink import nameToLink, downloadSong
import json


def get_top_genre_songs(genre: str, limit=50):
    """Get top 50 songs by genre using Spotify API"""
    test_valid_token()
    access_token = getToken()
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    # Search for rock playlists and get tracks
    # Note: Spotify doesn't have a direct "top songs by genre" endpoint
    # We use search with genre filter or category playlists
    search_url = 'https://api.spotify.com/v1/search'
    params = {
        'q': f'genre:{genre}',
        'type': 'track',
        'limit': limit,
        'market': 'US'
    }
    
    response = requests.get(search_url, headers=headers, params=params)
    response.raise_for_status()
    
    tracks = response.json()['tracks']['items']
    
    # Extract relevant information
    rock_songs = []
    for track in tracks:
        song_info = {
            'name': track['name'],
            'artist': ', '.join([artist['name'] for artist in track['artists']]),
            'album': track['album']['name'],
            'popularity': track['popularity'],
            'id': track['id'],
            'uri': track['uri']
        }
        rock_songs.append(song_info)
    
    return rock_songs



if __name__ == '__main__':
    genres = ['rock', 'pop', 'rap', 'indie pop', 'classical', 'country', 'jazz', 'indie rock', 'metal', 'electronic']
    music_data = dict()

    for genre in genres:
        music_data[genre] = get_top_genre_songs(genre=genre, limit=15)
        '''
        top_genre_songs = get_top_genre_songs(genre=genre, limit=15)
        for i, song in enumerate(top_genre_songs, 1):
            print(f"{i}. {song['name']} by {song['artist']} (Popularity: {song['popularity']})")
            # downloadSong(song['name'], song['artist'], genre)
        '''
    with open('music_data.json', 'w') as f:
        json.dump(music_data, f, indent=4)