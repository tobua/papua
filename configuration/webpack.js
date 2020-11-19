import { existsSync } from 'fs'
import { resolve, join } from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import WorkboxWebpackPlugin from 'workbox-webpack-plugin'
import { LocalDependenciesPlugin } from 'synec'
import { options } from '../utility/options.js'
import { getProjectBasePath } from '../utility/path.js'

const root = (folder) => resolve(process.cwd(), folder)

const getHtmlWebpackPluginOptions = () => {
  const htmlOptions = {
    title: options().title,
  }

  if (existsSync(join(process.cwd(), './index.html'))) {
    htmlOptions.template = './index.html'
  }

  return htmlOptions
}

const getEntry = () => {
  const polyfills = ['core-js/stable', 'regenerator-runtime/runtime']
  return [...polyfills, ...options().entries]
}

const getPlugins = (development) => {
  const plugins = [
    new HtmlWebpackPlugin(getHtmlWebpackPluginOptions()),
    new MiniCssExtractPlugin(),
    new LocalDependenciesPlugin(),
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

  if (!development && existsSync(serviceWorkerSourcePath)) {
    plugins.push(
      new WorkboxWebpackPlugin.InjectManifest({
        swSrc: serviceWorkerSourcePath,
      })
    )
  }

  return plugins
}

export default (development) => ({
  mode: development ? 'development' : 'production',
  entry: getEntry(),
  output: {
    path: join(getProjectBasePath(), options().output),
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: [
              // Plugins for mobx which uses decorators.
              ['@babel/plugin-proposal-decorators', { legacy: true }],
              ['@babel/plugin-proposal-class-properties', { loose: true }],
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
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  performance: {
    hints: false,
  },
})
