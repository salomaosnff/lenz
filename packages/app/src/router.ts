import { createRouter, createWebHashHistory } from 'vue-router'
import Splash from './views/Splash.vue'
import Editor from './views/Editor.vue'

export default createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: Splash
        },
        {
            path: '/editor',
            component: Editor
        }
    ]
})