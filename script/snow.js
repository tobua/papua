import { startDevServer } from 'snowpack'
import { loadSnowpackConfig } from '../utility/configuration.js'

export default async () => {
  const configuration = await loadSnowpackConfig()
  await startDevServer(configuration)
}
