# syntax=docker/dockerfile:1

FROM ubuntu:latest
WORKDIR ./opt/topoviewer

# Download dist folder
COPY ./dist /opt/topoviewer

USER root:root

# Install ssh server
RUN apt-get update && apt-get install -y openssh-server iproute2
RUN echo "HostKeyAlgorithms ssh-dss" >> /etc/ssh/ssh_config    
RUN echo "KexAlgorithms diffie-hellman-group1-sha1" >> /etc/ssh/ssh_config    
RUN useradd -rm -d /home/ubuntu -s /bin/bash -g root -G sudo -u 1000 suuser 
RUN  echo 'suuser:suuser' | chpasswd
RUN service ssh start

#expose port 
EXPOSE 8080 22

ENTRYPOINT [ "/opt/topoviewer" ]
