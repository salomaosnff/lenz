# Módulo de UI

O módulo ui é responsável por gerenciar janelas de interface do usuário independentes.

Para utilizar o módulo ui, basta importar o módulo `lenz:ui` no arquivo de script de sua extensão.


```ts
import { createWindow } from 'lenz:ui';
```

## Métodos

### `createWindow(options: WindowOptions): WindowInstance`

Cria uma janela de interface do usuário.

Exemplo:

```js
import { createWindow } from 'lenz:ui';

export function activate(context) {
  const window = createWindow({
    title: 'Minha Janela',
    width: 800,
    height: 600,
    content: `<h1>Olá, mundo!</h1>`,
  });
}
```

::: tip
A propriadade `content` também aceita uma URL.
Utilize `content: new URL('www/index.html', import.meta.url)` para carregar um arquivo HTML localizado em `www/index.html` que está no mesmo diretório do script da extensão.
:::

#### Parâmetros

| Nome    | Tipo                            | Descrição                                 |
| ------- | ------------------------------- | ----------------------------------------- |
| options | [WindowOptions](#windowoptions) | Opções da janela de interface do usuário. |

#### Retorno

[WindowInstance](#windowinstance) - Instância da janela de interface do usuário.

### `getData(): any`

Retorna os dados passados para a janela de interface do usuário.

#### Retorno

`any` - Dados passados para a janela de interface do usuário.

### `createChannel<T>(): Channel<T>`

Cria um canal de comunicação entre a janela de interface do usuário e a extensão.

#### Exemplo

```js
import { createChannel } from 'lenz:ui';

const [sender, receiver] = createChannel();

receiver.addListener((data) => {
  console.log('mensagem recebida:', data);
});

setInterval(() => {
  sender.send('ping');
}, 1000);
```

#### Retorno

[Channel\<T\>](#channel) - Canal de comunicação entre a janela de interface do usuário e a extensão.

### `createCustomRef<T>(factory: CustomRefFactory<T>): LenzRef<T>`

Cria uma referência reativa personalizada.

#### Exemplo

```js
import { createCustomRef } from 'lenz:ui';

const ref = createCustomRef(() => {
  return {
    get() {
      return localStorage.getItem('value') ?? value;
    },
    set(newValue) {
      localStorage.setItem('value', newValue);
    },
  };
});

ref.addListener((value) => {
  console.log('valor alterado:', value);
});

setInterval(() => {
  ref.value = Date.now();
}, 1000);
```

#### Parâmetros

| Nome    | Tipo                                        | Descrição                      |
| ------- | ------------------------------------------- | ------------------------------ |
| factory | `() => ({ get(): T, set(value: T): void })` | Fábrica da referência reativa. |

#### Retorno

[LenzRef\<T\>](#lenzref) - Referência reativa personalizada.

### `createRef<T>(initialValue?: T): LenzRef<T>`

Cria uma referência reativa para um valor.

#### Exemplo

```js
import { createRef } from 'lenz:ui';

const ref = createRef(42);

ref.addListener((value) => {
  console.log('valor alterado:', value);
});

setInterval(() => {
  ref.value++;
}, 1000);
```

#### Parâmetros

| Nome         | Tipo             | Descrição             |
| ------------ | ---------------- | --------------------- |
| initialValue | `T \| undefined` | Valor inicial da ref. |

#### Retorno

[LenzRef\<T\>](#lenzref) - Referência reativa com o valor inicial informado.
[LenzRef\<T | undefined\>](#lenzref) - Referência reativa com valor inicial `undefined`.

### `onUiInit(callback: Function): void`

Registra um callback para ser executado quando a janela de interface do usuário for inicializada.

Deve ser chamada dentro da janela de interface do usuário para garantir que a inicialização seja feita corretamente.

#### Exemplo

```js
import { onUiInit } from 'lenz:ui';
import { createApp } from 'vue';

onUiInit(() => {
  const app = createApp({
    template: `<h1>Olá, mundo!</h1>`,
  });

  app.mount('#app');
});
```

#### Parâmetros

| Nome     | Tipo       | Descrição               |
| -------- | ---------- | ----------------------- |
| callback | `Function` | Função a ser executada. |

## Tipos

### `WindowOptions`

Opções da janela de interface do usuário.

#### Propriedades

| Nome        | Tipo                     | Descrição                                   |
| ----------- | ------------------------ | ------------------------------------------- |
| `title`     | `string \| undefined`    | Título da janela.                           |
| `content`   | `string \| URL`          | Conteúdo da janela.                         |
| `base`      | URL                      | URL base para carregar recursos da janela.  |
| `width`     | `number`                 | Largura da janela.                          |
| `height`    | `number`                 | Altura da janela.                           |
| `themed`    | `boolean`                | Injeta estilos do tema do editor            |
| `data`      | `any`                    | Dados a serem passados para a janela.       |
| `position`  | `{x: number, y: number}` | Posição da janela.                          |
| `resizable` | `boolean`                | Define se a janela é redimensionável.       |
| `frame`     | `boolean`                | Define a visibilidade da moldura da janela. |
| `modal`     | `boolean`                | Define se a janela é modal.                 |
| `closable`  | `boolean`                | Define se a janela é fechável.              |
| `movable`   | `boolean`                | Define se a janela é movível.               |

### `WindowInstance`

Instância da janela de interface do usuário.

#### Propriedades

| Nome      | Tipo            | Descrição         |
| --------- | --------------- | ----------------- |
| `options` | `WindowOptions` | Opções da janela. |

#### Métodos

##### `close(): void`

Fecha a janela de interface do usuário.

##### `focus(): void`

Foca a janela de interface do usuário.

##### `waitForClose(): Promise<void>`

Aguarda a janela de interface do usuário ser fechada.

### `Channel<T>`#{#channel}

Tupla de canais de comunicação.

| Posição | Tipo                                     | Descrição             |
| ------- | ---------------------------------------- | --------------------- |
| `0`     | [SenderChannel\<T\>](#senderchannel)     | Canal de envio.       |
| `1`     | [ReceiverChannel\<T\>](#receiverchannel) | Canal de recebimento. |

### `SenderChannel<T>`#{#senderchannel}

Canal para enviar mensagens.

#### Métodos

##### `send(data: T): void`

Envia uma mensagem para o [ReceiverChannel\<T\>](#receiverchannel) associado.

#### Parâmetros

| Nome   | Tipo | Descrição |
| ------ | ---- | --------- |
| `data` | `T`  | Mensagem. |

##### `close(): void`

Fecha o canal de envio e o canal de recebimento associado.

##### `isClosed(): boolean`

Verifica se o canal de envio está fechado.

##### `waitClose(): Promise<void>`

Aguarda o canal ser fechado.

### `ReceiverChannel<T>`#{#receiverchannel}

Canal para receber mensagens.

#### Métodos

##### `addListener(listener: (data: T) => void): void`

Adiciona um ouvinte para receber mensagens.

#### Parâmetros

| Nome       | Tipo                | Descrição             |
| ---------- | ------------------- | --------------------- |
| `listener` | `(data: T) => void` | Ouvinte de mensagens. |

#### Retorno

`LenzDisposer` - Disposer para remover o ouvinte.

##### `close(): void`

Fecha o canal de recebimento e o canal de envio associado.

##### `isClosed(): boolean`

Verifica se o canal de recebimento está fechado.

##### `waitClose(): Promise<void>`

Aguarda o canal ser fechado.

##### `next(signal?: AbortSignal): Promise<T>`

Aguarda a próxima mensagem.

#### Parâmetros

| Nome     | Tipo                       | Descrição              |
| -------- | -------------------------- | ---------------------- |
| `signal` | `AbortSignal \| undefined` | Sinal de cancelamento. |

#### Retorno

`Promise<T>` - Promessa que será resolvida com a próxima mensagem.

### `LenzRef<T>`#{#lenzref}

Referência reativa.

#### Propriedades

| Nome    | Tipo | Descrição                  |
| ------- | ---- | -------------------------- |
| `value` | `T`  | Valor atual da referência. |

#### Métodos

##### `waitClose(): Promise<void>`

Aguarda a referência ser fechada.

##### `addListener(listener: (value: T) => void): LenzDisposer`

Adiciona um ouvinte para receber notificações de alteração de valor.

#### Parâmetros

| Nome       | Tipo                 | Descrição              |
| ---------- | -------------------- | ---------------------- |
| `listener` | `(value: T) => void` | Ouvinte de alterações. |

#### Retorno

`LenzDisposer` - Disposer para remover o ouvinte.

##### `next(signal?: AbortSignal): Promise<T>`

Aguarda a próxima alteração de valor.

#### Parâmetros

| Nome     | Tipo                       | Descrição              |
| -------- | -------------------------- | ---------------------- |
| `signal` | `AbortSignal \| undefined` | Sinal de cancelamento. |

#### Retorno

`Promise<T>` - Promessa que será resolvida com o próximo valor.

##### `listen(signal?: AbortSignal): AsyncIterableIterator<T>`

Retorna um iterador assíncrono para ouvir alterações de valor.

#### Parâmetros

| Nome     | Tipo                       | Descrição              |
| -------- | -------------------------- | ---------------------- |
| `signal` | `AbortSignal \| undefined` | Sinal de cancelamento. |

#### Retorno

`AsyncIterableIterator<T>` - Iterador assíncrono para ouvir alterações de valor.

#### `clone(): LenzRef`

Clona a referência reativa.

#### Retorno

[LenzRef\<T\>](#lenzref) - Referência reativa clonada.

#### `destroy(): void`

Fecha a referência reativa.

