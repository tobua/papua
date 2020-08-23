import chalk from 'chalk'

export const log = (message, type) => {
  const namespace = chalk.blue.bold('papua')
  if (type === 'error') {
    console.log(`${namespace} ${chalk.red.bold('Error')} ${message}.\n`)
  }

  if (type === 'warning') {
    console.log(`${namespace} ${chalk.orange('Warning')} ${message}.\n`)
  }

  console.log(`${namespace} ${message}.\n`)
}
