// pubie.js by Literal Line
// original game by hoylecake (https://hoylecake.com/pubie/)
// more at quique.gq

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

  var keys = {};
  var controls = {
    ok: 'Enter',
    up: 'KeyW',
    down: 'KeyS',
    right: 'KeyD',
    left: 'KeyA'
  };
  var playing = {};

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

  var requestText = function (url, callback) {
    var r = new XMLHttpRequest();
    r.open('GET', url);
    r.onload = function () { callback(r.responseText); };
    r.send();
  };

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

  var initAssets = function (obj) {
    var checkReady = setInterval(function () {
      var list = [];
      for (var t in obj.textures) list.push(obj.textures[t].ready);
      for (var a in obj.audio) list.push(obj.audio[a].ready);
      if (list.every(Boolean)) {
        console.log('All assets loaded!');
        obj.ready = true;
        clearInterval(checkReady);
      }
    }, 1);
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
    initAssets(assets);
    initCanvas();
    document.body.appendChild(canvas);
    console.log('pubie.js ' + info.version);
    console.log('by ' + info.authors);
    requestAnimationFrame(game.loop);
    setInterval(function () { assets.audio.silence.play(); }, 1000 / 60);
  };

  var GameTexture = function (src) {
    this.img = document.createElement('img');
    this.img.src = src;
    this.ready = false;
    var self = this;
    this.img.onload = function () {
      self.ready = true;
      self.w = self.img.width;
      self.h = self.img.height;
    };
  };

  var GameAudio = function (src) {
    this.audio = document.createElement('audio');
    this.audio.src = src;
    this.audio.volume = 0.5;
    this.loop = false;
    this.ready = false;
    var self = this;
    this.audio.oncanplaythrough = function () { self.ready = true; };
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
    ready: false,
    textures: {
      logo: new GameTexture('./assets/quiquePixel.png'),
      pubie: new GameTexture('./assets/pubie.png'),
      lugie: new GameTexture('./assets/lugie.png'),
      atome: new GameTexture('./assets/atome.png'),
      dynomete: new GameTexture('./assets/dynomete.png'),
      escape: new GameTexture('./assets/escape.png'),
      back: new GameTexture('./assets/back.png')
    },
    audio: {
      silence: new GameAudio('./assets/5-seconds-of-silence.mp3'),
      yay: new GameAudio('./assets/yay.mp3'),
      weoo: new GameAudio('./assets/weoo.mp3'),
      gameover: new GameAudio('./assets/gameover.mp3')
    }
  };

  var game = (function () {
    var STATE = 'intro';
    var ROOM = 1;
    var TIMER = 0;

    var intro = (function () {
      var lCanvas = document.createElement('canvas');
      var lStage = lCanvas.getContext('2d');
      lCanvas.width = info.width;
      lCanvas.height = info.height;
      var logo = assets.textures.logo.img;
      var frame = 0;
      var opacity = 0;

      var drawLogo = function () {
        lStage.globalAlpha = opacity;
        lStage.drawImage(logo, lCanvas.width / 2 - logo.width / 2, lCanvas.height / 2 - logo.height / 2);
      };

      var drawSkipText = function () {
        lStage.font = '16px MS Sans Serif';
        lStage.fillStyle = '#5A5A5A';
        lStage.fillText('Press [ENTER] to skip', 25, lCanvas.height - 25);
      };

      var drawOverlay = function () {
        stage.fillStyle = '#000000';
        stage.fillRect(0, 0, info.width, info.height);
      };

      var doTiming = function () {
        if (keys['Enter']) STATE = 'play';
        lStage.clearRect(0, 0, lCanvas.width, lCanvas.height);
        drawLogo();
        drawSkipText();
        drawOverlay();
        if (frame > 0 && frame <= 15) opacity += 1 / 15;
        if (frame > 45 && frame <= 60) opacity -= 1 / 15;
        frame++;
        if (frame > 75) {
          frame = 0;
          opacity = 1;
          STATE = 'play';
        }
      };

      return function () {
        doTiming();
        stage.drawImage(lCanvas, 0, 0);
      }
    })();

    var play = (function () {
      var GameEntity = function (obj) {
        this.texture = obj.texture;
        this.x = obj.x;
        this.y = obj.y;
        this.w = this.texture.w;
        this.h = this.texture.h;
        this.speed = obj.speed;
      };

      GameEntity.prototype.controls = function (obj) {
        var s = this.speed;
        if (keys[obj.up]) { this.y -= s; return; }
        if (keys[obj.down]) { this.y += s; return; }
        if (keys[obj.right]) { this.x += s; return; }
        if (keys[obj.left]) { this.x -= s; return; }
      };

      GameEntity.prototype.collision = function (otherEntity) {
        this.w = this.texture.w; // recalc width/height in case texture didn't load the first time
        this.h = this.texture.h;
        var rect1 = this;
        var rect2 = otherEntity;
        return (rect1.x < rect2.x + rect2.w && rect1.x + rect1.w > rect2.x && rect1.y < rect2.y + rect2.h && rect1.y + rect1.h > rect2.y)
      };

      GameEntity.prototype.render = function (ctx) {
        ctx.drawImage(this.texture.img, this.x, this.y);
      };

      var pubie = new GameEntity({
        texture: assets.textures.pubie,
        x: 100,
        y: 100,
        speed: 2
      });
      var lugie = new GameEntity({
        texture: assets.textures.lugie,
        x: 250,
        y: 250,
        speed: 2
      });
      var back = new GameEntity({
        texture: assets.textures.back,
        x: 0,
        y: 0
      });
      var finish = new GameEntity({
        texture: assets.textures.atome,
        x: 0,
        y: 0
      });

      var yay = assets.audio.yay;
      var weoo = assets.audio.weoo;
      var gameover = assets.audio.gameover;

      var rooms;
      requestText('./rooms.json', function (json) {
        rooms = JSON.parse(json);
      });
      var lastRoom;
      var dynometes = [];

      var initRoom = function (room) {
        var cur = rooms[room.toString()];
        if (!cur) { ROOM = 1; cur = rooms["1"] };
        yay.stop();

        var initPubie = function () {
          var p = cur.pubie;
          pubie.x = p.x;
          pubie.y = p.y;
        };

        var initLugie = function () {
          var l = cur.lugie;
          if (l.exists) {
            lugie.x = l.x;
            lugie.y = l.y;
            lugie.exists = true;
          } else {
            lugie.exists = false;
          }
        };

        var initBack = function () {
          var b = cur.back;
          if (b.exists) {
            back.x = b.x;
            back.y = b.y;
            back.exists = true;
          } else {
            back.exists = false;
          }
        };

        var initFinish = function () {
          var f = cur.finish;
          finish.texture = assets.textures[f.type];
          finish.x = f.x;
          finish.y = f.y;
        };

        var initDynometes = function () {
          var d = cur.dynomete;
          dynometes = [];
          d.forEach(function (dCur) {
            dynometes.push(new GameEntity({
              texture: assets.textures.dynomete,
              x: dCur.x,
              y: dCur.y
            }));
          });
        };

        initPubie();
        initLugie();
        initBack();
        initFinish();
        initDynometes();
      };

      var doControls = function () {
        var c = controls;
        pubie.controls({ up: c.up, down: c.down, right: c.right, left: c.left });
        if (lugie.exists) lugie.controls({ up: c.down, down: c.up, right: c.left, left: c.right });
      };

      var doCollision = function () {
        if (pubie.collision(finish)) { yay.play(); ROOM++; STATE = 'roomFinished'; }
      };

      var doRendering = (function () {
        var dCanvas = document.createElement('canvas');
        var dStage = dCanvas.getContext('2d');
        dCanvas.width = info.width;
        dCanvas.height = info.height;
        var lastRoom;

        var initDynomete = function () {
          dStage.clearRect(0, 0, dCanvas.width, dCanvas.height);
          dynometes.forEach(function (cur) { cur.render(dStage); });
        };

        return function () {
          if (lastRoom !== ROOM) {
            initDynomete();
            lastRoom = ROOM;
          }
          if (lugie.exists) lugie.render(stage);
          if (back.exists) back.render(stage);
          pubie.render(stage);
          finish.render(stage);
          stage.drawImage(dCanvas, 0, 0);
        }
      })();

      return function (room) {
        if (!rooms) return;
        if (ROOM !== lastRoom) {
          initRoom(ROOM);
          lastRoom = ROOM;
        }
        doControls();
        doRendering();
        doCollision();
      }
    })();

    var roomFinished = (function () {
      var lCanvas = document.createElement('canvas');
      var lStage = lCanvas.getContext('2d');

      var initTextbox = function () {
        lCanvas.width = info.width / 2;
        lCanvas.height = info.width / 8;
        lStage.font = '12px MS Sans Serif';
        lStage.fillStyle = '#5A5A5A';
        lStage.strokeStyle = '#4A4A4A';
        lStage.lineWidth = 7;
        lStage.fillRect(0, 0, lCanvas.width, lCanvas.height);
        lStage.strokeRect(0, 0, lCanvas.width, lCanvas.height);
        lStage.strokeStyle = '#3C3C3C';
        lStage.lineWidth = 5;
        lStage.strokeRect(0, 0, lCanvas.width, lCanvas.height);
        lStage.fillStyle = '#FFFFFF';
        lStage.fillText('congratulations. pubie have collected an MOLECULE', 30, 30);
        lStage.font = 'bold 12px MS Sans Serif';
        lStage.fillText('press ENTER to continue', 100, 60);
      };

      initTextbox();

      return function () {
        stage.drawImage(lCanvas, info.width / 2 - lCanvas.width / 2, info.height / 2 - lCanvas.height / 2);
        if (keys['Enter']) STATE = 'play';
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

        if (!assets.ready) return;

        if (delta > interval) {
          if (!PAUSE) {
            canvas.style.filter = 'brightness(100%)';
            stage.clearRect(0, 0, canvas.width, canvas.height);
            switch (STATE) {
              case 'intro':
                intro();
                break;
              case 'play':
                play(ROOM);
                break;
              case 'roomFinished':
                roomFinished();
                break;
              default:
                throw ('Error: requested state does not exist!');
            }
            TIMER++;
          } else {
            canvas.style.filter = 'brightness(33.33%)';
            stage.fillStyle = '#FFFFFF';
            stage.font = '64px MS Sans Serif';
            stage.fillText('PAUSED', 212, 225);
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

// fin
