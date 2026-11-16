# Configuración inicial de Firebase para Mercado Norte Sur

## 1. Habilitar Authentication

En la consola de Firebase, entra a **Authentication → Sign-in method** y activa:
- **Google** (haz clic, activa, ponle el nombre del proyecto y un correo de soporte)
- **Correo electrónico/contraseña** (activa la primera opción; la segunda "sin contraseña" no hace falta)

Luego ve a **Authentication → Configuración → Dominios autorizados** y agrega:
```
juanjogomezc.github.io
www.mercadonortesur.cl
mercadonortesur.cl
```

## 2. Habilitar Firestore

En la consola: **Firestore Database → Crear base de datos**.
- Elige la región más cercana (para Chile: **us-central1** o **southamerica-east1**)
- Arranca en **modo producción** (las reglas correctas van en el paso siguiente)

## 3. Pegar las reglas de Firestore

En **Firestore → Reglas**, reemplaza todo lo que haya con el contenido
del archivo `firestore.rules` de esta misma carpeta y publica.

## 4. Habilitar Storage y pegar sus reglas

En **Storage → Comenzar** (elige la misma región que Firestore).
Luego en **Storage → Reglas**, reemplaza con el contenido de `storage.rules`
y publica.

## 5. Crear el primer administrador

El campo `role` de cada usuario no puede establecerse desde el cliente
(las reglas de Firestore lo protegen). Para el primer admin, usa la
consola de Firestore:

1. Crea tu cuenta normalmente desde el sitio (login → "Crea tu cuenta").
2. En **Firestore → Colecciones → users**, busca el documento con tu UID
   (lo ves en Authentication → Users).
3. Edita el documento y cambia:
   - `role`: `user` → `admin`
   - `status`: `pending` → `approved`

A partir de ahí, ese admin puede aprobar las cuentas nuevas desde el
panel de administración (`/admin/dashboard.html`), sin necesidad de
entrar a la consola de Firebase de nuevo.

## 6. Índices de Firestore

Normalmente **no tienes que crear ninguno**: las consultas del sitio ordenan en el
navegador justamente para evitarlo. Solo si en la consola del navegador (F12) aparece
un error "The query requires an index", Firebase incluye en ese mensaje un link que
lo crea con un clic.

## 7. Verificar que todo funciona

```
1. Registrate con correo y contraseña → deberías llegar al panel de usuario
   con el aviso "Tu cuenta está en revisión".
2. Aprueba tu propia cuenta desde Firestore (ver paso 5) o crea un
   segundo usuario con rol admin y aprueba el primero desde el panel admin.
3. Con la cuenta aprobada, publica un producto → aparece en "Mis publicaciones"
   con estado "EN REVISIÓN".
4. Desde el panel de admin, aprueba la publicación → debe aparecer en el home.
5. Prueba la subida de fotos → deben cargarse en Firebase Storage y verse
   en la tarjeta de producto del home.
```

## Notas importantes

- **Los módulos de Firebase (`type="module"`) no funcionan abriendo el HTML
  con doble clic (protocolo `file://`).**  
  Para probar en local, usa Live Server en Cursor o VS Code.  
  En GitHub Pages y en tu dominio (`www.mercadonortesur.cl`) funciona normal.

- **El catálogo de ejemplo del home** (`SHOW_DEMO_WHEN_EMPTY = true` en
  `index.html`) se sigue mostrando mientras no haya publicaciones aprobadas
  en Firestore. Cuando tengas contenido real, cámbialo a `false`.
