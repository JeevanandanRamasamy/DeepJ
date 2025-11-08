import requests
import base64
import json
from refreshToken import getToken, refreshToken, test_valid_token

# Authorization - Get access token
test_valid_token()
ACCESS_TOKEN = getToken()

url = "https://api.spotify.com/v1/search"
headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}"
}
params = {
    "q": "Kendrick Lamar",
    "type": "artist",
    "limit": 1
}

response = requests.get(url, headers=headers, params=params)
response_data = response.json()

print(response.status_code)

if response.status_code == 401 and response_data["error"]["message"] == "The access token expired":
    print("Access token expired! Refreshing token")
    refreshToken()
    print("Now, rerun!")
    exit(1)

if response.status_code != 200:
    print(f"Error: {response.status_code}")
    print(response_data)
    exit(1)


# Write the response data to a JSON file
with open('spotify_response.json', 'w') as f:
    json.dump(response_data, f, indent=4)
