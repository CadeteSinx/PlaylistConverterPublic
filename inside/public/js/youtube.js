import { google_config } from "./config.js";

const google_apiKey = google_config.api_key;
const google_clientId = google_config.client_id;
const google_scope = google_config.scope;
const google_redirect_uri = google_config.redirect_uri;

const google_expiration_comparator = 3600000;

async function make_HTTP_request_POST(url, headers = {}, body = {}) {
  var response_obj = {};

  return new Promise((resolve, reject) => {
    try {
      fetch(url, {
        method: "POST",
        headers: headers,
        body: body,
      })
        .then((response) => {
          response_obj.status = response.status;
          if (!response.ok) {
            response_obj.error = `${response.status} ${response.statusText}`;
            reject(response_obj);
          } else {
            return response.json();
          }
        })
        .then((data) => {
          response_obj.data = data;
          resolve(response_obj);
        });
    } catch (error) {
      response_obj.status = "failed";
      response_obj.error = `${response.status} ${response.statusText}`;
      reject(response_obj);
    }
  });
}

async function make_HTTP_request_GET(url, headers = {}) {
  return new Promise((resolve, reject) => {
    try {
      fetch(url, {
        headers: headers,
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          resolve(data);
        });
    } catch (error) {
      reject(error);
      console.log(error);
    }
  });
}

async function make_youtube_track_array() {
	if(!sessionStorage.getItem("google_oauth") && new Date().getTime() - sessionStorage.getItem("google_expiration") > google_expiration_comparator ) {
		get_youtube_oauth_token()
	}

	var track_array = []


	const playlistId = document.getElementById("playlist-input").value.split('=')[1]
	const url_playlist = `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet%2CcontentDetails&id=${playlistId}&maxResults=25&key=${google_apiKey}`
	const headers_playlist = {
		Accept: "application/json",
		Authorization: `Bearer ${sessionStorage.getItem("google_oauth")}`
	}

	//TODO: Deal with multiple pages
	const url_playlistItems = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=50&playlistId=${playlistId}&key=${google_apiKey}`
  const headers_playlistItems = {
    'Authorization': `Bearer ${sessionStorage.getItem("google_oauth")}`,
    'Accept': 'application/json'
  }



	var res = await make_HTTP_request_GET(url_playlist, headers_playlist)
  var data = await make_HTTP_request_GET(url_playlistItems, headers_playlistItems)

  track_array.push({
    playlist: res.items[0].snippet.title,
    description: res.items[0].snippet.description,
    album: res.items[0].snippet.thumbnails.maxres.url,
    id: res.items[0].id,
  })

  data.items.forEach((element, index) => {
    var ob = get_artist_name(element)
    console.log(element.snippet.thumbnails)
    var track_name = ob.title
    var artist = ob.artist
    var cover = element.snippet.thumbnails.high.url
    var id = element.id

    track_array.push({artist: artist, name: track_name, cover: cover, id: id, selected: true})
  })

  return track_array
}

async function get_youtube_oauth_token() {
  const popup = window.open(
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=${google_clientId}&redirect_uri=${google_redirect_uri}&response_type=token&scope=${google_scope}`,
    "Google oAuth",
    "height: 600, width=450",
    "popup=true"
  );

  const check_popup = setInterval(() => {
    if (popup.window.location.href.includes(google_redirect_uri)) {
      var oauth_token = popup.window.location.href.split("=");
      oauth_token = oauth_token[1].split("&");
      var date = new Date().getTime();
      sessionStorage.setItem("google_oauth", oauth_token[0]);
      sessionStorage.setItem("google_expiration", date);

      popup.close();
    }

    if (popup || !popup.closed) {
      return;
    }
    clearInterval(check_popup);
  }, 100);
}

async function make_youtube_playlist(playlist_name, playlist_description) {
  var url_playlist = `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet%2Cstatus&key=${google_apiKey}`;
  var header_playlist = {
    Authorization: `Bearer ${sessionStorage.getItem("google_oauth")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  var body_playlist = JSON.stringify({
    snippet: {
      title: playlist_name,
      description: playlist_description,
      defaultLanguage: "en",
    },
    status: {
      privacyStatus: "public",
    },
  });

  return make_HTTP_request_POST(url_playlist, header_playlist, body_playlist);
}

async function get_youtube_video_id(title) {
  var string = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${title}&key=${google_apiKey}`;
  var response = await make_HTTP_request_GET(string);
  return response.items[0].id.videoId;
}

async function add_youtube_video_to_playlist(playlistId, videoId) {
  var url = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&key=${google_apiKey}`;

  var headers = {
    Authorization: `Bearer ${sessionStorage.getItem("google_oauth")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  var body = JSON.stringify({
    snippet: {
      playlistId: playlistId,
      resourceId: {
        kind: "youtube#video",
        videoId: videoId,
      },
    },
  });

  return make_HTTP_request_POST(url, headers, body);
}

function get_artist_name(data) {
  var arr = []
  arr = data.snippet.title.split("-")
  if(arr.length < 2) {
    arr.unshift(data.snippet.videoOwnerChannelTitle.split('-')[0])
  }

	return {artist: arr[0].trim(), title: arr[1].trim()}
}

export {
  make_youtube_track_array,
  get_youtube_oauth_token,
  make_youtube_playlist,
  get_youtube_video_id,
  add_youtube_video_to_playlist,
};
