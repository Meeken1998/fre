<p align="center"><img src="http://wx2.sinaimg.cn/mw690/0060lm7Tly1ftpm5b3ihfj3096097aaj.jpg" alt="fre logo" width="150"></p>
<h1 align="center">Fre</h1>
<p align="center">:ghost: Tiny Coroutine framework with Fiber.</p>
<p align="center">
<a href="https://github.com/yisar/fre/actions"><img src="https://img.shields.io/github/workflow/status/yisar/fre/main.svg" alt="Build Status"></a>
<a href="https://codecov.io/gh/yisar/fre"><img src="https://img.shields.io/codecov/c/github/yisar/fre.svg" alt="Code Coverage"></a>
<a href="https://npmjs.com/package/fre"><img src="https://img.shields.io/npm/v/fre.svg" alt="npm-v"></a>
<a href="https://npmjs.com/package/fre"><img src="https://img.shields.io/npm/dt/fre.svg" alt="npm-d"></a>
<a href="https://bundlephobia.com/result?p=fre"><img src="http://img.badgesize.io/https://unpkg.com/fre/dist/fre.js?compression=brotli&label=brotli" alt="brotli"></a>
</p>


- **Coroutine with Fiber** — This is a amazing idea, which implements the coroutine scheduler in JavaScript, and the rendering is asynchronous, which supports Time slicing and Suspense.

- **Highly-optimized algorithm** — Like other frameworks, Fre has a perfect reconciliation algorithm, which traverses both ends at the same time with O (n) complexity, support keyed.

- **Do more with less** — After tree shaking, project of hello world is only 1KB, but it has all fetures, virtual DOM, hooks API, functional component and more.

### Use

```shell
yarn add fre
```

```js
import { h, render, useState } from 'fre'

function App() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  )
}

render(<App />, document.getElementById('root'))
```

### Hooks API

- [useState](https://github.com/yisar/fre#usestate)

- [useEffect](https://github.com/yisar/fre#useeffect)

- [useReducer](https://github.com/yisar/fre#usereducer)

- [useLayout](https://github.com/yisar/fre#uselayout)

- [useCallback](https://github.com/yisar/fre#usecallback)

- [useMemo](https://github.com/yisar/fre#usememo)

- [useRef](https://github.com/yisar/fre#useref)

#### useState

`useState` is a base API, It will receive initial state and return a Array

You can use it many times, new state is available when component is rerender

```js
function App() {
  const [up, setUp] = useState(0)
  const [down, setDown] = useState(0)
  return (
    <div>
      <h1>{up}</h1>
      <button onClick={() => setUp(up + 1)}>+</button>
      <h1>{down}</h1>
      <button onClick={() => setDown(down - 1)}>-</button>
    </div>
  )
}
```

#### useReducer

`useReducer` and `useState` are almost the same，but `useReducer` needs a global reducer

```js
function reducer(state, action) {
  switch (action.type) {
    case 'up':
      return { count: state.count + 1 }
    case 'down':
      return { count: state.count - 1 }
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, { count: 1 })
  return (
    <div>
      {state.count}
      <button onClick={() => dispatch({ type: 'up' })}>+</button>
      <button onClick={() => dispatch({ type: 'down' })}>+</button>
    </div>
  )
}
```

#### useEffect

It is the execution and cleanup of effects, which is represented by the second parameter

```
useEffect(f)       //  effect (and clean-up) every time
useEffect(f, [])   //  effect (and clean-up) only once in a component's life
useEffect(f, [x])  //  effect (and clean-up) when property x changes in a component's life
```

```js
function App({ flag }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    document.title = 'count is ' + count
  }, [flag])
  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  )
}
```

If it return a function, the function can do cleanups:

```js
useEffect(() => {
    document.title = 'count is ' + count
    reutn () => {
      store.unsubscribe()
    }
}, [])
```

#### useLayout

More like useEffect, but useLayout is sync and blocking UI.

```js
useLayout(() => {
  document.title = 'count is ' + count
}, [flag])
```

#### useMemo

`useMemo` has the same rules as `useEffect`, but `useMemo` will return a cached value.

```js
function App() {
  const [count, setCount] = useState(0)
  const val = useMemo(() => {
    return new Date()
  }, [count])
  return (
    <div>
      <h1>
        {count} - {val}
      </h1>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  )
}
```

#### useCallback

`useCallback` is based `useMemo`, it will return a cached function.

```js
const cb = useCallback(() => {
  console.log('cb was cached')
}, [])
```

#### useRef

`useRef` will return a function or an object.

```js
function App() {
  useEffect(() => {
    console.log(t) // { current:<div>t</div> }
  })
  const t = useRef(null)
  return <div ref={t}>t</div>
}
```

If it use a function, It can return a cleanup and executes when removed.

```js
function App() {
  const t = useRef(dom => {
    if (dom) {
      doSomething()
    } else {
      cleanUp()
    }
  })
  return flag && <span ref={t}>I will removed</span>
}
```

### Fragments

Fragments will not create dom element.

```jsx
<>someThing</>
```

The above code needs babel plugin `@babel/plugin-transform-react-jsx`

```json
[
  "@babel/plugin-transform-react-jsx",
  {
    "pragma": "h",
    "pragmaFrag": "Fragment"
  }
]
```

#### License
_MIT @yisar
