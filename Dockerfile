FROM node:alpine

#RUN apk add --update nodejs
#RUN apk add npm
#RUN apk add bash

COPY ./src /home/node/app
COPY ./package.json /home/node/app

RUN echo "`date -u`" > /home/node/app/static/when.txt

WORKDIR /home/node/app
RUN npm install

CMD ["node","server.js"]

EXPOSE 80
#EXPOSE 3080