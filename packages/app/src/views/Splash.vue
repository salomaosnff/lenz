<script setup lang="ts">
import { ref } from 'vue';
import icon from '../../../../icon.png'

function onLoad() {
    nw.Window.open('package.nw/app/dist/index.html#/editor', {
        show: false,
        width: 1024,
        height: 768,
        frame: true,
        position: 'center',
        title: 'Lenz',
    }, (win) => {
        win.on('loaded', () => {
            nw.Window.get().close()
            win.setPosition('center');
            win.maximize();
            win.show();
        });
    });
}

const extension = ref<string>()

const mock = [
    // Lista de possíveis plugins de um editor de código
    'ESLint',
    'Prettier',
    'Vetur',
    'Emmet',
    'GitLens',
    'Bracket Pair Colorizer',
    'Live Server',
    'Code Spell Checker',
    'Auto Rename Tag',
    'Auto Close Tag',
    'Path Intellisense',
    'IntelliSense for CSS class names',
    'CSS Peek',
    'HTML CSS Support',
    'HTML Snippets',
    'JavaScript (ES6) code snippets',
    'JavaScript Snippet Pack',
    'npm Intellisense',
    'npm',
    'npm support',
]

const progress = ref(0)
    ; (async () => {
        let i = 0;
        const win = nw.Window.get()
        for (const item of mock) {
            extension.value = item
            let p = i++ / mock.length
            win.setProgressBar(p)
            progress.value = p * 100
            await new Promise(resolve => setTimeout(resolve, Math.random() * 3000))
        }

        onLoad()
    })();

</script>
<template>
    <div class="w-full h-full flex items-center pa-8">
        <div>
            <div class="flex">
                <img :src="icon" class="block w-64 h-64" />
            </div>
            <h1 class="text-8">Lenz</h1>
            <p class="text-3 opacity-50">Carregando {{ extension }}...</p>
            <div class="bg--primary h-1 bottom-0 absolute left-0 transition-all" :style="{
                    width: progress + '%'
                }"></div>
        </div>
    </div>
</template>