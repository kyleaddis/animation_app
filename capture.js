var state = {
      frames: [],
      isStreaming: false,
      isPlaying: false,
      currentPlayFrame: 0,
      fps: 12,
      projectName: 'Untitled Project',
      stream: null,
      playInterval: null,
      draggedIndex: null
    };

    var elements = {
      video: document.getElementById('video'),
      canvas: document.getElementById('canvas'),
      playbackImg: document.getElementById('playbackImg'),
      projectName: document.getElementById('projectName'),
      startCamera: document.getElementById('startCamera'),
      cameraControls: document.getElementById('cameraControls'),
      fpsSlider: document.getElementById('fpsSlider'),
      fpsValue: document.getElementById('fpsValue'),
      playBtn: document.getElementById('playBtn'),
      exportBtn: document.getElementById('exportBtn'),
      saveBtn: document.getElementById('saveBtn'),
      loadInput: document.getElementById('loadInput'),
      timeline: document.getElementById('timeline'),
      emptyState: document.getElementById('emptyState'),
      frameCount: document.getElementById('frameCount')
    };

    function startWebcam() {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then(function(stream) {
          state.stream = stream;
          elements.video.srcObject = stream;
          state.isStreaming = true;
          updateCameraControls();
        })
        .catch(function(err) {
          alert('Error accessing webcam: ' + err.message);
        });
    }

    function stopWebcam() {
      if (state.stream) {
        state.stream.getTracks().forEach(function(track) {
          track.stop();
        });
        elements.video.srcObject = null;
        state.stream = null;
        state.isStreaming = false;
        updateCameraControls();
      }
    }

    function updateCameraControls() {
      if (state.isStreaming) {
        elements.cameraControls.innerHTML = '<button id="captureBtn" class="green">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<line x1="12" y1="5" x2="12" y2="19"></line>' +
          '<line x1="5" y1="12" x2="19" y2="12"></line>' +
          '</svg> Capture</button>' +
          '<button id="stopCamera" class="red">Stop</button>';
        document.getElementById('captureBtn').addEventListener('click', captureFrame);
        document.getElementById('stopCamera').addEventListener('click', stopWebcam);
      } else {
        elements.cameraControls.innerHTML = '<button id="startCamera">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>' +
          '<circle cx="12" cy="13" r="4"></circle>' +
          '</svg> Start Camera</button>';
        document.getElementById('startCamera').addEventListener('click', startWebcam);
      }
    }

    function captureFrame() {
      var ctx = elements.canvas.getContext('2d');
      elements.canvas.width = elements.video.videoWidth || 640;
      elements.canvas.height = elements.video.videoHeight || 480;
      ctx.drawImage(elements.video, 0, 0);
      
      var imageData = elements.canvas.toDataURL('image/jpeg', 0.9);
      var newFrame = {
        id: Date.now() + Math.random(),
        data: imageData,
        timestamp: Date.now()
      };
      
      state.frames.push(newFrame);
      updateTimeline();
      updateControls();
    }

    function deleteFrame(id) {
      state.frames = state.frames.filter(function(f) {
        return f.id !== id;
      });
      updateTimeline();
      updateControls();
    }

    function updateTimeline() {
      elements.frameCount.textContent = state.frames.length;
      
      if (state.frames.length === 0) {
        elements.timeline.style.display = 'none';
        elements.emptyState.style.display = 'block';
      } else {
        elements.timeline.style.display = 'flex';
        elements.emptyState.style.display = 'none';
        
        elements.timeline.innerHTML = state.frames.map(function(frame, index) {
          return '<div class="frame" draggable="true" data-index="' + index + '">' +
            '<img src="' + frame.data + '" alt="Frame ' + (index + 1) + '">' +
            '<div class="frame-number">' + (index + 1) + '</div>' +
            '<button class="frame-delete" data-id="' + frame.id + '">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<polyline points="3 6 5 6 21 6"></polyline>' +
            '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
            '</svg></button></div>';
        }).join('');
        
        document.querySelectorAll('.frame-delete').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseFloat(btn.dataset.id);
            deleteFrame(id);
          });
        });
        
        document.querySelectorAll('.frame').forEach(function(frame) {
          frame.addEventListener('dragstart', handleDragStart);
          frame.addEventListener('dragover', handleDragOver);
          frame.addEventListener('drop', handleDrop);
          frame.addEventListener('dragend', handleDragEnd);
        });
      }
    }

    function handleDragStart(e) {
      state.draggedIndex = parseInt(e.currentTarget.dataset.index);
      e.currentTarget.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e) {
      e.preventDefault();
      var dropIndex = parseInt(e.currentTarget.dataset.index);
      
      if (state.draggedIndex !== null && state.draggedIndex !== dropIndex) {
        var removed = state.frames.splice(state.draggedIndex, 1)[0];
        state.frames.splice(dropIndex, 0, removed);
        updateTimeline();
      }
    }

    function handleDragEnd(e) {
      e.currentTarget.classList.remove('dragging');
      state.draggedIndex = null;
    }

    function updateControls() {
      var hasFrames = state.frames.length > 0;
      elements.playBtn.disabled = !hasFrames;
      elements.exportBtn.disabled = !hasFrames;
      elements.saveBtn.disabled = !hasFrames;
      elements.playBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">' +
        '<polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Play (' + state.frames.length + ' frames)';
    }

    function playAnimation() {
      if (state.frames.length === 0) return;
      
      state.isPlaying = true;
      state.currentPlayFrame = 0;
      elements.video.style.display = 'none';
      elements.playbackImg.style.display = 'block';
      
      elements.playBtn.textContent = 'Stop';
      elements.playBtn.classList.remove('green');
      elements.playBtn.classList.add('red');
      
      var frameIndex = 0;
      elements.playbackImg.src = state.frames[0].data;
      
      state.playInterval = setInterval(function() {
        frameIndex++;
        if (frameIndex >= state.frames.length) {
          frameIndex = 0;
        }
        state.currentPlayFrame = frameIndex;
        elements.playbackImg.src = state.frames[frameIndex].data;
      }, 1000 / state.fps);
    }

    function stopAnimation() {
      state.isPlaying = false;
      if (state.playInterval) {
        clearInterval(state.playInterval);
      }
      elements.video.style.display = 'block';
      elements.playbackImg.style.display = 'none';
      
      elements.playBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">' +
        '<polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Play (' + state.frames.length + ' frames)';
      elements.playBtn.classList.remove('red');
      elements.playBtn.classList.add('green');
    }

    function saveProject() {
      var project = {
        name: state.projectName,
        frames: state.frames,
        fps: state.fps,
        savedAt: new Date().toISOString()
      };
      
      var blob = new Blob([JSON.stringify(project)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = state.projectName + '.json';
      a.click();
      URL.revokeObjectURL(url);
    }

    function loadProject(e) {
      var file = e.target.files[0];
      if (!file) return;
      
      var reader = new FileReader();
      reader.onload = function(event) {
        try {
          var project = JSON.parse(event.target.result);
          state.frames = project.frames || [];
          state.fps = project.fps || 12;
          state.projectName = project.name || 'Loaded Project';
          elements.projectName.value = state.projectName;
          elements.fpsSlider.value = state.fps;
          elements.fpsValue.textContent = state.fps;
          updateTimeline();
          updateControls();
        } catch (err) {
          alert('Error loading project: ' + err.message);
        }
      };
      reader.readAsText(file);
    }

    function exportVideo() {
      if (state.frames.length === 0) {
        alert('No frames to export');
        return;
      }

      var canvas = document.createElement('canvas');
      var firstFrame = new Image();
      firstFrame.src = state.frames[0].data;
      
      firstFrame.onload = function() {
        canvas.width = firstFrame.width;
        canvas.height = firstFrame.height;
        var ctx = canvas.getContext('2d');

        var stream = canvas.captureStream(state.fps);
        var mediaRecorder = new MediaRecorder(stream, { 
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 2500000
        });
        
        var chunks = [];
        mediaRecorder.ondataavailable = function(e) {
          chunks.push(e.data);
        };
        
        mediaRecorder.onstop = function() {
          var blob = new Blob(chunks, { type: 'video/webm' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = state.projectName + '.webm';
          a.click();
          URL.revokeObjectURL(url);
        };

        mediaRecorder.start();

        var frameIndex = 0;
        function processFrame() {
          if (frameIndex >= state.frames.length) {
            mediaRecorder.stop();
            return;
          }
          
          var img = new Image();
          img.src = state.frames[frameIndex].data;
          img.onload = function() {
            ctx.drawImage(img, 0, 0);
            frameIndex++;
            setTimeout(processFrame, 1000 / state.fps);
          };
        }
        
        processFrame();
      };
    }

    elements.projectName.addEventListener('input', function(e) {
      state.projectName = e.target.value;
    });

    elements.fpsSlider.addEventListener('input', function(e) {
      state.fps = parseInt(e.target.value);
      elements.fpsValue.textContent = state.fps;
    });

    elements.playBtn.addEventListener('click', function() {
      if (state.isPlaying) {
        stopAnimation();
      } else {
        playAnimation();
      }
    });

    elements.exportBtn.addEventListener('click', exportVideo);
    elements.saveBtn.addEventListener('click', saveProject);
    elements.loadInput.addEventListener('change', loadProject);
    elements.startCamera.addEventListener('click', startWebcam);

    window.addEventListener('beforeunload', function() {
      if (state.stream) {
        state.stream.getTracks().forEach(function(track) {
          track.stop();
        });
      }
      if (state.playInterval) {
        clearInterval(state.playInterval);
      }
    });