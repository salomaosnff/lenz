import { createRouter, createWebHashHistory } from 'vue-router'
import Editor from './views/Editor.vue'

export default createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: Editor
        },
    ]
})