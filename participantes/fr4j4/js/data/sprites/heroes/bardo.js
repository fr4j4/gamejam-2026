window.HERO_SPRITE_BARDO = {
  key: 'hero_bardo',
  src: 'assets/heroes/bardo.png',
  classId: 'bardo',
  frameSize: { w: 512, h: 512 },
  origin: { x: 0.5, y: 0.85 },
  scale: 0.18,
  defaultState: 'idle',
  states: {
    idle: [
      { x: 0, y: 0, vflip: false, hflip: true, dur: 200 }
    ],
    attack: [],
    cast: [],
    hurt: [],
    victory: [],
    defeat: []
  }
};