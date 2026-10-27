---
name: Llakta
description: Un rótulo de barrio pintado a mano que convierte un problema contado con tus palabras en un plan.
colors:
  paramo: "#24533b"
  paramo-deep: "#163826"
  paja: "#e0a92e"
  paja-hover: "#eab747"
  barro: "#8c3b22"
  neblina: "#f2f5f1"
  tinta: "#13231a"
  tinta-muted: "#4d5c53"
  sobre-paramo: "#d7e6dc"
  hoja: "#ffffff"
  raised: "#edf2ee"
  border: "#d3ddd6"
  control: "#b9c6bd"
  paja-soft: "#fbf0d9"
  error: "#a3271b"
typography:
  display:
    fontFamily: "Alfa Slab One, Rockwell, serif"
    fontSize: "clamp(38px, 5.2vw, 68px)"
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: "0.005em"
  headline:
    fontFamily: "Alfa Slab One, Rockwell, serif"
    fontSize: "clamp(28px, 3.2vw, 40px)"
    fontWeight: 400
    lineHeight: 1.1
  title:
    fontFamily: "Alfa Slab One, Rockwell, serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.2
  body-lede:
    fontFamily: "Rubik, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "28px"
  body:
    fontFamily: "Rubik, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  label:
    fontFamily: "Rubik, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: "22px"
  small:
    fontFamily: "Rubik, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "19px"
rounded:
  tag: "6px"
  nav: "8px"
  control: "10px"
  row: "12px"
  sheet: "14px"
  composer: "18px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "56px"
  gutter-desktop: "40px"
  gutter-mobile: "16px"
components:
  button-primary:
    backgroundColor: "{colors.paja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    padding: "0 22px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.paja-hover}"
  button-secondary:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
  button-secondary-hover:
    backgroundColor: "{colors.raised}"
  chip-example:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pill}"
  chip-paja:
    backgroundColor: "{colors.paja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
  hoja:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sheet}"
    padding: "24px"
  input:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
  barra:
    backgroundColor: "{colors.barro}"
    textColor: "{colors.hoja}"
    height: "60px"
  riel:
    backgroundColor: "{colors.paramo}"
    textColor: "{colors.sobre-paramo}"
  riel-item-active:
    backgroundColor: "{colors.paja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.nav}"
---

# Design System: Llakta

## Overview

**Creative North Star: "Rótulo popular"**

Llakta se anuncia como un rótulo de barrio pintado a mano: campos plenos de verde páramo, la pregunta en letra de rótulo blanca con su sombra pintada en tinta, la acción en dorado de paja y la barra superior en barro cocido. Lo que la persona escribe y lo que los agentes devuelven cae en hojas blancas con borde de tinta, puestas sobre el verde o sobre la neblina del lienzo.

El sistema tiene dos registros que se alternan. El campo verde (inicio, entrevista, sala de agentes, páginas públicas, riel del proyecto) es el rótulo: letra grande, poco texto, una sola acción dorada. El lienzo de neblina (vistas del proyecto) es el tablero de trabajo: hojas blancas de borde de tinta, títulos en letra de rótulo verde y cuerpo en Rubik. La densidad es moderada; todo está pensado para leerse en un celular y en un proyector.

Las fotos son reales, de comunidades y mingas, enmarcadas en blanco con su crédito debajo. No hay degradados, ni vidrio, ni sombras difusas en las tarjetas.

**Key Characteristics:**
- Campos de color pleno de ancho completo, nunca degradados.
- Letra de rótulo (Alfa Slab One) solo para titulares, conteos y títulos de hoja; Rubik para todo lo demás.
- Hojas blancas con borde de tinta de 2px como único contenedor de contenido.
- Una acción dorada de paja por vista, con texto en tinta.
- Barra de barro arriba en todas las pantallas a pantalla completa y en el teléfono.

## Colors

Paleta Páramo: verdes de altura, paja seca, barro cocido y tinta, sobre una neblina apenas verdosa.

### Primary
- **Verde páramo** (paramo): el campo del rótulo (inicio, entrevista, sala, firmas, unirse, comunidad), el riel lateral del proyecto, la placa de firmas y la del QR, y el color de los títulos en letra de rótulo sobre el lienzo claro. También el cursor de texto, el borde de foco de los campos y los números de las preguntas.
- **Páramo hondo** (paramo-deep): la línea interior que separa el riel del lienzo y el fondo de los marcos de foto mientras carga la imagen.

### Secondary
- **Dorado de paja** (paja): la acción principal, la sección actual del riel, la parada "ahora" en el camino de agentes, las casillas firmadas, las tareas en curso en la tira de avance, el rombo de los hitos y la selección de texto. Al pasar el cursor sube a **paja clara** (paja-hover).
- **Paja suave** (paja-soft): el fondo de lo que todavía no tiene persona (tarea libre, lugar sin ocupar) y del documento elegido.

### Tertiary
- **Barro cocido** (barro): la barra superior (y el `theme-color` del navegador), la línea de "hoy" en el camino y los avisos de algo pendiente o atrasado en el texto.
- **Azul de información** (#e1ebf5 / #234a72): las pastillas informativas de la lista de proyectos van en un azul claro con texto azul hondo. La variable `--cielo` está declarada pero ninguna pantalla la usa todavía; no se registra como token.

### Neutral
- **Neblina** (neblina): el fondo del lienzo y de la página.
- **Hoja** (hoja): blanco de las hojas, los campos y los botones secundarios.
- **Tinta** (tinta): todo el texto sobre claro, los bordes de las hojas, la sombra pintada de la letra y el texto sobre paja.
- **Tinta apagada** (tinta-muted): texto secundario, pistas, encabezados de tabla.
- **Sobre páramo** (sobre-paramo): texto secundario sobre el verde (entradillas, pies de foto, ítems inactivos del riel).
- **Levantado, borde y control** (raised, border, control): fondos de filas, bordes suaves de filas y bordes de campos.
- **Error** (error): mensajes de error de formularios.

### Named Rules
**La Regla de la Paja.** El dorado de paja marca lo que se hace o lo que es ahora: la acción, la sección actual, la parada en curso, la casilla firmada. Nunca decora. Una sola acción dorada por vista; el texto sobre paja es siempre tinta, nunca blanco.

**La Regla del Campo Pleno.** El verde páramo va en campos de ancho completo o en placas enteras (riel, firmas, QR), de color plano y sin degradado. Sobre él, el texto es blanco o sobre-páramo.

## Typography

**Display Font:** Alfa Slab One (con Rockwell, serif), servida con next/font como `--rotulo`
**Body Font:** Rubik 400/500/600/700 (con system-ui, sans-serif), servida como `--letra`

**Character:** Alfa Slab One es la letra del pintor de rótulos: gruesa, de una sola variante, para gritar poco y claro. Rubik, redondeada y sencilla, carga todo lo que se lee y se toca.

### Hierarchy
- **Display** (Alfa Slab One 400, clamp(38px, 5.2vw, 68px), 1.06): la pregunta o el titular pintado en el campo verde, máximo unos 15ch, con su sombra pintada. Variante pequeña (clamp(32px, 4.2vw, 54px), 18ch) en entrevista, sala y páginas públicas.
- **Headline** (Alfa Slab One 400, clamp(28px, 3.2vw, 40px), 1.1): el nombre del proyecto sobre el lienzo, en verde páramo.
- **Title** (Alfa Slab One 400, 20–30px, 1.1–1.2): títulos de hoja y de panel, en verde páramo sobre blanco o blanco sobre verde. Los conteos grandes (firmas, 48–52px) y las cifras (22px) usan la misma letra.
- **Body lede** (Rubik 400, 18px/28px; 16px/25px en el teléfono): entradillas y citas sobre el verde, máximo 52–56ch.
- **Body** (Rubik 400, 16px/24px): listas, cuerpo de documentos (16px/26px) y texto de campaña (18px/29px, máximo 760px de columna).
- **Label** (Rubik 600, 15–16px): etiquetas de campos y títulos de filas. Botones en Rubik 700, 16px.
- **Small** (Rubik 400, 13px/19px): pistas, metadatos, encabezados de tabla, pies de foto (12px).

### Named Rules
**La Regla de la Sombra Pintada.** La letra de rótulo sobre el campo verde lleva su sombra pintada: un desplazamiento duro de 0.06em en tinta, sin desenfoque. Es el gesto del pintor de rótulos y es propio de este mundo; solo va en el display sobre verde, nunca en títulos de hoja, cuerpo ni cajas.

**La Regla de las Dos Letras.** Alfa Slab One solo para titulares, títulos y números que se cuentan; nunca en párrafos, botones, etiquetas ni navegación. Sin mayúsculas sostenidas ni tracking abierto: la letra de rótulo se escribe en caja normal.

## Layout

En pantallas a pantalla completa (inicio, entrevista, sala, páginas públicas) la barra de barro (60px; 56px en el teléfono) va arriba y debajo el campo verde de ancho completo. Dentro, una columna centrada de 1240px máximo con márgenes de 40px y una retícula 7fr / 5fr con 56px de separación: titular, entradilla y hoja a la izquierda; foto enmarcada o el camino de agentes a la derecha. En la sala, la columna derecha queda fija (sticky, 24px) mientras se lee.

El proyecto usa un riel verde a la izquierda y el lienzo de neblina con hojas blancas (lienzo con 36–40px a los lados y espacio inferior para el compositor flotante). La sala dentro del proyecto rompe los márgenes del lienzo para que el verde llegue a los bordes.

Las páginas de lectura (cuerpo de campaña, unirse) se estrechan a 760px.

Por debajo de 900px todo pasa a una columna con márgenes de 16px; el riel se vuelve barra de barro arriba con menú; en la sala el orden es titular, equipo trabajando y luego lo que va saliendo. Por debajo de 480px la barra superior muestra solo "Comunidad".

Ritmo de espaciado: 8, 12, 16, 24, 32 y 56px; las hojas separan sus bloques con 20–22px.

## Elevation & Depth

Plano. La profundidad la da el contraste entre campo verde, neblina y hoja blanca, y el borde de tinta de 2px. Las tarjetas y filas no llevan sombra; al pasar el cursor se levantan 1–2px y cambian de fondo.

### Shadow Vocabulary
- **Sombra pintada** (`text-shadow: 0.06em 0.06em 0 var(--tinta)`): solo en el display sobre verde.
- **Compositor flotante** (`box-shadow: 0 12px 28px -12px rgba(19, 35, 26, 0.35)`): la única sombra de caja, para el compositor del coordinador que flota sobre el lienzo.
- **Anillo de foco de campo** (`box-shadow: 0 0 0 3px #cfe2d6`) y **halo de la parada actual** (`box-shadow: 0 0 0 4px rgba(224, 169, 46, 0.3)`): estados, no elevación.

### Named Rules
**La Regla del Borde de Tinta.** Una hoja se separa del fondo con borde de tinta de 2px, no con sombra. Si algo necesita destacarse, cambia de fondo (paja suave, verde) o de borde, no de elevación.

## Shapes

Esquinas suavemente redondeadas y escalonadas por tamaño: 6px en etiquetas de rol, 8px en ítems de navegación y selects, 10px en botones, campos y filas, 12px en filas grandes y tarjetas del riel, 14px en hojas, paneles y marcos de foto, 18px en el compositor. Las pastillas y los ejemplos son totalmente redondos (999px); los números de pregunta y de parada son círculos.

Bordes: 2px de tinta en hojas, paneles, tarjetas y marcos; 1.5px en campos, botones secundarios y filas (gris de borde en reposo, tinta al pasar el cursor). Las fotos van enmarcadas con 8px de blanco (6px en el teléfono) y un contorno de tinta de 2px.

Las retículas de cifras y franjas usan el fondo de tinta que asoma por un hueco de 2px como división, sin líneas sueltas. El hito es un rombo pintado de paja de 7px, hecho en CSS.

## Components

### Buttons
- **Shape:** esquinas suaves (10px).
- **Primary:** fondo paja, texto tinta en Rubik 700 16px, 48px de alto y 22px a los lados, con flecha en SVG cuando lleva hacia adelante. Hover a paja clara; foco con contorno de tinta. Deshabilitado: fondo gris verdoso (#d9ded9) con texto tinta apagada, sin transparencia.
- **Secondary:** blanco con borde de tinta de 1.5px, Rubik 600; hover a fondo levantado. Es el botón de cada tarea y "Subir foto".
- **Toggle activo** (aria-pressed): fondo paja con borde de tinta.

### Chips
- **Ejemplos:** píldoras blancas con borde de control de 1.5px y Rubik 500; hover con borde verde páramo.
- **Chip de paja:** Rubik 600 13px sobre paja para "Elige una" y la salida recomendada.
- **Pastillas de estado:** "pos" en verde páramo con blanco, "warn" en rosa barro con texto barro, "quiet" blanca con borde.

### Cards / Containers
- **Hoja:** blanca, borde de tinta de 2px, 14px de radio, 24px de padding (18px en el teléfono). Es el contenedor de formularios, resultados de agentes, paneles del proyecto y la hoja de firmas.
- **Placa verde:** la misma hoja en verde páramo con texto blanco para las firmas del barrio y el QR (el código va sobre una placa blanca con borde de tinta).
- **Filas:** blancas o en fondo levantado, 10–12px de radio; las que esperan persona en paja suave; la seleccionada con borde de tinta de 2px.

### Inputs / Fields
- **Style:** blanco, borde de control de 1.5px, 10px de radio, Rubik 16px, cursor verde páramo, marcador en #66746b.
- **Focus:** borde verde páramo con anillo de 3px verde claro.
- **Error:** texto de error rojo bajo el campo.

### Navigation
- **Barra de barro:** marca (logotipo pixelado en paja con hueco de barro) y "Llakta" en letra de rótulo 24px; enlaces en Rubik 500 15px color crema, hover con velo blanco al 12%. Foco con contorno de paja.
- **Riel del proyecto:** campo verde; el proyecto en un recuadro con borde blanco translúcido; ítems en sobre-páramo con iconos SVG; la sección actual es una placa de paja (8px) con texto tinta que viaja entre ítems; los conteos en paja. Una tarjeta blanca con borde de tinta al pie para la página de firmas.

### Camino de agentes (signature)
Paradas numeradas sobre el verde unidas por una línea: hechas en círculo blanco con número verde y línea de paja, la actual en círculo de paja con halo, las siguientes en verde con borde blanco. Cada agente trabajando aparece como fila blanca con borde de tinta y una barra de barrido de paja.

### Casillas de firmas (signature)
Una casilla por vecino; cada firma pinta su casilla de paja. La misma idea vuelve en la tira de avance de tareas (pendiente gris verdoso, en curso paja, hecha verde).

## Do's and Don'ts

### Do:
- **Do** pintar el titular de cada pantalla a pantalla completa sobre el campo verde páramo, en Alfa Slab One con su sombra pintada de tinta (0.06em).
- **Do** poner todo contenido sobre hojas blancas con borde de tinta de 2px y 14px de radio.
- **Do** dejar una sola acción dorada de paja por vista, con texto tinta y dentro del primer vistazo.
- **Do** enmarcar las fotos reales con 8px de blanco y contorno de tinta, con su crédito debajo.
- **Do** dibujar marcas e iconos en SVG o CSS (rombo de hito, logotipo pixelado, círculos numerados).

### Don't:
- **Don't** usar degradados, vidrio, ni sombras difusas en tarjetas u hojas; la única sombra de caja es la del compositor flotante.
- **Don't** poner texto blanco sobre paja ni usar paja como decoración.
- **Don't** usar Alfa Slab One en párrafos, botones, etiquetas o navegación, ni escribirla en mayúsculas sostenidas.
- **Don't** aplicar la sombra pintada fuera del display sobre verde.
- **Don't** traer la serif ni el teal de la base anterior (Instrument Serif, #1b6e66) a pantallas nuevas.
