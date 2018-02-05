FROM nginx:alpine

RUN apk add --update nodejs
RUN apk add bash

COPY ./src /usr/share/node
COPY ./node_modules /usr/share/node/node_modules

COPY ./start.sh /usr/share

#RUN rm /etc/nginx/nginx.conf.default
COPY nginx.conf /etc/nginx/nginx.conf

CMD ["/usr/share/start.sh"]

EXPOSE 80
#EXPOSE 3000