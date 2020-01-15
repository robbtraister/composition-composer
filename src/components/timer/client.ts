'use strict'

/* global performance */

import { withTicTimer } from './common'

const timer = typeof performance === 'undefined' ? Date : performance

const tic = () => {
  const t0 = timer.now()
  return () => timer.now() - t0
}

export const withTimer = withTicTimer(tic)

export default withTimer
