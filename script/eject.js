import { copyFileSync } from 'fs'
import { join } from 'path'
import { program } from 'commander'
import prompts from 'prompts'
import { log } from '../utility/helper.js'
import { getPluginBasePath, getProjectBasePath } from '../utility/path.js'

const templates = {
  html: {
    title: 'HTML Template',
    value: 'index.html',
    file: 'index.html',
    handler: (file = 'index.html') => {
      copyFileSync(
        join(getPluginBasePath(), 'configuration/template.html'),
        join(getProjectBasePath, file)
      )
      log(`Template created in ${join(getProjectBasePath, file)}`)
    },
  },
  icon: {
    title: '',
    value: 'icon.svg',
    file: 'icon.svg',
  },
  webpack: {
    title: 'webpack configuration',
    value: 'webpack.config.js',
  },
}

export default async (options) => {
  program.version('1.0.0')
  program.option('-t --template <name>', 'name of the template')
  program.option('-f --file <name>', 'name of the generated entity')
  program.parse(process.argv)

  // 3 Input methods: Programmatic (options argument), CLI (argv) or
  // User prompt if previous input methods empty.
  if (!options || typeof options !== 'object') {
    // eslint-disable-next-line no-param-reassign
    options = program.opts()
  }

  let { template, file } = options

  if (!template) {
    template = (
      await prompts({
        type: 'select',
        name: 'template',
        message: 'Pick a template to eject',
        // TODO better assignment.
        choices: Object.keys(templates).map((key) => ({
          title: templates[key].title,
          value: key,
        })),
      })
    ).template
  }

  const action = templates[template]

  if (!action) {
    log('Unable to get template from options', 'error')
    return
  }

  if (action.file && !file) {
    file = (
      await prompts({
        type: 'text',
        name: 'file',
        message: 'How do you want to name the context?',
        initial: action.file,
      })
    ).file
  }

  action.handler(file)
}
