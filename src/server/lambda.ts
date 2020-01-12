'use strict'

import serverless from 'serverless-http'

// eslint-disable-next-line no-eval
const { app } = eval(`require('.')`)

export const handler = serverless(app())
