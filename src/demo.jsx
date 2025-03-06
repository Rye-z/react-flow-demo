import {memo, useCallback, useEffect, useRef, useState} from 'react'
import {useToggle} from 'ahooks'
import PropTypes from 'prop-types'

const Child = ({ isDark, show }) => {
  const isHappy = useRef(false)

  useEffect(() => {
    console.log('isDark changed', isDark.current)
    console.log('isHappy changed', String(isHappy.current))
  }, [isDark, show])

  return (
    <>
      <div>
        <button onClick={() => {
          isHappy.current = !isHappy.current
        }}>click3</button>
      </div>
      <div>{ isDark.current ? 'dark' : 'light'}</div>
      <div>{ show ? 'show' : 'hidden '}</div>
      <div>{ isHappy ? 'happy' : 'sad'}</div>
    </>
  )
}

Child.propTypes = {
  isDark: PropTypes.object.isRequired,
  show: PropTypes.bool.isRequired,
}

function DemoUseRefEffectState() {
  const isDark = useRef(false)
  const [show, { toggle }] = useToggle(false)
    return (
      <>
        <div>
          <button onClick={() => isDark.current = !isDark.current}>click1</button>
          <button onClick={toggle}>click2</button>
        </div>
        <Child isDark={isDark} show={show}></Child>
      </>
   )
}

const DemoUseCallbackChildNoMemo = ({click, count}) => {
  console.log('no memo render')

  const handleClick = useCallback(() => {
    console.log('no memo click render:', count)
    click('noMeno')
  }, [count])

  return (
    <div>
      <button onClick={handleClick}>click</button>
    </div>
  )
}
const DemoUseCallbackChildMemo = memo(({click, count}) => {
  console.log('memo render')

  const handleClick = useCallback(() => {
    console.log('memo click render:', count)
    click('memo')
  }, [])

  return (
    <div>
      <button onClick={handleClick}>click</button>
    </div>
  )
})
DemoUseCallbackChildMemo.displayName = 'DemoUseCallbackChildMemo'

function DemoUseCallback() {
  const [count, setCount] = useState(0)

  const onClick = useCallback((message) => {
    console.log(count + message)
  }, [])

  return (
    <>
      <button onClick={() => setCount(count + 1)}>add</button>
      <DemoUseCallbackChildMemo count={count} click={onClick}></DemoUseCallbackChildMemo>
      <DemoUseCallbackChildNoMemo count={count} click={onClick}></DemoUseCallbackChildNoMemo>
    </>
  )
}

export function App() {

  return (
    <div>
      {/*<DemoUseRefEffectState></DemoUseRefEffectState>*/}
      <DemoUseCallback></DemoUseCallback>
    </div>
  )
}

export default App
