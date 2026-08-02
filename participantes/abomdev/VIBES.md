# VIBES — cambios de Fase 2

## Resumen
Implementación de la idea de fullscreen en mobile (botón en menú y pausa, auto-fullscreen al tap de JUGAR, lock landscape, hint portrait) y de los controles táctiles (joystick hot zone con estilo neón, botón de pausa dedicado). Tambien se aprovecha para sumar meta tags PWA y soporte de safe-areas para el notch en `index.html`, exponer el dev server en LAN para probar desde el celular, e ignorar el directorio `dev-notes/`.

## Cambios realizados

### Fullscreen mobile
- **Botón "Pantalla completa" en el menú** (`src/scenes/MenuScene.js`) — solo se renderiza en touch devices (detección OR entre `Phaser.device.input.touch` y `matchMedia('(pointer: coarse)')`). Va arriba a la derecha del panel principal.
- **Botón "Pantalla completa" en la pausa** (`src/ui/PauseMenu.js`) — solo en touch, primer item del stack central. Mismo handler que el del menú.
- **Auto-fullscreen al tap de JUGAR en touch** — cada tap intenta entrar a fullscreen si no estamos ya adentro. Sin flag de sessionStorage: el usuario decide cuándo salir, el botón manual siempre funciona.
- **Lock de orientación landscape** (`src/utils/orientation.js`) — se aplica automáticamente al entrar a fullscreen y se libera al salir. Falla silencioso en iOS y browsers sin la API.
- **Hint "↻ Rotá el celular para jugar" en GameScene** — aparece si el juego queda en portrait (porque fullscreen falló o el usuario salió). Reaparece cada vez que rotás a portrait. Naranja `0xffaa00` sobre fondo oscuro del panel, contraste alto.
- **Toast de fallback iOS** — si el botón se tappea en iPhone, se muestra "En iPhone: tocar Compartir → Agregar a inicio" durante 8s.
- **Helper `toggleFullscreen`** (`src/utils/fullscreen.js`) — wrapper con cadena de fallback (Phaser → browser API). Retorna `'on' | 'off' | 'failed'`.
- **Helper `isBrowserFullscreen`** — consulta `document.fullscreenElement` directo. Fuente de verdad del browser, no la cache de Phaser.
- **Normalización post-F5 en MenuScene.create** — si el browser preservó el fullscreen tras refrescar, forzar salida. Evita que el auto-fullscreen no se dispare en sesiones refrescadas.

### Controles táctiles
- **Joystick virtual hot zone** (`src/ui/TouchControls.js`) — aparece al primer touch en la mitad izquierda de la pantalla. La base es un `Graphics` con anillos concéntricos (no un cuadrado); el thumb es un `Arc` con un highlight blanco sutil para simular volumen sin gradiente real. Paleta cyan accent (`0x66ffcc`) matcheando el theme.
- **Botón de pausa dedicado top-right** — círculo cyan con icono `icon-pause` blanco. Tappable siempre, fuera de la hot zone del joystick.
- **Touch gana sobre teclado, no suma** — `updatePlayerMovement` consulta primero el vector touch y copia los componentes a un `Vector2` local (no muta la referencia compartida, fix del bug donde el personaje salía a través del mapa).
- **Solo visible en landscape** — si `isPortrait()`, el overlay entero se oculta (incluyendo el portrait hint del fullscreen sigue funcionando).
- **Hooks de visibilidad** — el overlay se oculta en level-up, pausa, game over, victory y al volver al menú. Vuelve a aparecer en `resumeGame` y `chooseUpgrade`.
- **Lado del joystick configurable** (`src/utils/touchLayout.js` + `SettingsPanel` toggle IZQ/DER) — default `right` (diestros). El cambio aplica en vivo a `TouchControls` (hot zone + botón pausa), `Minimap` (esquina) y `PauseMenu` (columnas inventario/stats invierten). `LevelUpMenu` no se invierte (cards simétricas en el centro). Persiste en `localStorage` con clave `survivorsTouchLayout`.

### Infraestructura
- **Meta tags PWA + safe-areas en `index.html`** — `apple-mobile-web-app-capable`, `mobile-web-app-capable`, `theme-color`, `viewport-fit=cover`, `body` con `env(safe-area-inset-*)` para el notch.
- **Exponer dev server en LAN** (`vite.config.js`) — `host: '0.0.0.0'` y `allowedHosts: true` para que el celular pueda acceder al dev server directo (sin iframe del hub).
- **Ignorar `dev-notes/`** en `.gitignore` — el split de notas privadas (gitignored) vs artefactos reviewables (commited) que pide la convención.

## Lo que quedó frágil
- **PWA descartada en esta iteración.** El sitio del jam no es PWA; los meta tags quedan como zero-cost, pero no se profundizó en manifest ni service worker. Si el deploy cambia, retomar.
- **Lock residual en Android Chrome**: si el browser sale de fullscreen por motivo externo (notificación, llamada), el `screen.orientation.lock` puede quedar aplicado. Confiamos en que el navegador lo limpie solo. Si aparecen reportes, agregar listener `fullscreenchange` para llamar `unlockOrientation`.
- **Portrait hint reaparece** cada vez que rotás a portrait. Intencional pero puede ser molesto si el usuario usa portrait por elección; aceptable por ahora.
- **Listeners de resize duplicados en GameScene** — el `onResize` original y el `onResizePortrait` conviven. No hay conflicto, pero si se agrega otro listener de resize, hay que acordarse del cleanup en `shutdown`.
- **Joystick visual sobre fondos oscuros**: el alpha 0.55 del anillo exterior puede leerse poco sobre el stage 3 (púrpura oscuro). Si pasa, subir alpha. No evaluado en device real todavía.

## Ideas no implementadas
- **Botón flotante de fullscreen dentro del HUD** durante el gameplay (no solo en menú/pausa). Útil si el jugador entra directo saltándose el menú. Bajo impacto, alto costo de UI.
- **SFX "fullscreen denied"** — el toast de fallback aparece mudo. El audio es procedural así que se puede sintetizar un parpadeo de error.
- **Listener `fullscreenchange` para cleanup del lock** si el browser sale por motivo externo.
- **Meta tag `screen-orientation=landscape`** y manifest PWA quedaron fuera de scope; la decisión fue no profundizar PWA en esta iteración.
- **Indicador sutil de hot zone antes del primer touch** — útil para discoverability, descartado para esta iteración.
- **Dash con dos dedos / botón de ataque manual** — el juego no tiene dash y el ataque es auto. Fuera de scope.

## Ideas para explorar
- **HUD informativo de armas** — Mostrar las armas activas con su daño y stats relevantes, usando iconos o una presentación que no sature la pantalla.
- **Feedback al recoger experiencia** — Sumar un efecto visual (halo, brillo, etc.) cuando se recoge XP para reforzar la sensación de progreso.
- **Auditoría de comportamiento de enemigos** — Revisar los tipos de enemigo actuales y sus patrones de movimiento para identificar mejoras y nuevos patrones.
- **Estética neón con switch clásico/neón** — Agregar una opción para alternar entre el tema visual clásico y un tema neón con colores vibrantes y pulsantes.
- **Música chiptune durante el gameplay** — Evaluar librerías tipo chiptune o similares para sumar música de fondo que acompañe la partida.
