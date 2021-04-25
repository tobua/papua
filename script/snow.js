import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { render } from 'ejs'
import parser from 'node-html-parser'
import { createConfiguration, startServer } from 'snowpack'
import { loadSnowpackConfig } from '../utility/configuration.js'
import { getProjectBasePath, getPluginBasePath } from '../utility/path.js'
import { options } from '../utility/options.js'
import { log } from '../utility/helper.js'

const { parse } = parser

export default async () => {
  const templatePath = join(getPluginBasePath(), 'configuration/template.html')
  const userPath = join(getProjectBasePath(), 'index.html')

  if (!existsSync(userPath)) {
    let contents = readFileSync(templatePath, 'utf8')
    contents = render(contents, {
      htmlWebpackPlugin: { options: { title: options().title } },
    })
    const root = parse(contents)
    const body = root.querySelector('body')

    body.set_content(
      options()
        .entry.map(
          (entry) =>
            // JS, TS and TSX all need to be referenced as JS.
            `<script type="module" src="${entry.replace(
              /\.(t|j)sx?$/,
              '.js'
            )}"></script>`
        )
        .join('\n')
    )
    writeFileSync(userPath, root.toString())

    log(`Created required entry HTML in ${userPath}`)
  }

  const userConfiguration = await loadSnowpackConfig()
  const config = createConfiguration(userConfiguration)
  await startServer({ config })
}
