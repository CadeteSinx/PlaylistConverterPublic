import { google_config, spotify_config } from "./config.js";
import * as yout from "./youtube.js";
import * as spot from "./spotify.js";

// ==================== Documents ================================
const google_expiration_comparator = 3600000;

var playlist_input;
var screens = [
  "screens/home.html",
  "screens/input.html",
  "screens/playlist.html",
  "screens/completed.html",
  "screens/loading-screen.html"
];
const sources = ["Spotify", "Youtube"];
var selected_source;

setup_home_page()

function setup_home_page(){
  var colors = [
    "#e01951",
    "#2b4eff",
    "#00d4ff",
    "#00ff8c",
    "#e01951",
    "#2b4eff",
    "#34bbe6",
    "#00ff8c",
  ];  

  let h1 = document.getElementById("animated");
  h1.innerHTML = "Playlist"
    .split("")
    .map((letter) => {
      return `<span>` + letter + `</span>`;
    })
    .join("");
  
  Array.from(h1.children).forEach((span, index) => {
    setTimeout(() => {
      span.classList.add("wavy");
      span.style.color = colors[index];
    }, index * 60 + 200);
  });


  // TODO Change this into Jquery
  const first_page_buttons = [
    document.getElementById("first-screen-button spotify"),
    document.getElementById("first-screen-button youtube"),
  ];

  first_page_buttons[0].addEventListener("click", () => {
    selected_source = sources[0];
    change_screen(1, setup_input_page);
  });
  first_page_buttons[1].addEventListener("click", () => {
    selected_source = sources[1];
    change_screen(1, setup_input_page);
  });

  setTimeout(() => { 
    remove_loading_screen()
  }, 1100);
}

async function setup_input_page() {
  var spotify_colors = ["#54fc8e", "#1DB954"];
  var youtube_colors = ["#F05050", "#ff0000"];
  var color = [];
  
  if (selected_source == "Spotify") {
    color = spotify_colors;
  }
  if (selected_source == "Youtube") {
    color = youtube_colors;
    $("#title").text("Youtube Playlist").css("color", color[1])
    $("#sub-text").text("Copy your Youtube playlist URL and paste here:")
  }

  playlist_input = document.getElementById("playlist-input");
  var load_button = document.getElementById("load-button");
  load_button.style.backgroundColor = color[0];
  
  playlist_input.addEventListener("input", (event) => {
    if (playlist_input.value.length > 50) {
      $("#load-button").css("backgroundColor", `${color[1]}`)      
      load_button.disabled = false;
    } else if (playlist_input.value == "" && playlist_input.value.length == 0) {
      load_button.style.backgroundColor = color[0];
      load_button.disabled = true;
    }
  });

  load_button.addEventListener("click", () => {
    handle_load();
  });

  setTimeout(() => {
    remove_loading_screen()
  }, 500);
}

async function setup_playlist_page(track_array) {
  const svg_srcs = ["public/svg/spotify.svg", "public/svg/youtube.svg"]

  var songs_table = document.getElementById("songs-table");
  var submit_button = document.getElementById("submit-button");

  if (selected_source == "Youtube") {
    $("#img-0").attr("src", svg_srcs[1])
    $("#img-1").attr("src", svg_srcs[0])
  }

  submit_button.addEventListener("click", () => {
    var selected_songs = [];
    selected_songs.push(track_array[0]);

    Array.from(songs_table.children).forEach((element, index) => {
      if (element.children[1].checked != false) {
        selected_songs.push(track_array[index + 1]);
      }
    });

    if(selected_source == "Youtube"){
      create_loading_screen()
      transfer_playlist_yout(selected_songs)
    }else{
      create_loading_screen()
      transfer_playlist_spot(selected_songs)
    }
  });

  track_array.forEach((element, index) => {
    if (index == 0) {
      create_playlist_card(element, "#playlist-card", track_array.length - 1);
    } else {
      create_card(element, songs_table, 0, index);
    }
  });

  setTimeout(() => {
    remove_loading_screen()
    }, 1000);
}

async function transfer_playlist_spot(track_array) {
  var playlist_info = track_array[0];
  console.log(track_array)


  create_playlist_card(track_array[0], "#playlist-card", track_array.length - 1)

  if (
    !sessionStorage.getItem("google_oauth") ||
    new Date().getTime() - sessionStorage.getItem("google_expiration") > google_expiration_comparator
  ) {
    yout.get_youtube_oauth_token();
  }

  var check = setInterval(() => {
    if (sessionStorage.getItem("google_oauth")) {
      yout
        .make_youtube_playlist(
          playlist_info.playlist,
          playlist_info.description
        )
        .then((res) => {
          console.log(res)
          
          var playlist_id = res.data.id;
          track_array.shift();
          track_array.forEach((element, index) => {
            setTimeout(() => {
              yout.get_youtube_video_id(`${element.name} - ${element.artist}`).then((res) => {
                  yout.add_youtube_video_to_playlist(playlist_id, res).then((res) => {
                    console.log(res.data.snippet.thumbnails)

                    var ob = {playlistId: playlist_id, playlist_name: playlist_info.playlist, thumbUrl: res.data.snippet.thumbnails.default.url, playlistLen: track_array.length}
                    playlist_info = ob
                  });
              });
            }, 1600 * index);
          }); 

          setTimeout(() => {
            change_screen(3, setup_completed_page, playlist_info)
          }, 3000);

        });

      clearInterval(check);
    }
  }, 2000);
}

async function transfer_playlist_yout(track_array) {
  var playlist_info = track_array[0];

  create_playlist_card(track_array[0], "#playlist-card", track_array.length - 1)

  if(
    !sessionStorage.getItem("spotify_expiration")
    || new Date().getTime() - sessionStorage.getItem("spotify_expiration") > google_expiration_comparator
  ){
    spot.get_spotify_oauth_token()
  }

  var check = setInterval(() => {
    if(sessionStorage.getItem("spotify_oauth")) {
      spot.make_spotify_playlist(playlist_info.playlist, playlist_info.description)
      .then((res) => {
        spot.make_uris_array(track_array).then((uris) => {
          setTimeout(() => {
            spot.add_items_to_playlist(res.data.id, uris).then(() => {
              setTimeout(() => {
                spot.get_spotify_cover_img(res.data.id).then((img_res) => {
                  var ob = {playlistId: res.data.id, playlist_name: playlist_info.playlist, thumbUrl: img_res[0].url, playlistLen: track_array.length - 1}
                  change_screen(4, setup_completed_page, ob)
                })
              }, 2000);
            })
          }, 1000);
        })

        setTimeout(() => {
        }, 1000);
        clearInterval(check)
      })
    }
  }, 2000);
}

async function setup_completed_page(playlist_info){
  var playlist_link
  if (selected_source == "Spotify") {
    playlist_link = `https://www.youtube.com/playlist?list=${playlist_info.playlistId}`
  }
  if (selected_source == "Youtube") {
    playlist_link = `https://open.spotify.com/playlist/${playlist_info.playlistId}`
    $("#fifth-first-svg").attr("src", "../svg/youtube.svg")
    $("#fifth-second-svg").attr("src", "../svg/spotify.svg")
  }else {
    playlist_link = `https://www.youtube.com/playlist?list=${playlist_info.playlistId}`
  }

  $("#fifth-title").text(playlist_info.playlist_name)
  $("#fifth-tracklen").text(`${playlist_info.playlistLen} Songs`)
  $("#fifth-image").attr("src", playlist_info.thumbUrl)
  $(".fifth-link").attr("href", playlist_link)
  $(".fifth-copy-button").click(function() {
    copy_to_clipboard(playlist_link)
  })
  $("#fifth-convert-button").click(function() {
    change_screen(0, setup_home_page)
  })
  
  remove_loading_screen()
}


// I still love this
async function change_screen(screen_index, callback, parameters = {}) {
  create_loading_screen()

  $("#main-content").load(screens[screen_index], "", () => {
    setTimeout(() => {
      if (parameters != null) {
        callback(parameters);
      } else {
        callback();
      }
    }, 300);
  });
}

// FIX This stuff is bad and doens't actually handle errors
async function handle_load() {
  if (selected_source == "Spotify") {
    var array = await spot.make_spotify_track_array();
    if(array == "Failed"){
      custom_alert("Playlist is private or URL is incorrect")
    }else{
      change_screen(2, setup_playlist_page, array);
    }
  }
  if (selected_source == "Youtube") {

    var array = await yout.make_youtube_track_array();
    if(array == "Failed"){
      custom_alert("Playlist is private or URL is incorrect")
    }else{
      change_screen(2, setup_playlist_page, array)
    }
  }
}

// test

function create_card(element, parent, option, index = 0) {
  if (option == 0) {
    var card = `
    <div target="_blank" class="base-track track">
      <img class="track-image" src="${element.cover}" />
      <input class="checkbox" type="checkbox" checked>
      <div class="card-text-container"> 
        <a href="https://open.spotify.com/track/${element.id}" class="title-anchor">
            <p class="title" style="user-select: none;">${element.name}<br>${element.artist}</p>
        </a>
      </div>
    </div>
    `;
  } else {
    var card = `
    <div target="_blank" class="base-track track">
      <img class="track-image"
          src="${element.cover}" />
  
      <p class="transfer-result" id="index-${index}">-</p>
      <div class="card-text-container"> 
        <p class="title" style="user-select: none;">${element.name}<br>${element.artist}</p>
      </div>  
      <div class="bar-animation"></div>
    </div>
    `;
  }

  $(parent).append(card);
}

function create_playlist_card(element, container, length) {
  var playlist = `
  <a href="https://open.spotify.com/playlist/${element.id}" target="_blank">
    <img class="track-image" src="${element.album}"/>
  </a>
  <div class="card-text-container"> 
    <p class="title">${element.playlist}<br>${length} songs</p>
  </div>
  `;

  $(container).html(playlist);
}

function custom_alert(msg) {
  $("#custom-alert-text").text(msg)
  $("#custom-alert").fadeTo(300, 1)
  setTimeout(() => {
    $("#custom-alert").fadeTo(300, 0)
    setTimeout(() => {
      $("#custom-alert").css("display", "none")
    }, 300);
  }, 1200);
}

async function copy_to_clipboard(string) {
  await navigator.clipboard.writeText(string)
  custom_alert("Copied to Clipboard!")
}

function remove_loading_screen() {
  $(".loader").remove() 
}

function create_loading_screen() {
  $("#loader").load(screens[4])
} 

remove_loading_screen()