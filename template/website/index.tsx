import { createRoot } from 'react-dom/client'
import { makeAutoObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import { styled } from '@stitches/react'

const State = new (class StateModel {
  count = 0

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  increment() {
    this.count += 1
  }
})()

const Counter = observer(() => (
  <>
    <p>Current count: {State.count}</p>
    <button type="button" onClick={State.increment}>
      Increment
    </button>
  </>
))

const Main = styled('main', {
  fontFamily: 'Arial, sans-serif',
})

const Heading = styled('h1', {
  textDecoration: 'underline',
})

const additionalHeadingStyles = {
  color: '#abdee6',
}

createRoot(document.body).render(
  <Main>
    <Heading css={additionalHeadingStyles}>React App</Heading>
    <Counter />
  </Main>
)
