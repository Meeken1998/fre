import { IFiber, FreElement, ITaskCallback, FC, Attributes, HTMLElementEx, FreNode, FiberMap, IRef, IEffect } from './type'
import { createElement, updateElement } from './dom'
import { resetCursor } from './hooks'
import { scheduleWork, shouldYield, schedule } from './scheduler'
import { isArr, createText } from './h'

let preCommit: IFiber | undefined
let currentFiber: IFiber
let WIP: IFiber | undefined
let commits: IFiber[] = []
const microTask: IFiber[] = []
export const enum OP {
  UPDATE = 1 << 1,
  INSERT = 1 << 2,
  REMOVE = 1 << 3,
  MOUNT = UPDATE | INSERT,
}
export const render = (vnode: FreElement, node: Node, done?: () => void): void => {
  const rootFiber = {
    node,
    props: { children: vnode },
    done,
  } as IFiber
  dispatchUpdate(rootFiber)
}

export const dispatchUpdate = (fiber?: IFiber) => {
  if (fiber && !fiber.lane) {
    fiber.lane = true
    microTask.push(fiber)
  }
  scheduleWork(reconcileWork as ITaskCallback)
}

const reconcileWork = (timeout: boolean): boolean => {
  if (!WIP) WIP = microTask.shift()
  while (WIP && (!shouldYield() || timeout)) WIP = reconcile(WIP)
  if (WIP && !timeout) return reconcileWork.bind(null)
  if (preCommit) commitWork(preCommit)
  return null
}

const reconcile = (WIP: IFiber): IFiber | undefined => {
  WIP.parentNode = getParentNode(WIP) as HTMLElementEx
  isFn(WIP.type) ? updateHook(WIP) : updateHost(WIP)
  WIP.lane = WIP.lane ? false : 0
  WIP.parent && commits.push(WIP)

  if (WIP.child) return WIP.child
  while (WIP) {
    if (!preCommit && WIP.lane === false) {
      preCommit = WIP
      return null
    }
    if (WIP.sibling) return WIP.sibling
    WIP = WIP.parent
  }
}

const updateHook = <P = Attributes>(WIP: IFiber): void => {
  if (WIP.lastProps === WIP.props) return
  currentFiber = WIP
  resetCursor()
  let children = (WIP.type as FC<P>)(WIP.props)
  if (isStr(children)) children = createText(children as string)
  reconcileChildren(WIP, children)
}

const updateHost = (WIP: IFiber): void => {
  if (!WIP.node) {
    WIP.node = createElement(WIP) as HTMLElementEx
  }
  reconcileChildren(WIP, WIP.props.children)
}

const getParentNode = (WIP: IFiber): HTMLElement | undefined => {
  while ((WIP = WIP.parent)) {
    if (!isFn(WIP.type)) return WIP.node
  }
}


const reconcileChildren = (WIP: any, children: FreNode): void => {
  let oldKids = WIP.kids || [],
    newKids = (WIP.kids = hashfy(children) as any),
    oldHead = 0,
    newHead = 0,
    oldTail = oldKids.length - 1,
    newTail = newKids.length - 1

  while (oldHead <= oldTail && newHead <= newTail) {
    let newFiber = null
    if (oldKids[oldHead] == null) {
      oldHead++
    } else if (oldKids[oldTail] == null) {
      oldTail--
    } else if (oldKids[oldHead].key === newKids[newHead].key) {
      newFiber = newKids[newHead]
      newFiber.tag = OP.UPDATE
      newFiber.lastProps = oldKids[oldHead].props
      newFiber.kids = oldKids[oldHead].kids
      newFiber.node = oldKids[oldHead].node
      oldHead++
      newHead++
    } else if (oldKids[oldTail].key === newKids[newTail].key) {
      newFiber = newKids[newTail]
      newFiber.tag = OP.UPDATE
      newFiber.kids = oldKids[oldTail].kids
      newFiber.node = oldKids[oldTail].node
      newFiber.lastProps = oldKids[oldTail].props
      oldTail--
      newTail--
    } else if (oldKids[oldHead].key === newKids[newTail].key) {
      newFiber = newKids[newTail]
      newFiber.tag = OP.MOUNT
      newFiber.lastProps = oldKids[oldHead].props
      newFiber.node = oldKids[oldHead].node
      newFiber.kids = oldKids[oldHead].kids
      newFiber.insertPoint = oldKids[oldTail].node.nextSibling
      oldHead++
      newTail--
    } else if (oldKids[oldTail].key === newKids[newHead].key) {
      newFiber = newKids[newTail]
      newFiber.tag = OP.MOUNT
      newFiber.lastProps = oldKids[oldTail].props
      newFiber.node = oldKids[oldTail].node
      newFiber.kids = oldKids[oldTail].kids
      newFiber.insertPont = oldKids[oldHead].node
      oldTail--
      newHead++
    } else {
      const i = oldKids.findIndex((kid) => kid.key === newKids[newHead].key)
      if (i >= 0) {
        const oldKid = oldKids[i]
        newFiber = newKids[newHead]
        newFiber.tag = OP.MOUNT
        newFiber.lastProps = oldKid.props
        newFiber.node = oldKid.node
        newFiber.kids = oldKid.kids
        newFiber.insertPont = oldKids[oldHead].node
        oldKids[i] = null
      } else {
        newFiber = newKids[newHead]
        newFiber.tag = OP.INSERT
        newFiber.node = null
        newFiber.insertPont = oldKids[oldHead].node
      }
      newHead++
    }
  }
  if (oldHead > oldTail) {
    for (let i = newHead; i <= newTail; i++) {
      let newFiber = newKids[i]
      newFiber.tag = OP.INSERT
      newFiber.node = null
      newFiber.insertPont = oldKids[oldHead]?.node
      console.log(newFiber)
    }
  } else if (newHead > newTail) {
    for (let i = oldHead; i <= oldTail; i++) {
      let oldFiber = oldKids[i]
      oldFiber.tag = OP.REMOVE
      commits.push(oldFiber)
    }
  }

  for (var i = 0, prev = null; i < newKids.length; i++) {
    const child = newKids[i]
    child.parent = WIP
    if (i > 0) {
      prev.sibling = child
    } else {
      WIP.child = child
    }
    prev = child
  }
}

const commitWork = (fiber: IFiber): void => {
  commits.forEach(commit)
  fiber.done?.()
  commits = []
  preCommit = null
  WIP = null
}

const commit = (fiber: IFiber): void => {
  const { tag, parentNode, node, ref, hooks } = fiber
  if (isFn(fiber.type)) {
    if (hooks) {
      side(hooks.layout)
      schedule(() => side(hooks.effect))
    }
    return
  }
  if (tag & OP.UPDATE) {
    updateElement(node, fiber.lastProps, fiber.props)
  }
  if (tag & OP.REMOVE) {
    parentNode.removeChild(fiber.node)
  }
  if (tag & OP.INSERT) {
    const after = fiber.insertPoint as any
    if (after === node) return
    if (after === null && node === parentNode.lastChild) return
    parentNode.insertBefore(node, after)
  }
  refer(ref, node)
}

const hashfy = (arr) => {
  if (!arr) return []
  if (isArr(arr)) {
    return arr.map((a, i) => {
      a.key = '.' + a.key || '.' + i
      return a
    })
  } else {
    arr.key = arr.key || '.0'
    return [arr]
  }
}

const refer = (ref: IRef, dom?: HTMLElement): void => {
  if (ref) isFn(ref) ? ref(dom) : ((ref as { current?: HTMLElement })!.current = dom)
}

const cleanupRef = <P = Attributes>(kids: FiberMap<P>): void => {
  for (const k in kids) {
    const kid = kids[k]
    refer(kid.ref, null)
    if (kid.kids) cleanupRef(kid.kids)
  }
}

const side = (effects: IEffect[]): void => {
  effects.forEach(cleanup)
  effects.forEach(effect)
  effects.length = 0
}

export const getCurrentFiber = () => currentFiber || null

const effect = (e: IEffect): void => (e[2] = e[0](currentFiber))
const cleanup = (e: IEffect): void => e[2]?.(currentFiber)

export const isFn = (x: any): x is Function => typeof x === 'function'
export const isStr = (s: any): s is number | string => typeof s === 'number' || typeof s === 'string'
export const some = (v: any) => v != null && v !== false && v !== true
