#!/bin/env sh
VERSION="v0.1.8"

# Check if the script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Este script deve ser executado como root. Use sudo ou execute como root."
  exit 1
fi

TARBALL_URL="https://github.com/salomaosnff/lenz/releases/download/${VERSION}/lenz-designer.tar.xz"

get_latest_version() {
  local LATEST_VERSION=$(curl -sL https://api.github.com/repos/salomaosnff/lenz/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
  echo "$LATEST_VERSION"
}

command_install() {
  TMP_DIR=$(mktemp -d)
  echo "Baixando Lenz Designer ${VERSION}..."
  wget --progress=bar:force --no-verbose -O - "$TARBALL_URL" | tar -xJ -C "$TMP_DIR"
  
  # Copy assets to /usr/share/lenz
  mkdir -p /usr/share/lenz

  cp -r "$TMP_DIR/bin" /usr/share/lenz/bin
  cp -r "$TMP_DIR/extensions" /usr/share/lenz/extensions
  cp -r "$TMP_DIR/resources" /usr/share/lenz/resources

  # Copy Metainfo
  cp "$TMP_DIR/metainfo/dev.sallon.lenz.metainfo.xml" /usr/share/metainfo/dev.sallon.lenz.metainfo.xml

  # Link the executable to /usr/bin
  ln -sf /usr/share/lenz/bin/lenz /usr/bin/lenz

  # Clean up
  rm -rf "$TMP_DIR"
}

command_uninstall() {
  CURRENT_VERSION=$(get_installed_version)

  if [ "$CURRENT_VERSION" = "none" ]; then
    echo "Lenz Designer não está instalado."
    exit 1
  fi

  echo "Desinstalando Lenz Designer versão $CURRENT_VERSION..."

  rm -rf /usr/bin/lenz /usr/share/lenz /usr/share/metainfo/dev.sallon.lenz.metainfo.xml
}

command_update() {
  CURRENT_VERSION=$(get_installed_version)

  echo "Versão atual instalada: $CURRENT_VERSION"
  
  if [ "$CURRENT_VERSION" = "none" ]; then
    echo "Lenz Designer não está instalado. Use 'install' para instalar."
    exit 1
  fi

  if [ "$CURRENT_VERSION" != "$VERSION" ]; then
    echo "Atualizando Lenz Designer de $CURRENT_VERSION para $VERSION..."
    command_uninstall
    command_install
  else
    echo "Lenz Designer já está na versão mais recente ($VERSION)."
  fi
}

# check if command is a defined function
if declare -f "command_$1" > /dev/null; then
  "command_$1"
else
  echo "Comando desconhecido: $1"
  echo "Uso: <install|uninstall>"
  exit 1
fi