import { sep } from 'path'
import { Command } from 'commander'
import merge from 'deepmerge'

export const getCliInputs = <T>(
  specification: { [key: string]: 'string' | 'number' | 'boolean' },
  options = {}
) => {
  // Not run through papua CLI, skip parsing arguments.
  if (!(process.argv[1].endsWith('papua') || process.argv[1].endsWith(`papua${sep}cli.js`))) {
    return options as T
  }

  const program = new Command()
  program.version('1.0.0')
  Object.keys(specification).forEach((name) => {
    const type = specification[name] === 'boolean' ? '' : `  <${specification[name]}>`
    program.option(`-${name.charAt(0)} --${name}${type}`)
  })
  program.parse()

  // 3 Input methods: Programmatic (options argument), CLI (argv) or
  // User prompt if previous input methods empty.
  return merge(options, program.opts(), { clone: true }) as T
}
