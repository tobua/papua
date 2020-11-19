import React from 'react'
import { render } from 'react-dom'
import * as serviceWorkerRegistration from './register'

render(
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'sans-serif',
    }}
  >
    <h1>Progressive Web App</h1>
    <img alt="logo" src="logo512.png" />
  </div>,
  document.body
)

serviceWorkerRegistration.register({})
