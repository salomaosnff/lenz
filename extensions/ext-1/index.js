import * as lenz from 'lenz'

export async function activate(updateTask) {
  const tasks = [
    'Fazer café',
    'Reunião com o time',
    'Revisar pull request',
    'Estudar inglês',
    'Reunião com o cliente',
    'Revisar documentação',
    'Estudar Vue.js',
  ]

  
  let start = performance.now()

  while (true) {
    const task = tasks[Math.floor(Math.random() * tasks.length)]
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 250))
    await updateTask(task)
    let elapsed = performance.now() - start

    if (elapsed > 5000) {
      break
    }
  }

  await lenz.dialog.show('Se você está vendo essa mensagem,\nsignifica que a extensão embutida foi encontrada e ativada! 🎉', {
    title: 'Sucesso!',
    okLabel: 'Continuar',
  })
}
