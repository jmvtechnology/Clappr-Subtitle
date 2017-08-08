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

    var BLOCK_REGEX = /[0-9]+(?:\r\n|\r|\n)([0-9]{2}:[0-9]{2}:[0-9]{2}(?:,|\.)[0-9]{3}) --> ([0-9]{2}:[0-9]{2}:[0-9]{2}(?:,|\.)[0-9]{3})(?:\r\n|\r|\n)((?:.*(?:\r\n|\r|\n))*?)(?:\r\n|\r|\n)/g;

    window.ClapprSubtitle = Clappr.CorePlugin.extend({

        subtitles : [],

        element : null,

        active : false,

        options : {
            src : null,
            auto : false,
            backgroundColor : 'rgba(0, 0, 0, .8)',
            color : '#FFF',
            fontSize : '16px',
            fontWeight : 'bold',
            textShadow : 'rgb(0,0,0) 2px 2px 2px',
        },

        lastMediaControlButtonClick : new Date(),

        /**
         * @constructor
         */
        initialize : function() {

            this.subtitles = [];
            
            // register polyfills
            this.polyfill();

            // check options
            if (!'subtitle' in this._options)
                return;

            var options = this._options.subtitle;
 
            // override src and style
            // if 'options' is object
            if (typeof(options) === "object") {
                if('src' in options)
                    this.options.src = options.src;

                if('auto' in options) {
                    this.options.auto = options.auto === true;
                    if(this.options.auto) {
                        this.active = true;
                    }
                }
                
                if('backgroundColor' in options)
                    this.options.backgroundColor = options.backgroundColor;

                if('color' in options)
                    this.options.color = options.color;
                
                if('fontSize' in options)
                    this.options.fontSize = options.fontSize;
                
                if('fontWeight' in options)
                    this.options.fontWeight = options.fontWeight;

                if('textShadow' in options)
                    this.options.textShadow = options.textShadow;

            // override src if 'options' is string
            } else if (typeof(options) === "string") {
                this.options.src = options;
                this.options.auto = true;
            } else {
                return;
            }

            // initialize subtitle on DOM
            this.initializeElement();

            // fetch subtitles
            this.fetchSubtitle(this.onSubtitlesFetched.bind(this));
        },

        /**
         * Add event listeners
         */
        bindEvents : function() {
            this.listenTo(this.core, Clappr.Events.CORE_CONTAINERS_CREATED, this.containersCreated);
            this.listenTo(this.core.mediaControl, Clappr.Events.MEDIACONTROL_RENDERED, this.addButtonToMediaControl);
            this.listenTo(this.core.mediaControl, Clappr.Events.MEDIACONTROL_SHOW, this.onMediaControlShow);
            this.listenTo(this.core.mediaControl, Clappr.Events.MEDIACONTROL_HIDE, this.onMediaControlHide);
            this.listenTo(this.core.mediaControl, Clappr.Events.MEDIACONTROL_CONTAINERCHANGED, this.onContainerChanged);
        },

        /**
         * Add event listeners after containers were created
         */
        containersCreated : function() {
            // append element to container
            this.core.containers[0].$el.append(this.element);
            // run
            this.listenTo(this.core.containers[0].playback, Clappr.Events.PLAYBACK_TIMEUPDATE, this.run);
        },

        /**
         * On container changed
         */
        onContainerChanged : function() {
            // container changed is fired right off the bat
            // so we should bail if subtitles aren't yet loaded
            if (this.subtitles.length === 0)
                return;
            
            // kill the current element
            this.element.parentNode.removeChild(this.element);

            // clear subtitles
            this.subtitle = [];

            // initialize stuff again
            this.initialize();

            // trigger containers created
            this.containersCreated();
        },

        /**
         * Subtitles fetched
         */
        onSubtitlesFetched : function(data) {
            // parse subtitle
            this.parseSubtitle(data);
        },

        /**
         * Polyfill
         */
        polyfill : function() {
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
        },

        /**
         * AJAX request to the subtitles source
         * @param {function} callback
         */
        fetchSubtitle : function(cb) {
            var r = new XMLHttpRequest();
            r.open("GET", this.options.src, true);
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
        },

        /**
         * Parse subtitle
         * @param {string} data
         */
        parseSubtitle : function(datas) {
            
            // Get blocks and loop through them
            blocks = datas.match(BLOCK_REGEX);
            
            for(var i = 0; i < blocks.length; i++) {

                var startTime = null;
                var endTime = null;
                var text = "";

                // Break the block in lines
                var block = blocks[i];
                var lines = block.split(/(?:\r\n|\r|\n)/);

                // The second line is the time line.
                // We parse the start and end time.
                var time = lines[1].split(' --> ');
                var startTime = this.humanDurationToSeconds(time[0].trim());
                var endTime = this.humanDurationToSeconds(time[1].trim());

                // As for the rest of the lines, we loop through
                // them and append the to the text,
                for (var j = 2; j < lines.length; j++) {
                    var line = lines[j].trim();
                    
                    if (text.length > 0) {
                        text += "<br />";
                    }

                    text += line;
                }

                // Then we push it to the subtitles
                this.subtitles.push({
                    startTime: startTime,
                    endTime: endTime,
                    text: text
                });    
            }
        },

        /**
         * Converts human duration time (00:00:00) to seconds
         * @param {string} human time
         * @return {float}
         */
        humanDurationToSeconds : function(duration) {
            duration = duration.split(":");

            var hours = duration[0],
                minutes = duration[1],
                seconds = duration[2].replace(",", ".");

            var result = 0.00;
            result += parseFloat(hours) * 60 * 60;
            result += parseFloat(minutes) * 60;
            result += parseFloat(seconds);

            return result;
        },

        /**
         * Initializes the subtitle on the dom
         */
        initializeElement : function() {
            var el = document.createElement('div');
            el.style.display = 'block';
            el.style.position = 'absolute';
            el.style.left = '50%';
            el.style.bottom = '50px';
            el.style.color = this.options.color;
            el.style.backgroundColor = this.options.backgroundColor;
            el.style.fontSize = this.options.fontSize;
            el.style.fontWeight = this.options.fontWeight;
            el.style.textShadow = this.options.textShadow;
            el.style.transform = 'translateX(-50%)';
            el.style.boxSizing = 'border-box';
            el.style.padding = '7px';
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            el.style.maxWidth = '90%';
            el.style.whiteSpace = 'normal';
            el.style.zIndex = 1;
            this.element = el;
        },

        /**
         * Add button to media control
         */
        addButtonToMediaControl : function() {
            var bar = this.core
                          .mediaControl
                          .$el
                          .children('.media-control-layer')
                          .children('.media-control-right-panel');
            
            // create icon
            var button = document.createElement('button');
            button.classList.add('media-control-button');
            button.classList.add('media-control-icon');
            button.classList.add('media-control-subtitle-toggler');
            button.innerHTML = this.getMediaControlButtonSVG();
            
            // if active, glow
            if(this.active)
                button.style.opacity = '1';
            
            // append to bar
            bar.append(button);

            // add listener
            this.core.$el.on('click', this.onMediaControlButtonClick.bind(this));
        },

        /**
         * Button SGV
         * @return {string}
         */
        getMediaControlButtonSVG : function() {
            return '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve" style="pointer-events: none">' +
                    '<metadata> Svg Vector Icons : http://www.onlinewebfonts.com/icon </metadata>' + 
                    '<g><path d="M893.4,599V500H401.1V599H893.4z M893.4,794.5v-98.9H695.5v98.9H893.4z M598.9,794.5v-98.9H106.6v98.9H598.9z M106.6,500V599h197.8V500H106.6z M893.4,106.7c26.1,0,48.7,10,67.9,29.9s28.8,42.9,28.8,69v588.9c0,26.1-9.6,49.1-28.8,69c-19.2,19.9-41.8,29.9-67.9,29.9H106.6c-26.1,0-48.7-10-67.9-29.9c-19.2-19.9-28.8-42.9-28.8-69V205.5c0-26.1,9.6-49.1,28.8-69s41.8-29.9,67.9-29.9H893.4z"/></g>' + 
                    '</svg>';
        },

        /**
         * on button click
         */
        onMediaControlButtonClick : function(mouseEvent) {
            // this is a bit of a hack
            // it's ugly, I know, but I have yet to figure out how the click events work
            // so I'm bailing if click's target does not have the class 'media-control-subtitle-toggler'
            // I used this class 'media-control-subtitle-toggler' to identify the right element
            if(!mouseEvent.target.classList.contains('media-control-subtitle-toggler'))
                return;

            // This is also a bit of a hack.
            // We are preventing double clicks by checking the time the last click happened
            // if it's less then 300 miliseconds ago, we bail
            if (new Date() - this.lastMediaControlButtonClick < 300)
                return;

            // update lastMediaControlButtonClick
            this.lastMediaControlButtonClick = new Date();

            // toggle active on/off
            if(this.active) {
                this.active = false;
                mouseEvent.target.style.opacity = '.5';
                this.hideElement();
            } else {
                this.active = true;
                mouseEvent.target.style.opacity = '1';
            }
        },


        /**
         * Hides the subtitle element
         */
        hideElement : function() {
            this.element.style.opacity = '0';
        },

        /**
         * Shows the subtitle element with text
         * @param {string} text
         */
        showElement : function(text) {
            if(!this.active)
                return;
            this.element.innerHTML = text;
            this.element.style.opacity = '1';
        },

        /**
         * Subtitle element moves up
         * to give space to the controls
         */
        onMediaControlShow : function() {
            if(this.element)
                this.element.style.bottom = '100px';
        },

        /**
         * Subtitle element moves down
         * when controls hide
         */
        onMediaControlHide : function() {
            if(this.element)
                this.element.style.bottom = '50px';
        },

        /**
         * Show subtitles as media is playing
         */
        run : function(time) {
            var subtitle = this.subtitles.find(function(subtitle) {
                return time.current >= subtitle.startTime && time.current <= subtitle.endTime
            });
            
            if(subtitle) {
                this.showElement(subtitle.text);
            } else {
                this.hideElement();
            }
        },

    });
})();
