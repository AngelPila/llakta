# Imagen de producción: compila una vez y sirve con `next start`.
# Los proyectos y las fotos viven en /app/data, montado como volumen.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
RUN mkdir -p data
EXPOSE 3000
# El volumen llega con el dueño del host: se lo pasa a `node` y la app corre sin root.
CMD ["sh", "-c", "chown -R node:node /app/data && exec su node -s /bin/sh -c 'npm start'"]
