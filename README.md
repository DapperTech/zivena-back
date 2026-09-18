# zivena-back

Backend base MEAN (MongoDB + Express + Angular + Node) con TypeScript, arquitectura modular por entidades y auth lista para Firebase.

El proyecto usa Express 5, Mongoose 9, Zod 4 y TypeScript 7 sobre Node.js 24 LTS.

El website dispone de una API pública de lectura en `/api/v2`, independiente
del panel en `/api/v1`. Consulta [el contrato y la configuración](docs/website-catalog-v2.md).

## Quickstart

1. Instala dependencias:
   npm install
2. Crea entorno local:
   copy .env.example .env
3. Configura `MONGO_URI`; `MONGO_DB_NAME` queda fijado en `zivena`. Si tu red bloquea la
   resolucion SRV local, agrega resolvers separados por coma en `DNS_SERVERS`.
4. Corre en desarrollo:
   npm run dev

## Scripts

- npm run dev: servidor de desarrollo con recarga
- npm run build: compila TypeScript a dist
- npm run start: ejecuta build compilado
- npm run typecheck: validacion de tipos sin emitir

## Estructura

- src/config: configuracion de entorno y DB
- src/shared: contratos base (errores, response, repositorio, controller, tipos/validaciones comunes)
- src/middlewares: middlewares globales y auth
- src/modules: modulos por entidad
- src/app: composicion de rutas y app Express
- src/server: arranque del servidor

## Endpoints base por modulo

- GET /api/v1/health
- /api/v1/users
- /api/v1/products
- /api/v1/providers
- /api/v1/categories
- /api/v1/subCategories
- /api/v1/requests
- /api/v1/clients
- /api/v1/quotations
- /api/v1/orders

Productos permite lectura publica mediante:

- GET /api/v1/products
- GET /api/v1/products/:id

La lista acepta `page`, `limit` (24, 48 o 96), `search`, `category` y `sort`. Devuelve `items` y
metadata de paginacion. La busqueda combina terminos sobre nombre, SKU, descripcion, atributos,
categorias y subcategorias, con espacios normalizados y tolerancia a acentos. La lectura por `id`
devuelve el producto completo con imagenes, variantes y especificaciones. Los endpoints de
escritura y los demas modulos conservan la proteccion de autenticacion.
Cada modulo expone por defecto:
- GET /
- GET /:id
- POST /
- PATCH /:id

## Convencion de nombres

- camelCase para nombres de campos y rutas compuestas (ejemplo: subCategories, profileImage)
- sin guiones ni underscores en nombres de propiedades

## Contrato de producto

El modelo refleja directamente el catalogo existente en MongoDB:

- `id` y `sku`: identificadores del producto extraido de PromoOpcion.
- `url`: ficha original del producto.
- `availability`: estado y cantidad disponible.
- `images`: objetos con URLs original, media y thumbnail.
- `variants`: colores, opciones e imagenes por variante.
- `specifications` y `additionalAttributes`: informacion tecnica y de impresion.
- `categoryIds` y `subcategoryIds`: referencias string a las colecciones del crawler.
- `source` y `sources`: procedencia y fecha de extraccion.

MongoDB conserva 1,747 productos, 26 categorias y 103 subcategorias. El backend no crea indices,
colecciones ni datos al arrancar; la base existente es la unica fuente del catalogo.

## Auth actual

- AUTH_BYPASS=true: inyecta usuario de desarrollo
- AUTH_BYPASS=false: exige Bearer token y usa proveedor de auth (placeholder para Firebase)
