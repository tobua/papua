import { existsSync } from 'fs'
import { resolve, join } from 'path'
import { RspackOptions, Plugins, RspackPluginInstance } from '@rspack/core'
import urlJoin from 'url-join'
import TypeScriptWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import { InjectManifestPlugin } from 'inject-manifest-plugin'
import { options } from '../utility/options'
import { getProjectBasePath } from '../utility/path'
import { getBuiltins } from './rspack-builtins'

const root = (folder: string) => resolve(process.cwd(), folder)

const getPlugins = (development: boolean) => {
  const plugins: Plugins = []
  const pluginOptions = options()

  if (!development && pluginOptions.typescript) {
    plugins.push(new TypeScriptWebpackPlugin() as unknown as RspackPluginInstance)
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
        })
      )
    }
  }

  return plugins
}

const getRoots = () => {
  const paths = []

  // To allow absolute imports from root, without tons of ../..
  // and making it easy to copy code and move files around.
  if (options().root) {
    paths.push(root('.'))
  }

  if (options().localDependencies) {
    paths.push(join(process.cwd(), 'node_modules'))
  }

  paths.push('node_modules')

  return paths
}

const getPublicPath = () => {
  if (options().publicPath) {
    // Require leading and trailing slashes, use url-join for Browser compatible paths.
    // Double-slashes are never valid, but can result from url-join.
    return urlJoin('/', options().publicPath, '/').replace('//', '/')
  }

  return ''
}

const getSourceMap = (development: boolean) => {
  if (development) {
    // Inlined quick source map.
    return 'eval-cheap-module-source-map'
  }

  if (options().sourceMap) {
    // .js.map file with high quality source map for production debugging.
    return 'source-map'
  }

  // By default no source maps in production for obfuscation.
  return false
}

const getTarget = () => {
  const targets: RspackOptions['target'] = ['web']
  const version = options().esVersion

  if (typeof version === 'string') {
    targets.push(version)
  }

  return targets
}

export default (development: boolean): RspackOptions => ({
  target: getTarget(),
  mode: development ? 'development' : 'production',
  entry: options().entry,
  output: {
    filename: development || !options().hash ? '[name].js' : '[name].[contenthash].js',
    path: join(getProjectBasePath(), options().output),
    publicPath: getPublicPath(),
    // Path not required when hash is present, shortens paths.
    assetModuleFilename:
      development || !options().hash ? '[path][name][ext][query]' : '[hash][ext][query]',
  },
  devtool: getSourceMap(development),
  plugins: getPlugins(development),
  resolve: {
    modules: getRoots(),
  },
  module: {
    // Matched from bottom to top!
    rules: [
      // Images
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
      // Fonts
      {
        test: /\.(woff|woff2|otf|ttf)$/i,
        type: 'asset/resource',
      },
    ],
  },
  builtins: getBuiltins(development, getPublicPath()),
})
