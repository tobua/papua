import { existsSync } from 'fs'
import { resolve, join } from 'path'
import { RspackOptions, Compiler, Plugins } from '@rspack/core'
import TypeScriptWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import { options } from '../utility/options'
import { htmlPlugin } from './rspack-html'
import { getProjectBasePath } from '../utility/path'

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
      path: join(getProjectBasePath(), options().output),
      publicPath: options().publicPath,
      assetModuleFilename: development ? '[name][ext][query]' : '[hash][ext][query]',
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
        },
      ],
    },
    builtins: {
      // TODO https://www.rspack.dev/config/builtins.html
      // NOTE builtins html plugin has issues with publicPath.
      define: {
        'process.env.PUBLIC_URL': JSON.stringify(options().publicPath),
      },
      // react: {
      //   runtime: 'automatic',
      // },
      copy: {
        patterns: existsSync(join(process.cwd(), 'public')) ? [{ from: 'public' }] : [],
      },
    },
  } as RspackOptions)
