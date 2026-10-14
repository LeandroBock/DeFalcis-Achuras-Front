# Verificación de uso con teclado

`npm run test:keyboard` abre la app en Chrome y la recorre **solo con el
teclado** (nunca hace clic):

- **Pantallas:** en cada pantalla (y con el formulario de alta abierto) se
  llega a todo con Tab y el foco siempre se ve.
- **Flujos:** login, menú, paleta (Ctrl+K), atajos, clientes y precios
  especiales, nota de pedido, asignar reparto, entrega del repartidor y acceso
  de empleados. En cada modal verifica que el foco entra, que Tab no se escapa,
  que Esc lo cierra y que el foco vuelve al botón que lo abrió.
- **Celular (390 px):** menú lateral y recorrido con Tab.

Usa una base de datos **local** de prueba. Nunca la de producción: si la API
no es local, se niega a correr.

## Cómo correrla

1. En el **backend**, levantar el Postgres de prueba y el backend:

   ```bash
   docker compose -f docker-compose.test.yml up -d
   npm run start:keyboard
   ```

   `start:keyboard` usa `.env.keyboard`: puerto 3995, Postgres local en el
   puerto 5433, WhatsApp apagado y el admin `admin@test.com`. Las migraciones
   se corren solas.

2. En el **frontend**, en otra terminal:

   ```bash
   npm run test:keyboard
   ```

   Carga datos de prueba (si ya existen, no se duplican), levanta Vite en el
   puerto 5179 y muestra ✅ / ❌ por cada verificación. Si algo falla, sale con
   código 1.

## Opciones

| Variable                                           | Para qué                                                     |
| -------------------------------------------------- | ------------------------------------------------------------ |
| `HEADED=1`                                         | Ver el navegador mientras recorre la app                     |
| `CHROME_PATH`                                      | Usar otro Chrome/Chromium en vez del instalado               |
| `KEYBOARD_API_URL`                                 | Otra URL del backend local (default `http://localhost:3995`) |
| `KEYBOARD_APP_PORT`                                | Otro puerto para Vite (default 5179)                         |
| `KEYBOARD_ADMIN_EMAIL` / `KEYBOARD_ADMIN_PASSWORD` | Otro admin de prueba                                         |

En el backend, las variables de la terminal pisan las de `.env.keyboard`, por
ejemplo `DB_PORT=55432 npm run start:keyboard`.

## Notas

- Hace falta **Google Chrome** instalado (o `CHROME_PATH`).
- El backend permite 5 logins por minuto: si se corre dos veces seguidas, la
  verificación espera un minuto sola.
- Cada corrida entrega una nota de pedido y crea otras; la base de prueba va
  acumulando datos, pero no afecta el resultado.
