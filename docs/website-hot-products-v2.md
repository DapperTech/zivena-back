# Productos hot del website — handoff para Jorge

Fecha: 22 de octubre de 2026.

## Objetivo y decisión de datos

Implementar una sección de productos hot en el website, alimentada por el backend.
La selección se administra en el panel mediante `products.isHot`, un booleano.

- `true`: el producto pertenece a la selección hot.
- `false` o campo ausente en documentos antiguos: no pertenece a la selección.
- `featured` sigue siendo el indicador original del proveedor; es independiente de `isHot`.
- No se necesita un sistema de etiquetas para esta selección de sí/no.
- La selección inicial contiene los 29 productos existentes del catálogo editorial de 34 artículos. Los cinco faltantes quedan fuera.

El frontend debe consultar la API; no debe fijar los 29 SKU en el código ni conectarse a MongoDB.

## Disponibilidad y despliegue

**Disponible en producción desde el 22 de octubre de 2026.** La base pública es
`https://zivena-ap.web.app`; se verificó que el proxy de `/api/**` entrega esta
versión del backend. Jorge puede integrar directamente:

```text
https://zivena-ap.web.app/api/v2/products/hot?limit=96&sort=name-asc
```

Destino: proyecto `zivena-ap`, servicio Cloud Run `zivena-api`, región
`us-central1`, revisión `zivena-api-00003-mey` con el 100 % del tráfico.
El despliegue conservó las variables, las referencias a secretos, la cuenta de
servicio y los recursos existentes. No se requirió modificar Firebase Hosting.

En desarrollo, usar `http://localhost:4000` o el puerto configurado en el backend.
El origen del frontend debe estar permitido en `ALLOWED_ORIGINS`; la configuración
de ejemplo ya incluye `https://zivena.mx` y `https://www.zivena.mx`.

## Endpoint público para la sección

```http
GET /api/v2/products/hot?limit=96&sort=name-asc
```

No requiere token de Firebase, API key ni credenciales del panel. La respuesta
es HTTP `200` con `{ success: true, data: { items, pagination } }`.

Siempre selecciona `isHot: true` y excluye los productos ocultos mediante
`productVisibility.isVisible=false`. No permite obtener productos no-hot enviando
`isHot=false` a esta ruta: la selección hot permanece forzada.

| Parámetro | Valores / comportamiento |
| --- | --- |
| `page` | Entero de 1 a 10000; predeterminado 1. |
| `limit` | Entero de 1 a 96; predeterminado 24. Usar 96 para cargar los 29 iniciales en una sola página. |
| `sort` | `relevance`, `name-asc`, `name-desc`, `sku`. Predeterminado `relevance`: `featured` primero y después nombre, con desempate por ID. |
| `category` | ID de categoría, por ejemplo `cat_oficina`; no su slug. |
| `subcategory` | ID de subcategoría. |
| `search` | Hasta 100 caracteres; búsqueda tolerante a acentos. |
| `featured` | Filtro adicional `true` o `false` sobre el campo original. Normalmente omitirlo en la sección hot. |
| `view` | `summary` (predeterminado) o `detail`. Usar `summary` para tarjetas. |

La selección y la visibilidad se aplican antes de paginar. Si no hay resultados,
`items` es `[]`, `total` y `totalPages` son 0, y `hasNextPage` es `false`.
No hay un orden editorial manual ni se conserva el orden del PDF.

También existe el filtro equivalente `GET /api/v2/products?isHot=true`.
En esa ruta general, `isHot=false` selecciona los productos no-hot, incluidos los
documentos antiguos sin el campo. Omitir `isHot` conserva el catálogo completo.

## Contrato de respuesta para el frontend

```ts
interface ProductImage {
  originalUrl: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  url?: string;
  title?: string;
  alt?: string;
}

interface HotProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  isHot: boolean; // siempre true en /products/hot
  featured: boolean;
  categoryIds: string[];
  subcategoryIds: string[];
  availability: {
    status: string;
    text: string;
    availableQuantity?: number;
  };
  image: ProductImage | null;
}

interface HotProductPage {
  items: HotProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}
```

La respuesta pública no incluye `_id` ni `databaseId`. `id` es el identificador
del catálogo, por ejemplo `prod_tmps_94`, y no un ObjectId de MongoDB.
Con `view=detail`, cada artículo trae `images`, variantes, descripción,
especificaciones y los demás campos completos del producto, en lugar de la
propiedad resumida `image`.

Para abrir una ficha, reutilizar las rutas del website basadas en `slug`.
El backend permite consultar `GET /api/v2/products/slug/:slug` y
`GET /api/v2/products/:id`; ambos también devuelven `isHot`.
Para formularios de cotización, conservar el flujo existente documentado en
[website-leads-v2.md](website-leads-v2.md).

## Ejemplo de consulta

`apiBase` es el origen de la API, sin `/api/v2`; reutilizar la configuración
pública que ya utiliza el catálogo del website.

```ts
type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

async function getHotProducts(apiBase: string, signal?: AbortSignal): Promise<HotProductPage> {
  const url = new URL('/api/v2/products/hot', apiBase);
  url.searchParams.set('limit', '96');
  url.searchParams.set('sort', 'name-asc');

  const response = await fetch(url, { cache: 'no-store', signal });
  const result = await response.json() as ApiResult<HotProductPage>;
  if (!response.ok || !result.success) {
    throw new Error(result.success ? 'No se pudo cargar la selección' : result.error.message);
  }
  return result.data;
}
```

Para una fila o carrusel de ocho tarjetas, solicitar `limit=8`. Si la sección debe
mostrar toda la selección y supera 96 artículos en el futuro, recorrer páginas
hasta que `hasNextPage` sea `false`. No asumir que siempre habrá exactamente 29.

El endpoint hot envía `Cache-Control: no-store` y lee la bandera directamente de
MongoDB en cada consulta. A través de Firebase Hosting se verificó la cabecera
`no-cache, no-store, must-revalidate`, que también impide almacenar la respuesta.
Obtener los datos en tiempo de ejecución para que los
cambios del panel se reflejen al volver a consultar. Si el website genera esta
sección durante el build, establecer una regeneración o revalidación explícita;
un sitio estático ya publicado no cambia solo porque se actualice MongoDB.

## Requisitos de implementación del website

1. Agregar la sección usando los componentes de tarjetas y estilos existentes.
2. Obtener los datos de `/api/v2/products/hot`, sin credenciales privadas.
3. Usar `id` como clave estable y `slug` para enlazar a la ficha existente.
4. Para imagen, preferir `image.mediaUrl`, después `thumbnailUrl`, `originalUrl`
   o `url`; mostrar el placeholder existente si `image` es `null` o falla la carga.
5. Mostrar nombre y la información que ya admite la tarjeta del catálogo; no
   inventar precios, porque este contrato no ofrece precios de venta.
6. Contemplar carga, respuesta vacía y error sin interrumpir el resto del home.
7. Al cambiar la selección desde el panel, volver a consultar para mostrarla actualizada.

Errores: HTTP `400` / `VALIDATION_ERROR` para parámetros inválidos;
HTTP `500` / `INTERNAL_ERROR` ante una falla del backend. Conservar el formato
general `{ success: false, error: { code, message, details? } }`.

## Control desde el panel administrativo

El backend permite consultar `isHot` tanto en la lista administrativa como en la
ficha. El frontend del panel debe incorporar el interruptor y conectarlo al PATCH
existente; este repositorio contiene únicamente el backend.

```http
GET /api/v1/products/admin?isHot=true&page=1&limit=50
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

`admin` y `sales` pueden leer. El filtro `isHot` es opcional; `false` incluye los
documentos antiguos sin bandera y omitirlo devuelve ambos grupos. Los límites
administrativos continúan siendo 20, 50 o 100.

Para incluir un producto:

```http
PATCH /api/v1/products/prod_tmps_94
Authorization: Bearer <FIREBASE_ID_TOKEN_DE_ADMIN>
Content-Type: application/json

{"isHot": true}
```

Para retirarlo, enviar `{"isHot": false}`. Enviar booleanos JSON, no cadenas.
La respuesta es HTTP `200` con `{ success: true, data: productoCompleto }`.
El cambio requiere el rol `admin`; sin token se devuelve `401` y con rol `sales`,
`403`. Un ID inexistente devuelve `404`; un valor no booleano, `400`.
En desarrollo, `AUTH_BYPASS=true` simula un administrador.

El PATCH conserva los campos omitidos, incluidas categorías y `featured`.
Ocultar un producto mantiene su bandera hot pero lo excluye del website.
Desactivar `isHot` lo retira de la sección hot y conserva su presencia en el
catálogo general mientras siga visible.

## Inicialización de los 29 productos

La selección inicial está en `src/scripts/data/initialHotProductSkus.ts`:

| Grupo | SKU |
| --- | --- |
| Bebidas | `TAZ 050`, `TAZ 001`, `TMPS 77`, `TMPS 94`, `TMPS 213`, `TMPS 74` |
| Libretas | `HL 2021`, `HL 010`, `HL 9063`, `HL 9106`, `HL 9041` |
| Bolígrafos | `RQ 1160`, `RQ 013`, `SH 3020` |
| Sets | `SET 016`, `SET 029`, `SET 024` |
| Bolsas | `SIN 216`, `SIN 131` |
| Gorras | `COOL 001`, `CAP 005`, `GSP 002`, `CAP 004` |
| Accesorios | `M 7979`, `CEL 066`, `M 4180`, `M 63282-` |
| Antiestrés | `SOC 013`, `SOC 086` |

El guion final de `M 63282-` forma parte del SKU real.
Se omiten `TAZ 081`, `HL 1005`, `HL 9086`, `RQ 1167` y `SH 4009` por no existir en la colección.

El script requiere `MONGO_URI` privado y la base indicada en `MONGO_DB_NAME`
(en este proyecto, `zivena`). Si hace falta resolver SRV, configurar
`DNS_SERVERS=1.1.1.1,8.8.8.8` en el entorno del operador.

```sh
npm run seed:hot                 # solo consulta y muestra la prevalidación
npm run seed:hot -- --apply      # asigna isHot=true a esos 29 SKU
```

Antes de escribir, comprueba que estén los 29 SKU sin duplicados. La operación
solo asigna `isHot=true` a los productos de esa lista, sin upserts, sin crear
índices, sin alterar `featured` y sin desmarcar otros productos. Los documentos
restantes no necesitan una migración: el campo ausente se interpreta como `false`.

El script es para la carga inicial; no ejecutarlo en cada arranque o despliegue.
Volver a aplicarlo reactivaría productos iniciales que un administrador haya
retirado después. La selección de uso diario la controla el panel.

## Criterios de aceptación para el agente del frontend

- La sección usa el endpoint público y no contiene una lista fija de SKU.
- Las tarjetas enlazan a las fichas existentes y toleran imágenes nulas.
- La paginación o el límite elegidos no descartan productos inadvertidamente.
- Un producto con `isHot=false` no aparece en la sección; un hot oculto tampoco.
- El sitio soporta cero resultados y errores de red sin romper el home.
- La estrategia de consulta o regeneración permite reflejar cambios del panel.
- El sitio publicado usa un backend que ya contiene esta nueva ruta.

## Verificación realizada en el backend

El 22 de octubre de 2026 se aplicó la carga inicial en `Cluster0`, base `zivena`:
29 productos encontrados, 29 modificados y 29 verificados con `isHot=true`.
La colección conserva sus 1747 documentos. Se compararon los demás campos de
los 29 artículos antes y después, y permanecieron idénticos.

La compilación y las 12 pruebas automatizadas pasan. Además se ejecutó el
backend local contra la base real, con consultas HTTP de lectura: la nueva ruta
devolvió los 29 productos, la paginación de ocho elementos produjo páginas de
8/8/8/5 sin duplicados, y las lecturas administrativas y del catálogo v1
conservaron compatibilidad.

La imagen se construyó correctamente en Cloud Build
(`cce0a9c8-61d5-4f4a-896b-6594c9aa9049`) y primero se probó la revisión nueva sin
tráfico general. Después de verificar salud, los 29 SKU, paginación, CORS y
autenticación administrativa, se trasladó el 100 % del tráfico a
`zivena-api-00003-mey`. Se retiró la etiqueta temporal de verificación.

Se verificaron HTTP `200` y los 29 productos tanto en la URL directa de Cloud Run
como en `https://zivena-ap.web.app/api/v2/products/hot?limit=96&sort=name-asc`.
La lectura administrativa sin token devuelve `401` en ambas URLs.

Imagen desplegada:

```text
us-central1-docker.pkg.dev/zivena-ap/cloud-run-source-deploy/zivena-api@sha256:32af59a57d03254b5da7c61d0dc22813259cfb30bee3ad19d0de9121862d7eca
```

La revisión anterior `zivena-api-00002-p94` se conserva. Si el operador necesita
revertir el tráfico, el comando es:

```sh
gcloud run services update-traffic zivena-api --project=zivena-ap --region=us-central1 --to-revisions=zivena-api-00002-p94=100
```

Revertir el tráfico no modifica los datos de MongoDB. La revisión anterior no
incluye el nuevo endpoint hot.
