# Módulo de Atalhos de Teclado

O módulo de hotkeys é responsável por gerenciar atalhos de teclado.

Para utilizar o módulo de hotkeys, basta importar o módulo `lenz:hotkeys` no arquivo de script de sua extensão.


```ts
import { addHotKeys } from 'lenz:hotkeys';
```

## Métodos

### `addHotKeys(hotkeys: Record<string, string>): LenzDisposer`

Adiciona atalhos de teclado para comandos.

Exemplo:

```js
import { addHotKeys } from 'lenz:hotkeys';

export function activate(context) {
  const disposer = addHotKeys({
    'Ctrl+S': 'file.save',
    'Ctrl+S': 'file.undo',
    'Ctrl+S': 'file.redo',
  });

  context.subscriptions.push(disposer);
}
```

#### Parâmetros

| Nome    | Tipo                     | Descrição           |
| ------- | ------------------------ | ------------------- |
| hotkeys | `Record<string, string>` | Atalhos de teclado. |

### Exemplo


#### Retorno

`LenzDisposer` - Disposer para remover o hook que deve ser adicionado em `context.subscriptions` da extensão.