# syntax=docker/dockerfile:1

FROM ubuntu:latest
WORKDIR ./opt/topoviewer

# Download dist folder
COPY ./dist /opt/topoviewer
EXPOSE 8080
USER root:root

ENTRYPOINT [ "/opt/topoviewer" ]
