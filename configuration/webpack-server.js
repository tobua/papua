export default {
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
