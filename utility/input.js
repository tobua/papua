import { Command } from 'commander'

export const getInputs = (options, specification) => {
  // Not run through papua CLI, skip parsing arguments.
  if (!process.argv[1].endsWith('papua')) {
    return options || {}
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
  if (!options || typeof options !== 'object') {
    // eslint-disable-next-line no-param-reassign
    options = program.opts()
  }

  return options
}
