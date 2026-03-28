# Deploy MercaApp (Frontend + Backend)

## 1. Backend en Railway

1. Entra a [railway.app](https://railway.app) → New Project
2. **Importar desde GitHub** → selecciona tu repo
3. **Variables de entorno** (Settings → Variables):
   ```
   DATABASE_URL   = (la que Railway te da al añadir PostgreSQL)
   JWT_SECRET     = clave-secreta-aleatoria
   FRONTEND_URL   = https://tu-app.netlify.app
   PORT           = 3000
   ```
4. **Build command**: `npm run build`
5. **Start command**: `./start.sh`
6. Deploy → espera a que termine
7. Copia la URL del backend (termina en `.railway.app`)

## 2. Frontend en Netlify

1. Entra a [netlify.com](https://netlify.com) → Add new site → Import an existing project
2. Conecta tu repo de GitHub
3. **Build settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. **Environment variables** (Site settings → Build & deploy → Environment):
   ```
   VITE_API_URL = https://tu-backend.railway.app/api
   ```
5. Deploy site
6. Copia la URL del frontend (termina en `.netlify.app`)

## 3. Volver a Railway

En las variables del backend, actualiza `FRONTEND_URL` con la URL de Netlify para que CORS la acepte.

## 4. Probar

Abre la URL de Netlify → Login con:
- Email: `admin@mercaapp.co`
- Password: `admin123`

---

### URLs de ejemplo
- Backend: `https://mercaapp-production.up.railway.app/api`
- Frontend: `https://mercaapp.netlify.app`
