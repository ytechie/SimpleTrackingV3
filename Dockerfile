FROM nginx:alpine

RUN apk add --update nodejs
RUN apk add npm
RUN apk add bash

COPY ./src /usr/share/node
COPY ./package.json /usr/share/node
COPY ./start.sh /usr/share

RUN echo "`date -u`" > /usr/share/node/static/when.txt

WORKDIR /usr/share/node/
RUN npm install

COPY nginx.conf /etc/nginx/nginx.conf

CMD ["/usr/share/start.sh"]

EXPOSE 80
#EXPOSE 3080