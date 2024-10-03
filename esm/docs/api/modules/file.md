# Módulo de arquivo

O módulo de comandos é responsável por gerencia o arquivo aberto no editor.

Para utilizar o módulo de arquivo, basta importar o módulo `lenz:file` no arquivo de script de sua extensão.

```ts
import { getCurrentFile } from 'lenz:file';
```

## Métodos

### `getCurrentFile(): EditorFile | undefined`

Retorna o arquivo aberto no editor.

#### Retorno

`EditorFile | undefined` - Arquivo aberto no editor.

### `open(filepath: string): Promise<void>`

Abre um arquivo no editor.

#### Parâmetros

| Nome     | Tipo     | Descrição                        |
| -------- | -------- | -------------------------------- |
| filepath | `string` | Caminho do arquivo a ser aberto. |

#### Retorno

`Promise<void>` - Promessa que será resolvida quando o arquivo for aberto.
