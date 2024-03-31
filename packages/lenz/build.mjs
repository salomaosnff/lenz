#!/usr/bin/env node
import { context, build } from 'esbuild'
import { existsSync } from 'fs'
import { readFile, rm } from 'fs/promises'
import glob from 'fast-glob'

const pkg = JSON.parse(await readFile('package.json', 'utf-8'))

if (existsSync('dist')) {
    await rm('dist', { recursive: true })
}
const isWatch = process.argv.includes('--watch')

/**
 * @type {import('esbuild').BuildOptions}
 */
const config = {
    entryPoints: await glob(['src/**/*.ts', '!src/**/*.d.ts']),
    outdir: 'dist',
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    bundle: false,
    tsconfig: 'tsconfig.json',
    minify: false,
    treeShaking: true,
}

if (isWatch) {
    console.log('watching...')
    const build = await context(config)
    
    await build.watch()

    process.on('SIGINT', async () => {
        console.log('\nexiting...')
        await build.dispose()
        process.exit(0)
    })
} else {
    await build(config)
}