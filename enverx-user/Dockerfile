FROM node:lts

WORKDIR /app

#USER node

COPY . .

RUN npm install --force
RUN ls

RUN npm run build:clean

ENV PORT=4001
EXPOSE 4001

ENTRYPOINT ["node"]
CMD ["build/src/app.js"]
