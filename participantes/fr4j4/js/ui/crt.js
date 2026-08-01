// CRT overlay global — scanlines sobre toda la escena (incluye modales)

window.CRT = {
  addScanlines(scene) {
    const g = scene.add.graphics().setDepth(1000);
    g.fillStyle(0x000000, 0.08);
    for (let y = 0; y < 360; y += 4) g.fillRect(0, y, 640, 1);
    return g;
  }
};
