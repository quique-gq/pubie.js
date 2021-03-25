// pubie.js by Literal Line
// original game by hoylecake (https://hoylecake.com/pubie/)
// more at quique.gq

var PUBIE = (function () {
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
    canvas.style.imageRendering = info.aa ? 'auto' : 'pixelated';
    canvas.style.imageRendering = info.aa ? 'auto' : '-moz-crisp-edges';
    stage.imageSmoothingEnabled = info.aa;
    stage.textAlign = 'center';
  };

  var init = function () {
    initEventListeners();
    initAssets(assets);
    initCanvas();
    document.getElementById('pubieContainer').appendChild(canvas);
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
      self.collisionMask = GameTexture.createCollisionMask(self.img);
    };
  };

  GameTexture.createCollisionMask = function (img) {
    var tempCanvas = document.createElement('canvas');
    var tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    tempCtx.drawImage(img, 0, 0);
    var data = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;
    var newData = [];
    for (var y = 0; y < img.height; y++) {
      newData.push([]);
      for (var x = 0; x < img.width; x++) {
        newData[y][x] = data[(y * img.width + x) * 4 + 3] ? 1 : 0;
      }
    }
    return newData;
  };

  var GameAudio = function (src) {
    this.audio = document.createElement('audio');
    this.audio.src = src;
    //this.audio.volume = 0.5;
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
        lStage.drawImage(logo, Math.floor(lCanvas.width / 2 - logo.width / 2), Math.floor(lCanvas.height / 2 - logo.height / 2));
      };

      var drawSkipText = function () {
        lStage.font = '16px MS Sans Serif';
        lStage.fillStyle = '#5A5A5A';
        lStage.fillText('Press ' + controls.ok.toUpperCase() + ' to skip', 25, lCanvas.height - 25);
      };

      var drawOverlay = function () {
        stage.fillStyle = '#000000';
        stage.fillRect(0, 0, info.width, info.height);
      };

      var doTiming = function () {
        if (keys[controls.ok]) STATE = 'play';
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
        this.velX = obj.velX || 0;
        this.velY = obj.velY || 0;
        this.speed = obj.speed;
        this.friction = obj.friction;
      };

      GameEntity.prototype.setGridPos = function (obj) {
        this.x = obj.x * obj.s - this.texture.w / 2;
        this.y = obj.y * obj.s - this.texture.h / 2;
        this.velX = 0;
        this.velY = 0;
      };

      GameEntity.prototype.controls = function (obj) {
        var s = this.speed;
        var p = obj.precedence;
        for (var i = 0; i < 4; i++) {
          if (keys[obj.up] && p[i] === 'up') { this.move(0, -s, { rel: false }); return; }
          if (keys[obj.down] && p[i] === 'down') { this.move(0, s, { rel: false }); return; }
          if (keys[obj.right] && p[i] === 'right') { this.move(s, 0, { rel: false }); return; }
          if (keys[obj.left] && p[i] === 'left') { this.move(-s, 0, { rel: false }); return; }
        }
      };

      GameEntity.prototype.move = function (amtX, amtY, obj) {
        if (obj.rel) {
          this.velX += amtX;
          this.velY += amtY;
        } else {
          this.velX = amtX;
          this.velY = amtY;
        }
      };

      GameEntity.prototype.physics = function () { // im not that proud of this code but it works so idk lol
        var s = this.speed;
        var f = this.friction;
        if (this.velX > 0) this.velX = Math.max(this.velX - f, 0);
        if (this.velX < 0) this.velX = Math.min(this.velX + f, 0);
        if (this.velY > 0) this.velY = Math.max(this.velY - f, 0);
        if (this.velY < 0) this.velY = Math.min(this.velY + f, 0);
        this.x += this.velX;
        this.y += this.velY;
      };

      GameEntity.prototype.collision = function (otherEntity) {
        var rect1 = { x: this.x, y: this.y, w: this.texture.w, h: this.texture.h };
        var rect2 = { x: otherEntity.x, y: otherEntity.y, w: otherEntity.texture.w, h: otherEntity.texture.h };
        if (rect1.x < rect2.x + rect2.w && rect1.x + rect1.w > rect2.x && rect1.y < rect2.y + rect2.h && rect1.y + rect1.h > rect2.y) {
          var xMin = Math.min(rect1.x, rect2.x); // crap pixel collision by YOURS TRULY
          var xMax = Math.min(rect1.x + rect1.w, rect2.x + rect2.w);
          var yMin = Math.min(rect1.y, rect2.y);
          var yMax = Math.max(rect1.y + rect1.h, rect2.y + rect2.h);
          var mask1 = this.texture.collisionMask;
          var mask2 = otherEntity.texture.collisionMask;
          var cornerX1 = rect1.x - xMin;
          var cornerY1 = rect1.y - yMin;
          var cornerX2 = rect2.x - xMin;
          var cornerY2 = rect2.y - yMin;
          var boxWidth = xMax - xMin;
          var boxHeight = yMax - yMin;
          for (var y = 0; y < boxHeight; y++) {
            for (var x = 0; x < boxWidth; x++) {
              var ofs1X = x - cornerX1;
              var ofs1Y = y - cornerY1;
              var ofs2X = x - cornerX2;
              var ofs2Y = y - cornerY2;
              if (typeof mask1[ofs1Y] === 'undefined') continue;
              if (typeof mask2[ofs2Y] === 'undefined') continue;
              if (mask1[ofs1Y][ofs1X] && mask2[ofs2Y][ofs2X]) return true;
            }
          }
        }
      };

      GameEntity.prototype.render = function (ctx) {
        ctx.drawImage(this.texture.img, this.x, this.y);
      };

      var pubie = new GameEntity({
        texture: assets.textures.pubie,
        x: 100,
        y: 100,
        speed: 4,
        friction: 1
      });
      var lugie = new GameEntity({
        texture: assets.textures.lugie,
        x: 250,
        y: 250,
        speed: 4,
        friction: 1
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
      var curRoom;
      var lastRoom;
      var dynometes = [];
      var scale = 16;

      var initRoom = function (room) {
        curRoom = rooms[room.toString()];
        if (!curRoom) { ROOM = 1; curRoom = rooms['1']; };

        var initPubie = function () {
          var p = curRoom.pubie;
          pubie.setGridPos({ x: p.x, y: p.y, s: scale });
        };

        var initLugie = function () {
          var l = curRoom.lugie;
          if (l.exists) {
            lugie.setGridPos({ x: l.x, y: l.y, s: scale });
            lugie.exists = true;
          } else {
            lugie.exists = false;
          }
        };

        var initBack = function () {
          var b = curRoom.back;
          if (b.exists) {
            back.setGridPos({ x: b.x, y: b.y, s: scale });
            back.exists = true;
          } else {
            back.exists = false;
          }
        };

        var initFinish = function () {
          var f = curRoom.finish;
          finish.texture = assets.textures[f.type];
          finish.setGridPos({ x: f.x, y: f.y, s: scale });
        };

        var initDynometes = function () {
          var d = curRoom.dynomete;
          dynometes = [];
          d.forEach(function (dCur) {
            dynometes.push(new GameEntity({ texture: assets.textures.dynomete }));
            dynometes[dynometes.length - 1].setGridPos({ x: dCur.x, y: dCur.y, s: scale });
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
        pubie.controls({ up: c.up, down: c.down, right: c.right, left: c.left, precedence: ['up', 'down', 'right', 'left'] });
        if (lugie.exists) lugie.controls({ up: c.down, down: c.up, right: c.left, left: c.right, precedence: ['down', 'up', 'left', 'right'] });
      };

      var doCollision = function () {
        if (pubie.collision(back)) ROOM = 0;
        if (pubie.collision(finish)) {
          yay.play(0);
          ROOM++;
          if (curRoom.finish.type === 'atome') {
            STATE = 'roomFinished';
          } else if (curRoom.finish.type === 'escape') {
            STATE = 'pubieWin';
          }
          return;
        }
        if (lugie.collision(finish) && lugie.exists) { weoo.play(0); STATE = 'lugieLose'; return; }
        dynometes.forEach(function (cur) {
          if (pubie.collision(cur)) { gameover.play(0); STATE = 'lose'; }
          if (lugie.collision(cur) && lugie.exists) { yay.play(0); lugie.exists = false; }
        });
      };

      var doPhysics = function () {
        pubie.physics();
        if (lugie.exists) lugie.physics();
      };

      var rendering = (function () {
        var dCanvas = document.createElement('canvas');
        var dStage = dCanvas.getContext('2d');
        dCanvas.width = info.width;
        dCanvas.height = info.height;

        var initDynometes = function () {
          dStage.clearRect(0, 0, dCanvas.width, dCanvas.height);
          dynometes.forEach(function (cur) { cur.render(dStage); });
        };

        return {
          init: function () {
            initDynometes();
            // init whatever else if anything else added
          },
          do: function () {
            if (lugie.exists) lugie.render(stage);
            if (back.exists) back.render(stage);
            pubie.render(stage);
            finish.render(stage);
            stage.drawImage(dCanvas, 0, 0);
          }
        }
      })();

      return function (room) {
        if (!rooms) return;
        if (ROOM !== lastRoom) {
          if (ROOM < 1) ROOM = 1;
          initRoom(ROOM);
          rendering.init();
          lastRoom = ROOM;
        }
        rendering.do(); // this goes first so you don't see the sprites clipping through each other on collision
        doControls();
        doPhysics();
        doCollision();
      }
    })();

    var textbox = (function () {
      var lCanvas = document.createElement('canvas');
      var lStage = lCanvas.getContext('2d');
      lCanvas.width = info.width / 2;
      lCanvas.height = info.width / 8;
      var screenshot = document.createElement('canvas');
      var screenshotCtx = screenshot.getContext('2d');
      screenshot.width = info.width;
      screenshot.height = info.height;
      var lastTimer;
      var lastCase;

      var initTextbox = function () {
        lStage.font = '8px MS Sans Serif';
        lStage.textAlign = 'left';
        lStage.fillStyle = '#5A5A5A';
        lStage.strokeStyle = '#4A4A4A';
        lStage.lineWidth = 7;
        lStage.fillRect(0, 0, lCanvas.width, lCanvas.height);
        lStage.strokeRect(0, 0, lCanvas.width, lCanvas.height);
        lStage.strokeStyle = '#3C3C3C';
        lStage.lineWidth = 5;
        lStage.strokeRect(0, 0, lCanvas.width, lCanvas.height);
      };

      var drawText = function (text) {
        lStage.fillText(text, 30, 30);
      };

      initTextbox();

      return function (textCase) {
        if (TIMER !== lastTimer) {
          screenshotCtx.clearRect(0, 0, screenshot.width, screenshot.height);
          screenshotCtx.drawImage(lastFrameCanvas, 0, 0);
          lastTimer = TIMER;
        }
        if (textCase !== lastCase) {
          initTextbox();
          lStage.fillStyle = '#FFFFFF';
          switch (textCase) {
            case 'roomFinished':
              drawText('congratulations. pubie have collected an MOLECULE');
              break;
            case 'lose':
              drawText('pubie have lose');
              ROOM = 1;
              break;
            case 'lugieLose':
              drawText('lugie have stolen your molecule');
              ROOM = 1;
              break;
            case 'pubieWin':
              drawText('pubie got out , and wonned against lugie you win');
              ROOM = 1;
          }
          lStage.textAlign = 'center';
          lStage.fillText('press [' + controls.ok.toUpperCase() + '] to continue', lCanvas.width / 2 - 0.5, 60);
          lastCase = textCase;
        }
        stage.drawImage(screenshot, 0, 0);
        stage.drawImage(lCanvas, info.width / 2 - lCanvas.width / 2, info.height / 2 - lCanvas.height / 2);
        if (keys[controls.ok]) STATE = 'play';
      }
    })();

    var delta = 0;
    var then = 0;
    var interval = 1000 / info.fps;
    var lastFrameCanvas = document.createElement('canvas');
    var lastFrameStage = lastFrameCanvas.getContext('2d');
    lastFrameCanvas.width = info.width;
    lastFrameCanvas.height = info.height;

    return {
      loop: function (now) {
        if (!then) then = now;
        requestAnimationFrame(game.loop);
        delta = now - then;

        if (!assets.ready) return;

        if (delta > interval) {
          if (!PAUSE) {
            canvas.style.filter = 'brightness(100%)';
            lastFrameStage.drawImage(canvas, 0, 0);
            stage.clearRect(0, 0, canvas.width, canvas.height);
            switch (STATE) {
              case 'intro':
                intro();
                break;
              case 'play':
                play(ROOM);
                break;
              case 'roomFinished':
                textbox('roomFinished');
                break;
              case 'lose':
                textbox('lose');
                break;
              case 'lugieLose':
                textbox('lugieLose');
                break;
              case 'pubieWin':
                textbox('pubieWin');
                break;
              default:
                throw ('Error: requested state does not exist!');
            }
            lastFrameStage.clearRect(0, 0, lastFrameCanvas.width, lastFrameCanvas.height);
            TIMER++;
          } else {
            canvas.style.filter = 'brightness(33.33%)';
            stage.fillStyle = '#FFFFFF';
            stage.font = '32px MS Sans Serif';
            stage.fillText('PAUSED', canvas.width / 2, 225);
          }
          then = now - (delta % interval);
        }
      }
    }
  })();

  return {
    init: init
  }
})();

// fin
