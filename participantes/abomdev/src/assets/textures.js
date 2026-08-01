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

  // Jugador: halo suave + disco sólido + borde claro, para que se distinga siempre
  // del enjambre de enemigos aunque la pantalla esté llena.
  bake(scene, 'player', 36, 36, (g) => {
    g.fillStyle(0x66ffcc, 0.22);
    g.fillCircle(18, 18, 18);
    g.fillStyle(0x66ffcc, 1);
    g.fillCircle(18, 18, 13);
    g.lineStyle(2, 0xffffff, 0.85);
    g.strokeCircle(18, 18, 13);
  });

  bake(scene, 'projectile', 10, 10, (g) => {
    g.fillStyle(0xffee66, 1);
    g.fillCircle(5, 5, 5);
  });

  bake(scene, 'xp', 12, 12, (g) => {
    g.fillStyle(0xaa88ff, 1);
    g.fillCircle(6, 6, 6);
  });

  bake(scene, 'spark', 6, 6, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 3);
  });

  bake(scene, 'orbit', 12, 12, (g) => {
    g.fillStyle(0x55ddff, 1);
    g.fillCircle(6, 6, 6);
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
}
