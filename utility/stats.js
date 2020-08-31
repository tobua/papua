import chalk from 'chalk'
import log from 'logua'
import prettyMs from 'pretty-ms'
import prettyBytes from 'pretty-bytes'

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

  const warnings = stats.compilation.warnings
  const errors = stats.compilation.errors

  if (warnings.length) {
    console.log('')
    console.log(chalk.yellow(`${warnings.length} Warnings.`))
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
