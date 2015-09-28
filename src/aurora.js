'use strict';

WaveSurfer.Aurora = Object.create(WaveSurfer.WebAudio);

WaveSurfer.util.extend(WaveSurfer.Aurora, {
    init: function (params) {
        this.params = params;

        // Dummy media to catch errors
        this.media = {
            currentTime: 0,
            duration: 0,
            paused: true,
            playbackRate: 1,
            play: function () {},
            pause: function () {}
        };

        this.mediaType = params.mediaType.toLowerCase();
    },

    load: function (buffer, callback) {
        this.onPlayEnd = null;
        this.buffer = null;

        var my = this;

        this.media = AV.Player.fromBuffer(buffer);
        this.media.on('error', function(err) {
            my.fireEvent('error', err);
        });
        this.media.on('buffer', function(event) {
            if (event == 100) {
                my.fireEvent('canplay');
            }
        });
        this.media.on('end', function() {
            my.fireEvent('finish');
        });
        this.media.on('progress', function(msecs) {
            if (msecs >= my.getDuration()) {
                my.pause();
                my.seekTo(0);
            } else {
                my.fireEvent('audioprocess', msecs);
            }
        });

        this.media.asset.decodeToBuffer(callback);
    },

    isPaused: function () {
        return !this.media || !this.media.playing;
    },

    getDuration: function () {
        return this.media && this.media.duration;
    },

    getCurrentTime: function () {
        return this.media && this.media.currentTime;
    },

    getPlayedPercents: function () {
        return (this.getCurrentTime() / this.getDuration()) || 0;
    },

    setPlaybackRate: function (value) {
        // not supported
        this.playbackRate = 1;
    },

    seekTo: function (start) {
        if (start != null) {
            this.media.seek(start);
        }

        return { start: start };
    },

    play: function (start, end) {
        this.seekTo(start);
        this.media.play();
        this.fireEvent('play');
    },

    /**
     * Pauses the loaded audio.
     */
    pause: function () {
        this.media && this.media.pause();
        this.fireEvent('pause');
    },

    getPeaks: function (length, callback) {
        if (this.buffer) {
            return WaveSurfer.WebAudio.getPeaks.call(this, length);
        }
        return this.peaks || [];
    },

    decodeArrayBuffer: function (arraybuffer, callback, errback) {
        callback(arraybuffer);
    },

    getVolume: function () {
        return this.media.volume;
    },

    setVolume: function (val) {
        this.media.volume = val;
    },

    destroy: function () {
        this.pause();
        this.unAll();

        if (this.media !== null) {
            this.media.stop();
            this.media = null;
        }
    }
});
