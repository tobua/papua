import { CSSProperties } from 'react'
import { createRoot } from 'react-dom/client'
import { Todo } from 'markup/Todo'
import { register } from 'background/registration'

const styles: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  fontFamily: 'sans-serif',
  gap: 40,
}

const contentStyles: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: 600,
  maxWidth: '100%',
}

const textStyles: CSSProperties = {
  textAlign: 'center',
}

const linkStyles: CSSProperties = {
  color: 'black',
  fontWeight: 'bold',
  textDecoration: 'none',
}

const headingStyles: CSSProperties = {
  margin: 0,
}

createRoot(document.body).render(
  <div style={styles}>
    <header style={styles}>
      <img alt="logo" src="logo512.png" width="100" />
      <h1 style={headingStyles}>Progressive Web App</h1>
    </header>
    <main style={contentStyles}>
      <Todo />
    </main>
    <footer style={textStyles}>
      Built with the{' '}
      <a style={linkStyles} href="https://github.com/tobua/papua/tree/main/template/pwa">
        papua PWA template
      </a>
      .
    </footer>
  </div>
)

register({})
