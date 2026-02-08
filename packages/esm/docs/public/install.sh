#!/bin/env sh
VERSION="v0.1.8"
CURRENT_VERSION="none"

if [ -f /usr/share/metainfo/dev.sallon.lenz.metainfo.xml ]; then
  CURRENT_VERSION=$(xmllint --xpath "string(//releases/release[1]/@version)" /usr/share/metainfo/dev.sallon.lenz.metainfo.xml 2>/dev/null || echo "")
  if [ -n "$CURRENT_VERSION" ]; then
    CURRENT_VERSION="v$CURRENT_VERSION"
  fi
fi

# Check if the script is run as root
if [ "$EUID" -ne 0 ]; then
  echo "Este script deve ser executado como root. Use sudo ou execute como root."
  exit 1
fi

TARBALL_URL="https://github.com/salomaosnff/lenz/releases/download/${VERSION}/lenz-designer.tar.xz"

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
  if [ "$CURRENT_VERSION" = "none" ]; then
    echo "Lenz Designer não está instalado."
    exit 1
  fi

  echo "Desinstalando Lenz Designer versão $CURRENT_VERSION..."

  rm -rf /usr/bin/lenz /usr/share/lenz /usr/share/metainfo/dev.sallon.lenz.metainfo.xml
}

command_update() {
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

# Check if $1 is empty
if [ -z "$1" ]; then
  if [ "$CURRENT_VERSION" = "none" ]; then
    command_install
  else
    command_update
  fi
elif declare -f "command_$1" > /dev/null; then
  "command_$1"
else
  echo "Comando desconhecido: $1"
  echo "Uso: [install|uninstall|update]"
  exit 1
fi