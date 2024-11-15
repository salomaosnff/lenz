import type { Plugin } from 'vite'

export interface LenzOptions {
    lenzExecutable?: string;
}

export function Lenz(options?: LenzOptions): Plugin;

export default Lenz;