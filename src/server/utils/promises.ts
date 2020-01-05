'use strict'

import { promises as fsPromises } from 'fs'
import path from 'path'

export const fileExists = async filePath => {
  try {
    await fsPromises.access(filePath)
    return true
  } catch (_) {}
  return false
}

export const readFile = fsPromises.readFile.bind(fsPromises)

export const writeFile = async (filePath, content) => {
  await fsPromises.mkdir(path.dirname(filePath), { recursive: true })
  return fsPromises.writeFile(filePath, content)
}
