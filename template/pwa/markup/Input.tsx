import React, { useState } from 'react'
import { observer } from 'mobx-react'
import { Todo } from 'data/todo'

const styles = { position: 'relative', width: '100%', marginBottom: 20 }

const inputStyles = (active: boolean) => ({
  width: '100%',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'black',
  borderRadius: 10,
  outline: 'none',
  padding: 10,
  ...(active && {
    borderWidth: 2,
    marginTop: -1,
    marginBottom: -1,
  }),
})

const buttonStyles = (active: boolean) => ({
  position: 'absolute',
  right: 10,
  top: 10,
  bottom: 10,
  appearance: 'none',
  background: 'none',
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  ...(active && {
    fontWeight: 'bold',
  }),
})

export const Input = observer(() => {
  const [active, setActive] = useState(false)

  return (
    <div
      style={styles}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <input
        value={Todo.input}
        onChange={(event) => Todo.setInput(event.target.value)}
        onKeyPress={(event) => {
          if (event.key === 'Enter' && Todo.input) {
            Todo.add()
          }
        }}
        placeholder="Please enter..."
        style={inputStyles(active)}
      />
      <button
        type="submit"
        disabled={Todo.input === ''}
        onClick={() => Todo.add()}
        style={buttonStyles(active)}
      >
        ⏎ Add
      </button>
    </div>
  )
})
