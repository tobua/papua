import { existsSync } from 'fs'
import { resolve, join } from 'path'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import WorkboxWebpackPlugin from 'workbox-webpack-plugin'
import { LocalDependenciesPlugin } from 'synec'
import objectAssignDeep from 'object-assign-deep'
import { options } from '../utility/options.js'
import { getProjectBasePath } from '../utility/path.js'
import { isTest } from '../utility/helper.js'

const root = (folder) => resolve(process.cwd(), folder)

const getHtmlWebpackPluginOptions = () => {
  const htmlOptions = {
    title: options().title,
  }

  if (existsSync(join(process.cwd(), './index.html'))) {
    htmlOptions.template = './index.html'
  }

  if (options().html && typeof options().html === 'object') {
    objectAssignDeep(htmlOptions, options().html)
  }

  return htmlOptions
}

const getEntry = () => {
  const entry = {}

  // Do not include polyfills for tests.
  if (!isTest) {
    entry.polyfills = options().polyfills
  }

  entry.main = options().entry

  return entry
}

const getPlugins = (development) => {
  const plugins = [
    new HtmlWebpackPlugin(getHtmlWebpackPluginOptions()),
    new MiniCssExtractPlugin({
      filename: development ? '[name].css' : '[name].[contenthash].css',
      chunkFilename: development ? '[id].css' : '[id].[contenthash].css',
    }),
    new LocalDependenciesPlugin(),
    new webpack.DefinePlugin({
      'process.env.PUBLIC_URL': JSON.stringify(options().publicPath),
    }),
  ]

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
    console.log('in')
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
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              [
                '@babel/preset-react',
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
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
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
