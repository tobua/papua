import { join } from 'path'
import { existsSync } from 'fs'
// eslint-disable-next-line import/no-named-default
import { default as HtmlPlugin, Options } from '@rspack/plugin-html'
import { findRootSync } from '@manypkg/find-root'
import merge from 'deepmerge'
import { options } from '../utility/options'
import { getPluginBasePath, getProjectBasePath } from '../utility/path'

const faviconPath = (icon: boolean | string) => {
  let path = join(getPluginBasePath(), 'configuration/logo.png')

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

  return path
}

export const htmlPlugin = (inputs?: boolean | Options) => {
  const { html, icon } = options()

  let template = join(getPluginBasePath(), 'configuration/template.html')

  if (options().debug) {
    // eslint-disable-next-line no-console
    console.log('DEBUG: ', template, process.env.INIT_CWD, findRootSync(process.cwd()).rootDir)
  }

  if (existsSync(join(process.cwd(), './index.html'))) {
    template = './index.html'
  }

  let htmlOptions: Options = {
    template,
    title: options().title,
    minify: true,
    publicPath: options().publicPath,
    favicon: options().icon && faviconPath(icon),
  }

  if (typeof html === 'object') {
    htmlOptions = merge(htmlOptions, html, {
      clone: true,
    })
  }

  if (typeof inputs === 'object') {
    htmlOptions = merge(htmlOptions, inputs, { clone: true })
  }

  // @ts-ignore
  const hasDefaultExport = typeof HtmlPlugin === 'object' && HtmlPlugin.default
  // @ts-ignore
  const HtmlRspackPlugin = hasDefaultExport ? HtmlPlugin.default : HtmlPlugin

  return new HtmlRspackPlugin(htmlOptions)
}
