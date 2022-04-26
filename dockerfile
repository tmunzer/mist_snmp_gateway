FROM node:latest

LABEL maintainer="tmunzer@juniper.net"
LABEL one.stag.mwtt.version="1.1.0"
LABEL one.stag.mwtt.release-date="2020-04-08"


RUN apt-get update
RUN apt-get install snmpd -y
RUN apt-get install net-tools emacs -y

COPY ./src /app/
WORKDIR /app

RUN rm /etc/snmp/snmpd.conf
RUN ln -s /app/snmpd.conf /etc/snmp/snmpd.conf

EXPOSE 161/tcp
EXPOSE 161/udp
EXPOSE 705/tcp
EXPOSE 705/udp
CMD ["/bin/bash"]
#CMD ["node","/app/app.js"]

