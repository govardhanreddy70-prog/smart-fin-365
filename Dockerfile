FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY public ./public
COPY server.js ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV DATA_DIR=/data
ENV BACKUP_STORAGE_DIR=/backups

RUN mkdir -p /data /backups && chown -R node:node /app /data /backups

USER node

# The hosting platform supplies PORT at runtime. 8080 is only the container's
# documented default mapping when the platform does not assign a port.
EXPOSE 8080

CMD ["npm", "start"]
