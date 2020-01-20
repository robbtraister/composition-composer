declare namespace JSX {
  interface IntrinsicElements {
    'composition:styled-components': any
  }
}

declare namespace NodeJS {
  interface Process {
    browser?: boolean
  }
}
