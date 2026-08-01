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

## Estado

- [x] Corte 0: cuerpo compuesto mutable con Matter; masa, inercia y centroide se recalculan.
- [x] Corte 1: loop básico crecer → deformarse → rasparse → recuperar terreno.
- [x] Pulso magnético dependiente de masa para reorientar aterrizajes.
- [x] Corte 2: ciudad industrial, señalética, ruta y basurero como meta.
- [x] Corte 3: identidad de Mr. Lastre y taxonomía procedural de chatarra física.
- [ ] Corte 4: sonido y pulido de obstáculos.

## Verificación técnica

- `?grow=7` — fuerza siete adhesiones para inspeccionar el compuesto.
- `?grow=7&shed=right` — fuerza crecimiento y desprende una parte del lado derecho.
