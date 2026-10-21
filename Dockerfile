FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci --omit=dev --workspace server
COPY server/src server/src
COPY server/scripts server/scripts
ENV NODE_ENV=production
USER node
EXPOSE 5001
CMD ["node", "server/src/server.js"]
