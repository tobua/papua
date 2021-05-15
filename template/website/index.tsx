import React from 'react'
import { render } from 'react-dom'
import { makeAutoObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import styled from '@emotion/styled'
import { css, SerializedStyles } from '@emotion/react'

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

const Main = styled.main`
  font-family: Arial, sans-serif;
`

const Heading = styled.h1<{ cssStyles?: SerializedStyles }>`
  text-decoration: underline;
  ${({ cssStyles }) => cssStyles}
`

const additionalHeadingStyles = css`
  color: #abdee6;
`

render(
  <>
    <Main>
      <Heading cssStyles={additionalHeadingStyles}>React App</Heading>
      <Counter />
    </Main>
  </>,
  document.body
)
