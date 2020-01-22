import * as os from 'os'
import * as EVENTS from './constants/events'
import { createUuid, craateStateMachine, genRandomNumber } from './utils'
import { pid } from './constants/core'

export enum NODE_STATES {
    UP = 'UP'
    , DOWN = 'DOWN'
    , RUNNING = 'RUNNING'
    , STOPPED = 'STOPPED'
    , DOING_SOMETHING = 'DOING_SOMETHING'
}

export type DuplicatedNodePayload = {
    id: string
    , iid: string
    , port: number
    , address: string
}

export type NodeMetadata = {
    id?: string
    , description?: string
    , payload?: Buffer
}

export type NodeUp = {
    time: number
}

export type NodeDown = {
    code: number
    , time: number
    , signal: string
}

export type NodeDoing = {
    time?: number
    , reason?: string
}

export type NodeStart = {
    time: number
}

export type NodeStop = {
    time: number
    , reason?: string
}

export enum NODE_UNREGISTRE_REASON {
    TERMINATION = 'TERMINATION'
    , TIMEOUT = 'TIMEOUT'
}

export interface NodeBase {
    id: string
    , port: number
    , host: string
    , pid: string
    , iid: string
    , index: number
    , replica: NodeReplica
    , hostname: string
    , up: NodeUp
    , down?: NodeDown
    , stop?: NodeStop
    , start?: NodeStart
    , doing?: NodeDoing
    , state: NODE_STATES
}

export type NodeReplica = {
    is: boolean
    , of: string
}
export interface NodeRegistre extends NodeBase {
    ensured: boolean
    , lastSeen: number
    , meta: NodeMetadata
}

export interface NodePacket extends NodeBase {
    event: EVENTS.DISCOVERY
}

export interface Node extends NodeBase {
    ignoreProcess: boolean
    , ignoreInstance: boolean
    , meta: NodeMetadata
    , resetStates: (state: NODE_STATES) => void
    , transitState: (newState: NODE_STATES) => void
}

export type NodeOptions = {
    id?: string
    , host?: string
    , port?: number
    , meta?: NodeMetadata
    , replica?: boolean
    , ignoreProcess?: boolean
    , ignoreInstance?: boolean
}

type FnTrasitState = <T extends string>(currentState: string, newState: T) => T

type Replica = {
    is: boolean
    , of?: string
}

type NodeArgs = {
    options?: NodeOptions
}

type NodeStates = {
    up: NodeUp
    , down: NodeDown
    , stop: NodeStop
    , start: NodeStart
    , doing: NodeDoing
}

export const convertToReplicaId = (id: string) => `${id}:${createUuid()}`
export const handleId = (initReplica: Replica, initId: string) => initReplica.is ? convertToReplicaId(initId) : initId
export const nodeStates = {
    [NODE_STATES.UP]: [NODE_STATES.RUNNING, NODE_STATES.DOING_SOMETHING, NODE_STATES.STOPPED, NODE_STATES.DOWN]
    , [NODE_STATES.DOWN]: [NODE_STATES.UP]
    , [NODE_STATES.RUNNING]: [NODE_STATES.DOING_SOMETHING, NODE_STATES.STOPPED, NODE_STATES.DOWN]
    , [NODE_STATES.STOPPED]: [NODE_STATES.DOING_SOMETHING, NODE_STATES.RUNNING, NODE_STATES.DOWN]
    , [NODE_STATES.DOING_SOMETHING]: [NODE_STATES.DOING_SOMETHING, NODE_STATES.RUNNING, NODE_STATES.STOPPED, NODE_STATES.DOWN]
}

const hostname = os.hostname()
const nodeOptions: NodeOptions = {
    id: hostname
    , port: 3000
    , host: '0.0.0.0'
    , meta: null
    , replica: false
    , ignoreInstance: true
    , ignoreProcess: false
}

const handleReplica = (is: boolean, id: string) => {
    const replica = {
        is
        , of: ''
    }

    replica.is ? replica.of = id : delete replica.of
    return replica
}

const transitState = (node: Node, smt: FnTrasitState) => (newState: NODE_STATES) => {
    node.state = smt(node.state, newState)
}

const resetStates = (initialState: NodeStates, states: NodeStates) => (state: NODE_STATES) => {
    if (state !== NODE_STATES.STOPPED) {
        states.stop = {
            ...initialState.stop
        }
    }

    if (state !== NODE_STATES.RUNNING) {
        states.start = {
            ...initialState.start
        }
    }

    if (state !== NODE_STATES.DOING_SOMETHING) {
        states.doing = {
            ...initialState.doing
        }
    }
}

const Node = ({
    options: {
        id: initId = nodeOptions.id
        , host: initHost = nodeOptions.host
        , port: initPort = nodeOptions.port
        , meta: initMeta = nodeOptions.meta
        , replica: initReplica = nodeOptions.replica
        , ignoreInstance: initIgnoreInstance = nodeOptions.ignoreInstance
        , ignoreProcess: initIgnoreProcess = nodeOptions.ignoreProcess
    } = nodeOptions }: NodeArgs = {}): Node => {
    const stateMachineTransition = craateStateMachine(nodeStates)
    const iid = createUuid()
    const index = genRandomNumber()
    const replica = handleReplica(initReplica, initId)
    const id = handleId(replica, initId)
    const initialState: NodeStates = Object.freeze({
        up: {
            time: null
        }
        , down: {
            time: null
            , signal: null
            , code: null
        }
        , start: {
            time: null
        }
        , stop: {
            time: null
        }
        , doing: {
            time: null
        }
    })

    let meta = initMeta
    let state = NODE_STATES.DOWN
    const states = { ...initialState }
    const node: Node = {
        id
        , host: initHost
        , port: initPort
        , ignoreProcess: initIgnoreProcess
        , ignoreInstance: initIgnoreInstance
        , pid
        , iid
        , index
        , replica
        , hostname
        , transitState: null
        , resetStates: resetStates(initialState, states)
        , set meta(value: NodeMetadata) {
            meta = value
        }
        , get meta() {
            return meta
        }
        , set state(value: NODE_STATES) {
            state = value
        }
        , get state() {
            return state
        }
        , set up(value: NodeUp) {
            states.up = value
        }
        , get up() {
            return states.up
        }
        , set down(value: NodeDown) {
            states.down = value
        }
        , get down() {
            return states.down
        }
        , get stop() {
            return states.stop
        }
        , set stop(value: NodeStop) {
            states.stop = value
        }
        , get start() {
            return states.start
        }
        , set start(value: NodeStart) {
            states.start = value
        }
        , get doing() {
            return states.doing
        }
        , set doing(value: NodeDoing) {
            states.doing = value
        }
    }

    node.transitState = transitState(node, stateMachineTransition)

    return node
}

export const createNode = (args?: NodeArgs) => {
    return Node(args)
}
