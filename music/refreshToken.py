import requests
import base64
import json

# Spotify API credentials
CLIENT_ID = '1f093e2705574598b8c8096f532ecd87'
CLIENT_SECRET = 'f795aac1fa9e4c098db0e7d783aa2b5e'
REDIRECT_URI = 'https://deepj.tech/spotify/callback'

def getToken():
    with open('credentials.json', 'r') as f:
        creds = json.load(f)
    return creds['access_token']

def refreshToken():
    '''curl -X POST "https://accounts.spotify.com/api/token" \
    > -H "Content-Type: application/x-www-form-urlencoded" \
    > -d "grant_type=client_credentials&client_id=1f093e2705574598b8c8096f532ecd87&client_secret=f795aac1fa9e4c098db0e7d783aa2b5e"
    Returns:  {"access_token":"BQB5j1GLSi7ZZPdEv0-M6PR9NkTRt2YuEom8fDezXOyDtkaOp4sKje7uW7r8Qq3ZFm5FUY3aplaYRbZSPWN_oNPHecjWe3R_Ng_TlKtIk-9jwccfoXUrRn-LSXu6Yz6EmKc15lk5jcA","token_type":"Bearer","expires_in":3600}
    '''
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    params = {
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET

    }
    url = "https://accounts.spotify.com/api/token"

    response = requests.post(url, headers=headers, params=params)
    response_data = response.json()

    if response.status_code >= 400:
        print(f"Error: {response.status_code}")
        print(response_data)
        print("Failed to get new temporary access token")
        exit(1)

    with open('credentials.json', 'w') as f:
        json.dump(response_data, f, indent=4)

    print("New access: ", response_data["access_token"]) # just so that we can see it in console

def test_valid_token():
    url = "https://api.spotify.com/v1/search"
    headers = {
        "Authorization": f"Bearer {getToken()}"
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
        print("Token refreshed. Good to go!")
    elif response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response_data)
        exit(1)


    # Write the response data to a JSON file
    with open('validation_response.json', 'w') as f:
        json.dump(response_data, f, indent=4)


'''
Expired token response:
401
Error: 401
{'error': {'status': 401, 'message': 'The access token expired'}}
when printed response_data
'''
if __name__ == "__main__":
    print(getToken())