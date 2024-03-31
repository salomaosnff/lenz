import lenz from 'lenz/internal'

await lenz.extensions.start()

console.log('Iniciado!')
console.log(lenz.tools.getTool('tool.select'))