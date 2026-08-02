// js/engine/HeroSprite.js
// Runtime para spritesheets de heroes.
// Usa load.spritesheet de Phaser para registrar frames del grid automaticamente.
// Cada config declara frameSize (tamano de cada celda del grid).
// Los frames por estado se especifican con coordenadas [x, y] en pixels;
// el motor las traduce a frameIndex segun el tamano del frame.

(function () {
  const LOOP_STATES = { idle: true, cast: true };
  const ONESHOT_STATES = { attack: true, hurt: true, victory: true, defeat: true };
  const _warnedMissing = new Set();

  function warnOnce(stateName, classId) {
    const k = classId + ':' + stateName;
    if (_warnedMissing.has(k)) return;
    _warnedMissing.add(k);
    console.warn('[HeroSprite] estado "' + stateName + '" no definido para ' + classId + ', usando defaultState');
  }

  function resolveFrames(config, stateName) {
    const fallback = config.defaultState || 'idle';
    const states = config.states || {};
    let frames = states[stateName];
    if (!frames || frames.length === 0) {
      if (stateName !== fallback) warnOnce(stateName, config.classId || '?');
      frames = states[fallback] || [];
    }
    if (!frames || frames.length === 0) return null;
    return frames;
  }

  function getTextureSize(scene, key) {
    const tex = scene.textures.get(key);
    if (!tex) return { w: 0, h: 0 };
    const src = tex.getSourceImage();
    if (src) return { w: src.width || src.naturalWidth || 0, h: src.height || src.naturalHeight || 0 };
    return { w: tex.width || 0, h: tex.height || 0 };
  }

  function xyToFrameIndex(x, y, frameSize, texSize) {
    const cols = Math.max(1, Math.floor(texSize.w / frameSize.w));
    const col = Math.round(x / frameSize.w);
    const row = Math.round(y / frameSize.h);
    return row * cols + col;
  }

  const HeroSprite = {
    preload(scene, config) {
      if (!config || !config.key || !config.src) return;
      const fs = config.frameSize || { w: 256, h: 256 };
      scene.load.spritesheet(config.key, config.src, { frameWidth: fs.w, frameHeight: fs.h });
    },

    create(scene, options) {
      const config = options.config;
      const side = options.side || 'left';
      const x = options.x || 0;
      const y = options.y || 0;
      const hasTexture = scene.textures.exists(config.key);

      const instance = {
        scene,
        config,
        side,
        playing: true,
        currentState: null,
        currentFrames: null,
        frameIndex: 0,
        elapsed: 0,
        sprite: null,
        fallbackGraphics: null,
        fallbackText: null,
        available: hasTexture
      };

      if (hasTexture) {
        const fs = config.frameSize || { w: 256, h: 256 };
        const texSize = getTextureSize(scene, config.key);
        const cols = Math.max(1, Math.floor(texSize.w / fs.w));
        const rows = Math.max(1, Math.floor(texSize.h / fs.h));
        const totalFrames = cols * rows;

        const img = scene.add.image(x, y, config.key, 0);
        const ox = config.origin && typeof config.origin.x === 'number' ? config.origin.x : 0.5;
        const oy = config.origin && typeof config.origin.y === 'number' ? config.origin.y : 0.85;
        img.setOrigin(ox, oy);
        const scale = typeof config.scale === 'number' ? config.scale : 1;
        img.setScale(scale);
        img.setFlip(false, false);
        instance.sprite = img;
        instance._cols = cols;
        instance._rows = rows;
        instance._totalFrames = totalFrames;
        instance._texSize = texSize;
      } else {
        const g = scene.add.graphics();
        g.fillStyle(0x16213e, 1);
        g.fillRect(x - 32, y - 64, 64, 96);
        g.lineStyle(2, 0x4a4a6e, 1);
        g.strokeRect(x - 32, y - 64, 64, 96);
        const t = scene.add.text(x, y - 14, options.icon || '?', {
          fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#8892a0'
        }).setOrigin(0.5);
        instance.fallbackGraphics = g;
        instance.fallbackText = t;
      }

      instance._applyFrame = function () {
        const frame = instance.currentFrames && instance.currentFrames[instance.frameIndex];
        if (!frame) return;
        if (!instance.sprite) return;
        const fs = instance.config.frameSize || { w: 256, h: 256 };
        const ts = instance._texSize || { w: fs.w * 4, h: fs.h * 4 };
        const idx = xyToFrameIndex(frame.x, frame.y, fs, ts);
        if (idx < 0 || idx >= instance._totalFrames) return;
        instance.sprite.setFrame(idx);
        const vflip = !!frame.vflip;
        const hflip = !!frame.hflip ^ (instance.side === 'right');
        instance.sprite.setFlip(hflip, vflip);
      };

      instance.setState = function (stateName) {
        const frames = resolveFrames(config, stateName);
        if (!frames) return;
        const isSameState = instance.currentState === stateName && instance.currentFrames === frames;
        instance.currentState = stateName;
        instance.currentFrames = frames;
        instance.frameIndex = 0;
        instance.elapsed = 0;
        if (!isSameState) instance._applyFrame();
      };

      instance.update = function (time, delta) {
        if (!instance.playing) return;
        if (!instance.currentFrames || instance.currentFrames.length === 0) return;
        const frame = instance.currentFrames[instance.frameIndex];
        const dur = (frame && typeof frame.dur === 'number') ? frame.dur : 180;
        instance.elapsed += delta;
        if (instance.elapsed >= dur) {
          instance.elapsed = 0;
          instance.frameIndex += 1;
          if (instance.frameIndex >= instance.currentFrames.length) {
            if (LOOP_STATES[instance.currentState]) {
              instance.frameIndex = 0;
            } else {
              instance.setState('idle');
              return;
            }
          }
          instance._applyFrame();
        }
      };

      instance.play = function () { instance.playing = true; };
      instance.stop = function () { instance.playing = false; };
      instance.destroy = function () {
        if (instance.sprite) instance.sprite.destroy();
        if (instance.fallbackGraphics) instance.fallbackGraphics.destroy();
        if (instance.fallbackText) instance.fallbackText.destroy();
        instance.sprite = null;
        instance.fallbackGraphics = null;
        instance.fallbackText = null;
      };

      instance.setState('idle');

      return instance;
    }
  };

  window.HeroSprite = HeroSprite;
  window.HeroSprite.LOOP_STATES = LOOP_STATES;
  window.HeroSprite.ONESHOT_STATES = ONESHOT_STATES;
})();