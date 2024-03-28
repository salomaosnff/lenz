import { basename, join } from "path";
import { existsSync, createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { SingleBar, Presets } from 'cli-progress'
import { CACHE_DIR } from "./const.mjs";
import https from 'https'

export async function download(url, filename = basename(new URL(url).pathname)) {
    const cache_path = join(CACHE_DIR, filename)

    if (existsSync(cache_path)) {
        console.log(`Using cached ${filename}`)
        return cache_path
    }

    return new Promise((resolve, reject) => {
        const bar = new SingleBar({
            format: `Downloading ${filename} | {bar} | {percentage}% | ETA: {eta}s | {value}/{total} bytes`,
            hideCursor: true
        }, Presets.shades_classic)
    
        // Request the file
        https.get(url, async res => {
            if (res.statusCode !== 200) {
                console.error(`Failed to download ${filename}: ${res.statusCode} ${res.statusMessage}`)
                process.exit(1)
            }
    
            // Create the cache directory if it doesn't exist
            await mkdir(CACHE_DIR, { recursive: true })
    
            // Create the cache file
            const file = createWriteStream(cache_path)
    
            // Start the progress bar
            bar.start(parseInt(res.headers['content-length']), 0)
    
            // Pipe the response to the file
            res.pipe(file)
    
            // Update the progress bar
            res.on('data', chunk => bar.increment(chunk.length))

            res.on('error', reject)
    
            // Finish the progress bar
            res.on('end', () => {
                bar.stop()
                resolve(cache_path)
            })
        })
    })
}