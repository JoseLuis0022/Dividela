# --- build ---
FROM node:22-alpine AS build
WORKDIR /app

# Estas dos ARG son las que definen dónde vive el backend para este build.
# Al desplegar detrás de un Cloudflare Tunnel, pásale el subdominio público
# del backend en VITE_API_BASE_URL; en LAN/desarrollo basta con dejarla
# vacía y fijar VITE_BACKEND_PORT (config.js infiere el resto del hostname actual).
ARG VITE_API_BASE_URL=""
ARG VITE_BACKEND_PORT="8000"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_BACKEND_PORT=$VITE_BACKEND_PORT

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# --- serve ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
