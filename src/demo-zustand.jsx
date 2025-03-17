import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

const statusStore = createStore((set) => ({
  status: 'idle',
  setStatus: (status) => set({ status }),
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

const useStatus = () => {
  console.log('@@@@@@ useStatus')
  const { status, setStatus, count, increment } = statusStore.getState()
  return { status, setStatus, count, increment }
}

export const Child = () => {
  console.log('@@@re-render Child')
  const { count, status} = useStatus()

  return (
    <div>
      <h1>Status: {status}</h1>
      <h2>Count: {count}</h2>
    </div>
  )
}

export const Child2 = () => {
  const { count, status} = useStore(statusStore)

  return (
    <div>
      <h1>Status: {status}</h1>
      <h2>Count: {count}</h2>
    </div>
  )
}

const App = () => {
  const { count, increment, status, setStatus} = useStore(statusStore)

  const handleClick = () => {
    increment()
    const { count} = statusStore.getState()
    console.log('@@@increment count', count)
  }

  return (
    <div>
      <h1>Status: {status}</h1>
      <button onClick={() => setStatus('running')}>Set Status to Running</button>
      <h2>Count: {count}</h2>
      <button onClick={handleClick}>Increment Count</button>

      <div>
        <h2>Child Component</h2>
        <Child />
        <h2>Child2 Component</h2>
        <Child2 />
      </div>
    </div>
  )
}

export default App
