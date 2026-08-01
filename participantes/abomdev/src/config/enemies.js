// Tipos de enemigo. `color` se usa tanto para teñir el sprite como para el punto
// del minimapa y las partículas de muerte, así que los tres siempre coinciden.
// `hpPerMin`/`speedPerMin` es cuánto escala esa stat por minuto sobrevivido.

export const ENEMY_TYPES = {
  normal: { texture: 'enemy', color: 0xff5566, baseHp: 20, hpPerMin: 10, baseSpeed: 80, speedPerMin: 8, damage: 10, xpValue: 1 },
  fast: { texture: 'enemyFast', color: 0xffaa33, baseHp: 8, hpPerMin: 4, baseSpeed: 160, speedPerMin: 12, damage: 6, xpValue: 1 },
  tank: { texture: 'enemyTank', color: 0x88cc44, baseHp: 60, hpPerMin: 22, baseSpeed: 45, speedPerMin: 3, damage: 18, xpValue: 3 },
  boss: { texture: 'boss', color: 0xff33aa, baseHp: 250, hpPerMin: 50, baseSpeed: 50, speedPerMin: 4, damage: 20, xpValue: 0 },
  bossRanged: { texture: 'bossRanged', color: 0x33ccff, baseHp: 200, hpPerMin: 45, baseSpeed: 70, speedPerMin: 4, damage: 15, xpValue: 0 },
};
