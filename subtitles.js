/*!
 *
 *  ClapprSubtitle
 *  Copyright 2016 JMV Technology. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 */
(function() {

    var subtitles = [],
        element,
        self = null;

    /**
     * AJAX request to the subtitles source
     * @private
     * @param {string} url
     * @param {function} callback
     */
    function fetchSubtitle(url, cb) {
        var r = new XMLHttpRequest();
        r.open("GET", url, true);
        r.onreadystatechange = function () {
            // nothing happens if request
            // fails or is not ready
            if (r.readyState != 4 || r.status != 200)
                return;

            // callback
            if(cb)
                cb(r.responseText);
        };
        r.send();
    }

    /**
     * Parse subtitle
     * @private
     * @param {string} data
     */
    function parseSubtitle(data) {
        data = data.split("\n");

        var blockOpen = false,
            startTime,
            endTime,
            text = "";

        var line;
        for(var i = 0; i < data.length; i++) {
            line = data[i];

            // if block is not open
            if(!blockOpen) {
                // open block if it is
                // the first line of the block
                if(isFirstLineOfBlock(line)) {
                    blockOpen = true;
                }
            // if block is open
            } else {
                // set start and end time if
                // its the second line of the
                // block
                if(isSecondLineOfBlock(line)) {
                    line = line.split(" ");
                    startTime = humanDurationToSeconds(line[0]);
                    endTime = humanDurationToSeconds(line[2]);
                } else {
                    // if it's not the second line of the block
                    // not it has the time set, close block
                    if(!startTime || !endTime) {
                        blockOpen = false;
                        startTime = null;
                        endTime = null;
                        text = "";
                    } else {
                        // if start and end times are set
                        // and text contains text,
                        // save text
                        if(line.length > 0) {
                            // break line if text variable
                            // already contains text
                            if(text.length > 0)
                                text += "<br />";
                            
                            text = line;
                        } else {
                            // if it doesnt contain text
                            // close block
                            blockOpen = false;

                            // register new subtitle
                            subtitles.push({
                                startTime : startTime,
                                endTime : endTime,
                                text : text
                            });

                            // clear attributes
                            startTime = null;
                            endTime = null;
                            text = "";
                        }
                    }
                }
            }
        }
    }

    /**
     * Check if string given has the syntax of the first line of a block
     * @private
     * @private {string} line
     * @return {bool}
     */
    function isFirstLineOfBlock(line) {
        return Number(line) == line && line % 1 === 0;
    }

    /**
     * Check if string given has the syntax of the second line of a block
     * @private
     * @param {string} line
     * @return {bool}
     */
    function isSecondLineOfBlock(line) {
        return /^\d{2}\:\d{2}\:\d{2}\,\d{3}\ \-\-\>\ \d{2}\:\d{2}\:\d{2}\,\d{3}$/.test(line);
    }

    /**
     * Converts human duration time (00:00:00) to seconds
     * @private
     * @param {string} human time
     * @return {float}
     */
    function humanDurationToSeconds(duration) {
        duration = duration.split(":");

        var hours = duration[0],
            minutes = duration[1],
            seconds = duration[2].replace(",", ".");

        var result = 0.00;
        result += parseFloat(hours) * 60 * 60;
        result += parseFloat(minutes) * 60;
        result += parseFloat(seconds);

        return result;
    }


    /**
     * Polyfill
     * @private
     */
    function polyfill() {
        if (!Array.prototype.find) {
            Array.prototype.find = function(predicate) {
                if (this === null) {
                    throw new TypeError('Array.prototype.find called on null or undefined');
                }
                if (typeof predicate !== 'function') {
                    throw new TypeError('predicate must be a function');
                }
                var list = Object(this);
                var length = list.length >>> 0;
                var thisArg = arguments[1];
                var value;

                for (var i = 0; i < length; i++) {
                    value = list[i];
                    if (predicate.call(thisArg, value, i, list)) {
                        return value;
                    }
                }
                return undefined;
            };
        }
    }

    /**
     * Initializes the subtitle on the dom
     * @private
     */
    function initializeElement() {
        var el = document.createElement('div');
        el.style.display = 'block';
        el.style.position = 'absolute';
        el.style.left = '50%';
        el.style.bottom = '50px';
        el.style.color = '#FFF';
        el.style.backgroundColor = 'rgba(0, 0, 0, .8)';
        el.style.fontSize = '16px';
        el.style.fontWeight = 'bold';
        el.style.transform = 'translateX(-50%)';
        el.style.boxSizing = 'border-box';
        el.style.padding = '7px';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        el.style.maxWidth = '90%';
        element = el;
        self.container.el.appendChild(element);
    }

    /**
     * Hides the subtitle element
     * @private
     */
    function hideElement() {
        element.style.opacity = '0';
    }

    /**
     * Shows the subtitle element with text
     * @private
     * @param {string} text
     */
    function showElement(text) {
        element.innerHTML = text;
        element.style.opacity = '1';
    }

    /**
     * Subtitle element moves up
     * to give space to the controls
     * @private
     */
    function onMediaControlShow() {
        if(element)
            element.style.bottom = '100px';
    }

    /**
     * Subtitle element moves down
     * when controls hide
     * @private
     */
    function onMediaControlHide() {
        if(element)
            element.style.bottom = '50px';
    }

    /**
     * Show subtitles as media is playing
     * @private
     */
    function run(time) {
        var subtitle = subtitles.find(function(subtitle) {
            return time.current >= subtitle.startTime && time.current <= subtitle.endTime
        });
        
        if(subtitle) {
            showElement(subtitle.text);
        } else {
            hideElement();
        }
    }

    window.ClapprSubtitle = Clappr.UIContainerPlugin.extend({

        initialize : function() {
            self = this;
            
            // register polyfills
            polyfill();

            // check options
            if (!'subtitle' in this._options)
                return;

            // fetch subtitles
            fetchSubtitle(this._options.subtitle, function(data) {
                // parse subtitle
                parseSubtitle(data);

                // initialize subtitle on DOM
                initializeElement();
            });
        },

        bindEvents : function() {
            this.listenTo(this.container, Clappr.Events.CONTAINER_TIMEUPDATE, run);
            this.listenTo(this.container, Clappr.Events.CONTAINER_MEDIACONTROL_SHOW, onMediaControlShow);
            this.listenTo(this.container, Clappr.Events.CONTAINER_MEDIACONTROL_HIDE, onMediaControlHide);
        }

    });
})();