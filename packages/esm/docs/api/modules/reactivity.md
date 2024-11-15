# Módulo de Reatividade

O módulo de reatividade fornece utilitários para reatividade entre janelas de UI e o editor.

Para utilizar o módulo de reatividade, basta importar o módulo `lenz:reactivity` no arquivo de script de sua extensão.


```ts
import { ref } from 'lenz:reactivity';
```

## Métodos

### `createChannelPort<T, U = T>(receiver: (data: T) => void): ChannelPort<T, U>`

Cria uma nova porta de canal.

#### Parâmetros

| Nome     | Tipo       | Descrição                  |
| -------- | ---------- | -------------------------- |
| receiver | `Function` | Função para receber dados. |

#### Retorno

`ChannelPort<T, U>` - Porta de canal.

### `createChannel<T, U = T>(): Channel<T, U>`

Cria um novo canal de comunicação.

#### Retorno

Uma tupla com dois elementos:

| Índice | Tipo                | Descrição             |
| ------ | ------------------- | --------------------- |
| 0      | `ChannelPort<T, U>` | Porta de envio.       |
| 1      | `ChannelPort<U, T>` | Porta de recebimento. |

### `ref<T>(initialValue: T): Ref<T>`

Cria uma referência reativa.

#### Parâmetros

| Nome         | Tipo             | Descrição      |
| ------------ | ---------------- | -------------- |
| initialValue | `T \| undefined` | Valor inicial. |

#### Retorno

`Ref<T>` - Referência reativa com valor inicial.
`Ref<T | undefined>` - Referência reativa com valor inicial `undefined`.

### `createCustomRef<T>(factory: CustomRefFactory<T>): Ref<T>`

Cria uma referência reativa personalizada.

#### Exemplo

```ts
const customRef = createCustomRef((sender) => {
  let value = 0;
  return {
    get() {
      return JSON.parse(localStorage.getItem('value') || 'null');
    },
    set(newValue: number) {
      localStorage.setItem('value', JSON.stringify(newValue));
      sender.send(value);
    },
  };
});
```

#### Parâmetros

| Nome    | Tipo                  | Descrição              |
| ------- | --------------------- | ---------------------- |
| factory | `CustomRefFactory<T>` | Fábrica de referência. |

#### Retorno

`Ref<T>` - Referência reativa personalizada.

## Tipos

### `Ref<T>`

Extende: `ChannelPort<T, T>`.

Representa uma referência reativa.


### Propriedades

| Nome     | Tipo      | Descrição                           |
| -------- | --------- | ----------------------------------- |
| `value`  | `T`       | Valor atual da referência.          |
| `closed` | `boolean` | Indica se a referência foi fechada. |


### `ChannelPort<T, U>`

Representa uma porta de canal.

#### Métodos

##### `send(data: T): void`

Envia dados pela porta.

#### Parâmetros

| Nome | Tipo | Descrição               |
| ---- | ---- | ----------------------- |
| data | `T`  | Dados a serem enviados. |

#### `notify(data: U): void`

Notifica a porta com dados.

#### Parâmetros

| Nome | Tipo | Descrição                  |
| ---- | ---- | -------------------------- |
| data | `U`  | Dados a serem notificados. |

#### `addListener(listener: (data: U) => void): LenzDisposer`

Adiciona um ouvinte para receber dados pela porta.

#### Parâmetros

| Nome     | Tipo                | Descrição                  |
| -------- | ------------------- | -------------------------- |
| listener | `(data: U) => void` | Função para receber dados. |

#### Retorno

`LenzDisposer` - Disposer para remover o ouvinte.

#### `next(signal?: AbortSignal): Promise<U>`

Aguarda o próximo dado recebido pela porta.

#### Parâmetros

| Nome   | Tipo                       | Descrição              |
| ------ | -------------------------- | ---------------------- |
| signal | `AbortSignal \| undefined` | Sinal de cancelamento. |

#### Retorno

`Promise<U>` - Próximo dado recebido pela porta.

#### `waitClose(): Promise<void>`

Aguarda o fechamento da porta.

#### Retorno

`Promise<void>` - Promessa para aguardar o fechamento da porta.


#### `listen(signal?: AbortSignal): AsyncIterable<U>`

Cria um iterável assíncrono para receber dados pela porta.

#### Exemplo

```ts
const port = createChannelPort<number>((data) => {});

setTimeout(() => {
  port.send(1);
  port.send(2);
  port.send(3);
  port.close();
}, 1);

for await (const data of port.listen()) {
  console.log(data);
}

console.log('Porta fechada.');
```

#### Parâmetros

| Nome   | Tipo                       | Descrição              |
| ------ | -------------------------- | ---------------------- |
| signal | `AbortSignal \| undefined` | Sinal de cancelamento. |

#### Retorno

`AsyncIterable<U>` - Iterável assíncrono para receber dados pela porta.

#### `close(): void`

Fecha a porta.

### `CustomRefFactory<T>`

Representa uma fábrica de referência reativa personalizada.

#### Parâmetros

| Nome     | Tipo                | Descrição             |
| -------- | ------------------- | --------------------- |
| sender   | `ChannelPort<T, T>` | Porta de envio.       |
| receiver | `ChannelPort<T, T>` | Porta de recebimento. |

#### Retorno

Um objeto com dois métodos:

| Nome  | Tipo                 | Descrição                  |
| ----- | -------------------- | -------------------------- |
| `get` | `() => T`            | Método para obter valor.   |
| `set` | `(value: T) => void` | Método para definir valor. |