#!/bin/bash

# Verifica se o arquivo icons.mjs existe
if [ ! -f icons.mjs ]; then
    echo "Arquivo icons.mjs não encontrado!"
    exit 1
fi

mkdir lib

# Lê o arquivo linha por linha
while IFS= read -r line; do
    # Extrai o nome da constante sem o prefixo 'export const ' e sem a parte do valor
    filename=$(echo "$line" | sed -n 's/export const \(mdi\)\?\(.*\) = .*/\2/p')

    # Converte para snake_case
    filename=$(echo "$filename" | sed -E 's/([a-z])([A-Z])/\1_\2/g' | tr '[:upper:]' '[:lower:]')

    # Verifica se o filename não está vazio
    if [ -n "$filename" ]; then
        # Adiciona a extensão .mjs
        filename="${filename}.mjs"

        # Extrai o valor da constante
        value=$(echo "$line" | sed -n 's/export const .* = "\(.*\)";/\1/p')

        # Escreve o conteúdo no novo arquivo
        echo "export default \"$value\";" > "lib/$filename"

        echo "Arquivo $filename criado."
    else
        echo "Nome do arquivo vazio, ignorado."
    fi
done < icons.mjs
