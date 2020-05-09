'use strict'

import PropTypes from 'prop-types'

const oneOf = PropTypes.oneOf

interface OneOfRequireable<T> extends PropTypes.Requireable<T> {
  type?: T[]
}
interface OneOfValidator<T> extends PropTypes.Validator<NonNullable<T>> {
  type?: T[]
}

PropTypes.oneOf = <T>(items: T[]) => {
  const result = oneOf(items)

  ;(result as OneOfRequireable<T>).type = items
  ;(result.isRequired as OneOfValidator<T>).type = items

  return result
}

export default PropTypes
