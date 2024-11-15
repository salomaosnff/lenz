# Suporte ao Lenz Designer para Vite

Este plugin externaliza as dependencias do Lenz Designer e executa o Agente automaticamente evitando erros ao tentar importar módulos com o namespace `lenz:*`.

## Instalação

```bash
npm i @lenz-design/vite-plugin --save-dev
```

Use o plugin no seu arquivo `vite.config.ts`:

```ts
import { defineConfig } from 'vite'

import Lenz from '@lenz-design/vite-plugin'

export default defineConfig({
  plugins: [
    Lenz()
  ]
})
```