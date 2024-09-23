# Comandos

Comandos é a base de todas as funcionalidades do Lenz Designer. Eles representam ações que podem ser executadas pelo usuário através da paleta de comandos, atalhos de teclado ou programaticamente através de outras extensões.

![Paleta de comandos](/command-palette.png)

::: tip
A paleta de comandos é uma ferramenta poderosa para descobrir e executar comandos no Lenz Designer.
Pressione `F1` para abrir a paleta de comandos.
:::

## Estrutura de um comando

Um comando precisa de no mínimo um identificador único e uma função que será executada quando o comando for chamado.

```ts
export interface Command {
    id: string;                 // Identificador único
    name?: string;              // Nome do comando
    description?: string;       // Descrição do comando
    icon?: string;              // Ícone do comando
    run(context, ...args: any[]): any;   // Função que será executada
}
```

::: warning
Caso o comando não possua um nome, ele não será exibido na paleta de comandos, porém ainda poderá ser chamado através de atalhos de teclado ou programaticamente.
:::

## Criando um comando

Para criar um comando, basta importar o módulo `lenz:commands` e chamar a função `addCommand` passando um objeto que implementa a interface `Command`.

```ts
import { addCommand } from 'lenz:commands';
import iconEarth from 'lenz:icons/earth';

export function activate({ subscriptions }) {
    subscriptions.add(
        addCommand({
            id: 'hello.world',
            name: 'Exibir mensagem',
            description: 'Exibe uma mensagem de boas-vindas no console do navegador',
            icon: iconEarth,
            run() {
                console.log('Olá, mundo!');
            }
        })
    )
}
```

::: warning
Lembre-se de sempre chamar a função `addCommand` dentro do método `activate` e adicionar o retorno ao conjunto de inscrições **subscriptions** para que ele seja removido quando a extensão for desativada.
:::

## Associando um atalho de teclado

Para associar um atalho de teclado a um comando, utilize a função `addHotKeys` do módulo `lenz:hotkeys` e crie um mapa de atalhos de teclado para comandos.

```ts
import { addCommand } from 'lenz:commands';
import { addHotKeys } from 'lenz:hotkeys'; // [!code ++]
import iconEarth from 'lenz:icons/earth';

export function activate({ subscriptions }) {
    subscriptions.add(
        addCommand({
            id: 'hello.world',
            name: 'Exibir mensagem',
            description: 'Exibe uma mensagem de boas-vindas no console do navegador',
            icon: iconEarth,
            run() {
                console.log('Olá, mundo!');
            }
        })
    )

    subscriptions.add(                          // [!code ++]
        addHotKeys({                            // [!code ++]
            'Ctrl+H': 'hello.world'             // [!code ++]
        })                                      // [!code ++]
    )                                           // [!code ++]
}
```

## Executando um comando programaticamente

Para executar um comando programaticamente, importe o módulo `lenz:commands` e chame a função `executeCommand` passando o identificador do comando e opcionalmente os argumentos necessários.

A extensão abaixo executa o comando `hello.world` ao ser ativada.

```ts
import { addCommand, executeCommand } from 'lenz:commands'; // [!code ++]
import iconEarth from 'lenz:icons/earth';

export function activate({ subscriptions }) {
    subscriptions.add(
        addCommand({
            id: 'hello.world',
            name: 'Exibir mensagem',
            description: 'Exibe uma mensagem de boas-vindas no console do navegador',
            icon: iconEarth,
            run() {
                console.log('Olá, mundo!');
            }
        })
    )

    executeCommand('hello.world'); // [!code ++]
}
```

## Objeto de contexto

Todos os comandos recebem um objeto de contexto como primeiro argumento. Este objeto contém algumas informações úteis sobre o contexto de execução do comando como os elementos selecionados, o arquivo aberto. Estas informações podem ser utilizados para executar a ação do comando.

No exemplo abaixo, o comando `print-selection` imprime a seleção atual no console do navegador.

```ts
import { addCommand } from 'lenz:commands';
import { write } from 'lenz:file';

export function activate({ subscriptions }) {
    subscriptions.add(
        addCommand({
            id: 'print-selection',
            name: 'Imprimir seleção',
            description: 'Imprime a seleção atual no console do navegador',
            run({ getSelection }) {
                console.log('Seleção atual', Array.from(getSelection()).map(({ element }) => element));
            }
        })
    )
}
```

::: tip
Utilize a paleta de comandos para encontrar e executar o comando `Imprimir seleção`.
:::

### Propriedades do objeto de contexto

| Propriedade          | Tipo                                     | Descrição                                  |
| -------------------- | ---------------------------------------- | ------------------------------------------ |
| `getSelection`       | `() => Selection`                        | Retorna a seleção atual                    |
| `getSelection`       | `(elements: HTMLElement[]) => Selection` | Define a seleção atual                     |
| `getHover`           | `() => Selection`                        | Retorna o elemento sob o cursor            |
| `getCurrentDocument` | `() => Document`                         | Retorna o documento atual                  |
| `getCurrentContent`  | `() => string`                           | Transforma o documento atual em uma string |