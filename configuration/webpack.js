import { existsSync } from 'fs'
import { resolve, join } from 'path'
import webpack from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import WorkboxWebpackPlugin from 'workbox-webpack-plugin'
import FaviconsWebpackPlugin from 'favicons-webpack-plugin'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import { LocalDependenciesPlugin } from 'synec'
import objectAssignDeep from 'object-assign-deep'
import { options } from '../utility/options.js'
import { getProjectBasePath, getPluginBasePath } from '../utility/path.js'
import { isTest } from '../utility/helper.js'

const root = (folder) => resolve(process.cwd(), folder)

const getEntry = () => {
  const entry = {}

  if (
    // Do not include polyfills for tests.
    !isTest &&
    options().polyfills &&
    (!Array.isArray(options().polyfills) || options().polyfills.length)
  ) {
    entry.polyfills = options().polyfills
  }

  entry.main = options().entry

  return entry
}

const getIconPlugin = () => {
  let path = join(getPluginBasePath(), 'configuration/logo.png')

  const logoPngProjectPath = join(getProjectBasePath(), 'logo.png')
  const logoSvgProjectPath = join(getProjectBasePath(), 'logo.svg')

  if (existsSync(logoPngProjectPath)) {
    path = logoPngProjectPath
  }

  if (existsSync(logoSvgProjectPath)) {
    path = logoSvgProjectPath
  }

  if (options().icon) {
    const customIconPath = join(getProjectBasePath(), options().icon)

    if (existsSync(customIconPath)) {
      path = customIconPath
    }
  }

  return new FaviconsWebpackPlugin({
    logo: path,
    mode: 'light',
  })
}

const getBabelOptions = () => {
  const defaultOptions = {
    presets: [
      '@babel/env',
      // Removes TS annotations, but no type checking.
      '@babel/typescript',
      [
        '@babel/react',
        {
          // React not required to be in scope for JSX.
          runtime: 'automatic',
        },
      ],
    ],
  }

  if (typeof options().babel === 'object') {
    // Merge arrays to preserve default presets.
    objectAssignDeep.withOptions(defaultOptions, [options().babel], {
      arrayBehaviour: 'merge',
    })
  }

  return defaultOptions
}

const getPlugins = (development) => {
  const plugins = [
    new LocalDependenciesPlugin({ watch: true }),
    new webpack.DefinePlugin({
      'process.env.PUBLIC_URL': JSON.stringify(options().publicPath),
    }),
    getIconPlugin(),
  ]

  if (!development) {
    plugins.push(
      new MiniCssExtractPlugin({
        filename: development ? '[name].css' : '[name].[contenthash].css',
        chunkFilename: development ? '[id].css' : '[id].[contenthash].css',
      })
    )
  }

  if (options().typescript) {
    plugins.push(new ForkTsCheckerWebpackPlugin())
  }

  if (existsSync(join(process.cwd(), 'public'))) {
    plugins.push(
      new CopyPlugin({
        patterns: [{ from: 'public' }],
      })
    )
  }

  const serviceWorkerFileName = `service-worker.${options().typescript ? 'ts' : 'js'}`
  const serviceWorkerSourcePath = join(getProjectBasePath(), serviceWorkerFileName)

  if (existsSync(serviceWorkerSourcePath)) {
    // TODO optional papua.config.js to allow non JSON values and avoid transform.
    if (options().workbox.include && Array.isArray(options().workbox.include)) {
      options().workbox.include = options().workbox.include.map((value) => new RegExp(value))
    }

    if (options().workbox.exclude && Array.isArray(options().workbox.exclude)) {
      options().workbox.exclude = options().workbox.exclude.map((value) => new RegExp(value))
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

    plugins.push(new WorkboxWebpackPlugin.InjectManifest(workboxOptions))
  }

  return plugins
}

const getPublicPath = () => {
  if (options().publicPath) {
    // Require leading slash.
    const publicPathWithSlashes = join('/', options().publicPath, '/')
    return publicPathWithSlashes
  }

  // TODO test with "webpack v5 uses publicPath: "auto" by default"
  return ''
}

export default (development) => ({
  mode: development ? 'development' : 'production',
  entry: getEntry(),
  output: {
    filename: development ? '[name].js' : '[name].[contenthash].js',
    path: join(getProjectBasePath(), options().output),
    publicPath: getPublicPath(),
    // For node 17 compatibility, will be included in next webpack major release.
    hashFunction: 'xxhash64',
    hashDigestLength: 16,
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: getBabelOptions(),
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: development ? '[path][name].[ext]' : '[contenthash].[ext]',
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [development ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: getPlugins(development),
  resolve: {
    // To allow absolute imports from root, without tons of ../..
    // and making it easy to copy code and move files around.
    modules: [root('.'), 'node_modules'],
    // Add TypeScript extensions.
    extensions: ['.js', '.jsx', '.ts', '.tsx']
      .filter((extension) => options().typescript || !extension.includes('ts'))
      .concat('.json', '.mjs', '.wasm'),
    alias: {
      'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js',
      'react/jsx-runtime': 'react/jsx-runtime.js',
    },
  },
  performance: {
    hints: false,
  },
})
