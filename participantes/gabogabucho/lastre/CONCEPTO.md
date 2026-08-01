# LASTRE — concepto de jam

## Promesa

Un auto-runner lateral sobre **crecer por accidente y adelgazar a propósito**. La forma del personaje es simultáneamente vida, control, obstáculo y registro de errores.

## Verbo central

**Inclinar.** El jugador no salta ni acelera: aplica torque hacia la izquierda o la derecha mientras el mundo lo empuja.

## Loop de cinco segundos

1. Ver materia blanda y piedra por delante.
2. Inclinar la masa para decidir qué lado expone.
3. Rozar materia blanda: se adhiere y desplaza el centro de masa.
4. Detectar un paso angosto.
5. Raspar el lado sobrante contra piedra: perder masa y también tiempo.

## Reglas que deben entenderse sin texto

- **Blando se pega.** Más volumen implica más inercia y peor rodadura.
- **Piedra arranca.** El contacto desprende la parte del lado golpeado.
- **El borde izquierdo mata.** Ningún obstáculo produce muerte instantánea.
- **A/D o ←/→ aplican torque.** No existe salto.

## Alcance de la primera sesión

### Corte 0 — prueba técnica

- Matter activo en Phaser 4.2.1.
- Cuerpo compuesto con partes agregadas durante la simulación.
- Masa, inercia y centroide recalculados por Matter.
- Velocidad lineal y angular preservadas al reconstruir el compuesto.

### Corte 1 — juego mínimo

- Cámara con avance constante.
- Materia blanda coleccionable.
- Piedra que desprende partes.
- Torque bilateral.
- Derrota únicamente al caer detrás de la cámara.
- Distancia como puntuación.

## Fuera de alcance por ahora

- Arte definitivo, metaprogresión, poderes, enemigos, salto, niveles narrativos.
- Simular cada píxel como un rigid body independiente.
- Editor procedural sofisticado: primero se valida si deformarse es divertido.

## Criterio de éxito

Sin leer instrucciones, una persona debe descubrir en menos de un minuto que puede engordar, rasparse y perder por quedarse atrás.
