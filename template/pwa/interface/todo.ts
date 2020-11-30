const defaultTodos = [
  { title: 'Manifest' },
  { title: 'Service Worker' },
  { title: 'IndexedDB' },
  { title: 'CacheStorage API' },
]

let DB: IDBDatabase
const TodoStore = () =>
  DB.transaction('todos', 'readwrite').objectStore('todos')

export const initialize = () =>
  new Promise<void>((done, fail) => {
    const DBRequest = window.indexedDB.open('todo', 9)

    DBRequest.onerror = () => fail()

    DBRequest.onsuccess = () => {
      if (!DB) {
        DB = DBRequest.result
      }

      done()
    }

    DBRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      if (!DB || DB.version !== event.newVersion) {
        DB = DBRequest.result
      }

      if (event.oldVersion === 0) {
        // Client has no database, create new database.
        DB.createObjectStore('todos', {
          keyPath: 'id',
          autoIncrement: true,
        }).transaction.oncomplete = () => {
          defaultTodos.forEach((todo) => TodoStore().add(todo))
        }
      }
    }
  })

export const list = () =>
  new Promise<any[]>((done, fail) => {
    const Store = TodoStore()
    const request = Store.getAll()
    request.onsuccess = (event: any) => {
      done(event.target.result)
    }

    request.onerror = () => fail()
  })

export const insert = (title: string) =>
  new Promise<number>((done, fail) => {
    const Store = TodoStore()
    const request = Store.add({ title })
    request.onerror = () => fail()
    request.onsuccess = ({ target }: { target: IDBRequest } & Event) => {
      done(target.result)
    }
  })

export const remove = (id: number) =>
  new Promise<void>((done, fail) => {
    const Store = TodoStore()
    const request = Store.delete(id)
    request.onerror = () => fail()
    request.onsuccess = () => {
      done()
    }
  })
