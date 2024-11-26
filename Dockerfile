# syntax=docker/dockerfile:1

FROM ubuntu:latest
WORKDIR ./opt/topoviewer

USER root:root

# Set Environment Variables
ENV TERM=xterm-256color \
    COLORTERM=truecolor \
    LANG=en_US.UTF-8

# Consolidate RUN Commands
RUN echo 'root:admin' | chpasswd && \
    useradd -rm -d /home/ubuntu -s /bin/bash -g root -G sudo -u 1001 suuser && \
    echo 'suuser:suuser' | chpasswd && \
    useradd -rm -d /home/ubuntu -s /bin/bash -g root -G sudo -u 1002 admin && \
    echo 'admin:admin' | chpasswd && \
    apt-get update && apt-get install -y openssh-server iproute2 iputils-ping vim wget sudo curl rsyslog && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    echo "HostKeyAlgorithms ssh-dss,ecdsa-sha2-nistp256,ssh-ed25519" >> /etc/ssh/ssh_config && \    
    echo "HostKeyAlgorithms ssh-dss,ecdsa-sha2-nistp256,ssh-ed25519" >> /etc/ssh/ssh_config && \     
    echo "KexAlgorithms diffie-hellman-group1-sha1,curve25519-sha256@libssh.org,ecdh-sha2-nistp256,ecdh-sha2-nistp384,ecdh-sha2-nistp521,diffie-hellman-group-exchange-sha256,diffie-hellman-group14-sha1" >> /etc/ssh/ssh_config

# Download dist folder
COPY ./dist /opt/topoviewer

# Expose ports
EXPOSE 8080 22 514

# Entry point
ENTRYPOINT rsyslogd && service ssh restart && bash
