# Módulo de Utilitários

O módulo de utilitários é responsável por fornecer funcionalidades auxiliares para extensões.

Para utilizar o módulo util, basta importar o módulo `lenz:util` no arquivo de script de sua extensão.


```ts
import { ensureInitialized } from 'lenz:util';
```

## Métodos

### `ensureInitialized(options: WindowOptions): void`

Garante que o editor esteja inicializado. Caso o editor ainda não esteja inicializado, é lançado um erro.