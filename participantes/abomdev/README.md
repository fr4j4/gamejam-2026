# BugSurvivor — abomdev

GameJam 2026, Fase 1.

Clon de Vampire Survivors: sobrevive a oleadas de enemigos que crecen sin parar,
sube de nivel eligiendo mejoras, desbloquea armas y cruza los portales que abren
los jefes para avanzar de etapa. Hay 3 etapas; cruzar la última es la victoria.

## Cómo correr

```
npm install
npm run dev
```

Abre la URL que muestra Vite (por defecto http://localhost:5173).

## Controles

- **WASD / Flechas**: moverse (el ataque es automático al enemigo más cercano)
- **ESC**: pausa (desde ahí: configuración de volumen, reiniciar, salir al menú)
- **F**: pantalla completa
- **M**: silenciar

## Tecnologías

- Phaser 4
- Vite
- [lucide-static](https://lucide.dev/) para los iconos
- Sonido con un sintetizador propio sobre WebAudio (sin archivos de audio)
