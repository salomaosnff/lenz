---
---
# Conceitos Fundamentais

O Lenz Designer é um editor de páginas web altamente extensível e intuitivo feito para quem deseja aprender Design Web.
Isso foi possível graças a uma arquitetura projetada focada em extensibilidade.

## Cliente

O cliente é a interface gráfica do Lenz Designer, onde o usuário interage com o editor.
A interface foi construída com Vue.js e Vite, e é executada no navegador do usuário. Esta camada é responsável por renderizar o editor e carregar a maioria das extensões (falaremos sobre extensões mais adiante).

## Agente

O agente é um servidor HTTP responsável deselvolvido em Rust por lidar com operações de arquivos do usuário, carregar extensões e servir a interface gráfica.

## Extensão

Extensões são pacotes de software que adicionam funcionalidades ao editor (chamados de contribuições) e podem ser desenvolvidas em JavaScript e/ou Rust.

## Contribuição

Contribuições são funcionalidades que extensões podem adicionar ao editor, são elas:

- Comandos
- Atalhos de teclado
- Snippets
- Comandos do Agente