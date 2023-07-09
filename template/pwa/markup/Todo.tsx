import { observer } from 'mobx-react-lite'
import { Todo as Data } from 'data/todo'
import { Input } from './Input'
import { Item } from './Item'
import { Update } from './Update'

export const Todo = observer(() => (
  <>
    <Input />
    {Data.data.map((todo, index) => (
      <Item key={index} todo={todo} />
    ))}
    <Update />
  </>
))
