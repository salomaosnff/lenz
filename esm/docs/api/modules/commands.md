# Módulo de comandos

O módulo de comandos é responsável por gerenciar os comandos disponíveis no Lenz Designer.

Para utilizar o módulo de comandos, basta importar o módulo `lenz:commands` no arquivo de script de sua extensão.

```ts
import { addCommand } from 'lenz:commands';
```

## Métodos

### `addCommand(command: Command): LenzDisposer`

Adiciona um comando ao Editor.

#### Parâmetros

| Nome    | Tipo      | Descrição                 |
| ------- | --------- | ------------------------- |
| command | [Command](#command) | Comando a ser adicionado. |

#### Retorno

`LenzDisposer` - Disposer para remover o comando que deve ser adicionado em `context.subscriptions` da extensão.

### `executeCommand<T>(commandId: string, ...args: any[]): Promise<T>`

Executa um comando no Editor.

#### Parâmetros

| Nome      | Tipo     | Descrição                      |
| --------- | -------- | ------------------------------ |
| commandId | `string` | ID do comando a ser executado. |
| ...args   | `any[]`  | Argumentos do comando.         |

#### Retorno

`Promise<T>` - Promessa que será resolvida com o resultado da execução do comando.

## Tipos

### `CommandContext`

Contexto de execução de um comando.

#### Propriedades

| Nome                 | Tipo                                 | Descrição                                              |
| -------------------- | ------------------------------------ | ------------------------------------------------------ |
| `getSelection`       | `Set<Selection>`                     | Retorna a seleção atual do editor.                     |
| `setSelection`       | `(selection: HTMLElement[]) => void` | Define a seleção atual do editor.                      |
| `getCurrentContent`  | `() => string`                       | Retorna uma string contendo o HTML do documento atual. |
| `getCurrentDocument` | `() => Document`                     | Retorna o documento atual.                             |

### `Command`

Comando a ser adicionado ao Editor.

#### Propriedades

| Nome          | Tipo                                | Descrição                                         |
| ------------- | ----------------------------------- | ------------------------------------------------- |
| `id`          | `string`                            | Identificador único do comando.                   |
| `name`        | `string \| undefined`               | Nome que será exibido na paleta de comandos.      |
| `description` | `string \| undefined`               | Descrição que será exibida na paleta de comandos. |
| `icon`        | `string \| undefined`               | Ícone que será exibido na paleta de comandos.     |
| `run`         | `(context: CommandContext) => void` | Função que será executada ao chamar o comando.    |

::: info
O Ícone deve ser uma string contendo um Path SVG de tamanho 24x24.
Por exemplo: `M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z`
:::

### `Selection`

Representa uma seleção de elementos no editor.

#### Propriedades

| Nome       | Tipo          | Descrição                |
| ---------- | ------------- | ------------------------ |
| `element`  | `HTMLElement` | Elemento selecionado.    |
| `box`      | `DOMRect`     | Caixa de seleção.        |
| `selector` | `string`      | Seletor CSS do elemento. |

### `LenzDisposer`

Disposer para remover um comando.

#### Definição

```ts
type LenzDisposer = () => void;
```