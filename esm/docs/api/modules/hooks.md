# Módulo de comandos

O módulo de hooks é responsável por gerenciar eventos do Editor.

Para utilizar o módulo de hooks, basta importar o módulo `lenz:hooks` no arquivo de script de sua extensão.

```ts
import { onAfter } from 'lenz:hooks';
```

## Métodos

### `onBefore(event: string, callback: Function): LenzDisposer`

Adiciona um hook para ser executado antes de um evento.

#### Parâmetros

| Nome     | Tipo       | Descrição               |
| -------- | ---------- | ----------------------- |
| event    | `string`   | Nome do evento.         |
| callback | `Function` | Função a ser executada. |

#### Retorno

`LenzDisposer` - Disposer para remover o hook que deve ser adicionado em `context.subscriptions` da extensão.

### `onAfter(event: string, callback: Function): LenzDisposer`

Adiciona um hook para ser executado após um evento.

#### Parâmetros

| Nome     | Tipo       | Descrição               |
| -------- | ---------- | ----------------------- |
| event    | `string`   | Nome do evento.         |
| callback | `Function` | Função a ser executada. |

#### Retorno

`LenzDisposer` - Disposer para remover o hook que deve ser adicionado em `context.subscriptions` da extensão.