import { CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'
import { Todo } from 'data/todo'

const styles: CSSProperties = {
  position: 'fixed',
  left: '50%',
  transform: 'translateX(-50%)',
  bottom: 20,
  borderRadius: 10,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
  padding: 10,
  background: 'black',
  color: 'white',
}

const textStyles: CSSProperties = {
  margin: 0,
}

const buttonStyles: CSSProperties = {
  appearance: 'none',
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  background: 'white',
  color: 'black',
  borderRadius: 5,
  padding: 5,
}

export const Update = observer(() => {
  if (!Todo.updateAvailable) {
    return null
  }

  return (
    <div style={styles}>
      <p style={textStyles}>An update is available.</p>
      <button style={buttonStyles} type="button" onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  )
})
