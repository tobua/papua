import { basename, join, relative } from 'path'
import { cpSync, existsSync } from 'fs'
import merge from 'deepmerge'
import { RspackOptions } from '@rspack/core'
import { options } from '../utility/options'
import { getPluginBasePath, getProjectBasePath } from '../utility/path'
import type { HtmlOptions, CopyOptions } from '../types'
import { log } from '../utility/helper'

const defaultIconFiles = ['logo.png', 'logo.svg', 'icon.png', 'icon.svg']

const faviconPath = (icon: boolean | string) => {
  let path = null
  const files = defaultIconFiles.concat(defaultIconFiles.map((file) => `asset/${file}`))

  files.forEach((file) => {
    const fileProjectPath = join(getProjectBasePath(), file)

    if (existsSync(fileProjectPath)) {
      path = fileProjectPath
    }
  })

  if (typeof icon === 'string') {
    const customIconPath = join(getProjectBasePath(), icon)

    if (existsSync(customIconPath)) {
      if (!customIconPath.includes(getProjectBasePath())) {
        log(
          `icon "${icon}" is located outside the project "${getProjectBasePath()}" and will be copied to the root.`,
          'warning'
        )

        const iconFileName = basename(customIconPath)
        const iconDestinationPath = join(getProjectBasePath(), iconFileName)

        // Skip if file already exists (from previous runs or otherwise).
        if (!existsSync(iconDestinationPath)) {
          cpSync(customIconPath, iconDestinationPath)
        }

        path = iconFileName
      } else {
        path = customIconPath
      }
    }
  }

  return path && relative(getProjectBasePath(), path)
}

export const htmlPlugin = (development: boolean, inputs?: boolean | HtmlOptions) => {
  const { html, icon, title, publicPath } = options()
  let template = join(getPluginBasePath(), 'configuration/template.html')

  if (existsSync(join(process.cwd(), './index.html'))) {
    template = './index.html'
  }

  let htmlOptions: HtmlOptions = {
    template,
    title,
    minify: !development,
    publicPath,
    favicon: icon && faviconPath(icon),
  }

  if (typeof html === 'object') {
    htmlOptions = merge(htmlOptions, html, {
      clone: true,
    })
  }

  if (typeof inputs === 'object') {
    htmlOptions = merge(htmlOptions, inputs, { clone: true })
  }

  if (!htmlOptions.title) {
    delete htmlOptions.title
  }

  if (!htmlOptions.favicon) {
    delete htmlOptions.favicon
  }

  return htmlOptions
}

const getCopyPlugin = () => {
  const result: CopyOptions = { patterns: [] }

  if (existsSync(join(process.cwd(), 'public'))) {
    result.patterns.push({ from: 'public', globOptions: { ignore: ['**/.DS_Store'] } })
  }

  return result
}

export const getBuiltins = (
  development: boolean,
  publicPath: string
): RspackOptions['builtins'] => ({
  define: {
    'process.env.PUBLIC_URL': JSON.stringify(publicPath),
    'process.env.NODE_ENV': development ? '"development"' : '"production"',
  },
  html: options().html ? [htmlPlugin(development, options().html)] : [],
  copy: getCopyPlugin(),
  presetEnv: {
    mode: 'entry',
    targets:
      options().esVersion !== 'browserslist' ? ['last 3 versions', '> 1%', 'not dead'] : undefined,
  },
})
