
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
