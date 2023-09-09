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
  offline = !window.navigator.onLine // true when PWA running on cached assets.
  error: boolean | string = false // true when PWA registration errored.
  ready: boolean | 'local' = false // true when Service Worker is ready.

  constructor() {
    makeAutoObservable(this)
    this.load()

    window.addEventListener('online', () =>
      runInAction(() => {
        this.offline = false
      })
    )
    window.addEventListener('offline', () =>
      runInAction(() => {
        this.offline = true
      })
    )
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

  setOffline() {
    this.offline = true
  }

  setError(error: boolean | string = true) {
    this.error = error
  }

  setReady(value: boolean | 'local' = true) {
    this.ready = value
  }
}

export const Todo = new TodosStore()
