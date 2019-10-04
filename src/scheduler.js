import { push, pop, peek } from './min-heap'

let taskQueue = []
let taskId = 1
let currentTask = null
let currentCallback = null
let inMC = false
let frameLength = 5
let frameDeadline = 0

export function scheduleCallback (callback) {
  const currentTime = getTime()
  let startTime = currentTime
  let timeout = 5000 // idle
  let dueTime = startTime + timeout

  let newTask = {
    id: taskId++,
    callback,
    startTime,
    dueTime
  }

  push(taskQueue, newTask)

  requestHostCallback(flushWork)

  return newTask
}
function requestHostCallback (cb) {
  currentCallback = cb
  if (!inMC) {
    inMC = true
    port.postMessage(null)
  }
}
function flushWork (iniTime) {
  try {
    return workLoop(iniTime)
  } finally {
    currentTask = null
  }
}

function workLoop (iniTime) {
  let currentTime = iniTime
  currentTask = peek(taskQueue)

  while (currentTask) {
    if (currentTask.dueTime > currentTime && hasTime()) break
    let callback = currentTask.callback
    if (callback) {
      currentTask.callback = null
      let didout = currentTask.dueTime < currentTime
      let nextWork = callback(didout)
      if (nextWork) {
        currentTask.callback = nextWork
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue)
        }
      }
    } else pop(taskQueue)
    currentTask = peek(taskQueue)
  }
  if (currentTask) {
    console.log(222)
    return true
  } else {
    console.log(333)
    return false
  }
}

function portMessage () {
  if (currentCallback) {
    let currentTime = getTime()
    frameDeadline = currentTime + frameLength
    let moreWork = currentCallback(currentTime)
    if (!moreWork) {
      inMC = false
      currentCallback = null
    } else {
      port.postMessage(null)
    }
  } else inMC = false
}

export function shouldYeild(){
    var currentTime = getTime()
    var firstTask = peek(taskQueue)
    return (
      (firstTask !== currentTask &&
        currentTask !== null &&
        firstTask !== null &&
        firstTask.callback !== null &&
        firstTask.startTime <= currentTime) ||
      hasTime()
    )
}

const getTime = () => performance.now()
const hasTime = () => getTime() > frameDeadline

const channel = new MessageChannel()
const port = channel.port2
channel.port1.onmessage = portMessage