import { addCommand } from 'lenz:commands'
import { createWindow, createChannel } from 'lenz:ui'

export async function activate({ subscriptions }) {

    let windowAlreadyOpen = false
    
    subscriptions.add(
        addCommand({
            id: 'dialog.file.open',
            name: 'Abrir janela de seleção de arquivo',
            description: 'Abre a janela de seleção de arquivo',
            async run() {
                if (windowAlreadyOpen) {
                    throw new Error('Há uma janela de seleção de arquivo aberta')
                }

                windowAlreadyOpen = true
                const [tx, rx] = createChannel()
                
                const w = createWindow({
                    title: 'Selecionar arquivo',
                    themed: true,
                    content: new URL('www', import.meta.url),
                    data: {
                      result: tx,
                      filters: {
                        'Páginas HTML': '*.html',
                        'Imagens': '*.jpg'
                      }
                    },
                })
                
                return rx.next().finally(() => {
                    w.close()
                    windowAlreadyOpen = false
                })
            }
        })
    )
}
