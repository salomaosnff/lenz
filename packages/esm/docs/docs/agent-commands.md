# Comandos do Agente

Comandos do agente podem ser criados utilizando bibliotecas dinâmicas em Rust. Eles são executados no servidor e podem ser chamados através do métofo `invoke()` ou `invokeSync()` d módulo `lenz:invoke` no cliente.

## `invoke<T>(command: string, args: Record<string, InvokeArg>): Promise<T>`

Executa um comando do agente de forma assíncrona.

### Parâmetros

| Nome    | Tipo                      | Descrição                                        |
| ------- | ------------------------- | ------------------------------------------------ |
| command | string                    | Identificador do comando do agente a ser chamado |
| args    | Record<string, InvokeArg> | Argumentos do comando                            |

### Retorno

Retorna uma promessa que resolve com o resultado do comando.

## `invokeSync<T>(command: string, args: Record<string, InvokeArg>): T`

Executa um comando do agente de forma síncrona.

### Parâmetros

| Nome    | Tipo                      | Descrição                                        |
| ------- | ------------------------- | ------------------------------------------------ |
| command | string                    | Identificador do comando do agente a ser chamado |
| args    | Record<string, InvokeArg> | Argumentos do comando                            |

### Retorno

Retorna o resultado do comando.

## Exemplo

```js
import { invoke } from 'lenz:invoke';

export async function activate({ subscriptions }) {
    const result = await invoke('fs.readFile', { path: '/etc/hostname' })
    
    console.log(result, new TextDecoder().decode(result));
}
```

::: info
Em breve esta documentação será atualizada com mais informações sobre como criar bibliotecas dinâmicas em Rust e para adicionar comandos do agente.
:::