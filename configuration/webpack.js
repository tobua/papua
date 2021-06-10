import { existsSync } from 'fs'
import { resolve, join } from 'path'
import webpack from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import WorkboxWebpackPlugin from 'workbox-webpack-plugin'
import FaviconsWebpackPlugin from 'favicons-webpack-plugin'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import { LocalDependenciesPlugin } from 'synec'
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

const getPlugins = (development) => {
  const plugins = [
    new MiniCssExtractPlugin({
      filename: development ? '[name].css' : '[name].[contenthash].css',
      chunkFilename: development ? '[id].css' : '[id].[contenthash].css',
    }),
    new LocalDependenciesPlugin({ watch: true }),
    new webpack.DefinePlugin({
      'process.env.PUBLIC_URL': JSON.stringify(options().publicPath),
    }),
    getIconPlugin(),
  ]

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

  const serviceWorkerFileName = `service-worker.${
    options().typescript ? 'ts' : 'js'
  }`
  const serviceWorkerSourcePath = join(
    getProjectBasePath(),
    serviceWorkerFileName
  )

  if (existsSync(serviceWorkerSourcePath)) {
    const workboxOptions = {
      swSrc: serviceWorkerSourcePath,
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

  return ''
}

export default (development) => ({
  mode: development ? 'development' : 'production',
  entry: getEntry(),
  output: {
    filename: development ? '[name].js' : '[name].[contenthash].js',
    path: join(getProjectBasePath(), options().output),
    publicPath: getPublicPath(),
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
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
          },
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
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
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
