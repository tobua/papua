import chalk from 'chalk'
import prettyMs from 'pretty-ms'
import prettyBytes from 'pretty-bytes'
import type { Compiler, MultiStats, Stats } from '@rspack/core'
import { log } from './helper'
import { options } from './options'

export const startServer = (url: string) => {
  log(`Starting server on ${url}...`)
}

const getEntries = (compiler: Compiler) => {
  const entries = []
  const { entry } = compiler.compilation.options

  Object.keys(entry).forEach((entryKey) => {
    entries.push([
      entryKey,
      // Filter out DevServer injections.
      entry[entryKey].import.filter(
        (module) =>
          !module.includes('node_modules/@rspack') && !module.includes('node_modules/webpack'),
      ),
    ])
  })

  return entries
}

export const logStats = (input: MultiStats, development: boolean) => {
  const multiStats: Stats[] = Array.isArray(input.stats)
    ? input.stats
    : [input.stats as unknown as Stats]
  multiStats.forEach((stats) => {
    if (!development) {
      log(
        `Build in ${stats.compilation.outputOptions.path} took ${prettyMs(
          stats.compilation.endTime - stats.compilation.startTime,
          {
            verbose: true,
          },
        )}`,
      )
    }

    const entries = getEntries(stats.compilation.compiler)
    console.log(
      `${chalk.gray('Entry')} ${entries
        .map((entry) => `${entry[1].join(', ')} (${entry[0]})`)
        .join(', ')}`,
    )

    const assets = Object.keys(stats.compilation.assets).map((name) => {
      const asset = stats.compilation.assets[name]

      return {
        name,
        size: asset.size(),
      }
    })

    assets.forEach((asset) =>
      console.log(`  ${chalk.bold.cyan(asset.name)}  ${prettyBytes(asset.size)}`),
    )

    const { warnings, errors } = stats.toJson({}, true)

    if (warnings.length) {
      console.log('')
      console.log(chalk.yellow(`${warnings.length} Warnings.`))

      warnings.forEach((warning) => {
        console.log('')
        console.log(warning.formatted)
      })
    }

    if (errors.length) {
      console.log('')
      const errorCount = errors.length === 1 ? 'Error' : 'Errors'
      console.log(chalk.bold.red(`${errors.length} ${errorCount}:`))

      errors.forEach((error) => {
        console.log('')
        console.log(error.formatted)
      })
    }

    if (options().typescript && !development) {
      console.log('')
      console.log('Type check finished.')
    }

    console.log('')
  })
}

export const logError = (error: { message: string }) => console.log(chalk.red(error.message))

export const recompiling = () => log('Recompiling...')
