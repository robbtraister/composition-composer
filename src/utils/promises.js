'use strict'

const { promises: fsPromises } = require('fs')
const path = require('path')

const fileExists = async filePath => {
  try {
    await fsPromises.access(filePath)
    return true
  } catch (_) {}
  return false
}

const readFile = fsPromises.readFile.bind(fsPromises)

const writeFile = async (filePath, content) => {
  await fsPromises.mkdir(path.dirname(filePath), { recursive: true })
  return fsPromises.writeFile(filePath, content)
}

module.exports = {
  fileExists,
  readFile,
  writeFile
}
