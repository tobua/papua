import { makeAutoObservable, runInAction, observable } from 'mobx'
import { initialize, list, insert, remove } from 'interface/todo'

export class TodoStore {
  id: number
  title: string

  constructor({ id, title }) {
    makeAutoObservable(this)

    this.id = id
    this.title = title
  }
}

const TodosStore = class {
  data = observable<TodoStore>([])
  input = ''
  loading = true
  updateAvailable = false // If true PWA assets will be updated upon reload.

  constructor() {
    makeAutoObservable(this)
    this.load()
  }

  load = async () => {
    await initialize()
    const todos = await list()

    runInAction(() => {
      this.data.replace(todos.map((data) => new TodoStore(data)))
      this.loading = false
    })
  }

  setInput = (input: string) => {
    this.input = input
  }

  add = async () => {
    const newTodo = new TodoStore({
      id: await insert(this.input),
      title: this.input,
    })
    runInAction(() => {
      this.data.push(newTodo)
      this.input = ''
    })
    return newTodo
  }

  remove = async (todo: TodoStore) => {
    await remove(todo.id)

    runInAction(() => {
      this.data.remove(todo)
    })
  }

  setUpdateAvailable() {
    this.updateAvailable = true
  }
}

export const Todo = new TodosStore()
