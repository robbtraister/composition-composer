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

async function readAssetFile(name, encoding) {
  return readResourceFile(getAssetFile(name), encoding)
}

async function readResourceFile(name, encoding = 'utf8') {
  const buffer = await readFile(getResourceFile(name))

  return /^buffer$/i.test(encoding) ? buffer : buffer.toString(encoding)
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
    // this is a circular dependency; require it here to ensure everything is hydrated properly
    await require('./compile')({ template, output })
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
