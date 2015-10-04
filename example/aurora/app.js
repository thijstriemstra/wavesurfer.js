'use strict';

// Create an instance
var wavesurfer = Object.create(WaveSurfer);

// Init & load
document.addEventListener('DOMContentLoaded', function () {
    wavesurfer = WaveSurfer.create({
        container: document.querySelector('#waveform'),
        // select the Aurora.js backend
        backend: 'Aurora'
    });

    // Check for errors
    wavesurfer.on('error', function(err){
        console.log('error', err);
    });

    // Load audio from URL
    wavesurfer.load('../media/stereo.mp3');

    // Play/pause on button press
    document.querySelector('[data-action="play"]').addEventListener(
        'click', wavesurfer.playPause.bind(wavesurfer)
    );

    // Drag'n'drop
    var toggleActive = function (e, toggle) {
        e.stopPropagation();
        e.preventDefault();
        if (e.target && e.target.classList) {
            toggle ? e.target.classList.add('wavesurfer-dragover') :
                e.target.classList.remove('wavesurfer-dragover');
        }
        
    };

    var handlers = {
        // Drop event
        drop: function (e) {
            toggleActive(e, false);

            // Load the file into wavesurfer
            if (e.dataTransfer.files.length) {
                wavesurfer.loadBlob(e.dataTransfer.files[0]);
            } else {
                wavesurfer.fireEvent('error', 'Not a file');
            }
        },

        // Drag-over event
        dragover: function (e) {
            toggleActive(e, true);
        },

        // Drag-leave event
        dragleave: function (e) {
            toggleActive(e, false);
        }
    };

    var dropTarget = document.querySelector('#drop');
    Object.keys(handlers).forEach(function (event) {
        dropTarget.addEventListener(event, handlers[event]);
    });
});
