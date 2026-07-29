# 🏆 Sistema de Logros — GameJam 2026

## Propuesta técnica para detección automática + asignación manual

---

## 1. Filosofía

No todos los logros se pueden detectar con un script. Algunos requieren contexto humano (jugabilidad, creatividad, caos). Este sistema divide los logros en **3 capas** según su método de detección, priorizando los que se pueden automatizar sin falsos positivos.

---

## 2. Catálogo de Logros

### 🟢 Capa 1 — Automáticos (detección por script, 0 falsos positivos)

| # | Logro | Detonante | Criterio técnico |
|---|-------|-----------|------------------|
| 1 | 🧛 **Drácula del Código** | Commit | Al menos 1 commit entre las 02:00 y 06:00 AM (hora Chile) |
| 2 | 🚽 **El Que Flush-eó el Repo** | Push | `git push --force` detectado en el historial del PR |
| 3 | 😈 **Hizo Sufrir a Motoko** | PR mergeado | Más de 30 archivos modificados O diff > 5000 líneas |
| 4 | 🐛 **Bug Más Épico** | PR mergeado | Más de 10 commits después del primer review (indica fixes en cadena) |
| 5 | 🏗️ **Casa de los Simpson** | Código | Presencia de `var` (no `let`/`const`) o variables globales sin `const`/`let`/`var` |
| 6 | 🚀 **Olvidó el Return** | Código | Función principal sin `return` (análisis estático básico) |
| 7 | 🧊 **Frío como el Hielo** | Asset | Juego que pesa menos de 100 KB total (HTML+CSS+JS) |
| 8 | 🧠 **Prompt Skills Level: Dios** | Prompt | El prompt del PR contiene palabras clave como "guerra", "batalla", "ejército" pero el juego resultante es de granja, cocina, o simulación pacífica |
| 9 | 🎰 **Gambler's Fallacy** | Código | Presencia de `Math.random()` en más del 30% de las funciones del juego |
| 10 | 🧹 **Barrendero de Bugs** | PR | Más de 5 commits con mensajes que contengan "fix", "bug", "arreglo", "error" |

### 🟡 Capa 2 — Semiautomáticos (detección con heurística + revisión rápida)

| # | Logro | Detonante | Criterio |
|---|-------|-----------|----------|
| 11 | 🐒 **Código Tarzán** | Código | Sin funciones declaradas (todo en línea), sin estructura de archivos, pero el juego corre |
| 12 | 🧪 **Alquimista Digital** | Código | Importa/CDN de 3+ frameworks/libs no relacionadas (ej: Phaser + jQuery + Three.js) |
| 13 | 🎲 **Dios del Caos** | Código | Sin try/catch, sin validaciones, sin controles de errores — y el juego funciona igual |
| 14 | 🧩 **Rompecabezas Humano** | Código | Más de 3 niveles de anidamiento en funciones, callbacks sin nombre, lógica críptica |
| 15 | 🎯 **Efecto Mariposa** | Código | Una sola línea de código comentada que, al restaurarse, rompe todo el juego |

### 🔴 Capa 3 — Manuales (requieren juicio humano o comunitario)

| # | Logro | Asignado por | Criterio |
|---|-------|-------------|----------|
| 16 | 🎭 **Doble Personalidad** | Organizadores | El juego cambia de género/mecánica a mitad de la partida |
| 17 | 🎪 **Circo de Tres Pistas** | Organizadores | Tres mecánicas distintas que no tienen relación entre sí |
| 18 | 🎠 **Carrusel de la Confusión** | Organizadores | Más tiempo de carga que de juego real |
| 19 | 🧸 **Modo Fácil: La Vida** | Organizadores | El juego es imposible de perder |
| 20 | 🎬 **Director de Cine Mudo** | Organizadores | Sin sonido pero con diálogos/subtítulos memorables |
| 21 | 🏃 **El Que Hizo un Juego de Carreras...** | Organizadores | El título promete una cosa, la ejecución entrega otra completamente distinta |
| 22 | 🧨 **Más Explosiones Que un Michael Bay** | Comunidad | Votación popular |
| 23 | 🦗 **Cricket Mental** | Comunidad | Votación popular |
| 24 | 🎤 **Se Lanzó Sin Red** | Comunidad | Votación popular |
| 25 | 🧿 **Debuggeó con Fe** | Comunidad | Votación popular |

---

## 3. Arquitectura Técnica

### 3.1. Flujo de detección automática

```
PR mergeado en kodingvibes/gamejam-2026
        │
        ▼
[GitHub Webhook] ──► [GitHub Actions: achievement-hunter.yml]
        │
        ▼
[Script: hunter.py]
  1. Clona el repo en el commit mergeado
  2. Obtiene metadatos del PR (commits, autores, timestamps, diff stats)
  3. Analiza el código del participante (archivos en participantes/<author>/)
  4. Ejecuta reglas de Capa 1 (automáticas)
  5. Ejecuta heurísticas de Capa 2 (semiautomáticas)
  6. Genera reporte de logros detectados
        │
        ▼
[achievements.json] ← se actualiza con los nuevos logros
        │
        ▼
[Notificación] ← se envía al grupo de WhatsApp
```

### 3.2. Estructura de datos

```json
{
  "version": 1,
  "participants": {
    "juanito": {
      "name": "Juan Pérez",
      "github": "juanito",
      "achievements": {
        "automatic": ["dracula-del-codigo", "casa-de-los-simpson"],
        "semi_automatic": ["codigo-tarzan"],
        "manual": [],
        "community": []
      },
      "unlocked_at": "2026-08-01T22:15:00-04:00"
    }
  },
  "rules_metadata": {
    "dracula-del-codigo": {
      "evidence": "commit 3a1b2c3 a las 04:23 AM",
      "detected_by": "hunter.py v1"
    }
  }
}
```

### 3.3. Archivos necesarios

```
gamejam-2026/
├── .github/
│   └── workflows/
│       └── achievement-hunter.yml    ← GitHub Action
├── scripts/
│   └── hunter.py                     ← Script de detección
├── achievements/
│   ├── catalog.json                  ← Catálogo de logros (definiciones)
│   ├── data.json                     ← Logros desbloqueados (persistencia)
│   └── README.md                     ← Documentación del sistema
└── certificados/
    └── index.html                    ← Generador (ya existe)
```

---

## 4. Implementación por fases

### Fase 1 (pre-evento) — 2 horas de trabajo
- [x] Generador de certificados funcionando
- [ ] Crear `achievements/catalog.json` con definiciones de todos los logros
- [ ] Crear `achievements/README.md` con esta propuesta
- [ ] Implementar `scripts/hunter.py` con reglas de Capa 1 (automáticas)

### Fase 2 (durante el evento) — 1 hora
- [ ] Configurar GitHub Action `achievement-hunter.yml`
- [ ] Probar con PRs de ejemplo
- [ ] Ajustar reglas según falsos positivos

### Fase 3 (post-evento) — 2 horas
- [ ] Asignar logros de Capa 2 (semiautomáticos) con revisión rápida
- [ ] Asignar logros de Capa 3 (manuales) por organizadores
- [ ] Votación comunitaria para logros populares
- [ ] Generar certificados para todos los logros desbloqueados
- [ ] Publicar tabla de logros en la landing page

---

## 5. Limitaciones y riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Falso positivo en logro automático | Baja | Las reglas de Capa 1 están diseñadas para ser binarias y verificables |
| Participante se siente ofendido por un logro | Media | Todos los logros son humorísticos y se entregan en tono de broma. Si alguien no quiere su logro, se lo quitamos |
| Script se rompe con un caso borde | Media | hunter.py se ejecuta en un workflow separado, no bloquea el merge. Si falla, se reintenta manualmente |
| Logro "Drácula del Código" injusto si el participante está en otro huso horario | Alta | Normalizar todos los timestamps a UTC y documentar que el logro se asigna según hora Chile. Alternativa: detectar commits nocturnos relativos al participante (siempre codea de noche) |
| GitHub Action se cae por rate limiting | Baja | Usar token de motoko-section9 con permisos suficientes |

---

## 6. Ejemplo de ejecución

```bash
# Modo seco (solo reporta, no escribe)
python3 scripts/hunter.py --dry-run --pr 42

# Modo normal (detecta y escribe en achievements/data.json)
python3 scripts/hunter.py --pr 42

# Revisión manual (asigna logros de Capa 2 y 3)
python3 scripts/hunter.py --assign --participant juanito --achievement doble-personalidad
```

---

## 7. Integración con certificados

El generador de certificados ya existente (`certificados/index.html`) se conectará al archivo `achievements/data.json` para:

1. **Vista previa:** mostrar todos los logros de un participante
2. **Generación por lote:** generar certificados para todos los logros de todos los participantes
3. **Exportación:** descargar todos los certificados en un ZIP

---

## 8. Resumen de esfuerzo

| Fase | Tiempo | ¿Quién? |
|------|--------|---------|
| Fase 1 (pre-evento) | ~2h | Motoko (código) |
| Fase 2 (durante) | ~1h | Motoko (config + test) |
| Fase 3 (post-evento) | ~2h | Motoko + organizadores |
| **Total** | **~5h** | |

**TL;DR:** 5 horas de trabajo total, logros automáticos desde el día 1, manuales después del evento. El generador de certificados ya está listo.
