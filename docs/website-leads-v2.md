# Leads del nuevo sitio Zivena - API v2

Documento de integración para Jorge. El formulario del sitio envía datos al backend; **nunca** se conecta directamente a MongoDB ni usa credenciales del panel.

## Endpoint

```text
POST https://zivena-ap.web.app/api/v2/leads
Content-Type: application/json
Origin: https://www.zivena.mx
```

No requiere token de Firebase ni clave pública. El backend permite solicitudes CORS desde `https://www.zivena.mx` (origen exacto, con `www`). Es un endpoint público, no un endpoint de administración. En desarrollo local se puede usar `http://localhost:4000/api/v2/leads`, siempre que el origen del frontend esté en `ALLOWED_ORIGINS` del backend.

## Contacto general

Usa `type: "contact"`. Se exige `name` y **al menos uno** entre `email` y `phone`. `message` y `company` son opcionales. Omite las propiedades opcionales vacías en lugar de enviarlas como `""`.

```json
{
  "type": "contact",
  "name": "Ana Ruiz",
  "email": "ana@ejemplo.com",
  "phone": "9981234567",
  "company": "Ejemplo SA de CV",
  "message": "Quiero conocer opciones de regalos para un evento."
}
```

El backend crea una tarjeta nueva en la etapa **Nuevos** del CRM, con fuente **Contacto web**. **No** crea borrador de cotización. La asignación a un ejecutivo se hace después desde el panel.

## Solicitud de cotización

Usa `type: "quotation"`. Se exigen `name`, `email`, `phone` y al menos un producto. El backend crea la tarjeta del CRM en **Nuevos** y un borrador de cotización vinculado, con precios iniciales en cero para que Ventas los complete. No genera ni envía la cotización automáticamente.

```json
{
  "type": "quotation",
  "name": "Jorge Salazar",
  "email": "jorge@ejemplo.com",
  "phone": "9981234567",
  "company": "Ejemplo SA de CV",
  "message": "Necesitamos impresión a una tinta.",
  "deadline": "2026-11-30T18:00:00-05:00",
  "products": [
    {
      "sku": "TAZ077",
      "name": "Taza cerámica",
      "quantity": 100,
      "productId": "opcional-id-del-catalogo",
      "technique": "Serigrafía",
      "imageUrl": "https://ejemplo.com/taza.jpg"
    }
  ]
}
```

Por producto, `sku`, `name` y `quantity` son obligatorios. `quantity` debe ser entero positivo. `productId`, `technique` e `imageUrl` son opcionales. No envíes precios: se agregan en el panel. El arreglo acepta de 1 a 100 productos. `deadline`, si se incluye, debe ser una fecha ISO 8601 con zona horaria. Para solicitudes sin producto, usa el tipo `contact`.

## Respuesta

HTTP `201 Created` para ambos casos. La respuesta **no** devuelve los datos personales:

```json
{
  "success": true,
  "data": {
    "id": "id-de-la-oportunidad",
    "type": "contact",
    "status": "received"
  }
}
```

Para `quotation`, `type` vale `"quotation"` y `data.quotationId` contiene el ID del borrador vinculado.

Errores siguen `{ "success": false, "error": { "code": "...", "message": "...", "details": ... } }`:

| HTTP | Código | Cuándo |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Faltan campos, tipo/fecha/correo inválidos, campos no reconocidos o `products` incorrecto. |
| 400 | `INVALID_JSON` | JSON mal formado. |
| 429 | `RATE_LIMITED` | Más de 10 solicitudes por IP en 15 minutos. Respeta `Retry-After`/`RateLimit` cuando estén presentes. |
| 500 | `INTERNAL_ERROR` | Fallo temporal del servidor o base de datos. |

El límite del cuerpo JSON es 1 MB. El frontend debe deshabilitar el botón mientras espera respuesta para evitar dobles envíos; **no** debe reintentar automáticamente un `500` o una conexión perdida, porque el lead pudo haberse guardado. Si el usuario reintenta manualmente, puede crearse una segunda tarjeta. El limitador es por instancia de Cloud Run, no una cuota global.

## Ejemplo en el frontend

```ts
async function enviarLead(payload: Record<string, unknown>) {
  const response = await fetch('https://zivena-ap.web.app/api/v2/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message ?? 'No se pudo enviar la solicitud');
  return result.data; // { id, type, status, quotationId? }
}
```

## Prueba manual

```bash
curl -i -X POST 'https://zivena-ap.web.app/api/v2/leads' \
  -H 'Content-Type: application/json' \
  -d '{"type":"contact","name":"Prueba de integración","email":"prueba@example.com","message":"Verificar recepción"}'
```

Esta prueba **crea un lead real** en el CRM: úsala solo cuando se vaya a verificar y elimínalo después desde el panel. Para revisar CORS desde el navegador, prueba el formulario publicado en `https://www.zivena.mx`; `curl` no aplica restricciones CORS.

## Notas para el mapeo

- Se recortan espacios en textos; el correo se guarda en minúsculas.
- Los campos no listados se rechazan. No envíes `stage`, `priority`, `source`, `assignedTo`, `metadata` ni `unitPrice` desde el navegador.
- El backend fija `stage: "new"`, `priority: "medium"` y el canal `zivena.mx`.
- La ruta antigua `POST /api/v1/leads/website` sigue disponible para compatibilidad, pero el sitio nuevo debe usar `/api/v2/leads`.
