const lenz = require('lenz/api');

function activate({ subscriptions }){
    subscriptions.add(
        lenz.commands.registerCommand('project.open', async () => {
            console.log('open folder')
            const path = await lenz.files.showOpenFolderDialog()

            console.log(path)
        })
    )
    subscriptions.add(
        lenz.commands.registerCommand('project.new', () => {})
    )
    subscriptions.add(
        lenz.commands.registerCommand('project.new.from-template', () => {})
    )
}

module.exports = {
    activate
}