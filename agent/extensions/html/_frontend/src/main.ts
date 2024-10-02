import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { onUiInit } from 'lenz:ui'


onUiInit(() => {
    createApp(App).mount('#app')
})