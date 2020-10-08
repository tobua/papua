import chalk from 'chalk'
import prettyMs from 'pretty-ms'
import prettyBytes from 'pretty-bytes'
import formatMessages from 'webpack-format-messages'
import { log } from './helper.js'

export const startServer = () => {
  log('Starting server...')
}

export const logStats = (stats, development) => {
  if (!development) {
    log(
      `Build in ${stats.compilation.entries[0].context} took ${prettyMs(
        stats.endTime - stats.startTime,
        {
          verbose: true,
        }
      )}`
    )
  }

  const entries = stats.compilation.entries[0].dependencies
    .map((dep) => dep.module.rawRequest || dep.userRequest)
    .filter(
      (entry) => !entry.match(/core-js\/stable|regenerator-runtime\/runtime/)
    )

  if (entries.length === 1) {
    console.log(`${chalk.gray('Entry')} ${entries[0]}`)
  }

  if (entries.length > 1) {
    console.log(`${chalk.gray('Entries')} ${entries.join(' ')}`)
  }

  const assets = Object.keys(stats.compilation.assets).map((name) => {
    const asset = stats.compilation.assets[name]

    return {
      name,
      size: asset.size(),
    }
  })

  assets.forEach((asset) =>
    console.log(`  ${chalk.bold.cyan(asset.name)}  ${prettyBytes(asset.size)}`)
  )

  const { warnings, errors } = formatMessages(stats)

  if (warnings.length) {
    console.log('')
    console.log(chalk.yellow(`${warnings.length} Warnings.`))

    warnings.forEach((warning) => {
      console.log('')
      console.log(warning)
    })
  }

  if (errors.length) {
    console.log('')
    const errorCount = errors.length === 1 ? 'Error' : 'Errors'
    console.log(chalk.bold.red(`${errors.length} ${errorCount}:`))

    errors.forEach((error) => {
      console.log('')
      console.log(error)
    })
  }

  console.log('')
}

export const logError = (error) => console.log(chalk.red(error.message))

export const recompiling = () => log('Recompiling...')
