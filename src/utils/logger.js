'use strict'

const winston = require('winston')

const { logLevel } = require('../../env')

const LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly']

const logger = winston.createLogger({
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

module.exports = logger
