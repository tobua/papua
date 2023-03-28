// import { existsSync } from 'fs'
import HtmlRspackPlugin, { Options } from '@rspack/plugin-html'
// import merge from 'deepmerge'
import { options } from '../utility/options.js'

export const htmlPlugin = () => {
  const htmlOptions: Options = {
    template: './../../../configuration/template.html',
    title: options().title,
  }

  return new HtmlRspackPlugin(htmlOptions)
  //   let htmlOptions = {
  //     title: options().title,
  //   }

  //   if (existsSync(join(process.cwd(), './index.html'))) {
  //     htmlOptions.template = './index.html'
  //   } else if (typeof jest !== 'undefined') {
  //     htmlOptions.template = './../../../configuration/template.html'
  //   } else {
  //     htmlOptions.template = './node_modules/papua/configuration/template.html'
  //   }

  //   if (options().html && typeof options().html === 'object') {
  //     htmlOptions = merge(htmlOptions, options().html, { clone: false })
  //   }

  //   return htmlOptions
}
