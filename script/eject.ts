import { existsSync, writeFileSync, cpSync } from 'node:fs'
import { join } from 'path'
import prompts from 'prompts'
import { log, editPackageJson } from '../utility/helper'
import { getPluginBasePath, getProjectBasePath } from '../utility/path'
import { getCliInputs } from '../utility/input'

const templates = {
  html: {
    title: 'HTML Template',
    file: 'index.html',
    handler: (file: string) => {
      cpSync(
        join(getPluginBasePath(), 'configuration/template.html'),
        join(getProjectBasePath(), file),
        { recursive: true }
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
    file: 'logo.png',
    handler: (file: string) => {
      if (file !== 'logo.png' && file !== 'logo.svg') {
        editPackageJson({ papua: { icon: file } })
        log(`Icon configuration edited in package.json to point to ${file}`)
      }

      cpSync(
        join(getPluginBasePath(), 'configuration/logo.png'),
        join(getProjectBasePath(), file),
        { recursive: true }
      )

      log(`Icon added in ${join(getProjectBasePath(), file)}`)
    },
  },
  rspack: {
    title: 'rspack configuration',
    handler: () => {
      const rspackConfigPath = join(getProjectBasePath(), 'rspack.config.js')
      if (existsSync(rspackConfigPath)) {
        log(`Configuration already exists in ${rspackConfigPath}`, 'error')
        return
      }

      writeFileSync(
        rspackConfigPath,
        `// Custom rspack configuration to merge with papua default configuration.
export default (configuration, isDevelopment) => ({
  // Add rspack modifications here.
})

// Optionally edit the resulting configuration after merging.
export const after = (configuration) => {
  // Modify configuration.
  return configuration
}`
      )

      log(`Configuration created in ${rspackConfigPath}`)
    },
  },
}

export default async (inputs = {}) => {
  let { template, file } = getCliInputs<{ template: string; file: string }>(
    { template: 'string', file: 'string' },
    inputs
  )

  if (!template) {
    template = (
      await prompts({
        type: 'select',
        name: 'template',
        message: 'Pick a template to eject',
        choices: Object.keys(templates).map((key) => ({
          title: templates[key].title,
          value: key,
        })),
      })
    ).template
  }

  const action = templates[template]

  if (!action) {
    log(`Template ${template} doesn't exist`, 'error')
    return
  }

  if (action.file && !file) {
    file = (
      await prompts({
        type: 'text',
        name: 'file',
        message: 'How do you want to name the file?',
        initial: action.file,
      })
    ).file
  }

  console.log('')

  if (action.handler) {
    action.handler(file || action.file)
  }
}
