#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')

const program = require('commander')

const npm = require('./npm')

const { projectRoot } = require('../env')

const { logger } = require('../build/utils/logger')

async function copyFile(src, dest, flags) {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true })
  await fs.promises.copyFile(src, dest, flags)
}

program.version(require('../package.json').version)

program.command('init').action(async () => {
  logger.info('initializing')
  try {
    logger.info('creating directories')
    await Promise.all(
      ['components', 'content-sources', 'definitions', 'outputs'].map(dir =>
        fs.promises.mkdir(path.join(projectRoot, 'src', dir), {
          recursive: true
        })
      )
    )

    logger.info('copying config files')
    await Promise.all(
      [
        '.vscode/launch.json',
        'src/definitions/styles.d.ts',
        '.dockerignore',
        '.eslintignore',
        '.eslintrc.json',
        '.gitignore',
        '.nvmrc',
        '.prettierignore',
        'server.js',
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
;['build', 'clean', 'dev', 'generate', 'manifest', 'prod', 'watch'].map(cmd => {
  program.command(cmd).action(npm(cmd))
})

program.parse(process.argv)
