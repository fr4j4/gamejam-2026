# MR. LASTRE — concepto de jam

## Promesa

Un auto-runner lateral sobre **crecer por accidente y adelgazar a propósito**. La forma del personaje es simultáneamente vida, control, obstáculo y registro de errores.

Mr. Lastre es un electroimán perdido que atraviesa una ciudad industrial para entregar toda la chatarra que se le pegó en el basurero municipal. El destino siempre está indicado por señales y distancia: la historia acompaña al loop, no lo interrumpe.

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
- **Toda la masa sigue imantada.** El núcleo y cualquier pieza ya adherida pueden capturar chatarra nueva.

## Riesgo, recompensa y entrega

La chatarra no vale solamente por cantidad: forma y tamaño tienen un valor visible. Llegar cargado aumenta la puntuación, pero una forma grande y asimétrica pone en riesgo el tiempo y la supervivencia. Rasparse resuelve un problema físico a cambio de perder exactamente el valor de la pieza desprendida.

La pantalla final desglosa tiempo, bonus de tiempo, valor de chatarra entregada y total. El bonus vale 10 puntos por cada segundo restante hasta 180 segundos. Así, el jugador puede comprender el resultado y decidir en la siguiente partida si le conviene cargar más o llegar antes.

## Dirección conceptual: chatarra magnética

El núcleo es un electroimán blanco-cian con polos rojo y azul. Lo que recoge no son partículas abstractas: son chapas, tuercas y engranajes oxidados.

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

- Arte ilustrado definitivo, metaprogresión, poderes, enemigos y niveles narrativos.
- Simular cada píxel como un rigid body independiente.
- Editor procedural sofisticado: primero se valida si deformarse es divertido.

## Criterio de éxito

Sin leer instrucciones, una persona debe descubrir en menos de un minuto que puede engordar, rasparse y perder por quedarse atrás.
