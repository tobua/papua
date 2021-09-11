import { CSSProperties } from 'react'
import { render } from 'react-dom'
import { Todo } from 'markup/Todo'
import { register } from 'background/registration'

const styles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  fontFamily: 'sans-serif',
}

const contentStyles = { width: 600, maxWidth: '100%' }

render(
  <div style={styles}>
    <header style={styles}>
      <img alt="logo" src="logo512.png" width="100" />
      <h1>Progressive Web App</h1>
    </header>
    <main style={contentStyles}>
      <Todo />
    </main>
  </div>,
  document.body
)

register({})
