'use strict'

import winston from 'winston'

import { logLevel } from '../../env'

const LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly']

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: logLevel,
      format: winston.format.combine(
        {
          transform: info => {
            info.level = info.level.toUpperCase()
            return info
          }
        },
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.colorize({ all: true }),
        winston.format.printf(info => {
          return `[${info.timestamp}] ${info.level}: ${info.message}`
        })
      ),
      stderrLevels: LEVELS
    })
  ]
})

export default logger
