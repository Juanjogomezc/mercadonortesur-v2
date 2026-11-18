# Pruebas de autenticación y navegación — Mercado Norte Sur

## Cambios cubiertos
- Persistencia local explícita de Firebase Authentication.
- Caché de perfil limitada a la pestaña y a 30 segundos para evitar lecturas repetidas de Firestore al cambiar de página.
- Limpieza de caché al cerrar sesión.
- El login y registro redirigen a usuarios que ya tienen sesión activa.
- Tras autenticar, se reemplaza la página del formulario en el historial del navegador.
- Las páginas privadas conservan la ruta solicitada al enviar al usuario al login.
- Google ya no fuerza el selector de cuenta en cada ingreso.
- Los permisos siguen dependiendo de Firestore/Storage Rules; la caché no concede permisos.

## Matriz de pruebas manuales

| Dispositivo / navegador | Prueba | Resultado esperado |
|---|---|---|
| Android / Chrome | Iniciar sesión con correo y contraseña | Ingreso correcto y llegada al panel correspondiente |
| Android / Chrome | Abrir Mi cuenta, Publicar, volver atrás y avanzar | La sesión continúa; no aparece el formulario de login |
| Android / Chrome | Recargar una página privada | Se conserva la sesión |
| Android / Chrome | Abrir una URL privada directamente sin sesión | Login y, después de autenticar, retorno a la URL solicitada |
| iPhone / Safari | Repetir ingreso, recarga y navegación atrás/adelante | La sesión continúa sin pedir credenciales de nuevo |
| iPhone / Safari | Cerrar sesión y pulsar atrás | No se debe mostrar información privada; la página protegida debe exigir sesión |
| Escritorio / Chrome, Safari y Firefox | Navegar entre catálogo, cuenta y administración | Menús, enlaces, colores y diseño permanecen sin cambios |
| Todos | Entrar con Google teniendo cuenta previamente elegida | No se fuerza el selector de cuenta cada vez |
| Todos | Intentar una operación protegida con cuenta suspendida/no aprobada | Firebase Rules siguen rechazando la operación |

## Validaciones técnicas
- Revisar consola del navegador: sin errores de módulos, Firebase Auth ni rutas.
- Comprobar que el perfil se lee de Firestore en el primer acceso o al vencer el caché, no en cada navegación rápida.
- Confirmar que cerrar sesión elimina el caché de perfil de la pestaña.
- Confirmar que la navegación de retorno usa la ruta original y no pierde sus parámetros.

## Alcance de las pruebas
Esta lista define las pruebas de aceptación. La ejecución real en teléfonos físicos requiere probar en Safari de iPhone y Chrome de Android; una validación estática del repositorio no sustituye esas pruebas.

## Navegación por perfil (ampliación PR #26)

| Perfil | Inicio y páginas públicas | Opciones esperadas |
|---|---|---|
| Visitante | Inicio, ficha de producto, carrito, favoritos, compras y pagos | Comprar, Favoritos, Carrito e Iniciar sesión; el acceso a login conserva la URL de retorno |
| Usuario | Las mismas páginas, también al volver desde Mi cuenta | Nombre del usuario / Mi cuenta, Publicar anuncio y Cerrar sesión |
| Administrador | Las mismas páginas | Panel de administración, Mi cuenta, Publicar anuncio y Cerrar sesión |
| Todos | Móvil y escritorio | Los enlaces se mantienen dentro del menú existente; no cambia la paleta, tipografía ni estructura visual |

### Pruebas funcionales adicionales
- Iniciar sesión y volver al inicio: el encabezado debe mostrar el perfil activo.
- Abrir una ficha de producto y volver al catálogo: no debe pedir credenciales otra vez.
- Abrir carrito, favoritos, compras o pagos: el encabezado debe reflejar el mismo perfil.
- Cerrar sesión desde el menú móvil o desde una página pública: debe volver al catálogo como visitante.
- Verificar que un usuario normal nunca recibe un enlace al panel de administración.
- Verificar que un administrador sí recibe el enlace al panel y también puede entrar a Mi cuenta.
- Probar con pantalla estrecha (320–390 px) y escritorio (≥ 1024 px), comprobando que los enlaces no desbordan el encabezado.
