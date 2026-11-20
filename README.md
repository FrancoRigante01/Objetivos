# Objetivos

Aplicación web para organizar objetivos, tareas y recordatorios personales. Está hecha con Angular y guarda todos los datos en el navegador (`localStorage`), así que no necesita servidor ni base de datos.

## Funcionalidades

- **Listas inteligentes**: Mi día, Importantes, Planificadas y Completadas, con contador de pendientes en la barra lateral.
- **Objetivos**: título, descripción, fecha límite y prioridad (baja, media o alta).
- **Subtareas**: árboles anidados de subtareas, con opción de colapsarlas. Se pueden marcar para Mi día.
- **Listas propias**: crear listas y asignarles objetivos.
- **Recordatorios**: avisos con fecha y hora, con su propia sección.
- **Datos**: exportar e importar la información en un archivo.

## Requisitos

- Node.js y npm.
- Angular CLI (se puede usar `npx ng`, o instalarlo globalmente).

## Instalación

```bash
npm install
```

## Uso

Para levantar el servidor de desarrollo:

```bash
npm start
```

Después abrí `http://localhost:4200/`

## Decisiones de diseño

### Sin backend, datos en el navegador
La app no necesita servidor ni base de datos. Todo el estado se guarda en `localStorage` bajo una sola clave, lo que simplifica el despliegue (cualquier hosting estático sirve) y permite usarla sin cuenta. El costo es que los datos viven en un solo navegador, por eso existe la exportación e importación en un archivo JSON.