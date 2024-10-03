# Módulo de comandos

O módulo de histórico é responsável por gerenciar históricos de estados do editor.

Para utilizar o módulo de histórico, basta importar o módulo `lenz:history` no arquivo de script de sua extensão.

```ts
import { ensureHistory } from 'lenz:history';
```

## Métodos

### `ensureHistory<T>(key: string, initialData: T): History<T>`

Obtém ou cria um histórico de estados.

#### Parâmetros

| Nome        | Tipo     | Descrição                    |
| ----------- | -------- | ---------------------------- |
| key         | `string` | Chave do histórico.          |
| initialData | `T`      | Dados iniciais do histórico. |

#### Retorno

`History<T>` - Histórico de estados de tipo `T`.

### `save<T>(key: string, data: T): T`

Salva um estado no histórico e retorna o estado salvo.

#### Parâmetros

| Nome | Tipo     | Descrição                       |
| ---- | -------- | ------------------------------- |
| key  | `string` | Chave do histórico.             |
| data | `T`      | Dados a serem salvos no estado. |

#### Retorno

`T` - Dados salvos no estado.

### `undo(key: string): T`

Desfaz a última alteração no histórico e retorna o estado anterior.

#### Parâmetros

| Nome | Tipo     | Descrição           |
| ---- | -------- | ------------------- |
| key  | `string` | Chave do histórico. |

#### Retorno

`T` - Dados do estado anterior.

### `redo(key: string): T`

Refaz a última alteração desfeita no histórico e retorna o estado anterior.

#### Parâmetros

| Nome | Tipo     | Descrição           |
| ---- | -------- | ------------------- |
| key  | `string` | Chave do histórico. |

### `clear(key: string): T`

Apaga todos os estados anteriores ao estado atual e mantém o estado atual.

#### Parâmetros

| Nome | Tipo     | Descrição           |
| ---- | -------- | ------------------- |
| key  | `string` | Chave do histórico. |

#### Retorno

`T` - Dados do estado atual.

### `drop(key: string): void`

Apaga complemente o histórico.

#### Parâmetros

| Nome | Tipo     | Descrição           |
| ---- | -------- | ------------------- |
| key  | `string` | Chave do histórico. |

## Tipos

### `History<T>`

Representa um histórico de estados.

#### Propriedades

| Nome       | Tipo                       | Descrição                       |
| ---------- | -------------------------- | ------------------------------- |
| `current`  | [Snapshot\<T\>](#snapshot) | Snapshot atual do histórico.    |
| `count`    | `number`                   | Número de estados no histórico. |
| `capacity` | `number`                   | Capacidade máxima do histórico. |

#### Métodos

##### `save(data: T): T`

Salva um estado no histórico e retorna o estado salvo.

#### Parâmetros

| Nome | Tipo | Descrição                       |
| ---- | ---- | ------------------------------- |
| data | `T`  | Dados a serem salvos no estado. |

#### Retorno

`T` - Dados salvos no estado.

##### `undo(): T`

Desfaz a última alteração no histórico e retorna o estado anterior.

#### Retorno

`T` - Dados do estado anterior.

##### `redo(): T`

Refaz a última alteração desfeita no histórico e retorna o estado anterior.

#### Retorno

`T` - Dados do estado anterior.

##### `clear(): T`

Apaga todos os estados anteriores ao estado atual e mantém o estado atual.

#### Retorno

`T` - Dados do estado atual.

### `Snapshot<T>`#{#snapshot}

Representa um estado salvo no histórico.

#### Propriedades

| Nome   | Tipo                  | Descrição        |
| ------ | --------------------- | ---------------- |
| `data` | `T`                   | Dados do estado. |
| `prev` | `Snapshot<T> \| null` | Estado anterior. |
| `next` | `Snapshot<T> \| null` | Estado seguinte. |
