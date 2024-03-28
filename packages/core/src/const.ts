import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

/** Representa um valor que não foi inicializado */
export const NotInitialized = Symbol('NotInitialized');

export const APP_DIR = join(homedir(), '.my-app');
export const EXTENSIONS_DIR = join(APP_DIR, 'extensions');
export const BUILTIN_EXTENSIONS_DIR = resolve(global.__dirname, 'package.nw/extensions');