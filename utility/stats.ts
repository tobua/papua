import chalk from 'chalk'
import prettyMs from 'pretty-ms'
import prettyBytes from 'pretty-bytes'
import formatMessages from 'webpack-format-messages'
import { MultiCompiler, MultiStats, Stats } from '@rspack/core'
import { log } from './helper'
import { options } from './options'

export const startServer = (url: string) => {
  log(`Starting server on ${url}...`)
}

const getEntries = (compiler: MultiCompiler) => {
  const entries = []

  compiler.compilers.forEach((innerCompiler) => {
    const { entry } = innerCompiler.compilation.options

    Object.keys(entry).forEach((entryKey) => {
      entries.push([
        entryKey,
        // Filter out DevServer injections.
        entry[entryKey].import.filter(
          (module) =>
            !module.includes('node_modules/@rspack') && !module.includes('node_modules/webpack')
        ),
      ])
    })
  })

  return entries
}

export const logStats = (
  input: MultiStats | Stats,
  development: boolean,
  compiler: MultiCompiler
) => {
  const multiStats: Stats[] =
    input instanceof MultiStats ? input.stats : [input as unknown as Stats]
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

    const entries = getEntries(compiler)

    console.log(
      `${chalk.gray('Entry')} ${entries
        .map((entry) => `${entry[1].join(', ')} (${entry[0]})`)
        .join(', ')}`
    )

    let assets = Object.keys(stats.compilation.assets).map((name) => {
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

    if (options().typescript && !development) {
      console.log('')
      console.log('Type check finished.')
    }

    console.log('')
  })
}

export const logError = (error: { message: string }) => console.log(chalk.red(error.message))

export const recompiling = () => log('Recompiling...')
