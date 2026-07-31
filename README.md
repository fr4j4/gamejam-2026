# 🎮 GameJam 2026 — kodingvibes

Esto es una GameJam. ¿Qué significa eso? Que durante 48 horas vamos a hacer juegos. Cada uno hace el suyo, y después cada uno mejora el de otro. Todo por diversión, para aprender y para compartir.

---

## ⏱️ ¿Cómo funciona? (en simple)

Son **48 horas** partidas en **2 mitades de 24 horas**:

### Primera mitad: tú haces tu juego (24h)
Te sientas, programas un juego, y lo subes. No importa si es chico, si es feo, si es raro. Lo importante es que funcione.

### Segunda mitad: mejoras el juego de otro (24h)
Te dan el juego de otro participante. Le agregas cosas, le arreglas bugs, lo haces más entretenido. Así todos aprendemos de todos.

---

## 📋 Reglas (léelas, son pocas)

1. **Ten una cuenta en late.kodingvibes.com** — si no tienes, no puedes participar
2. **Trabaja solo dentro de tu carpeta** — creas una carpeta que se llama `participantes/tu-nombre/` y todo lo que hagas va ahí adentro. No toques nada fuera de esa carpeta
3. **No muevas ni cambies archivos de otros** — nada de README, .gitignore, ni archivos que no sean tuyos
4. **Para entregar tu juego, haces un Pull Request (PR)** — no te asustes, más abajo te explico cómo
5. **@Motoko revisa tu PR** — ella es una IA, revisa que todo esté bien y si pasa, lo acepta automáticamente
6. **No juegos eróticos** — violencia extrema sí, sangre, gore, desmembramiento, todo bien. Pero nada de sexo

---

## 🚀 Guía paso a paso para participar (hasta tu abuela entiende)

Estos son los pasos para subir tu juego. Si nunca has hecho esto, sigue cada instrucción al pie de la letra.

### Paso 1: Crea una cuenta en GitHub (si no tienes)

Anda a https://github.com y crea una cuenta. Es gratis. Pon tu nombre, tu correo, una clave, y listo.

### Paso 2: Haz un "Fork" del repo

El "repo" es donde está guardado el proyecto. Piensa en un fork como "sacar una fotocopia" del repo para tener tu propia copia.

1. Abre este link: https://github.com/kodingvibes/gamejam-2026
2. Arriba a la derecha, busca el botón que dice **Fork** y haz clic ahí
3. Te va a preguntar dónde quieres copiarlo. Elige tu cuenta de GitHub
4. Listo, ya tienes tu propia copia del proyecto

### Paso 3: Descarga tu copia a tu computador

Esto se llama "clonar". Vas a bajar los archivos a tu PC para trabajar en ellos.

**Opción A (fácil — con GitHub Desktop):**
1. Descarga e instala GitHub Desktop desde https://desktop.github.com/
2. Abre GitHub Desktop e inicia sesión con tu cuenta de GitHub
3. Busca tu fork (se llama `TU_USUARIO/gamejam-2026`) y haz clic en "Clone"
4. Elige una carpeta en tu computador y listo

**Opción B (con comandos — para los más expertos):**
```bash
git clone https://github.com/TU_USUARIO/gamejam-2026.git
cd gamejam-2026
```

### Paso 4: Crea tu carpeta personal

Dentro de la carpeta `gamejam-2026`, busca la carpeta que se llama `participantes`. Ahí adentro, crea una carpeta con **tu nombre o apodo**. Por ejemplo:

```
participantes/juanito/
```

Todo tu juego va a ir dentro de esa carpeta. No pongas nada fuera de ahí.

### Paso 5: Programa tu juego

Aquí puedes usar lo que quieras:
- HTML + CSS + JavaScript (lo más fácil, solo necesitas un block de notas)
- Python
- COBOL (sí, COBOL también vale)
- Phaser
- Unreal Engine
- Lo que sea

**Requisito:** tu juego tiene que poder ejecutarse. Si alguien descarga tu carpeta, debe poder abrir tu juego y que funcione.

**Si usas npm (Node.js):** incluye un archivo `package.json` y explica en un README cómo ejecutarlo (ej: `npm install && npm start`). **No subas la carpeta `node_modules/`** — el archivo .gitignore ya la excluye sola.

### Paso 6: Sube tu juego a GitHub

Una vez que tengas tu juego listo dentro de `participantes/tu-nombre/`, tienes que subirlo.

**Con GitHub Desktop:**
1. Abre GitHub Desktop
2. Vas a ver los archivos nuevos que creaste
3. Abajo a la izquierda, escribe un mensaje corto como "Mi juego: el nombre de mi juego"
4. Haz clic en "Commit to main"
5. Después haz clic en "Push origin" para subirlo a internet

**Con comandos:**
```bash
git add participantes/tu-nombre/
git commit -m "Mi juego: el nombre de mi juego"
git push origin main
```

### Paso 7: Crea un Pull Request (PR)

El Pull Request es como "pedir permiso para que tu juego entre al proyecto original".

1. Abre https://github.com/kodingvibes/gamejam-2026 en tu navegador
2. Arriba vas a ver un aviso que dice algo como "TU_USUARIO/gamejam-2026 had recent pushes" y un botón que dice **"Compare & pull request"** — haz clic ahí
3. Si no aparece ese aviso, haz clic en la pestaña "Pull requests" y luego en el botón verde "New pull request"
4. Asegúrate que diga: **base: kodingvibes/gamejam-2026 ← main** y **compare: TU_USUARIO/main**
5. Escribe un título para tu PR, por ejemplo: "Mi juego: el nombre de mi juego"
6. En la descripción, explica qué hiciste, cómo se juega, y qué tecnologías usaste
7. Haz clic en el botón verde **"Create pull request"**

### Paso 8: Espera a @Motoko

@Motoko (una IA) va a revisar tu PR automáticamente. Si todo está bien, lo acepta y tu juego queda en el repo oficial. Si algo no está bien, te va a dejar un comentario explicando qué corregir.

---

## 📁 Cómo se ve la estructura del proyecto

```
gamejam-2026/
├── participantes/
│   ├── ejemplos/         # Juegos de ejemplo para que te inspires
│   │   ├── Snake/
│   │   ├── Tetris/
│   │   ├── Minesweeper/
│   │   ├── Twenty48/
│   │   ├── SpaceInvaders/
│   │   └── RiverRaid/
│   └── tu-nombre/        # Aquí va tu juego
│       ├── index.html
│       └── ...
├── .gitignore
├── LICENSE
└── README.md
```

---

## ✅ ¿Qué revisa @Motoko para aceptar tu juego?

- [ ] Que tu código esté solo dentro de `participantes/tu-nombre/`
- [ ] Que tu juego funcione (que se pueda abrir y jugar)
- [ ] Que no hayas copiado código sin entenderlo
- [ ] Si usas npm, que tengas `package.json` y no hayas subido `node_modules/`
- [ ] Que no sea un juego erótico (la violencia extrema sí está permitida)

---

## 📅 Fechas (para que las anotes en tu calendario)

- **Inicio:** viernes 31 de julio, 23:00 (hora de Chile)
- **Fin de la Fase 1 (hacer tu juego):** sábado 1 de agosto, 23:00
- **Fin de la Fase 2 (mejorar el juego de otro):** domingo 2 de agosto, 23:00
- **Fin de todo:** domingo 2 de agosto, 23:00

---

## ❓ Preguntas frecuentes

**P: Nunca he programado, ¿puedo participar?**
R: Sí. Puedes hacer un juego muy simple con HTML y JavaScript. Hay ejemplos en la carpeta `participantes/ejemplos/` que te pueden servir de guía.

**P: Trabajé con COBOL toda mi vida, ¿puedo usarlo?**
R: Sí. COBOL está permitido. Eso sí, quien reciba tu juego en la Fase 2 para mejorarlo va a necesitar un compilador de COBOL. Déjale instrucciones claras.

**P: ¿Puedo usar inteligencia artificial para que me ayude?**
R: Sí, pero tienes que entender lo que el código hace. Si copias y pegas sin saber, en la Fase 2 cuando te toque mejorar el juego de otro no vas a poder.

**P: ¿Qué pasa si no termino a tiempo?**
R: No pasa nada. Esto es para aprender y divertirse. Sube lo que tengas.

**P: ¿Hay premio?**
R: Por definir. Pero la experiencia y el orgullo de haber participado no tienen precio.

---

## 🌐 Links útiles

- Página oficial: https://kodingvibes.github.io/gamejam-2026/
- Repo en GitHub: https://github.com/kodingvibes/gamejam-2026
- Comunidad: kodingvibes.com
