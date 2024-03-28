import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)))
export const CACHE_DIR = resolve(ROOT_DIR, '.cache')
