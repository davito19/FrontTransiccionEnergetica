# Front Transicion Energetica (Angular)

Frontend Angular para autenticacion, control por rol `ADMIN` y dashboard de datos energeticos consumiendo el backend en `http://localhost:8083`.

## Requisitos

- Node.js 20+
- npm 10+
- Backend activo en `http://localhost:8083`

## Instalacion

```bash
npm install
```

## Ejecucion

```bash
npm start
```

Abrir en `http://localhost:4200`.

Nota: en desarrollo se usa `proxy.conf.json` para enrutar `/api` hacia `http://localhost:8083` y evitar errores de CORS. Si cambias configuracion, reinicia `npm start`.

## Build

```bash
npm run build
```

## Credenciales de prueba

```json
{
	"email": "admin@correo.com",
	"password": "123456"
}
```

## Estructura

- `src/app/components`: login, registro, dashboard
- `src/app/models`: contratos TypeScript de auth, user, energia
- `src/app/services`: integracion REST
- `src/app/guards`: proteccion de rutas y rol ADMIN
- `src/app/interceptors`: adjunta token y maneja 401
- `src/environments`: configuracion dev/prod

## Configuracion de entornos

Angular no consume `.env` de forma nativa en navegador. Se usa estrategia oficial con:

- `src/environments/environment.ts` (produccion)
- `src/environments/environment.development.ts` (desarrollo)

El archivo `.env.example` sirve como referencia para valores esperados.

## Seguridad

- Token JWT en `Authorization: Bearer <token>` via interceptor
- Rutas protegidas por `authGuard` y `adminRoleGuard`
- Logout automatico ante `401`
- `.env`, `.env.local`, `.env.*.local` excluidos en `.gitignore`
