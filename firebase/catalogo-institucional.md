# Catálogo institucional de Mercado Norte Sur

## Qué hace
El catálogo inicial de 23 artículos y servicios se convierte en publicaciones reales de Firestore, con `sellerName: "Mercado Norte Sur"`, `sellerType: "admin"` y `adminCatalog: true`. Los IDs conservan `s0` a `s22` para mantener los enlaces y favoritos/carritos guardados anteriormente.

La importación se ejecuta desde el panel de administración, no desde la portada. Es idempotente: los documentos que ya existan no se sobrescriben.

## Activación después de integrar los cambios
1. En Firebase Console, abre Firestore Database → Rules.
2. Publica el contenido actualizado de `firebase/firestore.rules`. La regla permite que un administrador cree registros institucionales en estado `pending`; el panel los aprueba inmediatamente después.
3. Inicia sesión con una cuenta cuyo perfil tenga `role: "admin"`.
4. En el panel de administración, configura primero **WhatsApp institucional** con el número completo y código de país.
5. Pulsa **Cargar catálogo institucional** y confirma. Se cargarán hasta 23 registros; los existentes se omiten.

## Datos y fotografías
- Los precios, nombres, condiciones y ubicaciones proceden del catálogo inicial que ya estaba en el sitio.
- Los atributos técnicos que no estaban disponibles se muestran expresamente como “No informado” o “Por confirmar”; no se inventan especificaciones.
- Las fotografías actuales son referenciales y deben sustituirse por fotografías reales de cada artículo antes de ofrecerlos como inventario verificado.
- La disponibilidad, estado físico, accesorios y detalles no confirmados deben validarse antes de cerrar una venta.

## Contacto
Los artículos institucionales usan el WhatsApp configurado desde el panel. Las publicaciones de usuarios utilizan el WhatsApp que cada vendedor registra al publicar. El comprador debe iniciar sesión y tener su cuenta aprobada para abrir el contacto.