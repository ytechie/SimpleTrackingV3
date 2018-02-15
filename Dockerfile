FROM nginx:alpine

RUN apk add --update nodejs
#RUN apk add bash

COPY ./src /usr/share/node
COPY ./package.json /usr/share/node

WORKDIR /usr/share/node/
RUN npm install

COPY ./start.sh /usr/share

COPY nginx.conf /etc/nginx/nginx.conf

CMD ["/usr/share/start.sh"]

EXPOSE 80
#EXPOSE 3000