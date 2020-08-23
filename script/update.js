import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import ncu from 'npm-check-updates'
import { execSync } from 'child_process'
import rimraf from 'rimraf'
import { log } from '../utility/log.js'

export default async () => {
  log('checking for updates..')

  const upgrades = await ncu.run({
    upgrade: true,
  })

  if (Object.keys(upgrades).length === 0) {
    return log('everything already up-to-date')
  }

  Object.keys(upgrades).forEach((key) => {
    const version = upgrades[key]

    console.log(`${key} → ${version}`)
  })

  console.log('')

  log('dependencies upgraded in package.json')

  log('reinstalling dependencies after upgrade..')

  // Cleanup before install.
  rimraf.sync('node_modules')

  const packageLockFilePath = join(process.cwd(), 'package-lock.json')

  if (existsSync(packageLockFilePath)) {
    unlinkSync(packageLockFilePath)
  }

  execSync('npm install', { stdio: 'inherit' })

  log('new dependencies installed')
}
