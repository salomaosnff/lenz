# Sistema de Arquivos

O módulo embutido de sistema de arquivos é responsável por realizar operações básicas de arquivos como leitura e escrita.

Para utilizar o módulo de sistema de arquivos, basta importar o módulo `lenz:fs` no arquivo de script de sua extensão.

```ts
import { readFile } from 'lenz:fs';
```

## Métodos

### `readFile(filepath: string): Promise<string>`

Lê um arquivo e retorna o conteúdo do arquivo.

#### Exemplo

```ts
import { readFile } from 'lenz:fs';

export function activate(context) {
  // Lê o conteúdo do arquivo /etc/hosts
  readFile('/etc/hosts').then((data) => {
    console.log('conteúdo do arquivo:', data);
  });
}
```

#### Parâmetros

| Nome     | Tipo     | Descrição                 |
| -------- | -------- | ------------------------- |
| filepath | `string` | Caminho do arquivo a ler. |

#### Retorno

`Promise<string>` - Promessa que será resolvida com o conteúdo do arquivo.

### `writeFile(filepath: string, content: ArrayBuffer): Promise<void>`

Escreve um arquivo com o conteúdo fornecido.

#### Exemplo

```ts
import { writeFile } from 'lenz:fs';

export function activate(context) {
  const content = new TextEncoder().encode('Hello, World!');

  // Cria um arquivo em /tmp/hello.txt com o conteúdo 'Hello, World!'
  writeFile('/tmp/hello.txt', content).then(() => {
    console.log('arquivo escrito com sucesso!');
  });
}
```

#### Parâmetros

| Nome     | Tipo          | Descrição                      |
| -------- | ------------- | ------------------------------ |
| filepath | `string`      | Caminho do arquivo a escrever. |
| content  | `ArrayBuffer` | Conteúdo do arquivo.           |

#### Retorno

`Promise<void>` - Promessa que será resolvida quando o arquivo for escrito.
