import { existsSync } from 'fs'
import { join } from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import objectAssignDeep from 'object-assign-deep'
import { options } from '../utility/options.js'

const getHtmlWebpackPluginOptions = () => {
  const htmlOptions = {
    title: options().title,
  }

  if (existsSync(join(process.cwd(), './index.html'))) {
    htmlOptions.template = './index.html'
  } else if (typeof jest !== 'undefined') {
    htmlOptions.template = './../../../configuration/template.html'
  } else {
    htmlOptions.template = './node_modules/papua/configuration/template.html'
  }

  if (options().html && typeof options().html === 'object') {
    objectAssignDeep(htmlOptions, options().html)
  }

  return htmlOptions
}

export const html = () => new HtmlWebpackPlugin(getHtmlWebpackPluginOptions())
