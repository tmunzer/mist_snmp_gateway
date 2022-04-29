FROM node:latest

LABEL maintainer="tmunzer@juniper.net"
LABEL one.stag.mwtt.version="1.1.0"
LABEL one.stag.mwtt.release-date="2020-04-08"

COPY ./src /app/
WORKDIR /app
RUN npm install

EXPOSE 161/udp
ENTRYPOINT npm start

