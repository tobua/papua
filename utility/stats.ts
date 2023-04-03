import { relative } from 'path'
import chalk from 'chalk'
import prettyMs from 'pretty-ms'
import prettyBytes from 'pretty-bytes'
import formatMessages from 'webpack-format-messages'
import { MultiStats, Stats } from '@rspack/core'
import { log } from './helper'
import { getProjectBasePath } from './path'

export const startServer = (url: string) => {
  log(`Starting server on ${url}...`)
}

export const logStats = (input: MultiStats, development: boolean) => {
  const multiStats: Stats[] = input.stats ?? [input as unknown as Stats]
  multiStats.forEach((stats) => {
    if (!development) {
      log(
        `Build in ${stats.compilation.outputOptions.path} took ${prettyMs(
          stats.compilation.endTime - stats.compilation.startTime,
          {
            verbose: true,
          }
        )}`
      )
    }

    // TODO includes more files than just entries, previously used compilation.entries no longer available.
    const entries = stats.compilation
      .getModules()
      .map((module) => relative(getProjectBasePath(), module.resource))

    console.log(`${chalk.gray('Entry')} ${entries.join(', ')}`)

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
  })
}

export const logError = (error: { message: string }) => console.log(chalk.red(error.message))

export const recompiling = () => log('Recompiling...')
