'use strict'

const path = require('path')

const { fileExists, readFile, writeFile } = require('./promises')

const { projectRoot } = require('../../env')

function getAssetFile(name) {
  return getResourceFile(path.join('build', 'dist', name))
}

function getResourceFile(name) {
  return path.resolve(projectRoot, name)
}

async function readAssetFile(name) {
  return readResourceFile(getAssetFile(name))
}

async function readResourceFile(name) {
  return (await readFile(getResourceFile(name))).toString()
}

async function writeAssetFile(name, content) {
  return writeResourceFile(getAssetFile(name), content)
}

async function writeResourceFile(name, content) {
  return writeFile(getResourceFile(name), content)
}

const readAsset = readAssetFile
const writeAsset = writeAssetFile

async function writeCompilation(
  { name, output },
  { css, js, jsMap, styleHash }
) {
  return Promise.all([
    writeAsset(path.join(name, `${output}.js`), js),
    jsMap && writeAsset(path.join(name, `/${output}.js.map`), jsMap),
    writeAsset(
      path.join(name, `${output}.css.json`),
      JSON.stringify({ styleHash })
    ),
    styleHash &&
      css &&
      writeAsset(path.join('styles', 'templates', `${styleHash}.css`), css)
  ])
}

async function getHash({ template, output }) {
  if (
    !(await fileExists(
      getAssetFile(path.join('templates', template, `${output}.css.json`))
    ))
  ) {
    await compile({ template, output })
  }

  const { styleHash } = JSON.parse(
    await readAssetFile(path.join('templates', template, `${output}.css.json`))
  )

  return styleHash
}

async function getTree(template) {
  return JSON.parse(
    await readResourceFile(path.join('templates', `${template}.json`))
  )
}

module.exports = {
  getHash,
  getTree,
  readAsset,
  readResourceFile,
  writeAsset,
  writeResourceFile,
  writeCompilation
}

// this is a circular dependency; require it here to ensure everything is hydrated properly
const compile = require('./compile')
