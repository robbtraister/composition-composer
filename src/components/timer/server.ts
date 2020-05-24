'use strict'

import { withTicTimer } from './common'

const tic = () => {
  const t0 = process.hrtime()
  return () => {
    const [s, n] = process.hrtime(t0)
    return s * 1e3 + n * 1e-6
  }
}

const recordMetrics = ({ format, type, id, ms }) => {}

export const withTimer = withTicTimer(tic, recordMetrics)

export default withTimer
