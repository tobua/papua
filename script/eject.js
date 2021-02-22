import { copyFileSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import { Command } from 'commander'
import prompts from 'prompts'
import { log, editPackageJson } from '../utility/helper.js'
import { getPluginBasePath, getProjectBasePath } from '../utility/path.js'

const program = new Command()

const templates = {
  html: {
    title: 'HTML Template',
    file: 'index.html',
    handler: (file = 'index.html') => {
      copyFileSync(
        join(getPluginBasePath(), 'configuration/template.html'),
        join(getProjectBasePath(), file)
      )
      log(`Template created in ${join(getProjectBasePath(), file)}`)

      if (file !== 'index.html') {
        editPackageJson({ papua: { html: { template: file } } })
        log(`HTML configuration edited in package.json to point to ${file}`)
      }
    },
  },
  icon: {
    title: 'Icon',
    file: 'icon.png',
    handler: (file = 'icon.png') => {
      if (file !== 'icon.png' && file !== 'icon.svg') {
        editPackageJson({ papua: { icon: file } })
        log(`Icon configuration edited in package.json to point to ${file}`)
      }

      copyFileSync(
        join(getPluginBasePath(), 'configuration/icon.png'),
        join(getProjectBasePath(), file)
      )

      log(`Icon added in ${join(getProjectBasePath(), file)}`)
    },
  },
  webpack: {
    title: 'webpack configuration',
    handler: () => {
      const webpackConfigPath = join(getProjectBasePath(), 'webpack.config.js')
      if (existsSync(webpackConfigPath)) {
        log(`Configuration already exists in ${webpackConfigPath}`, 'error')
        return
      }

      writeFileSync(
        webpackConfigPath,
        `// Custom webpack configuration to merge with papua default configuration.
export default (configuration, isDevelopment) => ({
  // Add webpack modifications here.
})

// Optionally edit the resulting configuration after merging.
export const after = (configuration) => {
  // Modify configuration.
  return configuration
}`
      )

      log(`Configuration created in ${webpackConfigPath}`)
    },
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

  console.log('')

  if (action.handler) {
    action.handler(file)
  }
}
