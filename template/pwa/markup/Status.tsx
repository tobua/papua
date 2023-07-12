import { observer } from 'mobx-react-lite'
import { Todo } from 'data/todo'
import { CSSProperties } from 'react'

const wrapperStyles: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const badgeStyles = (error = false): CSSProperties => ({
  background: error ? 'orange' : 'green',
  color: 'white',
  borderRadius: 10,
  padding: '5px 10px',
  whiteSpace: 'nowrap',
})

export const Status = observer(() => (
  <div style={wrapperStyles}>
    <span style={badgeStyles(Todo.offline)}>{Todo.offline ? 'offline' : 'online'}</span>
    <span style={badgeStyles(!Todo.ready)}>{!Todo.ready ? 'installing' : 'ready'}</span>
    <span style={badgeStyles(Todo.updateAvailable)}>
      {Todo.updateAvailable ? 'update available' : 'up-to-date'}
    </span>
    <span style={badgeStyles(!!Todo.error)}>{Todo.error ? 'error' : 'running'}</span>
  </div>
))
