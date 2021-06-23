import { observer } from 'mobx-react-lite'
import { Todo as Data } from 'data/todo'
import { Input } from './Input'
import { Item } from './Item'

export const Todo = observer(() => (
  <>
    <Input />
    {Data.data.map((todo, index) => (
      <Item key={index} todo={todo} />
    ))}
  </>
))
