FROM apify/actor-node:24

COPY --chown=myuser:myuser package*.json ./
RUN npm ci --include=dev

COPY --chown=myuser:myuser . ./
RUN npm run build && npm prune --omit=dev

CMD ["npm", "start"]
