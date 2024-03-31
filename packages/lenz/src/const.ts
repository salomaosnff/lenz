import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';

/** Representa um valor que não foi inicializado */
export const NotInitialized = Symbol('NotInitialized');

export const app = {
    id: 'lenz',
    name: 'Lenz',
}

export const APP_DIR = join(homedir(), `.${app.id}`);
export const USER_EXTENSIONS_DIR = join(APP_DIR, 'extensions');
export const BUILTIN_EXTENSIONS_DIR = resolve(dirname(global.__filename), '../../extensions');