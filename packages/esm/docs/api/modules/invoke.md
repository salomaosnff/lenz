# Módulo Invoke

O módulo invoke é responsável por executar operações no agente de execução.

Para utilizar o módulo invoke, basta importar o módulo `lenz:invoke` no arquivo de script de sua extensão.


```ts
import { invoke } from 'lenz:invoke';
```

## Métodos

### `invoke<T>(command: string, args: Record<string, unknown> = {}): Promise<T>`

Invoca um comando no agente de execução de forma assíncrona.

Exemplo:

```js
import { invoke } from 'lenz:invoke';

export function activate(context) {
  invoke('fs.readFile', { filepath: '/etc/hosts' }).then((data) => {
    console.log('conteúdo do arquivo:', data);
  });
}
```

#### Parâmetros

| Nome    | Tipo                      | Descrição               |
| ------- | ------------------------- | ----------------------- |
| command | `string`                  | Comando a ser invocado. |
| args    | `Record<string, unknown>` | Argumentos do comando.  |

::: info
O argumento `args` será convertido em um `FormData` antes de ser enviado para o agente de execução.
Portanto, os valores devem ser valores primitivos, `Blob`, `File` ou `FileList`.

Para enviar JSON, utilize `JSON.stringify`.
:::

### Exemplo


#### Retorno

`Promise<T>` - Promessa que será resolvida com o resultado da execução do comando.

### `invokeSync<T>(command: string, args: Record<string, unknown> = {}): T`

Versão síncrona do método `invoke`.

Exemplo:

```js
import { invokeSync } from 'lenz:invoke';

export function activate(context) {
  const data = invokeSync('fs.readFile', { filepath: '/etc/hosts' });
  console.log('conteúdo do arquivo:', data);
}
```

::: warning
Utilize este método com cautela, pois ele bloqueia a thread principal.
Caso o comando seja muito demorado, pode causar travamentos no editor. Neste caso, utilize o método `invoke`.
:::

#### Parâmetros

| Nome    | Tipo                      | Descrição               |
| ------- | ------------------------- | ----------------------- |
| command | `string`                  | Comando a ser invocado. |
| args    | `Record<string, unknown>` | Argumentos do comando.  |
