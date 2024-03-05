function check_orientation() {
    console.log(screen.orientation.type)
}

document.onkeyup = function(ev) {
    // R pressed
    if(ev.key == "r"){
        check_orientation()
    }
    if(ev.key == "l"){
        $("#loader").load("screens/loading-screen.html")
    }
    // 
  
}
