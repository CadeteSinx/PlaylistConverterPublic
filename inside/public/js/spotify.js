import { spotify_config } from "./config.js";

const spotify_redirect_uri = spotify_config.redirect_uri
const spotify_clientId = spotify_config.client_id
const spotify_clientSecret = spotify_config.client_secret
const spotify_credentials_url = spotify_config.credentials_url
var spotify_auth_token 
var spotify_user_id
var spotify_playlist_id

async function make_HTTP_request_POST(url, headers={}, body={}) {
  var response_obj = {}

  return new Promise((resolve, reject) => {
    try{
      fetch(url, {
        method: "POST",
        headers:headers,
        body: body
      }).then((response) => {
        response_obj.status = response.status
        if(!response.ok){
          response_obj.error = `${response.status} ${response.statusText}` 
          reject(response_obj)
        }else{
          return response.json()
        } 
      }).then((data) => {
        response_obj.data = data
        resolve(response_obj)
      })
    }catch(error){
      response_obj.status = "failed"
      response_obj.error = `${response.status} ${response.statusText}` 
      reject(response_obj)
    }
  })
}
  
async function make_HTTP_request_GET(url, headers = {}) {
  return new Promise((resolve, reject) => {
      try{
      fetch(url, {
          headers: headers,
      }).then((response) => {
          return response.json()
      }).then((data) => {
          resolve(data)
      })
      }catch(error){
      reject(error)
      console.log(error)
      }
  })
}

async function make_spotify_track_array() { 
  get_spotify_oauth_token()

  var track_array = []

  var string = "https://open.spotify.com/playlist/"
  string = document.getElementById("playlist-input").value.replace(string, "")
  string = string.split("?si")

  var playlist_response = await make_HTTP_request_GET(`https://api.spotify.com/v1/playlists/${string[0]}`, {
      'Authorization': `Bearer ${sessionStorage.getItem("spotify_oauth")}`
  })

  if('error' in playlist_response) {
    return "Failed"
  }else{
    track_array.push({
      playlist: playlist_response.name,
      description: playlist_response.description,
      album: playlist_response.images[0].url,
      id: playlist_response.id,
    })
    
    playlist_response.tracks.items.forEach((element, index) => {
        var track_name = element.track.name
        var artist = element.track.artists[0].name
        var cover = element.track.album.images[0].url
        var id = element.track.id
  
        track_array.push({artist: artist, name: track_name, cover: cover, id: id, selected: true})
    });
  
    return track_array
  }
}

async function get_spotify_oauth_token() {
  var SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
  var authURL = SPOTIFY_AUTH_URL + "?client_id=" + spotify_clientId + "&redirect_uri=" + spotify_redirect_uri + "" + "&response_type=token&scope=playlist-read-private playlist-modify-public playlist-modify-private";

  var width = 450,
  height = 730,
  left = (screen.width / 2) - (width / 2),
  top = (screen.height / 2) - (height / 2);

  var popup = window.open(
    authURL,
    'Spotify',
    'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left
  );

  const check_popup = setInterval(() => {
    if (popup.window.location.href.includes(spotify_redirect_uri)) {
      var str = popup.window.location.href.split('access_token=')[1]
      var access_token = str.split("&token_type=Bearer&expires_in=")[0]
      var token_expiration = str.split("&token_type=Bearer&expires_in=")[1]
      var date = new Date().getTime();
      sessionStorage.setItem("spotify_oauth", access_token);
      sessionStorage.setItem("spotify_expiration", date);
      popup.close()
    }
    if (popup || !popup.closed) {
      return;
    }
    clearInterval(check_popup);
  }, 100);
}

async function get_spotify_track_uri(title, artist) {
  var url = `https://api.spotify.com/v1/search?q=remaster%26track%3D${title}%26artist%3D${artist}&type=track&limit=1`
  var headers = {
    Authorization: `Bearer ${sessionStorage.getItem("spotify_oauth")}`
  }

  var res = await  make_HTTP_request_GET(url, headers)

  return res.tracks.items[0].uri
}

async function make_uris_array(track_array) {
  var uris = []
  track_array.forEach((element, index) => {
    if(index != 0){
      
      get_spotify_track_uri(element.name, element.artist).then((uri) => {
        uris.push(uri)
      })
    }
  })

  return uris
}

async function add_items_to_playlist(playlist_id, items_uri) {
  console.log(items_uri)

  var url = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`
  var header = {
    Authorization: `Bearer ${sessionStorage.getItem("spotify_oauth")}`,
    "Content-Type": "application/json"
  }
  var body = JSON.stringify({
    uris: items_uri,
    position: 0
  })

  return make_HTTP_request_POST(url, header, body)
}

async function make_spotify_playlist(playlist_name, playlist_description) {
  var user_id = await get_user_id()
  
  var url_playlist = `https://api.spotify.com/v1/users/${user_id}/playlists`
  var headers = {
    Authorization: `Bearer ${sessionStorage.getItem("spotify_oauth")}`,
    "Content-Type": "application/json"
  }
  var body = JSON.stringify({
    name: playlist_name,
    description: playlist_description,
    public: true
  })

  return make_HTTP_request_POST(url_playlist, headers, body)
}

async function get_user_id() {
  var url = "https://api.spotify.com/v1/me"
  var header = {
    Authorization: `Bearer ${sessionStorage.getItem("spotify_oauth")}`
  }

  var res = await make_HTTP_request_GET(url, header)
  return res.id
}

async function get_spotify_cover_img(id) {
  const endpoint = `https://api.spotify.com/v1/playlists/${id}/images`
  const header = {
    Authorization: `Bearer ${sessionStorage.getItem("spotify_oauth")}`
  }

  return make_HTTP_request_GET(endpoint, header)
}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

export {
  make_spotify_track_array,
  get_spotify_oauth_token,
  get_user_id,
  make_spotify_playlist,
  get_spotify_track_uri,
  make_uris_array,
  add_items_to_playlist,
  get_spotify_cover_img
}

//OFFSET CHANGES THE PAGE OF THE QUERY