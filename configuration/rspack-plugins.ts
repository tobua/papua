import { basename, join, relative } from 'path'
import { cpSync, existsSync } from 'fs'
import { deepmerge } from 'deepmerge-ts'
import {
  RspackOptions,
  Plugins,
  RspackPluginInstance,
  DefinePlugin,
  HtmlRspackPlugin,
  CopyRspackPlugin,
} from '@rspack/core'
import TypeScriptWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import { InjectManifestPlugin } from 'inject-manifest-plugin'
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
          'warning',
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

const getCopyPlugin = () => {
  const result: CopyOptions = { patterns: [] }

  if (existsSync(join(process.cwd(), 'public'))) {
    result.patterns.push({ from: 'public', globOptions: { ignore: ['**/.DS_Store'] } })
  }

  return result
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
    htmlOptions = deepmerge(htmlOptions, html)
  }

  if (typeof inputs === 'object') {
    htmlOptions = deepmerge(htmlOptions, inputs)
  }

  if (!htmlOptions.title) {
    delete htmlOptions.title
  }

  if (!htmlOptions.favicon) {
    delete htmlOptions.favicon
  }

  return htmlOptions
}

export const getPlugins = (development: boolean, publicPath: string): RspackOptions['plugins'] => {
  const plugins: Plugins = []
  const pluginOptions = options()

  if (!development && pluginOptions.typescript) {
    plugins.push(new TypeScriptWebpackPlugin() as unknown as RspackPluginInstance)
  }

  plugins.push(
    new DefinePlugin({
      'process.env.PUBLIC_URL': JSON.stringify(publicPath),
      'process.env.NODE_ENV': development ? '"development"' : '"production"',
    }),
  )

  plugins.push(new CopyRspackPlugin(getCopyPlugin()))

  if (pluginOptions.html) {
    plugins.push(new HtmlRspackPlugin(htmlPlugin(development, options().html)))
  }

  if (!development && pluginOptions.injectManifest) {
    const serviceWorkerFileName =
      pluginOptions.injectManifest.file ??
      `./service-worker.${pluginOptions.typescript ? 'ts' : 'js'}`
    const serviceWorkerSourcePath = join(getProjectBasePath(), serviceWorkerFileName)

    if (existsSync(serviceWorkerSourcePath)) {
      plugins.push(
        new InjectManifestPlugin({
          file: serviceWorkerFileName,
          removeHash: true,
          ...pluginOptions.injectManifest,
        }),
      )
    }
  }

  return plugins
}
