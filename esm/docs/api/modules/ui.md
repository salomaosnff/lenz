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

| Nome        | Tipo                   | Descrição                                   |
| ----------- | ---------------------- | ------------------------------------------- |
| `title`     | `string \| undefined`  | Título da janela.                           |
| `content`   | `string \| URL`        | Conteúdo da janela.                         |
| `base`      | `URL \| undefined`     | URL base para carregar recursos da janela.  |
| `width`     | `number \| undefined`  | Largura da janela.                          |
| `height`    | `number \| undefined`  | Altura da janela.                           |
| `themed`    | `boolean \| undefined` | Injeta estilos do tema do editor            |
| `data`      | `any`                  | Dados a serem passados para a janela.       |
| `x`         | `number \| undefined`  | Posição horizontal da janela.               |
| `y`         | `number \| undefined`  | Posição vertical da janela.                 |
| `resizable` | `boolean \| undefined` | Define se a janela é redimensionável.       |
| `frame`     | `boolean \| undefined` | Define a visibilidade da moldura da janela. |
| `modal`     | `boolean \| undefined` | Define se a janela é modal.                 |
| `closable`  | `boolean \| undefined` | Define se a janela é fechável.              |
| `movable`   | `boolean \| undefined` | Define se a janela é movível.               |

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

###### Retorno

`Promise<void>` - Promessa que será resolvida quando a janela for fechada.

