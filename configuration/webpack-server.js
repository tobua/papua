import { join } from 'path'
import { options } from '../utility/options.js'

const removeLeadingSlash = (path) => path.replace(/^\/*/, '')

export const webpackServer = () => {
  const baseConfiguration = {
    open: true,
    // Redirect all routes to index.html (useful with router).
    historyApiFallback: true,
    devMiddleware: {
      // Prevent errors from falling back to regular logs.
      stats: 'none',
    },
  }

  if (options().publicPath) {
    // Won't work with leading slash.
    baseConfiguration.open = removeLeadingSlash(options().publicPath) || '/'
    // Leading and trailing slashes required.
    // Leading slash for bundle and trailing for assets.
    const publicPathWithSlashes = join('/', options().publicPath, '/')
    baseConfiguration.devMiddleware.publicPath = publicPathWithSlashes

    // Rewrite index requests to public path.
    baseConfiguration.historyApiFallback = {
      index: publicPathWithSlashes,
      // Route every request to index.html (SPA assumed).
      rewrites: [{ from: /./, to: join(publicPathWithSlashes, 'index.html') }],
    }
  }

  return baseConfiguration
}
