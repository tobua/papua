import { RspackOptions, Compiler, Plugins } from '@rspack/core'
import TypeScriptWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import { options } from '../utility/options'
import { htmlPlugin } from './rspack-html'

class PatchTypeScriptHookPlugin {
  // eslint-disable-next-line class-methods-use-this
  apply(compiler: Compiler) {
    // Rspack includes no afterCompile hook, afterEmit is similar.
    // @ts-ignore
    compiler.hooks.afterCompile = compiler.hooks.afterEmit
  }
}

const getPlugins = (development: boolean) => {
  const plugins: Plugins = []

  if (options().html) {
    plugins.push(htmlPlugin())
  }

  if (!development && options().typescript) {
    plugins.push(new PatchTypeScriptHookPlugin())
    plugins.push(new TypeScriptWebpackPlugin())
  }

  return plugins
}

export default (development: boolean) =>
  ({
    entry: {
      main: options().entry,
    },
    output: {
      filename: development ? '[name].js' : '[name].[contenthash].js',
    },
    devtool: development ? 'cheap-module-source-map' : 'source-map',
    plugins: getPlugins(development),
    module: {
      rules: [
        {
          test: /\.inline\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/inline', // Inline logo.inline.svg files in JavaScript using base64 dataURI.
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource', // Convert asset to separate file.
        },
      ],
    },
  } as RspackOptions)
