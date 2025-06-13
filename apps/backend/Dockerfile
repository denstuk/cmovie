FROM --platform=linux/amd64 node:22-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM --platform=linux/amd64 node:22-alpine AS app
USER node
WORKDIR /usr/src/app
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/package*.json ./
RUN npm install --only=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
