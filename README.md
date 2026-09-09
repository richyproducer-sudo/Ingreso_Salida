# Ingreso · Salida — Control de Asistencia con FaceID

Sistema de control de horario laboral con reconocimiento facial (100% en el navegador, sin costos de nube). Permite marcar **Ingreso**, **Salida a almorzar**, **Regreso de almuerzo** y **Salida** con solo pararse frente a la cámara.

## Tecnología

- **Frontend:** React + Vite + TailwindCSS + Framer Motion + Recharts
- **Reconocimiento facial:** [face-api.js](https://github.com/justadudewhohacks/face-api.js) (TensorFlow.js) corriendo localmente en el navegador — los rostros nunca se envían a ningún servidor externo
- **Backend:** Node.js + Express
- **Base de datos:** SQLite (módulo nativo `node:sqlite` de Node.js, sin compilación)

## Primer uso

```bash
npm run install:all   # instala backend y frontend
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

## Notas

- Los modelos de IA (`client/public/models`) se descargaron una vez con `npm run download:models`; ya están incluidos, no necesitas volver a descargarlos salvo que borres esa carpeta.
- La base de datos vive en `server/data/attendance.db`.
- Cada marcaje respeta el orden lógico del día: si alguien ya marcó salida, no puede volver a marcar hasta el día siguiente.
