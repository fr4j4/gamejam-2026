// Texturas generadas por código, sin archivos de imagen: cada entidad se "hornea"
// una vez a partir de un Graphics temporal y después se reutiliza como sprite.

// Helper: dibuja con un Graphics temporal y lo convierte en textura.
function bake(scene, key, width, height, draw) {
  const gfx = scene.add.graphics();
  draw(gfx);
  gfx.generateTexture(key, width, height);
  gfx.destroy();
}

export function generateTextures(scene) {
  if (scene.textures.exists('player')) return;

  bake(scene, 'player', 32, 32, (g) => {
    g.fillStyle(0x66ffcc, 1);
    g.fillCircle(16, 16, 16);
  });

  bake(scene, 'enemy', 24, 24, (g) => {
    g.fillStyle(0xff5566, 1);
    g.fillRect(0, 0, 24, 24);
  });

  bake(scene, 'projectile', 10, 10, (g) => {
    g.fillStyle(0xffee66, 1);
    g.fillCircle(5, 5, 5);
  });

  bake(scene, 'xp', 12, 12, (g) => {
    g.fillStyle(0xaa88ff, 1);
    g.fillCircle(6, 6, 6);
  });

  bake(scene, 'enemyFast', 16, 16, (g) => {
    g.fillStyle(0xffaa33, 1);
    g.fillTriangle(8, 0, 16, 16, 0, 16);
  });

  bake(scene, 'spark', 6, 6, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 3);
  });

  bake(scene, 'boss', 44, 44, (g) => {
    g.fillStyle(0x220022, 1);
    g.fillRect(0, 0, 44, 44);
    g.lineStyle(3, 0xff33aa, 1);
    g.strokeRect(1.5, 1.5, 41, 41);
  });

  bake(scene, 'orbit', 12, 12, (g) => {
    g.fillStyle(0x55ddff, 1);
    g.fillCircle(6, 6, 6);
  });

  bake(scene, 'enemyTank', 28, 28, (g) => {
    g.fillStyle(0x335522, 1);
    g.fillRect(0, 0, 28, 28);
    g.lineStyle(2, 0x88cc44, 1);
    g.strokeRect(1, 1, 26, 26);
  });

  bake(scene, 'bossRanged', 44, 44, (g) => {
    g.fillStyle(0x002233, 1);
    g.fillRect(0, 0, 44, 44);
    g.lineStyle(3, 0x33ccff, 1);
    g.strokeRect(1.5, 1.5, 41, 41);
  });

  bake(scene, 'pierce', 20, 10, (g) => {
    g.fillStyle(0x66ddff, 1);
    g.fillRect(0, 3, 20, 4);
  });

  bake(scene, 'bossBolt', 14, 14, (g) => {
    g.fillStyle(0xff3333, 1);
    g.fillCircle(7, 7, 7);
  });

  bake(scene, 'portal', 64, 64, (g) => {
    g.fillStyle(0x8855ff, 0.35);
    g.fillCircle(32, 32, 32);
    g.fillStyle(0xaa88ff, 0.7);
    g.fillCircle(32, 32, 20);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(32, 32, 8);
  });

  bake(scene, 'chest', 28, 28, (g) => {
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(0, 8, 28, 20);
    g.fillStyle(0xffcc44, 1);
    g.fillRect(0, 8, 28, 6);
    g.lineStyle(2, 0x442200, 1);
    g.strokeRect(0, 8, 28, 20);
  });
}
