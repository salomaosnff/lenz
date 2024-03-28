const editor = require('@editor/core');

function activate({ subscriptions }){
    subscriptions.add(
        editor.commands.registerCommand('project.open', async () => {
            console.log('open folder')
            const path = await editor.files.showOpenFolderDialog()

            console.log(path)
        })
    )
    subscriptions.add(
        editor.commands.registerCommand('project.new', () => {})
    )
    subscriptions.add(
        editor.commands.registerCommand('project.new.from-template', () => {})
    )
}

module.exports = {
    activate
}