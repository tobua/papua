import { resolve } from 'path'
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

const root = (folder: string) => resolve(process.cwd(), folder)

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
    mode: development ? 'development' : 'production',
    entry: {
      main: options().entry,
    },
    output: {
      filename: development ? '[name].js' : '[name].[contenthash].js',
    },
    devtool: development ? 'cheap-module-source-map' : 'source-map',
    plugins: getPlugins(development),
    resolve: {
      // To allow absolute imports from root, without tons of ../..
      // and making it easy to copy code and move files around.
      modules: [root('.'), 'node_modules'],
      // Add TypeScript extensions.
      // extensions: ['.js', '.jsx', '.ts', '.tsx']
      //   .filter((extension) => options().typescript || !extension.includes('ts'))
      //   .concat('.json', '.mjs', '.wasm'),
    },
    module: {
      // Matched from bottom to top!
      rules: [
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset', // Auto-detect: Inline if < 8kb, external otherwise.
        },
        {
          test: /\.inline\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/inline', // Inline *.inline.svg files in JavaScript using base64 dataURI.
        },
        {
          test: /\.load\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource', // Convert *.load.png asset to separate file loaded through request.
          use: [
            {
              loader: 'file-loader',
              options: {
                name: development ? '[path][name].[ext]' : '[contenthash].[ext]',
              },
            },
          ],
        },
      ],
    },
  } as RspackOptions)
