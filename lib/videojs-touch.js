/*! videojs-touch - v0.0.0 - 2015-11-26
 * Copyright (c) 2015 Hervé BREDIN
 * Licensed under the Apache-2.0 license. */
(function(window, videojs) {
  'use strict';

  var defaults = {};
  /**
   * Initialize the plugin.
   * @param options (optional) {object} configuration for the plugin
   */
  var touch = function(controls,data,drawing,debug,options) {
    //controls={'singletap':function(event){console.log('event':event.type)},'doubletap':function(event){console.log('event':event.type)},'pan':function(event){console.log('event':event.type)}}

    var settings = videojs.mergeOptions(defaults, options);
    var player = this;
    var video = player.el();
    //prepares the drawing board if needed
    // sets the precision of the relative coordinates
    data=data||{};
    data['round']=data['round']||1000;
    // see "how to maintain the aspect ratio of a div using only CSS
    // http://stackoverflow.com/questions/1495407/how-to-maintain-the-aspect-ratio-of-a-div-using-only-css
    var setAspectRatio = function() {
      console.log('loadedmetadata');
      video.className += " vjs-touch-player";

    var parent = video.parentNode;
    var videoHeight = player.videoHeight();
    var videoWidth = player.videoWidth();
    var overlay = document.createElement('div');
    if(drawing||debug){
      this.draw=SVG('drawing').size(videoWidth,videoHeight);
      var draw=this.draw
    }
    // add touch overlay on top of player
    overlay.id = 'interactivePlayer';
    overlay.style.paddingBottom = 100 * videoHeight / videoWidth + "%";

    parent.replaceChild(overlay, video);
    overlay.appendChild(video);


    // add touch overlay on top of player
    var touchLayer = document.createElement('div');
    touchLayer.id = 'interaction';
    overlay.appendChild(touchLayer);
    var hammerOptions = {};

    // add Hammer to touch overlay
    var hammer = new Hammer.Manager(overlay,hammerOptions);
    // Tap recognizer with a minimal of 2 taps
    hammer.add( new Hammer.Tap({ event: 'doubletap', taps: 2, interval:500, posThreshold:50 }) );
    // Single tap recognizer
    hammer.add( new Hammer.Tap({ event: 'singletap' }) );
    // Pan recognizer
    hammer.add(new Hammer.Pan({event:'pan', threshold:1}));
    // Pinch recognizer
    hammer.add(new Hammer.Pinch({event:'pinch'}))

    // we want to recognize this simulatenously, so a doubletap will be detected even while a tap has been recognized.
    hammer.get('doubletap').recognizeWith('singletap');
    // we only want to trigger a tap when we don't have detected a doubletap
    hammer.get('singletap').requireFailure('doubletap');
    // we don't want to trigger a pan at the end of a pinch
    hammer.get('pan').requireFailure('pinch')

    /**
    * If debug is true (by default false), functions for singletap,doubletap,panstart,panend are replaced by base functions.
    */

    if (debug){
      // var drawing = document.createElement('div');
      // drawing.setAttribute('id','drawing');
      data['doround']=false;
      var start=[0,0,0];
      var circle=draw.circle(this.videoHeight()/20).fill({color:'#f06',opacity:0});
      var arrow=draw.line(0,0,100,100).stroke({color:'#f06',opacity:0,width:10});

      controls['singletap']=function(event){
        circle.center(event.center.x,event.center.y);
        circle.animate(500).fill({opacity:0.8}).animate(500).fill({opacity:0});
        console.log({'type': event.type,
                      'x': event.center.x/width,
                      'y': event.center.y/height,
                      'currentTime': player.currentTime()});
        }
      controls['doubletap']=function() {
        console.log('doubletap');
        if (player.paused()) {
          player.play()
        } else {
          player.pause()
        }
      }
      controls['panstart']=function(event) {
          height = touchLayer.clientHeight;
          width = touchLayer.clientWidth;
          start=[event.center.x,event.center.y,player.currentTime()]
            console.log({'type': event.type,
                         'x': event.center.x/width,
                         'y': event.center.y/height,
                         'currentTime': player.currentTime()});
      }
      controls['panend']=function(event) {
        height = touchLayer.clientHeight;
        width = touchLayer.clientWidth;
          console.log({'type': event.type,
                       'x': event.center.x,
                       'y': event.center.y,
                       'currentTime': player.currentTime(),'delta':player.currentTime()-start[2]<3});
        if (player.currentTime()-start[2]<2) {
          arrow.plot(start[0],start[1],event.center.x,event.center.y).animate(500).stroke({opacity:0.8}).animate(1000).stroke({opacity:0});
        }
      }
    }
    this.height = overlay.clientHeight;
    var height=this.height
    this.width = overlay.clientWidth;
    var width=this.width
    player.xy = function(touch) {

      var top = overlay.clientTop;
      var left = overlay.clientLeft;

      var position = {};
      position.x = (touch.clientX - left) / width;
      position.y = (touch.clientY - top) / height;

      return position;
    };

    function _normalizeAndTrigger(event) {
      return function(event,eventType) {
      if (data['doround']){
        event.center.x=Math.round(event.center.x/width*data['round'])/data['round'];
        event.center.y=Math.round(event.center.y/height*data['round'])/data['round'];
      }
      player.trigger(event);
      };
    };

    var eventList=Object.keys(controls);
    for (var i = 0; i < eventList.length; i++) {
      var eventType = eventList[i];
      hammer.on(eventType, _normalizeAndTrigger(event));
      player.on(eventType,controls[eventType]);
    };

    player.play()
  };
  player.on('loadedmetadata', setAspectRatio);
  };
  document.ontouchmove = function(event){
    event.preventDefault();
  }
  // register the plugin
  videojs.plugin('touch', touch);

})(window, window.videojs);
