'use strict'

import path from 'path'

import compile from '../../utils/compile'
import { fileExists, readFile } from '../../utils/promises'

async function getJson(filePath) {
  return JSON.parse((await readFile(filePath)).toString())
}

async function getHash({ template, output }, options) {
  const { styleHash } = await getJson(
    path.join(
      options.projectRoot,
      `build/dist/templates/${template}/${output}.css.json`
    )
  )

  return styleHash
}

async function getTree(template, options) {
  return getJson(
    path.join(options.projectRoot, 'templates', `${template}.json`)
  )
}

export async function resolve({ uri, output = 'default' }, options) {
  const { projectRoot } = options
  const template = uri === '/' ? 'homepage' : 'article'

  if (
    !(await fileExists(
      path.join(projectRoot, `build/dist/templates/${template}/${output}.js`)
    ))
  ) {
    await compile({ template, output }, options)
  }

  return {
    output,
    styleHash: await getHash({ template, output }, options),
    template,
    tree: await getTree(template, options),
    uri
  }
}

export default resolve
