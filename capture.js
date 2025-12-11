(function() {
  // Set the captured photo width and height - note that height will be
  // calculated from the input stream aspect ratio.

  let width = 1080; // Scale the photo width to this
  let height = 0;     // To be computed from the input stream

  let streaming = false;

  function startup() {

    navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then(function(stream) {
      video.srcObject = stream;
      video.play();
    })
    .catch(function(err) {
      console.log("An error occurred: " + err);
    });

    video.addEventListener('canplay', function(ev){
      if (!streaming) {
        height = video.videoHeight / (video.videoWidth/width);
      
        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.
      
        if (isNaN(height)) {
          height = width / (4/3);
        }
      
        video.setAttribute('width', width);
        video.setAttribute('height', height);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
      }
    }, false);

    startbutton.addEventListener('click', function(ev){
      takepicture();
      ev.preventDefault();
    }, false);
    
    clearphoto();
  }

  // Store a reference to the offscreen canvas, for the functions below

  const context = canvas.getContext('2d');
  
  // A blank filled box indicates that no photo has been captured
  
  function clearphoto() {
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    let data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);
  }
  
  // Fetch the current video contents, draw it to a (offscreen) canvas, then
  // convert that to a PNG format data URL. The offscreen canvas allows us to
  // change its size and/or apply other changes before drawing it.
  
  function takepicture() {
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
    
      let data = canvas.toDataURL('image/png');
      photo.setAttribute('src', data);
    } else {
      clearphoto();
    }
  }

  // This event listener runs the startup process once loading is complete.
  
  window.addEventListener('load', startup, false);
})();

