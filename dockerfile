FROM node:latest

LABEL maintainer="tmunzer@juniper.net"
LABEL one.stag.mwtt.version="1.1.0"
LABEL one.stag.mwtt.release-date="2020-04-08"

RUN npm install

COPY ./src /app/
WORKDIR /app

EXPOSE 161/udp
ENTRYPOINT npm start

