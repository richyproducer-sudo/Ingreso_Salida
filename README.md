# Ingreso · Salida — Control de Asistencia con FaceID

Sistema de control de horario laboral con reconocimiento facial (100% en el navegador, sin costos de nube). Permite marcar **Ingreso**, **Salida a almorzar**, **Regreso de almuerzo** y **Salida** con solo pararse frente a la cámara.

## Tecnología

- **Frontend:** React + Vite + TailwindCSS + Framer Motion + Recharts
- **Reconocimiento facial:** [face-api.js](https://github.com/justadudewhohacks/face-api.js) (TensorFlow.js) corriendo localmente en el navegador — los rostros nunca se envían a ningún servidor externo
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL ([Neon](https://neon.tech), gratis y persistente)

## Primer uso (local)

```bash
npm run install:all   # instala backend y frontend
```

Crea `server/.env` con tu conexión a Postgres (ver `server/.env.example`):

```
DATABASE_URL=postgresql://usuario:password@host/db?sslmode=require
```

```bash
npm run dev            # levanta backend (puerto 4000) y frontend (puerto 5173)
```

Abre `http://localhost:5173`:

- **Pantalla principal (`/`)**: el kiosco de marcaje por FaceID. Cualquier empleado se para frente a la cámara y el sistema lo reconoce y registra automáticamente el marcaje que le corresponde (ingreso → almuerzo → regreso → salida, en orden).
- **Panel administrador (`/admin/login`)**: gestión de empleados, registro facial y reportes.
  - Usuario inicial: `admin@empresa.com` / `admin123` (cámbialo después de tu primer ingreso creando otro admin).

## Flujo para agregar un empleado

1. Entra al panel admin → **Empleados** → **Nuevo empleado**.
2. Completa nombre y email (la contraseña es opcional, solo se necesita si ese empleado también usará el panel admin).
3. El sistema abre la cámara para capturar su rostro (FaceID). Con el rostro centrado, presiona **Capturar rostro**.
4. Desde ese momento el empleado puede marcar su horario en la pantalla principal.

## Despliegue en producción (Render)

El repo incluye `render.yaml` para desplegar con un click:

1. Ve a `https://render.com/deploy?repo=https://github.com/richyproducer-sudo/Ingreso_Salida`
2. Inicia sesión con GitHub y autoriza el repositorio
3. Cuando te pida la variable `DATABASE_URL`, pega tu connection string de Neon (u otro Postgres)
4. Render construye el frontend y lo sirve desde el mismo servicio Express — una sola URL pública para todo

## Notas

- Los modelos de IA (`client/public/models`) se descargaron una vez con `npm run download:models`; ya están incluidos, no necesitas volver a descargarlos salvo que borres esa carpeta.
- Cada marcaje respeta el orden lógico del día: si alguien ya marcó salida, no puede volver a marcar hasta el día siguiente.
- La cámara (FaceID) solo funciona en `localhost` o bajo HTTPS — el despliegue en Render ya sirve todo por HTTPS automáticamente.
