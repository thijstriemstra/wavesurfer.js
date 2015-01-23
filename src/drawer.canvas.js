'use strict';

WaveSurfer.Drawer.Canvas = Object.create(WaveSurfer.Drawer);

WaveSurfer.util.extend(WaveSurfer.Drawer.Canvas, {
    /**
     * Create the elements for the waveform and cursor drawings.
     */
    createElements: function () {
        var waveCanvas = this.wrapper.appendChild(
            this.style(document.createElement('canvas'), {
                position: 'absolute',
                display: 'none',
                zIndex: 1
            })
        );
        this.waveCc = waveCanvas.getContext('2d');

        this.progressWave = this.wrapper.appendChild(
            this.style(document.createElement('wave'), {
                position: 'absolute',
                zIndex: 2,
                overflow: 'hidden',
                width: '0',
                height: this.params.height + 'px',
                borderRightStyle: 'solid',
                borderRightWidth: this.params.cursorWidth + 'px',
                borderRightColor: this.params.cursorColor
            })
        );

        if (this.params.waveColor != this.params.progressColor) {
            var progressCanvas = this.progressWave.appendChild(
                document.createElement('canvas')
            );
            this.progressCc = progressCanvas.getContext('2d');
        }

        var secondaryCanvas = this.wrapper.appendChild(
            this.style(document.createElement('canvas'), {
                position: 'absolute',
                zIndex: 3
            })
        );
        this.secondaryCc = secondaryCanvas.getContext('2d');

        // setting this here, because updateWidth changes the size of
        // the canvas which causes it to clear the waveform
        this.secondaryCc.canvas.width = this.getWidth();
        this.secondaryCc.canvas.height = this.params.height;
        this.style(this.secondaryCc.canvas, {width: this.getWidth() + 'px'});
    },

    /**
     * Update the width of the waveform and cursor canvas elements.
     */
    updateWidth: function () {
        var width = Math.round(this.width / this.params.pixelRatio);

        this.waveCc.canvas.width = this.width;
        this.waveCc.canvas.height = this.height;
        this.style(this.waveCc.canvas, { width: width + 'px'});

        if (this.progressCc) {
            this.progressCc.canvas.width = this.width;
            this.progressCc.canvas.height = this.height;
            this.style(this.progressCc.canvas, { width: width + 'px'});
        }

        this.clearWave();
    },

    /**
     * Clear the waveform and cursor drawings.
     */
    clearWave: function () {
        this.waveCc.clearRect(0, 0, this.width, this.height);
        if (this.progressCc) {
            this.progressCc.clearRect(0, 0, this.width, this.height);
        }
    },

    /**
     * Draw the waveform and cursor.
     */
    drawWave: function (peaks, max) {
        // A half-pixel offset makes lines crisp
        var $ = 0.5 / this.params.pixelRatio;

        var halfH = this.height / 2;
        var coef = halfH / max;
        var length = peaks.length;
        var scale = 1;
        if (this.params.fillParent && this.width != length) {
            scale = this.width / length;
        }

        this.waveCc.fillStyle = this.params.waveColor;
        if (this.progressCc) {
            this.progressCc.fillStyle = this.params.progressColor;
        }

        [ this.waveCc, this.progressCc ].forEach(function (cc) {
            if (!cc) { return; }

            cc.beginPath();
            cc.moveTo($, halfH);

            for (var i = 0; i < length; i++) {
                var h = Math.round(peaks[i] * coef);
                cc.lineTo(i * scale + $, halfH + h);
            }

            cc.lineTo(this.width + $, halfH);
            cc.moveTo($, halfH);

            for (var i = 0; i < length; i++) {
                var h = Math.round(peaks[i] * coef);
                cc.lineTo(i * scale + $, halfH - h);
            }

            cc.lineTo(this.width + $, halfH);
            cc.fill();

            // Always draw a median line
            cc.fillRect(0, halfH - $, this.width, $);
        }, this);
    },

    /**
     * Draw and append the waveform.
     */
    appendWave: function (peaks, max) {

        // draw wave
        this.drawWave(peaks, max);

        // append wave
        if (this.newWaveform === undefined) {

            if (this.frameCount === undefined) {
                // keeps track of current frame number
                this.frameCount = 0;
            }

            if (this.frameCount == 0) {
                // first frame is equal to first full waveform
                this.secondaryCc.drawImage(this.waveCc.canvas, 0, 0);

                // ready
                this.frameCount += 1;

            } else {
                // other frames need to scale and re-use previous content on canvas
                this.newWaveform = new Image();
                this.newWaveform.onload = function (event) {

                    this.originalWaveform = new Image();
                    this.originalWaveform.onload = function (event) {
                        // amount of pixels reserved on the left for appending
                        // the new waveform
                        var appendWidth = this.getWidth() / 10;

                        // clear existing waveform
                        this.secondaryCc.clearRect(0, 0, this.getWidth(), this.height);

                        // scale and redraw previous waveform
                        this.secondaryCc.drawImage(this.originalWaveform, appendWidth, 0,
                            this.getWidth() - appendWidth, this.height);

                        // place new waveform at the start
                        this.secondaryCc.drawImage(this.newWaveform,
                            0, 0, appendWidth, this.height);

                        // ready
                        this.frameCount += 1;
                        this.newWaveform = undefined;

                    }.bind(this);

                    // get an instance of the current image data that we can
                    // manipulate
                    this.originalWaveform.src = this.secondaryCc.canvas.toDataURL();

                }.bind(this);

                // load canvas wave
                this.newWaveform.src = this.waveCc.canvas.toDataURL();
            }
        }
    },

    /**
     * Update the position of the cursor.
     */
    updateProgress: function (progress) {
        var pos = Math.round(
            this.width * progress
        ) / this.params.pixelRatio;
        this.style(this.progressWave, { width: pos + 'px' });
    }
});
