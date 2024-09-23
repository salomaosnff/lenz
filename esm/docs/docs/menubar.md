# Barra de menus

A barra de menus é uma parte importante da interface do Lenz Designer, pois é onde você encontra a maioria dos comandos disponíveis no editor.

![Barra de menus](/menubar.png)

A barra de menus é composta por menus que são exibidos na parte superior de forma horizontal. Cada menu contém uma lista de submenus que agrupam comandos relacionados.

::: tip
Não é necessário configurar atalhos de teclado para um submenu.
Quando você associa um atalho de teclado a um comando, atalho é exibido ao lado do comando no submenu automaticamente.

Veja mais em [Associando um atalho de teclado](/docs/commands.html#associando-um-atalho-de-teclado).
:::

## Inserindo um novo menu

Para inserir um novo menu na barra de menus, basta chamar a função `addMenuItemsAt` do módulo `lenz:menubar`.

```ts
import { addCommand } from 'lenz:commands';
import { addMenuItemsAt } from 'lenz:menubar';  // [!code focus]

export function activate({ subscriptions }) {
    subscriptions.add(
        addCommand({
            id: 'meu.comando',
            name: 'Meu Comando',
            description: 'Exibe uma mensagem no console do navegador',
            run() {
                console.log('Olá, mundo!');
            }
        })
    );  
    subscriptions.add(
        addMenuItemsAt(['Meu Menu'], [      // [!code focus]
            {                               // [!code focus]
                type: 'item',               // [!code focus]
                title: 'Meu Comando',       // [!code focus]
                command: 'meu.comando',     // [!code focus]
            },                              // [!code focus]
        ])                                  // [!code focus]
    );
}
```

## Separadores

Você pode adicionar um separador entre os itens de um submenu para agrupar comandos relacionados.

```ts
import { addCommand } from 'lenz:commands';
import { addMenuItemsAt, SEPARATOR } from 'lenz:menubar';  // [!code focus]

export function activate({ subscriptions }) {
    subscriptions.add(
        addCommand({
            id: 'meu.comando',
            name: 'Meu Comando',
            description: 'Exibe uma mensagem no console do navegador',
            run() {
                console.log('Olá, mundo!');
            }
        })
    );  
    subscriptions.add(
        addMenuItemsAt(['Meu Menu'], [      // [!code focus]
            {                               // [!code focus]
                type: 'item',               // [!code focus]
                title: 'Meu Comando',       // [!code focus]
                command: 'meu.comando',     // [!code focus]
            },                              // [!code focus]
            SEPARATOR,                      // [!code focus]
            {                               // [!code focus]
                type: 'item',               // [!code focus]
                title: 'Meu Comando 2',     // [!code focus]
                command: 'meu.comando',     // [!code focus]
            },                              // [!code focus]
        ])                                  // [!code focus]
    );
}
```

## Grupos de checkboxes e radio buttons

Você pode adicionar um checkbox a um submenu para permitir que o usuário ative ou desative uma opção.

```ts
import { addMenuItemsAt } from 'lenz:menubar';

export function activate({ subscriptions }) {
    let features = new Set();
    let selectedOption = 'opcao1';

    subscriptions.add(
        addMenuItemsAt(['Meu Menu'], [
            {
                type: "checkbox-group",
                title: "Recursos",
                onUpdated: (newValue) => {
                    features = newValue
                    console.log(`Recursos ativados:`, ...features);
                },
                getValue: () => features,
                items: [
                    {
                        title: "Recurso 1",
                        checkedValue: 'recurso1',
                    },
                    {
                        title: "Recurso 2",
                        checkedValue: 'recurso2',
                    },
                    {
                        title: "Recurso 3",
                        checkedValue: 'recurso3',
                    }
                ],
            },
            {
                type: "radio-group",
                title: "Opções",
                onUpdated: (newValue) => {
                    console.log(`Opção selecionada:`, newValue);
                },
                getValue: () => selectedOption,
                items: [
                    {
                        title: "Opção 1",
                        checkedValue: 'opcao1',
                    },
                    {
                        title: "Opção 2",
                        checkedValue: 'opcao2',
                    },
                    {
                        title: "Opção 3",
                        checkedValue: 'opcao3',
                    }
                ],
            }
        ])
    );
}
```