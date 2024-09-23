# Extensões

Extensões são pacotes de software que adicionam funcionalidades ao editor (chamados de contribuições) e são desenvolvidas em JavaScript.

## Estrutura de uma extensão

Uma extensão precisa ter obrigatoriamente um arquivo `manifest.json` na raiz do projeto. Este arquivo é responsável por descrever a extensão e seus pontos de entrada.

Abaixo um exemplo de uma extensão que imprime "Olá, mundo!" no console do navegador quando a extensão é ativada.

Estrutura de arquivos:
```
hello-world
├── manifest.json
└── main.js
```

::: code-group

```json [manifest.json]
{
    "id": "hello-world",
    "name": "Hello World",
    "description": "Imprime 'Olá, mundo!' no console do navegador",
    "version": "1.0.0",
    "main": "main.js",
    "publisher": "Seu Nome <voce@seu-email.com>"
}
```

```js [main.js]
export function activate() {
    console.log('Olá, mundo!');
}
```

## Carregando uma extensão

Para que uma extensão seja carregada, é necessário adicionar a pasta da extensão no diretório `extensions` do Lenz Designer.
Este diretório pode ser encontrado em `~/.lenz/extensions` no Linux. Caso o diretório não exista, crie-o manualmente.
No final, o arquivo manifest.json da extensão deve estar localizado em `~/.lenz/extensions/hello-world/manifest.json`.

:::

## Métodos de uma extensão

Uma extensão pode exportar os seguintes métodos:

### `activate(context)`

Chamado quando a extensão é ativada.

| Parâmetro               | Tipo            | Descrição                                                                   |
| ----------------------- | --------------- | --------------------------------------------------------------------------- |
| `context`               | `Object`        | Objeto que contém informações sobre o contexto de inicialização da extensão |
| `context.subscriptions` | `Set<Function>` | Conjunto de funções que serão chamadas quando a extensão for desativada     |

::: warning
Utilize o objeto `context.subscriptions` para adicionar funções que serão chamadas quando a extensão for desativada para evitar problemas de memória ou vazamento de recursos.
Todas as funções que criam algum tipo de contribuição (comandos, atalhos de teclado, snippets, etc) devem ser adicionadas ao conjunto de inscrições.
:::

### `deactivate(context)`

Chamado quando a extensão foi desativada.

::: warning
Certifique-se de sempre interagir com o editor somente dentro dos métodos `activate` e `deactivate` para evitar problemas de inicialização e desativação.
:::