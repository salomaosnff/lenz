const importmap = {
    imports: {
        'lenz': `${window.location.origin}/lenz/api/dist/lenz.js`
    }
}

const script = document.createElement('script')
script.type = 'importmap'
script.text = JSON.stringify(importmap)

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes?.forEach((node) => {
            if (node.tagName === 'HEAD') {
                observer.disconnect()
                node.appendChild(script)
            }
        })
    })
})

observer.observe(document, { childList: true, subtree: true });