# Mercado Norte Sur — Mockup navegable

Prototipo estático (HTML/CSS/JS, sin backend) del marketplace outdoor
"Mercado Norte Sur". Sirve para revisar y aprobar el flujo completo de
compra/venta y moderación antes de implementarlo de verdad.

## Cómo verlo
Abrir `index.html` en el navegador y navegar con los enlaces normalmente,
o publicarlo con GitHub Pages (ver instrucciones más abajo).

## Mapa del sitio

```
index.html                    Home pública del marketplace (navegable por categoría)
auth/
  login.html                  Iniciar sesión (correo o Google)
  register.html                Crear cuenta (una sola cuenta: compra y vende)
  forgot-password.html         Recuperar contraseña por correo
cuenta/
  dashboard.html                Panel del usuario: compras, favoritos, publicaciones, ventas
  publicar.html                 Publicar un producto (asistente de 4 pasos) → queda "en revisión"
admin/
  dashboard.html                 Panel de administrador: aprobar/rechazar publicaciones y cuentas nuevas
assets/
  styles.css                    Design system compartido por todas las páginas (colores, tipografía, componentes)
```

## Flujo modelado
1. Un visitante navega el home por categoría y crea una cuenta (correo o Google).
2. Con la misma cuenta puede comprar y publicar productos para vender — no hay
   un rol separado de "vendedor".
3. Al publicar un producto, la publicación queda con estado **En revisión**
   y no aparece en el sitio hasta que un administrador la aprueba.
4. El administrador tiene una cola de **publicaciones pendientes** y otra de
   **cuentas nuevas**, con acciones de aprobar/rechazar (el rechazo pide un motivo,
   que el usuario ve reflejado como aviso en su panel).
5. El usuario ve en su panel el estado de cada publicación (en revisión,
   aprobada, rechazada con motivo) y de sus compras/ventas.

## Nota sobre el login
Los botones de "Continuar con Google" y el formulario de correo/contraseña son
visuales — no hay autenticación real todavía. Para producción, la forma más simple
de tener login con Google + recuperación de contraseña por correo sin construir
tu propio backend de auth es usar un proveedor como **Supabase Auth** o
**Firebase Authentication** (ambos tienen login social y recuperación de clave
integrados). Cuando pasemos esto a desarrollo real, se conecta ahí.

Las fotos de producto son placeholders de [Picsum Photos](https://picsum.photos)
— se deben reemplazar por las fotos reales que suban los usuarios.

## Abrir este proyecto en Cursor
1. Descomprimí `mercadonortesur.zip` en tu computador.
2. Abrí **Cursor** → `File → Open Folder...` → seleccioná la carpeta `mercadonortesur`.
3. Ya incluye un archivo `.cursorrules` con el contexto del proyecto (stack, estructura,
   design system, flujo de negocio) para que el asistente de Cursor entienda el
   proyecto sin que tengas que explicarlo de nuevo cada vez.
4. Para previsualizar mientras trabajás, dos opciones:
   - Más simple: abrir directamente `index.html` (u otro archivo) con doble clic
     desde el explorador de archivos — no necesita servidor, es HTML plano.
   - Con recarga automática al guardar: instalá la extensión **Live Server**
     (o **Live Preview**) en Cursor/VS Code, clic derecho sobre `index.html` →
     "Open with Live Server".
5. No hay `npm install` ni build — es HTML/CSS/JS puro, los cambios se ven
   apenas guardás y recargás el navegador.

## Publicar en GitHub Pages
En el repo: **Settings → Pages** → Branch `main`, carpeta `/ (root)` → Save.
El sitio queda en `https://TU-USUARIO.github.io/mercadonortesur/`.
