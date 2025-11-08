import requests
import os

def nameToLink(name):
    API_KEY = "AIzaSyAbsXMPX_ksnA6twQxco0C5dz79gx4NMCI"
    query = name
    url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={query}&key={API_KEY}&type=video&maxResults=1"

    response = requests.get(url).json()
    video_id = response["items"][0]["id"]["videoId"]
    video_link = f"https://www.youtube.com/watch?v={video_id}"

    return video_link

def downloadSong(name, artist, genre):
    link = nameToLink(name + " by " + artist)
    print(name)
    print(link)
    os.system(f"yt-dlp -x --audio-format mp3 \"{link}\" -o \"songs/{genre}/{name}.mp3\"")

nameToLink("Bohemian Rhapsody by Queen")
# downloadSong("Why'd You Only Call Me When You're High?", "Arctic Monkeys", "indie rock")
