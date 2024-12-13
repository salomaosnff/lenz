import fb from 'fast-glob';
import { createHash } from 'crypto';
import fs from 'fs-extra'
import { tmpdir } from 'os';
import { dirname, join } from 'path';

const HASH_FILE = join(tmpdir(), 'lenz-builder/file-hash.json');
let cache: { [key: string]: string };

export async function getNewHash(pattern: string | string[]) {
    const hash = createHash('sha256');

    for (const file of await fb.glob(([] as string[]).concat(pattern), {
        absolute: true, followSymbolicLinks: true, markDirectories: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/.svn/**', '**/.hg/**', '**/.DS_Store', '**/Thumbs.db'],
    }).then(files => files.sort())) {
        hash.update(`${file}[\n`);
        hash.update(await fs.readFile(file, { encoding: 'binary' }));
        hash.update(`\n]${file}\n`);
    }

    return hash.digest('hex');
}

export async function getHashs() {
    if (await fs.exists(HASH_FILE)) {
        return cache ??= JSON.parse(await fs.readFile(HASH_FILE, { encoding: 'utf8' }));
    }

    return {};
}

export async function saveHashs(hash: { [key: string]: string }) {
    await fs.mkdir(dirname(HASH_FILE), { recursive: true });
    await fs.writeFile(HASH_FILE, JSON.stringify(hash, null, 4), { encoding: 'utf8' });
    cache = hash;
}

export async function getOldHash(pattern: string | string[]) {
    const hashs = await getHashs();
    const key = getKey(pattern);

    if (key in hashs) {
        return hashs[key];
    }
}

export function getKey(pattern: string | string[]) {
    return ([] as string[]).concat(pattern).join(',');
}

export async function isChanged(pattern: string | string[]) {
    const newHash = await getNewHash(pattern);
    const oldHash = await getOldHash(pattern);

    if (newHash !== oldHash) {
        const hashs = await getHashs();
        hashs[getKey(pattern)] = newHash;
        await saveHashs(hashs);

        return true;
    }

    return false;
}

export async function clearHashs() {
    await fs.remove(HASH_FILE);
    cache = undefined as any;
}