import { OperationAbort } from 'ope-abort'
import ERROR from './constants/error'
import { NodeRegistre } from './node'
import { createError } from './utils'
import { Orchester } from './orchester'

export type PickOptions = {
    timeout?: number
    , opAbort?: OperationAbort
}

export type NodePicker = {
    pick(id: string, options?: PickOptions): Promise<NodeRegistre>
    getPickQueue(): PickQueue
}

export type NodePickerOptions = {
    pickTimeoutOut?: number
}

type NodePickerArgs = {
    orchester: Orchester
    , options: NodePickerOptions
}

type PickQueue = Map<symbol, { id: string }>

const nodePickerOptions: NodePickerOptions = {
    pickTimeoutOut: 300000 // 5 minutes
}

const pickOptions = (timeout: number) => {
    return {
        timeout
        , opAbort: null
    }
}

const handleTimeLimitExceded = (id: string) => {
    const errExcededLimit = ERROR.NODE_PICK_WAITFOR_LIMIT_EXCEEDED
    return createError(errExcededLimit.name, errExcededLimit.message(id))
}

const pickNodeAwaiter = (orchester: Orchester
    , timeout: number
    , id: string
    , opAbort: OperationAbort = null): Promise<NodeRegistre> => new Promise((resolve, reject) => {
        const unique = Symbol()
        const timeoutout = setTimeout(reject, timeout, handleTimeLimitExceded(id))
        const resolveAwaiter = (nodeRegistre: NodeRegistre = null) => {
            clearTimeout(timeoutout)
            orchester.removeNodeAwaiter(unique)
            resolve(nodeRegistre)
        }

        if (opAbort) {
            opAbort.onAbort(resolveAwaiter)
        }

        orchester.addNodeAwaiter(unique, id, resolveAwaiter)
    })

const addAwaiterToPickQueue = (pickQueue: PickQueue, id: string) => {
    const unique = Symbol()
    pickQueue.set(unique, { id })
    return function clearPickInQueue() {
        return pickQueue.delete(unique)
    }
}

const getNode = (orchester: Orchester, id: string) => {
    const nodeRegistre = orchester.getNode(id)
    if (nodeRegistre) return nodeRegistre
    return null
}

const getNodeRegistreFromCache = (orchester: Orchester, id: string): NodeRegistre => {
    return getNode(orchester, id)
}

const pickHandlerFromCache = (orchester: Orchester, id: string) => {
    const nodeRegistre = getNodeRegistreFromCache(orchester, id)
    return nodeRegistre ? nodeRegistre : null
}

type PickArgs = {
    orchester: Orchester
    , pickQueue: PickQueue
    , picktimeoutOut: number
}

const pick = ({
    orchester
    , pickQueue
    , picktimeoutOut
}: PickArgs) => (id: string
    , { timeout = picktimeoutOut, opAbort: opAbort = null }: PickOptions = pickOptions(picktimeoutOut)): Promise<NodeRegistre> => {
        return new Promise((resolve) => {
            const nodeRegistre = pickHandlerFromCache(orchester, id)
            if (nodeRegistre) return resolve(nodeRegistre)

            const nodeRegistresAwaiter = pickNodeAwaiter(orchester, timeout, id, opAbort)
            const clearQueue = addAwaiterToPickQueue(pickQueue, id)

            return resolve(nodeRegistresAwaiter.finally(clearQueue))
        })
    }

const getPickQueue = (queue: PickQueue) => () => new Map(queue)

const NodePicker = ({
    orchester
    , options: {
        pickTimeoutOut: picktimeoutOut = nodePickerOptions.pickTimeoutOut
    } = nodePickerOptions
}: NodePickerArgs): NodePicker => {
    const pickQueue = new Map()
    return {
        pick: pick({
            orchester
            , pickQueue
            , picktimeoutOut
        })
        , getPickQueue: getPickQueue(pickQueue)
    }
}

export const createNodePicker = (args: NodePickerArgs) => {
    return NodePicker(args)
}
