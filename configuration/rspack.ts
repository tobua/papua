import { existsSync } from 'fs'
import { resolve, join } from 'path'
import { RspackOptions, Plugins, RspackPluginInstance } from '@rspack/core'
import urlJoin from 'url-join'
import TypeScriptWebpackPlugin from 'fork-ts-checker-webpack-plugin'
// import WorkboxWebpackPlugin from 'workbox-webpack-plugin'
import { options } from '../utility/options'
import { getProjectBasePath } from '../utility/path'
import { log } from '../utility/helper'
import { getBuiltins } from './rspack-builtins'

const root = (folder: string) => resolve(process.cwd(), folder)

const getPlugins = (development: boolean) => {
  const plugins: Plugins = []

  if (!development && options().typescript) {
    plugins.push(new TypeScriptWebpackPlugin() as unknown as RspackPluginInstance)
  }

  const serviceWorkerFileName = `service-worker.${options().typescript ? 'ts' : 'js'}`
  const serviceWorkerSourcePath = join(getProjectBasePath(), serviceWorkerFileName)

  if (existsSync(serviceWorkerSourcePath) && !development) {
    // TODO optional papua.config.js to allow non JSON values and avoid transform.
    if (options().workbox.include && Array.isArray(options().workbox.include)) {
      options().workbox.include = options().workbox.include.map((value) =>
        typeof value === 'string' ? new RegExp(value) : value
      )
    }

    if (options().workbox.exclude && Array.isArray(options().workbox.exclude)) {
      options().workbox.exclude = options().workbox.exclude.map((value) =>
        typeof value === 'string' ? new RegExp(value) : value
      )
    }

    // https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-webpack-plugin.InjectManifest#InjectManifest
    const workboxOptions = {
      swSrc: serviceWorkerSourcePath,
      ...options().workbox,
    }

    // Prevent max file size warning in development (files not minified etc.).
    if (development) {
      workboxOptions.maximumFileSizeToCacheInBytes = 20000000
    }

    // TODO not yet compatible.
    // Custom stage not supported: https://github.com/web-infra-dev/rspack/issues/2196
    // processAssets.tapPromise -> stage parameter can be removed, but then:
    // createChildCompiler needs to be implemented: https://github.com/web-infra-dev/rspack/pull/2152
    // plugins.push(new WorkboxWebpackPlugin.InjectManifest(workboxOptions))
    log('Service worker plugin not yet compatible', 'warning')
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
  builtins: getBuiltins(development, getPublicPath()),
})
