FROM node:lts

WORKDIR /usr/src/app

COPY . .
RUN npm install --force
RUN ls

#RUN npm i pm2
RUN npm run build:clean

EXPOSE 4001

ENTRYPOINT ["npm"]
CMD ["start"]
