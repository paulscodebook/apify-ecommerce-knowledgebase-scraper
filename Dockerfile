FROM apify/actor-node:20

COPY package*.json ./
RUN npm install --include=dev --audit=false

COPY . ./
RUN npm run build

RUN npm prune --omit=dev

CMD npm run start:prod
