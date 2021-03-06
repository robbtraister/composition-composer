#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const program = require('commander')
const glob = promisify(require('glob'))

const npm = require('./npm')
const spawn = require('./spawn')

const { scripts } = require('./package.json')

const { logger } = require('../build/utils/logger')

async function copyFile(src, dest, flags) {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true })
  await fs.promises.copyFile(src, dest, flags)
}

const pkg = require('../package.json')
program.version(pkg.version)

program.command('init').action(async () => {
  const projectRoot =
    process.env.INIT_CWD || process.env.PWD || path.resolve('.')
  const templateRoot = path.join(__dirname, 'templates')

  logger.info('initializing')
  await spawn('npm', ['init', '-y'], {
    cwd: projectRoot,
    stdio: 'inherit'
  })

  logger.info('installing composer')
  await spawn('npm', ['install', '--save-dev', `${pkg.name}@${pkg.version}`], {
    cwd: projectRoot,
    stdio: 'inherit'
  })

  logger.info('copying config files')
  try {
    await Promise.all(
      (
        await glob('**/*', {
          cwd: templateRoot,
          dot: true,
          nodir: true
        })
      ).map(async fileName => {
        try {
          const srcFile = path.join(templateRoot, fileName)
          const destFile = path.join(projectRoot, fileName.replace(/^-/, ''))

          await fs.promises.mkdir(path.dirname(destFile), {
            recursive: true
          })

          return copyFile(srcFile, destFile, fs.COPYFILE_EXCL)
        } catch (_) {}
      })
    )
  } catch (e) {
    console.error(e)
  }
})

Object.keys(scripts)
  .filter(
    script =>
      !(
        script.startsWith('pre') &&
        Object.prototype.hasOwnProperty.call(
          scripts,
          script.replace(/^pre/, '')
        )
      )
  )
  .map(cmd => {
    program.command(cmd).action(npm(cmd))
  })

program.parse(process.argv)
