import { useState } from 'react'
import * as React from 'react'
import { Todo, TodoStore } from 'data/todo'

const styles = (active: boolean) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 10,
  outline: 'none',
  ...(active && {
    fontWeight: 'bold',
  }),
})

const buttonStyles = (active: boolean) => ({
  appearance: 'none',
  background: 'black',
  color: 'white',
  border: 'none',
  borderRadius: 50,
  opacity: 0.2,
  cursor: 'pointer',
  outline: 'none',
  ...(active && {
    opacity: 1,
  }),
})

interface Props {
  todo: TodoStore
}

export const Item = ({ todo }: Props & React.ReactElement) => {
  const [active, setActive] = useState(false)
  return (
    <div
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      role="button"
      style={styles(active)}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      onKeyPress={(event) => {
        if (event.key === 'Enter') {
          Todo.remove(todo)
        }
      }}
    >
      <span>{todo.title}</span>
      <button
        type="button"
        tabIndex={-1}
        onClick={() => Todo.remove(todo)}
        style={buttonStyles(active)}
      >
        Remove
      </button>
    </div>
  )
}
