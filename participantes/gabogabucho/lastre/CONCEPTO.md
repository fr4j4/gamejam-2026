# LASTRE — concepto de jam

## Promesa

Un auto-runner lateral sobre **crecer por accidente y adelgazar a propósito**. La forma del personaje es simultáneamente vida, control, obstáculo y registro de errores.

## Verbo central

**Inclinar.** El jugador aplica torque hacia la izquierda o la derecha mientras el mundo lo empuja. Un pulso magnético corto permite despegarse apenas del suelo para cambiar el aterrizaje; no reemplaza el control de forma.

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
- **A/D o ←/→ aplican torque.** Espacio produce un hop bajo que pierde altura con la masa.

## Dirección conceptual: chatarra magnética

El núcleo es un electroimán blanco-cian. Lo que recoge no son partículas abstractas: son tornillos, chapas, resortes, tuercas y engranajes oxidados.

La regla de producción es estricta: **la forma dibujada debe coincidir con la forma Matter**. Una chapa larga necesita un collider largo; un engranaje puede aproximarse con un círculo. Las piezas no se simulan por separado una vez adheridas: pasan a ser partes convexas del mismo cuerpo compuesto.

La chatarra explica el loop sin tutorial: metal se adhiere al imán, hormigón y piedra lo raspan, una trituradora puede arrancar piezas. El mundo será industrial y desaturado; el núcleo magnético conserva el único color luminoso.

La referencia estructural es Katamari, pero la inversión es esencial: allí crecer es el objetivo y la esfera se normaliza; aquí crecer es deuda, la forma empeora y desprender materia es una habilidad.

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
