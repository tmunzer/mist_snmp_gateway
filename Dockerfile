FROM node:20.13.1-bookworm-slim

LABEL maintainer="tmunzer@juniper.net"
LABEL one.stag.mwtt.version="1.1.0"
LABEL one.stag.mwtt.release-date="2020-04-08"


WORKDIR /app
COPY ./src /app/

RUN npm install

EXPOSE 161/udp
CMD [ "npm","start" ]

