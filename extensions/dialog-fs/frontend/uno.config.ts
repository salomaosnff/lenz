import { defineConfig, presetUno } from "unocss";


export default defineConfig({
    presets:[presetUno()],
    rules: [
        [
            /^bg--(.+)$/, ([, color]) => ({
                background: `var(--color-${color})`
            }),
        ],
        [
            /^fg--(.+)$/, ([, color]) => ({
                color: `var(--color-${color})`
            })
        ]
    ]
})