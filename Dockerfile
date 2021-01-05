FROM nginx:alpine

RUN apk add --update nodejs
RUN apk add bash

COPY ./src /usr/share/node
COPY ./node_modules /usr/share/node
COPY ./start.sh /usr/share

RUN echo "`date -u`" > /usr/share/node/static/when.txt

COPY nginx.conf /etc/nginx/nginx.conf

CMD ["/usr/share/start.sh"]

EXPOSE 80
#EXPOSE 3080