#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')

const program = require('commander')
const debug = require('debug')('composition')

const npm = require('./npm')

const { projectRoot } = require('../env')

const manifest = require('../src/manifest')

async function copyFile(src, dest, flags) {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true })
  await fs.promises.copyFile(src, dest, flags)
}

program.version(require('../package.json').version)

program.command('init').action(async () => {
  debug('initializing')
  try {
    debug('creating directories')
    await Promise.all(
      ['components', 'content-sources', 'outputs'].map(dir =>
        fs.promises.mkdir(path.join(projectRoot, 'src', dir), {
          recursive: true
        })
      )
    )

    debug('copying config files')
    await Promise.all(
      [
        '.vscode/launch.json',
        '.dockerignore',
        '.eslintignore',
        '.eslintrc.json',
        '.gitignore',
        '.prettierignore',
        'tsconfig.json'
      ].map(async fileName => {
        try {
          return copyFile(
            path.join(__dirname, `templates/${fileName}`),
            path.join(projectRoot, fileName),
            fs.COPYFILE_EXCL
          )
        } catch (_) {}
      })
    )
  } catch (e) {
    console.error(e)
  }
})

program.command('manifest').action(async () => {
  console.log(JSON.stringify(manifest(), null, 2))
})
;['build', 'clean', 'dev', 'generate', 'prod', 'watch'].map(cmd => {
  program.command(cmd).action(npm(cmd))
})

program.parse(process.argv)
