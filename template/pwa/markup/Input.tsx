import { CSSProperties, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Todo } from 'data/todo'

const styles: CSSProperties = { position: 'relative', width: '100%', marginBottom: 20 }

const inputStyles = (active: boolean): CSSProperties => ({
  width: '100%',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'black',
  borderRadius: 10,
  outline: 'none',
  padding: 10,
  boxSizing: 'border-box',
  fontSize: 16,
  ...(active && {
    boxShadow: 'inset 0px 0px 0px 1px black',
  }),
})

const buttonStyles = (active: boolean): CSSProperties => ({
  position: 'absolute',
  right: 10,
  top: 10,
  bottom: 10,
  appearance: 'none',
  background: 'none',
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  fontSize: 16,
  ...(active && {
    fontWeight: 'bold',
  }),
})

export const Input = observer(() => {
  const [active, setActive] = useState(false)

  return (
    <div style={styles} onFocus={() => setActive(true)} onBlur={() => setActive(false)}>
      <input
        value={Todo.input}
        onChange={(event) => Todo.setInput(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && Todo.input && Todo.add()}
        placeholder="Please enter..."
        style={inputStyles(active)}
      />
      <button
        type="submit"
        disabled={Todo.input === ''}
        onClick={() => Todo.add()}
        style={buttonStyles(active)}
      >
        ⏎ &nbsp;Add
      </button>
    </div>
  )
})
