import { join, relative } from 'path'
import { existsSync } from 'fs'
import merge from 'deepmerge'
import { RspackOptions } from '@rspack/core'
import { options } from '../utility/options'
import { getPluginBasePath, getProjectBasePath } from '../utility/path'
import type { HtmlOptions, CopyOptions } from '../types'

const faviconPath = (icon: boolean | string) => {
  const defaultIconPath = join(getPluginBasePath(), 'configuration/logo.png')
  let path = defaultIconPath

  const logoPngProjectPath = join(getProjectBasePath(), 'logo.png')
  const logoSvgProjectPath = join(getProjectBasePath(), 'logo.svg')

  if (existsSync(logoPngProjectPath)) {
    path = logoPngProjectPath
  }

  if (existsSync(logoSvgProjectPath)) {
    path = logoSvgProjectPath
  }

  if (typeof icon === 'string') {
    const customIconPath = join(getProjectBasePath(), icon)

    if (existsSync(customIconPath)) {
      path = customIconPath
    }
  }

  return {
    absolute: path,
    relative: relative(getProjectBasePath(), path),
    display: path === defaultIconPath ? 'logo.png' : undefined,
  }
}

export const htmlPlugin = (development: boolean, inputs?: boolean | HtmlOptions) => {
  const { html, icon } = options()
  let template = join(getPluginBasePath(), 'configuration/template.html')

  if (existsSync(join(process.cwd(), './index.html'))) {
    template = './index.html'
  }

  let htmlOptions: HtmlOptions = {
    template,
    title: options().title,
    minify: !development,
    publicPath: options().publicPath,
    favicon: options().icon && faviconPath(icon).relative,
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

  if (options().icon) {
    const paths = faviconPath(options().icon)
    result.patterns.push({ from: paths.absolute, to: paths.display || paths.relative })
  }

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
