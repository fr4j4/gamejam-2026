# MR. LASTRE

Auto-runner físico lateral hecho con **Phaser 4.2.1 + Matter**. Mr. Lastre es un pequeño electroimán que cruza la ciudad industrial buscando el basurero municipal.

## Ejecutar

No requiere instalación ni build.

```bash
python -m http.server 8080
```

Abrir:

`http://localhost:8080/participantes/gabogabucho/lastre/`

## Controles

- **A / ←** — torque antihorario.
- **D / →** — torque horario.
- **Espacio** — pulso magnético corto. Cuanta más masa, menor altura.
- **R** — reiniciar.

## Objetivo

Llegar al basurero mientras la cámara empuja. Engranajes, chapas y tuercas se pegan al cuerpo; el hormigón arranca masa. Si el borde izquierdo alcanza el núcleo, termina la partida.

Cada pieza dibujada tiene la misma forma que su collider Matter y, al adherirse, pasa a ser parte del único cuerpo compuesto de Mr. Lastre.

La partida comienza en una pantalla breve de objetivo y controles; la física y el cronómetro esperan hasta que el jugador pulse **Espacio**, **Enter** o haga click. Toda la chatarra adherida conserva el magnetismo: una pieza de la periferia también puede capturar otra.

## Zonas interactivas

- **Zona de obra (500–700 m):** una grúa sostiene una carga Matter real. El arco rojo anticipa su trayectoria; el golpe desestabiliza y cuesta terreno, pero no mata ni desprende piezas por regla especial.
- **Superimán (antes de 800 m):** activa durante 6 segundos un radio de imantado de 120 px. La chatarra viaja hacia la parte más cercana del compuesto y solo entonces se incorpora.
- **Campo electromagnético (800–950 m):** paneles de techo atraen hacia arriba. La fuerza escala con la raíz de la masa, así que un Mr. Lastre pesado se suspende menos.

Cada zona tiene señal de entrada, un tramo de desarrollo y una salida limpia. Las instrucciones están en la ciudad para no alargar la pantalla inicial.

## Puntuación

- Cada pieza muestra su valor antes de recogerla; forma y tamaño determinan valores entre **$10 y $40**.
- Al llegar, se suma únicamente el valor de la chatarra que sigue adherida. Una pieza perdida contra la piedra deja de puntuar.
- El bonus de tiempo es transparente: **$10 por cada segundo restante de un objetivo de 180 segundos**, sin valores negativos.

## Estado

- [x] Corte 0: cuerpo compuesto mutable con Matter; masa, inercia y centroide se recalculan.
- [x] Corte 1: loop básico crecer → deformarse → rasparse → recuperar terreno.
- [x] Pulso magnético dependiente de masa para reorientar aterrizajes.
- [x] Corte 2: ciudad industrial, señalética, ruta y basurero como meta.
- [x] Corte 3: identidad de Mr. Lastre y taxonomía procedural de chatarra física.
- [x] Onboarding, valores de chatarra, magnetismo periférico y puntuación de entrega.
- [x] Corte 4: zonas sistémicas con péndulo, campo vertical y superimán temporal.
- [ ] Corte 5: sonido y ajuste de ritmo tras pruebas con jugadores.

## Verificación técnica

- `?grow=7` — fuerza siete adhesiones para inspeccionar el compuesto.
- `?grow=7&shed=right` — fuerza crecimiento y desprende una parte del lado derecho.
- `?autostart` — omite la pantalla inicial para pruebas visuales automatizadas.
- `?qa=construction` — posiciona jugador y cámara frente a la grúa.
- `?qa=boost` — posiciona al jugador sobre el pickup para inspeccionar su aura y atracción.
- `?qa=field` — posiciona al jugador dentro del campo electromagnético.
