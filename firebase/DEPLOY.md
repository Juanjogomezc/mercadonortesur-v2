# Índices y reglas de Firebase

Para activar la paginación del catálogo público, publica el índice compuesto:

```bash
firebase deploy --only firestore:indexes
```

El índice requerido está definido en `firebase/firestore.indexes.json` (colección `listings`, `status` ascendente y `createdAt` descendente). Las fotos JPG/PNG se redimensionan en el navegador y se convierten a WebP cuando el navegador lo soporta, usando JPEG/PNG como alternativa.

Las reglas de Storage están en `firebase/storage.rules`. Deben publicarse en el proyecto Firebase `mercadonortesur` desde Firebase Console o Firebase CLI. Guardar cambios en este repositorio no los publica automáticamente.

```bash
firebase deploy --only storage
```

Antes de abrir el registro al público, verifica que el bucket activo sea `mercadonortesur.firebasestorage.app` y ejecuta pruebas reales de alta, lectura y eliminación de imágenes con una cuenta normal.
