import './style.css'

import { createApp } from 'vue'

import App from './App.vue'

export default function (parent: HTMLElement, data: any) {
    const link = document.createElement('link')

    const styleUrl = import.meta.url.replace(/[^/]+$/g, 'style.css')

    link.rel = 'stylesheet'
    link.href = styleUrl
    link.id = 'widget-layout-style'

    document.head.appendChild(link)

    const app = createApp(App, {
        getData: () => data
    })

    app.mount(parent)

    return () => {
        app.unmount()
        link.remove()
    }
}