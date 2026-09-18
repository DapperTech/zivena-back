# Catálogo público del website — API v2

La API del website se monta en `/api/v2`, independiente de las rutas del panel
en `/api/v1`. Solo lee colecciones existentes: no crea documentos ni índices.

| Método | Ruta | Respuesta en `data` |
| --- | --- | --- |
| GET | `/categories` | Categorías de MongoDB con `productCount` |
| GET | `/subcategories` | Subcategorías con `categoryId` y `productCount` |
| GET | `/products` | `{ items, pagination }` |
| GET | `/products/:id` | Producto completo, sin `_id`, con `slug` derivado |
| GET | `/products/slug/:slug` | La misma ficha, localizada por slug |

Las respuestas siguen `{ success: true, data }`. Los errores conservan
`{ success: false, error }`.

## Parámetros de productos

- `page`: entero desde 1; predeterminado 1.
- `limit`: entre 1 y 96; predeterminado 24.
- `category`: **ID de MongoDB**, por ejemplo `cat_oficina`, no el slug.
- `subcategory`: ID de subcategoría.
- `search`: búsqueda tolerante a acentos por nombre, SKU, taxonomía y atributos.
- `sort`: `relevance`, `name-asc`, `name-desc` o `sku`.
- `featured`: `true` o `false`, basado en el campo original.
- `view`: `summary` (predeterminado) o `detail`.

`summary` devuelve identificadores, nombre, relaciones, disponibilidad,
`featured`, `slug` y primera `image` (o `null`). `detail` conserva los campos del
producto, incluidas imágenes, variantes, especificaciones y atributos. El build
del website lo utiliza para obtener las fichas por lotes.

`GET /subcategories?category=<id>` limita la taxonomía a una categoría. Conteos
y lecturas públicas respetan `productVisibility.isVisible=false`.

La paginación ordena una proyección pequeña antes de obtener los documentos
completos para evitar ordenar las galerías en memoria de MongoDB.

## Desarrollo local

Usa el `.env` privado del backend y `npm run dev`. Si Firebase ocupa 4000:

```powershell
$env:PORT = '4001'
npm run dev
```

El website solo recibe la URL pública de esta API. Los formularios no forman
parte de v2 y las credenciales de MongoDB permanecen únicamente en el backend.
