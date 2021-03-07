var PUBIE = function () {
  'use strict';

  var canvas = document.createElement('canvas');
  var stage = canvas.getContext('2d');
  var info = {
    version: 'v0.1',
    authors: ['Literal Line'],
    width: 640,
    height: 480,
    widthCSS: '640px',
    heightCSS: '480px',
    bg: '#C0C0C0',
    aa: false,
    fps: 30
  };

  var controls = {};

  var PAUSE;
  var setPause = function (bool) {
    if (bool) {
      PAUSE = true;
      keys = {};
      for (var a in playing) playing[a].pause();
    } else {
      PAUSE = false;
      for (var a in playing) playing[a].play();
    }
  };

  var keys = {};
  var initEventListeners = function () {
    window.addEventListener('keydown', function (e) {
      for (var c in controls) if (controls[c] === e.code) e.preventDefault();
      keys[e.code] = true;
    });
    window.addEventListener('keyup', function (e) {
      delete keys[e.code];
    });
    window.addEventListener('blur', function () { setPause(true); });
    window.addEventListener('focus', function () { setPause(false); });
  };

  var initCanvas = function () {
    canvas.width = info.width;
    canvas.height = info.height;
    canvas.style.width = info.widthCSS;
    canvas.style.height = info.heightCSS;
    canvas.style.background = info.bg;
    canvas.style.display = 'block';
    canvas.style.margin = 'auto';
    canvas.style.imageRendering = info.aa ? 'auto' : 'pixelated';
    canvas.style.imageRendering = info.aa ? 'auto' : '-moz-crisp-edges';
    stage.imageSmoothingEnabled = info.aa;
  };

  var init = function () {
    initEventListeners();
    initCanvas();
    document.body.appendChild(canvas);
    console.log('pubie.js ' + info.version);
    console.log('by ' + info.authors);
    requestAnimationFrame(game.loop);
    setInterval(function () { assets.audio.silence.play(); }, 1000 / 60);
  };

  var playing = {};

  var GameAudio = function (src) {
    this.audio = document.createElement('audio');
    this.audio.src = src;
    this.audio.volume = 0.5;
    this.loop = false;
    var self = this;
    this.audio.addEventListener('ended', function () {
      if (self.loop) {
        self.audio.play();
      } else {
        delete playing[self.audio.src];
      }
    });
  };

  GameAudio.prototype.play = function (time) {
    playing[this.audio.src] = this.audio;
    if (typeof time !== 'undefined') {
      this.audio.pause();
      this.audio.currentTime = time;
    }
    this.audio.play();
  };

  GameAudio.prototype.stop = function () {
    this.audio.pause();
    this.audio.currentTime = 0;
    delete playing[this.audio.src];
  };

  var assets = {
    textures: {
      pubie: createTexture('./assets/pubie.png')
    },
    audio: {
      silence: new GameAudio('assets/5-seconds-of-silence.mp3')
    }
  };

  var game = (function () {
    var STATE = 'play';
    var LEVEL = 0;
    var timer = 0;

    var play = (function () {
      //

      return function (level) {
        stage.font = '8px MS Sans Serif';
        stage.fillText('hello', 250.5, 250.5);
        stage.drawImage(assets.textures.pubie, 0, 0);
        stage.drawImage(textCanvas, 0, 0, info.width - 64, info.height);
      }
    })();

    var delta = 0;
    var then = 0;
    var interval = 1000 / info.fps;

    return {
      loop: function (now) {
        if (!then) then = now;
        requestAnimationFrame(game.loop);
        delta = now - then;

        if (delta > interval) {
          if (!PAUSE) {
            canvas.style.filter = 'brightness(100%)';
            stage.clearRect(0, 0, canvas.width, canvas.height);
            switch (STATE) {
              case 'play':
                play(LEVEL);
                break;
              default:
                throw ('Error: requested state does not exist!');
            }
            timer++;
          } else {
            canvas.style.filter = 'brightness(33.33%)';
            stage.fillText('PAUSED', 50, 50);
          }
          then = now - (delta % interval);
        }
      }
    }
  })();

  return {
    init: init
  }
};


// misc functions

function rndInt(max) {
  return Math.floor(Math.random() * max);
}

function repeatChar(char, amt) {
  return new Array(amt + 1).join(char);
}

function requestText(url, callback) {
  var r = new XMLHttpRequest();
  r.open('GET', url);
  r.onload = function () { callback(r.responseText); };
  r.send();
};

function createTexture(src) {
  var img = document.createElement('img');
  img.src = src;
  return img;
}

function convertBase(value, fromBase, toBase) {
  var range = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/'.split('');
  var fromRange = range.slice(0, fromBase);
  var toRange = range.slice(0, toBase);

  var decValue = value.split('').reverse().reduce(function (carry, digit, index) {
    if (fromRange.indexOf(digit) === -1) throw new Error('Invalid digit `' + digit + '` for base ' + fromBase + '.');
    return carry += fromRange.indexOf(digit) * (Math.pow(fromBase, index));
  }, 0);

  var newValue = '';
  while (decValue > 0) {
    newValue = toRange[decValue % toBase] + newValue;
    decValue = (decValue - (decValue % toBase)) / toBase;
  }
  return newValue || '0';
}
