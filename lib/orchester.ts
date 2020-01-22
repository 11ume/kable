import { NodeRegistre, NODE_STATES } from './node'
import { Repository } from './repository'
import {
    fnPatch
    , roundRound
    , arrIsEmpty
    , objIsFalsy
    , arrIsNotEmpty
    , arrIfCheckExist
    , arrNumbSortAc
} from './utils'

export type Orchester = {
    nodeWorkPool: NodeWorkPool
    , getNode: (id: string) => NodeRegistre
    , getNodeWorkPool: () => NodeStack
    , addNodeAwaiter: (unique: symbol, id: string, invoker: FnAwaiterInvoker) => void
    , removeNodeAwaiter: (unique: symbol) => void
}

export type NodeStack = {
    [x: string]: Sequencer
}

export type Sequencer = {
    queue: number[]
    , next?: () => number
}

type FnAwaiterInvoker = (nodeRegistre: NodeRegistre) => void

type NodeAwaitStack = {
    id: string
    , invoker: FnAwaiterInvoker
}

type NodeWorkPool = Map<string, Sequencer>
type NodeAwaitPool = Map<symbol, NodeAwaitStack>

const roundGetNode = (sequencer: Sequencer, nodesRepository: Repository<NodeRegistre>) => {
    return nodesRepository.getOne(sequencer.next())
}

const checkNodeIsNotAvaliable = (node: NodeRegistre) => node.state === NODE_STATES.UP
    || node.state === NODE_STATES.STOPPED
    || node.state === NODE_STATES.DOING_SOMETHING

const handleGetReplicasNodes = (sequencer: Sequencer, nodesRepository: Repository<NodeRegistre>, count = 0) => {
    const node = roundGetNode(sequencer, nodesRepository)
    const len = sequencer.queue.length
    if (checkNodeIsNotAvaliable(node)) {
        if (len > count) return handleGetReplicasNodes(sequencer, nodesRepository, ++count)
        else return null
    }

    return node
}

const handleGetNode = (sequencer: Sequencer, nodesRepository: Repository<NodeRegistre>) => {
    return nodesRepository.getOne(sequencer.queue[0])
}

const addNodeAwaiter = (nodeAwaitPool: NodeAwaitPool) => (unique: symbol, id: string, invoker: FnAwaiterInvoker) => {
    nodeAwaitPool.set(unique, {
        id
        , invoker
    })
}

const removeNodeAwaiter = (nodeAwaitPool: NodeAwaitPool) => (unique: symbol) => {
    nodeAwaitPool.delete(unique)
}

const getNode = (nodesRepository: Repository<NodeRegistre>, nodeWorkPool: NodeWorkPool) => (id: string) => {
    const sequencer = nodeWorkPool.get(id)
    if (sequencer) {
        return arrIsNotEmpty(sequencer.queue)
            ? handleGetReplicasNodes(sequencer, nodesRepository)
            : handleGetNode(sequencer, nodesRepository)
    }

    return null
}

const addNodeToStack = (nodeWorkPool: NodeWorkPool, id: string, index: number) => {
    const sequencer = nodeWorkPool.get(id)
    if (sequencer) {
        if (arrIfCheckExist(sequencer.queue, index)) return
        sequencer.queue.push(index)
        sequencer.queue = arrNumbSortAc(sequencer.queue)
        sequencer.next = roundRound(sequencer.queue)
        return
    }

    nodeWorkPool.set(id, {
        queue: [index]
    })
}

const onRegistreHandleWorkPool = (nodeWorkPool: NodeWorkPool, { id, index, replica }: NodeRegistre) => {
    if (replica.of) {
        addNodeToStack(nodeWorkPool, replica.of, index)
        return
    }

    addNodeToStack(nodeWorkPool, id, index)
}

const onRegistreHandleAwaitPool = (nodesRepository: Repository<NodeRegistre>
    , nodeWorkPool: NodeWorkPool
    , nodeAwaitPool: NodeAwaitPool
    , nodeRegistre: NodeRegistre) => {
    nodeAwaitPool.forEach((pool) => {
        if (nodeRegistre.id !== pool.id) return
        pool.invoker(getNode(nodesRepository, nodeWorkPool)(pool.id))
    })
}

const onAddNodeRegistre = (nodesRepository: Repository<NodeRegistre>
    , nodeWorkPool: NodeWorkPool
    , nodeAwaitPool: NodeAwaitPool
    , nodeRegistre: NodeRegistre) => {
    onRegistreHandleWorkPool(nodeWorkPool, nodeRegistre)
    onRegistreHandleAwaitPool(nodesRepository, nodeWorkPool, nodeAwaitPool, nodeRegistre)
}

// check existence of sequencer if redundant!
const removeNodeFromStack = (nodeWorkPool: NodeWorkPool, id: string, index: number) => {
    const sequencer = nodeWorkPool.get(id)
    if (objIsFalsy(sequencer)) return
    const queue = sequencer.queue.filter((i) => i !== index)
    sequencer.next = roundRound(queue)
    nodeWorkPool.set(id, {
        queue
        , next: sequencer.next
    })

    if (arrIsEmpty(queue)) {
        nodeWorkPool.delete(id)
    }
}

const onRemoveNodeRegistre = (nodeWorkPool: NodeWorkPool, { id, index, replica }: NodeRegistre) => {
    if (replica.of) {
        removeNodeFromStack(nodeWorkPool, replica.of, index)
        return
    }

    removeNodeFromStack(nodeWorkPool, id, index)
}

const getNodeWorkPool = (nodeWorkPool: NodeWorkPool) => () => {
    return Object.fromEntries(nodeWorkPool.entries())
}

const Orchester = (nodesRepository: Repository<NodeRegistre>): Orchester => {
    const nodeWorkPool: NodeWorkPool = new Map()
    const nodeAwaitPool: NodeAwaitPool = new Map()

    fnPatch('add', nodesRepository, (_: string, nodeRegistre: NodeRegistre) => {
        onAddNodeRegistre(nodesRepository, nodeWorkPool, nodeAwaitPool, nodeRegistre)
    })

    fnPatch('remove', nodesRepository, (_: string, nodeRegistre: NodeRegistre) => {
        onRemoveNodeRegistre(nodeWorkPool, nodeRegistre)
    })

    return {
        get nodeWorkPool() {
            return new Map(nodeWorkPool)
        }
        , getNode: getNode(nodesRepository, nodeWorkPool)
        , getNodeWorkPool: getNodeWorkPool(nodeWorkPool)
        , addNodeAwaiter: addNodeAwaiter(nodeAwaitPool)
        , removeNodeAwaiter: removeNodeAwaiter(nodeAwaitPool)
    }
}

export const createOrchester = (nodesRepository: Repository<NodeRegistre>) => {
    return Orchester(nodesRepository)
}