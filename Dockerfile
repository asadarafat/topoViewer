# syntax=docker/dockerfile:1

FROM ubuntu:latest
WORKDIR ./opt/topoviewer

# Download dist folder
COPY ./dist /opt/topoviewer

USER root:root

# Install ssh server
RUN apt-get update && apt-get install -y openssh-server iproute2 iputils-ping vim

#expose port 
EXPOSE 8080 22

ENTRYPOINT [ "/opt/topoviewer" ]
