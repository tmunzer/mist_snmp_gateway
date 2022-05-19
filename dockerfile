FROM node:latest

LABEL maintainer="tmunzer@juniper.net"
LABEL one.stag.mwtt.version="1.1.0"
LABEL one.stag.mwtt.release-date="2020-04-08"

RUN npm install

COPY ./src /app/
WORKDIR /app

RUN addgroup --gid 1000 -S mistlab && adduser --uid 1000 -S mistlab -G mistlab
RUN chown -R mistlab:mistlab /app
USER mistlab

EXPOSE 161/udp
ENTRYPOINT npm start

