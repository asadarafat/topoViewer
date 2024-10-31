#!/bin/bash

: ${USE_SUDO:="true"}
: ${BINARY_NAME:="topoviewer"}
: ${VERIFY_CHECKSUM:="false"}
: ${BIN_INSTALL_DIR:="/usr/bin"}

: ${REPO_NAME:="asadarafat/topoViewer"}
: ${REPO_URL:="https://github.com/$REPO_NAME"}

# export http_proxy=http://135.245.192.7:8000 && export https_proxy=http://135.245.192.7:8000


# detectArch discovers the architecture for this system.
detectArch() {
    ARCH=$(uname -m)
    case $ARCH in
    # armv5*) ARCH="armv5" ;;
    # armv6*) ARCH="armv6" ;;
    # armv7*) ARCH="arm" ;;
    aarch64) ARCH="arm64" ;;
    x86) ARCH="386" ;;
    x86_64) ARCH="amd64" ;;
    i686) ARCH="386" ;;
    i386) ARCH="386" ;;
    esac

}

# detectOS discovers the operating system for this system and its package format
detectOS() {
    OS=$(echo $(uname) | tr '[:upper:]' '[:lower:]')

    case "$OS" in
    # Minimalist GNU for Windows
    mingw*) OS='windows' ;;
    esac

    if [ -f /etc/os-release ]; then
        OS_ID="$(. /etc/os-release && echo "$ID")"
    fi
    case "${OS_ID}" in
        ubuntu|debian|raspbian)
            PKG_FORMAT="deb"
        ;;

        centos|rhel|sles)
            PKG_FORMAT="rpm"
        ;;

        alpine)
            PKG_FORMAT="apk"
        ;;
        *)
            if type "rpm" &>/dev/null; then
                PKG_FORMAT="rpm"
            elif type "dpkg" &>/dev/null; then
                PKG_FORMAT="deb"
            fi
        ;;
    esac
}

# runs the given command as root (detects if we are root already)
runAsRoot() {
    local CMD="$*"

    if [ $EUID -ne 0 -a $USE_SUDO = "true" ]; then
        CMD="sudo $CMD"
    fi

    $CMD
}

# verifySupported checks that the os/arch combination is supported
verifySupported() {
    local supported="linux-amd64"
    if ! echo "${supported}" | grep -q "${OS}-${ARCH}"; then
        echo "No prebuilt binary for ${OS}-${ARCH}."
        # echo "To build from source, go to ${REPO_URL}"
        exit 1
    fi

    if ! type "curl" &>/dev/null && ! type "wget" &>/dev/null; then
        echo "Either curl or wget is required"
        exit 1
    fi
}


# fail_trap is executed if an error occurs.
fail_trap() {
    result=$?
    if [ "$result" != "0" ]; then
        if [[ -n "$INPUT_ARGUMENTS" ]]; then
            echo "Failed to install $BINARY_NAME with the arguments provided: $INPUT_ARGUMENTS"
            help
        else
            echo "Failed to install $BINARY_NAME"
        fi
        echo -e "\tFor support, go to $REPO_URL/issues"
    fi
    cleanup
    exit $result
}

# removes temporary directory used to download artefacts
cleanup() {
    if [[ -d "${TMP_ROOT:-}" ]]; then
        rm -rf "$TMP_ROOT"
    fi
}

# Execution
# Stop execution on any error
trap "fail_trap" EXIT
set -e

# Parsing input arguments (if any)
export INPUT_ARGUMENTS="${@}"
set -u
while [[ $# -gt 0 ]]; do
    case $1 in
    '--version' | -v)
        shift
        if [[ $# -ne 0 ]]; then
            export DESIRED_VERSION="v${1}"
        else
            echo -e "Please provide the desired version. e.g. --version 0.1.1"
            exit 0
        fi
        ;;
    '--no-sudo')
        USE_SUDO="false"
        ;;
    '--verify-checksum')
        VERIFY_CHECKSUM="true"
        ;;
    '--use-pkg')
        USE_PKG="true"
        ;;
    '--help' | -h)
        help
        exit 0
        ;;
    *)
        exit 1
        ;;
    esac
    shift
done
set +u

detectArch
echo "The detected architecture is: $ARCH"

detectOS
echo "The detected OS is: $OS_ID"

# verifySupported

# setDesiredVersion

# if ! checkInstalledVersion; then
#     createTempDir
#     verifyOpenssl
#     downloadFile

#     installFile

#     testVersion
#     cleanup
# fi


getFiles(){
    runAsRoot
    sudo rm -f /tmp/topoviewer.zip*
    sudo wget -O /tmp/topoviewer.zip https://github.com/asadarafat/topoViewer/raw/development/dist/dist.zip
    # sudo cp /home/aarafat/topoViewer/dist/dist.zip  /tmp/topoviewer.zip
    # sudo curl -o /tmp/topoviewer.zip  https://github.com/asadarafat/topoViewer/blob/development/dist/dist.zip
    sudo rm -fR /opt/topoviewer
    sudo mkdir /opt/topoviewer
}

getFiles


installFile() {
    runAsRoot
    TEMP_DIR=$(mktemp -d)
    unzip /tmp/topoviewer.zip -d "$TEMP_DIR"
    cp -rR "$TEMP_DIR"/dist/* /opt/topoviewer/
    sudo rm -r "$TEMP_DIR"
    ln -sf /opt/topoviewer/topoviewer /usr/bin/topoviewer
    topoviewer --help
}

installFile


