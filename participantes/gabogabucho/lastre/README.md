# LASTRE

Auto-runner físico lateral hecho con **Phaser 4.2.1 + Matter**.

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

Avanzar mientras la cámara empuja. La materia luminosa se pega al cuerpo; la piedra arranca masa. Si el borde izquierdo alcanza el núcleo, termina la partida.

## Estado

- [x] Corte 0: cuerpo compuesto mutable con Matter; masa, inercia y centroide se recalculan.
- [x] Corte 1: loop básico crecer → deformarse → rasparse → recuperar terreno.
- [x] Pulso magnético dependiente de masa para reorientar aterrizajes.
- [ ] Corte 2: diseño de obstáculos y pasos angostos.
- [ ] Corte 3: arte, sonido y feedback.

## Verificación técnica

- `?grow=7` — fuerza siete adhesiones para inspeccionar el compuesto.
- `?grow=7&shed=right` — fuerza crecimiento y desprende una parte del lado derecho.
