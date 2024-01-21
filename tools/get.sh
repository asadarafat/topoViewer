#!/bin/bash

: ${USE_SUDO:="true"}
: ${BINARY_NAME:="topoviewer"}
: ${VERIFY_CHECKSUM:="false"}
: ${BIN_INSTALL_DIR:="/usr/bin"}

: ${REPO_NAME:="asadarafat/topoViewer"}
: ${REPO_URL:="https://github.com/$REPO_NAME"}


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


# checkInstalledVersion checks which version is installed and
# if it needs to be changed.
checkInstalledVersion() {
    if [[ -f "${BIN_INSTALL_DIR}/${BINARY_NAME}" ]]; then
        local version=$("${BIN_INSTALL_DIR}/${BINARY_NAME}" version | grep version | awk '{print $NF}')
        if [[ "v$version" == "$TAG" ]]; then
            echo "${BINARY_NAME} is already at its ${DESIRED_VERSION:-latest ($version)}" version
            return 0
        else
            if [ "$(printf '%s\n' "$TAG_WO_VER" "$version" | sort -V | head -n1)" = "$TAG_WO_VER" ]; then
                RN_VER=$(docsLinkFromVer $TAG_WO_VER)
                echo "A newer ${BINARY_NAME} version $version is already installed"
                echo "You are running ${BINARY_NAME} version $version"
                echo "You are trying to downgrade to ${BINARY_NAME} version ${TAG_WO_VER}"
                UPGR_NEEDED="Y"
                # check if stdin is open (i.e. capable of getting users input)
                if [ -t 0 ]; then
                    read -e -p "Proceed with downgrade? [Y/n]: " -i "Y" UPGR_NEEDED
                fi
                if [ "$UPGR_NEEDED" == "Y" ]; then
                    return 1
                fi
                return 0
            else
                RN_VER=$(docsLinkFromVer $TAG_WO_VER)
                # echo "A newer ${BINARY_NAME} ${TAG_WO_VER} is available. Release notes: https://containerlab.dev/rn/${RN_VER}"
                echo "You are running topoviewer $version version"
                UPGR_NEEDED="Y"
                # check if stdin is open (i.e. capable of getting users input)
                if [ -t 0 ]; then
                    read -e -p "Proceed with upgrade? [Y/n]: " -i "Y" UPGR_NEEDED
                fi
                if [ "$UPGR_NEEDED" == "Y" ]; then
                    return 1
                fi
                return 0
            fi
          fi
    else
        return 1
    fi
}


# setDesiredVersion sets the desired version either to an explicit version provided by a user
# or to the latest release available on github releases
setDesiredVersion() {
    if [ "x$DESIRED_VERSION" == "x" ]; then
        # check if GITHUB_TOKEN env var is set and use it for API calls
        local gh_token=${GITHUB_TOKEN:-}
        if [ ! -z "$gh_token" ]; then
            local curl_auth_header=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
            local wget_auth_header=(--header="Authorization: Bearer ${GITHUB_TOKEN}")
        fi
        # when desired version is not provided
        # get latest tag from the gh releases
        if type "curl" &>/dev/null; then
            local latest_release_url=$(curl -s "${curl_auth_header[@]}" https://api.github.com/repos/$REPO_NAME/releases/latest | sed '5q;d' | cut -d '"' -f 4)
            if [ -z "$latest_release_url" ]; then
                echo "Failed to retrieve latest release URL due to rate limiting. Please provide env var GITHUB_TOKEN with your GitHub personal access token."
                exit 1
            fi
            TAG=$(echo $latest_release_url | cut -d '"' -f 2 | awk -F "/" '{print $NF}')
            # tag with stripped `v` prefix
            TAG_WO_VER=$(echo "${TAG}" | cut -c 2-)
        elif type "wget" &>/dev/null; then
            # get latest release info and get 5th line out of the response to get the URL
            local latest_release_url=$(wget -q "${wget_auth_header[@]}" https://api.github.com/repos/$REPO_NAME/releases/latest -O- | sed '5q;d' | cut -d '"' -f 4)
            if [ -z "$latest_release_url" ]; then
                echo "Failed to retrieve latest release URL due to rate limiting. Please provide env var GITHUB_TOKEN with your GitHub personal access token."
                exit 1
            fi
            TAG=$(echo $latest_release_url | cut -d '"' -f 2 | awk -F "/" '{print $NF}')
            TAG_WO_VER=$(echo "${TAG}" | cut -c 2-)
        fi
    else
        TAG=$DESIRED_VERSION
        TAG_WO_VER=$(echo "${TAG}" | cut -c 2-)

        if type "curl" &>/dev/null; then
            if ! curl -s -o /dev/null --fail https://api.github.com/repos/$REPO_NAME/releases/tags/$DESIRED_VERSION; then
                echo "release $DESIRED_VERSION not found"
                exit 1
            fi
        elif type "wget" &>/dev/null; then
            if ! wget -q https://api.github.com/repos/$REPO_NAME/releases/tags/$DESIRED_VERSION; then
                echo "release $DESIRED_VERSION not found"
                exit 1
            fi
        fi
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

# runAsRoot

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

sudo rm -f /tmp/topoviewer.zip*
# sudo wget -O /tmp/topoviewer.zip https://github.com/asadarafat/topoViewer/raw/development/dist/dist.zip
sudo cp /home/aarafat/topoViewer/dist/dist.zip  /tmp/topoviewer.zip
sudo rm -fR /opt/topoviewer
sudo mkdir /opt/topoviewer

TEMP_DIR=$(mktemp -d)
sudo unzip /tmp/topoviewer.zip -d "$TEMP_DIR"
sudo mv "$TEMP_DIR"/* /opt/topoviewer/
sudo rm -r "$TEMP_DIR"

