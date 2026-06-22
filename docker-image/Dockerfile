FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN dpkg --add-architecture i386 || true

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    git \
    gcc-14 \
    g++-14 \
    golang-go \
    kotlin \
    libcap-dev \
    libseccomp-dev \
    libsystemd-dev \
    mono-complete \
    openjdk-17-jdk-headless \
    openjdk-21-jdk-headless \
    php-cli \
    wine64 \
    wine32 \
    wine \
    pypy3 \
    python3 \
    python3-pip \
    python3-venv \
    python-is-python3 \
    pkg-config \
    make \
 && update-alternatives --install /usr/bin/java java /usr/lib/jvm/java-21-openjdk-amd64/bin/java 2100 \
 && update-alternatives --install /usr/bin/javac javac /usr/lib/jvm/java-21-openjdk-amd64/bin/javac 2100 \
 && update-alternatives --install /usr/bin/jar jar /usr/lib/jvm/java-21-openjdk-amd64/bin/jar 2100 \
 && update-alternatives --set java /usr/lib/jvm/java-21-openjdk-amd64/bin/java \
 && update-alternatives --set javac /usr/lib/jvm/java-21-openjdk-amd64/bin/javac \
 && update-alternatives --set jar /usr/lib/jvm/java-21-openjdk-amd64/bin/jar \
 && for std in 11 17 23; do \
            printf '#!/bin/sh\nexec gcc-14 -std=c%s "$@"\n' "$std" > "/usr/local/bin/c${std}"; \
            chmod 0755 "/usr/local/bin/c${std}"; \
        done \
 && for std in 14 17 20 23; do \
            printf '#!/bin/sh\nexec g++-14 -std=c++%s "$@"\n' "$std" > "/usr/local/bin/cpp${std}"; \
            chmod 0755 "/usr/local/bin/cpp${std}"; \
            ln -sf "/usr/local/bin/cpp${std}" "/usr/local/bin/c++${std}"; \
        done \
 && printf '#!/bin/sh\nexec /usr/lib/jvm/java-17-openjdk-amd64/bin/java "$@"\n' > /usr/local/bin/java17 \
 && printf '#!/bin/sh\nexec /usr/lib/jvm/java-17-openjdk-amd64/bin/javac "$@"\n' > /usr/local/bin/javac17 \
 && printf '#!/bin/sh\nexec /usr/lib/jvm/java-17-openjdk-amd64/bin/jar "$@"\n' > /usr/local/bin/jar17 \
 && chmod 0755 /usr/local/bin/java17 /usr/local/bin/javac17 /usr/local/bin/jar17 \
 && printf '#!/bin/sh\nexec /usr/lib/jvm/java-21-openjdk-amd64/bin/java "$@"\n' > /usr/local/bin/java21 \
 && printf '#!/bin/sh\nexec /usr/lib/jvm/java-21-openjdk-amd64/bin/javac "$@"\n' > /usr/local/bin/javac21 \
 && printf '#!/bin/sh\nexec /usr/lib/jvm/java-21-openjdk-amd64/bin/jar "$@"\n' > /usr/local/bin/jar21 \
 && chmod 0755 /usr/local/bin/java21 /usr/local/bin/javac21 /usr/local/bin/jar21 \
 && git clone --depth 1 https://github.com/ioi/isolate.git /tmp/isolate \
 && make -C /tmp/isolate isolate \
 && install -m 0755 /tmp/isolate/isolate /usr/local/bin/isolate \
 && rm -rf /tmp/isolate /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64

WORKDIR /workspace

CMD ["bash"]