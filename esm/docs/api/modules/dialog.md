# Módulo de Diálogos

O módulo de diálogos é responsável por exibir diálogos de confirmação, e entrada de dados.

Para utilizar o módulo de diálogos, basta importar o módulo `lenz:dialog` no arquivo de script de sua extensão.

```ts
import { confirm, prompt } from 'lenz:dialog';
```

## Métodos

### `confirm(options: ConfirmDialogOptions): Promise<boolean>`

Adiciona um comando ao Editor.

#### Parâmetros

| Nome    | Tipo                                         | Descrição                         |
| ------- | -------------------------------------------- | --------------------------------- |
| options | [ConfirmDialogOptions](#confirmdialogoptions) | Opções do diálogo de confirmação. |

#### Retorno

`Promise<boolean>` - Promessa que será resolvida com a resposta do usuário.

### `prompt(options: PromptDialogOptions): Promise<string>`

Exibe um diálogo de entrada de dados.

#### Parâmetros

| Nome    | Tipo                  | Descrição                              |
| ------- | --------------------- | -------------------------------------- |
| options | [PromptDialogOptions](#promptdialogoptions) | Opções do diálogo de entrada de dados. |

#### Retorno

`Promise<string>` - Promessa que será resolvida com o valor inserido pelo usuário.

## Tipos

### `ConfirmDialogOptions`

Opções do diálogo de confirmação.

#### Propriedades

| Nome          | Tipo                  | Descrição                       |
| ------------- | --------------------- | ------------------------------- |
| `title`       | `string \| undefined` | Título do diálogo.              |
| `message`     | `string \| undefined` | Mensagem do diálogo.            |
| `confirmText` | `string \| undefined` | Texto do botão de confirmação.  |
| `cancelText`  | `string \| undefined` | Texto do botão de cancelamento. |

### `PromptDialogOptions`

Comando a ser adicionado ao Editor.

#### Propriedades

| Nome           | Tipo                  | Descrição                       |
| -------------- | --------------------- | ------------------------------- |
| `title`        | `string \| undefined` | Título do diálogo.              |
| `message`      | `string \| undefined` | Mensagem do diálogo.            |
| `defaultValue` | `string \| undefined` | Valor padrão do campo de texto. |
| `confirmText`  | `string \| undefined` | Texto do botão de confirmação.  |
| `cancelText`   | `string \| undefined` | Texto do botão de cancelamento. |
