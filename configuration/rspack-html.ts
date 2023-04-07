import { join } from 'path'
import { existsSync } from 'fs'
import HtmlRspackPlugin, { Options } from '@rspack/plugin-html'
import merge from 'deepmerge'
import { options } from '../utility/options.js'

export const htmlPlugin = () => {
  const customization = options().html

  let template = './node_modules/papua/configuration/template.html'

  if (process.env.NODE_ENV === 'test') {
    template = './../../../configuration/template.html'
  }

  if (existsSync(join(process.cwd(), './index.html'))) {
    template = './index.html'
  }

  let htmlOptions: Options = {
    template,
    title: options().title,
    minify: true,
    publicPath: options().publicPath,
  }

  if (typeof customization === 'object') {
    htmlOptions = merge(htmlOptions, customization, {
      clone: true,
    })
  }

  return new HtmlRspackPlugin(htmlOptions)
}
