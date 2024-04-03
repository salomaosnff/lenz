const lenz = require('lenz');
const EventEmitter = require('node:events');
const { mkdir } = require('node:fs/promises');

function activate({ subscriptions }){
    const events = new EventEmitter()

    function open(projectPath) {
        events.emit('open', projectPath)
    }

    subscriptions.add(
        lenz.commands.registerCommand('project.open', async () => {
            let project = await lenz.files.showOpenFolderDialog({
                title: 'Selecione a pasta do projeto',
            })

            open(project)
        })
    )
    subscriptions.add(
        lenz.commands.registerCommand('project.new', async () => {
            let project = await lenz.files.showSaveDialog({
                folder: true,
                title: 'Selecione a pasta do projeto',
                suggest: 'Nome do projeto',
            })

            await mkdir(project, {recursive: true})

            open(project)
        })
    )
    subscriptions.add(
        lenz.commands.registerCommand('project.new.from-template', () => {})
    )

    return {
        events
    }
}

module.exports = {
    activate
}