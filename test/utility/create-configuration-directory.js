import { mkdirSync } from 'fs'
import { join } from 'path'

export const createConfigurationDirectory = (fixturePath) => {
  const packageConfigDirectory = join(fixturePath, 'node_modules/papua/configuration')

  // Create empty node_module package config to local fixture, so it can be modified.
  mkdirSync(packageConfigDirectory, { recursive: true })
}
