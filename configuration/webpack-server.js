import { join } from 'path'
import { options } from '../utility/options.js'

const removeLeadingSlash = (path) => path.replace(/^\/*/, '')

export const webpackServer = () => {
  const baseConfiguration = {
    open: true,
    // Disables webpack build stats.
    clientLogLevel: 'silent',
    // Disables ｢wds｣ logs.
    // NOTE will not work if quiet: true.
    noInfo: true,
    // Prevent errors from falling back to regular logs.
    stats: 'none',
    // Redirect all routes to index.html (useful with router).
    historyApiFallback: true,
  }

  if (options().publicPath) {
    // Won't work with leading slash.
    baseConfiguration.openPage = removeLeadingSlash(options().publicPath)
    // Leading and trailing slashes required.
    // Leading slash for bundle and trailing for assets.
    const publicPathWithSlashes = join('/', options().publicPath, '/')
    baseConfiguration.publicPath = publicPathWithSlashes

    // Rewrite index requests to public path.
    baseConfiguration.historyApiFallback = {
      index: publicPathWithSlashes,
      // Route every request to index.html (SPA assumed).
      rewrites: [{ from: /./, to: join(publicPathWithSlashes, 'index.html') }],
    }
  }

  return baseConfiguration
}
