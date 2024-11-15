# Módulo de Barra de Menu

O módulo menubar é responsável por gerenciar a barra de menu do editor.

Para utilizar o módulo menubar, basta importar o módulo `lenz:menubar` no arquivo de script de sua extensão.


```ts
import { extendMenu } from 'lenz:menubar';
```

## Métodos

### `extendMenu(items: MenuItem[], parentId?: string): LenzDisposer`

Adiciona itens de menu à barra de menu.

Exemplo:

```js
import { extendMenu } from 'lenz:menubar';

export function activate(context) {
  const disposer = extendMenu([
    {
      id: 'meu-menu',
      title: 'Meu Menu',
      children: [
        {
          id: 'meu-comando',
          title: 'Meu Comando',
          command: 'meu.comando',
        },
      ],
    },
  ]);

  context.subscriptions.push(disposer);
}
```

#### Parâmetros

| Nome     | Tipo         | Descrição                          |
| -------- | ------------ | ---------------------------------- |
| items    | `MenuItem[]` | Itens de menu a serem adicionados. |
| parentId | `string`     | ID do item pai.                    |

#### Retorno

`LenzDisposer` - Disposer para remover os itens de menu que deve ser adicionado em `context.subscriptions` da extensão.


## Tipos

### `MenuItem`

União de tipos que podem ser adicionados à barra de menu.

| Tipo                                            | Descrição                                   |
| ----------------------------------------------- | ------------------------------------------- |
| [MenuItemAction](#menuitemaction)               | Item de menu que executa um comando.        |
| [MenuItemSeparator](#menuitemseparator)         | Separador de itens de menu.                 |
| [MenuItemCheckboxGroup](#menuitemcheckboxgroup) | Grupo de itens de menu de seleção múltipla. |
| [MenuItemRadioGroup](#menuitemradiogroup)       | Grupo de itens de menu de seleção única.    |

### `MenuItemAction`

Item de menu que executa um comando.

| Propriedade | Tipo                    | Descrição                                             |
| ----------- | ----------------------- | ----------------------------------------------------- |
| `id`        | `string \| undefined`   | Identificador único.                                  |
| `type`      | `'item'`                | Tipo do item.                                         |
| `title`     | `string`                | Título do item de menu.                               |
| `command`   | `string \| undefined`   | Comando a ser executado.                              |
| `icon`      | `string \| undefined`   | Ícone do item de menu.                                |
| `before`    | `string[] \| undefined` | ID dos itens antes em que o item deve aparecer antes. |
| `after`     | `string[] \| undefined` | ID dos itens em que o item deve aparecer depois.      |
| `children`  | [MenuItem[]](#menuitem) | Itens de menu filhos.                                 |

### `MenuItemSeparator`

Separador de itens de menu.

| Propriedade | Tipo                    | Descrição                                             |
| ----------- | ----------------------- | ----------------------------------------------------- |
| `id`        | `string \| undefined`   | Identificador único.                                  |
| `type`      | `'separator'`           | Tipo do item.                                         |
| `before`    | `string[] \| undefined` | ID dos itens antes em que o item deve aparecer antes. |
| `after`     | `string[] \| undefined` | ID dos itens em que o item deve aparecer depois.      |

### `MenuItemCheckboxGroup`

Grupo de itens de menu de seleção múltipla.

| Propriedade | Tipo                                            | Descrição                                             |
| ----------- | ----------------------------------------------- | ----------------------------------------------------- |
| `id`        | `string \| undefined`                           | Identificador único.                                  |
| `type`      | `'checkbox-group'`                              | Tipo do item.                                         |
| `title`     | `string`                                        | Título do grupo.                                      |
| `before`    | `string[] \| undefined`                         | ID dos itens antes em que o item deve aparecer antes. |
| `after`     | `string[] \| undefined`                         | ID dos itens em que o item deve aparecer depois.      |
| `children`  | [MenuItemCheckboxItem[]](#menuitemcheckboxitem) | Itens de menu filhos.                                 |
| `getValue`  | `() => any`                                     | Função que retorna o valor atual do grupo.            |
| `onUpdated` | `(value: any) => void`                          | Função chamada quando o valor do grupo é atualizado.  |

### `MenuItemCheckboxItem`

Item de menu de seleção múltipla.

| Propriedade      | Tipo                  | Padrão  | Descrição                                           |
| ---------------- | --------------------- | ------- | --------------------------------------------------- |
| `id`             | `string \| undefined` |         | Identificador único.                                |
| `title`          | `string`              |         | Título do item de menu.                             |
| `command`        | `string \| undefined` |         | Comando a ser executado ao clicar no item.          |
| `checkedValue`   | `any`                 | `true`  | Valor a ser retornado quando o item for marcado.    |
| `uncheckedValue` | `any`                 | `false` | Valor a ser retornado quando o item for desmarcado. |

### `MenuItemRadioGroup`

Grupo de itens de menu de seleção única.

| Propriedade | Tipo                                      | Descrição                                             |
| ----------- | ----------------------------------------- | ----------------------------------------------------- |
| `id`        | `string \| undefined`                     | Identificador único.                                  |
| `type`      | `'radio-group'`                           | Tipo do item.                                         |
| `title`     | `string`                                  | Título do grupo.                                      |
| `before`    | `string[] \| undefined`                   | ID dos itens antes em que o item deve aparecer antes. |
| `after`     | `string[] \| undefined`                   | ID dos itens em que o item deve aparecer depois.      |
| `children`  | [MenuItemRadioItem[]](#menuitemradioitem) | Itens de menu filhos.                                 |
| `getValue`  | `() => any`                               | Função que retorna o valor atual do grupo.            |
| `onUpdated` | `(value: any) => void`                    | Função chamada quando o valor do grupo é atualizado.  |

### `MenuItemRadioItem`

Item de menu de seleção única.

| Propriedade | Tipo                  | Padrão | Descrição                                            |
| ----------- | --------------------- | ------ | ---------------------------------------------------- |
| `id`        | `string \| undefined` |        | Identificador único.                                 |
| `title`     | `string`              |        | Título do item de menu.                              |
| `command`   | `string \| undefined` |        | Comando a ser executado ao clicar no item.           |
| `value`     | `any`                 |        | Valor a ser retornado quando o item for selecionado. |
