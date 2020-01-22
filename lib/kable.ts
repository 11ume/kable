import * as EVENTS from './constants/events'
import * as EVENTS_TYPES from './constants/eventTypes'
import { Node, NodeOptions, NodeRegistre, NodeMetadata, createNode, NODE_STATES } from './node'
import { Transport, TransportOptionsCompose, TransportTypes, createTransport } from './transport/transport'
import { Discovery, DiscoveryOptions, createDiscovery } from './discovery'
import { DependencyManagerOptions, createdependencyManager, DependencyManager } from './dependency'
import { NodePickerOptions, PickOptions, createNodePicker, NodePicker } from './nodePicker'
import { EventsDriver, createEventsDriver } from './eventDriver'
import { createRepository, Repository } from './repository'
import { createOrchester, Orchester } from './orchester'
import { createStore } from './store'
import { getDateNow } from './utils'

export type KableComposedOptions = NodeOptions
    & DiscoveryOptions
    & NodePickerOptions
    & TransportOptionsCompose
    & DependencyManagerOptions

export type KableOptions = {
    run?: boolean
}

export type Kable = {
    /** Node id, must be unique by network */
    id: string
    /** Node process unique idetificator */
    pid: string
    /** Node instance unique idetificator */
    iid: string
    /** Node host default 0.0.0.0 */
    host: string
    /** Node port default 3000 */
    port: number
    /** Node metadata */
    meta: NodeMetadata
    /** Node states */
    state: NODE_STATES
    /** Unique random number used for organizate the nodes workflow, who own replicated nodes */
    index: number
    /** Node os hostname */
    hostname: string
    /** Set that node in running state */
    start(): void
    /** Set that node in stopped state */
    stop(reason?: string): void
    /** Set that node in doing something state */
    doing(reason?: string): void
    /** Start all internals processes and set that node in up state */
    up(running?: boolean): Promise<void>
    /** Terminate all internals processes and set that node in down state */
    down(): Promise<void>
    /**
     * Request a node by you identificator.
     * This method will wait an default time, if the requested node has not been announced yet.
     * This method can be aborted.
     */
    pick(id: string, options?: PickOptions): Promise<NodeRegistre>
}

type FnShutdown = (signal: string, code?: number) => Promise<void>

const handleShutdown = (invoke: FnShutdown) => {
    const handle = (signal: NodeJS.Signals, code = null) => {
        invoke(signal, code)
            .then(() => process.exit(code))
            .catch((err) => process.exit(err ? 1 : 0))
    }

    process.on('SIGINT', handle)
    process.on('SIGTERM', handle)
    return () => {
        process.off('SIGINT', handle)
        process.off('SIGTERM', handle)
    }
}

const handleRunState = (node: Node, running: boolean) => {
    let state: NODE_STATES = null
    node.up.time = getDateNow()
    node.resetStates(state)

    if (running) {
        state = NODE_STATES.RUNNING
        node.transitState(NODE_STATES.UP)
        node.transitState(NODE_STATES.RUNNING)
        return state
    }

    state = NODE_STATES.UP
    node.transitState(NODE_STATES.UP)

    return state
}

const handleTerminateState = (node: Node) => {
    const state = NODE_STATES.DOWN
    node.down.time = getDateNow()
    node.resetStates(state)
    node.transitState(state)

    return state
}

const start = (node: Node, eventsDriver: EventsDriver) => () => {
    const time = getDateNow()
    const state = NODE_STATES.RUNNING
    node.start.time = time
    node.resetStates(state)
    node.transitState(state)

    eventsDriver.emit(EVENTS.NODE.UPDATE, {
        type: EVENTS_TYPES.NODE_UPDATE_TYPES.START
        , payload: {
            time
        }
    })
}

const stop = (node: Node, eventsDriver: EventsDriver) => (reason: string = null) => {
    const time = getDateNow()
    const state = NODE_STATES.STOPPED
    node.stop.time = time
    node.stop.reason = reason
    node.resetStates(state)
    node.transitState(state)

    eventsDriver.emit(EVENTS.NODE.UPDATE, {
        type: EVENTS_TYPES.NODE_UPDATE_TYPES.STOP
        , payload: {
            time
            , reason
        }
    })
}

const doing = (node: Node, eventsDriver: EventsDriver) => (reason: string = null) => {
    const time = getDateNow()
    const state = NODE_STATES.DOING_SOMETHING
    node.doing.time = time
    node.doing.reason = reason
    node.resetStates(state)
    node.transitState(state)

    eventsDriver.emit(EVENTS.NODE.UPDATE, {
        type: EVENTS_TYPES.NODE_UPDATE_TYPES.DOING
        , payload: {
            time
            , reason
        }
    })
}

type UpArgs = {
    node: Node
    , transport: Transport
    , discovery: Discovery
    , eventsDriver: EventsDriver
}

const up = ({
    node
    , transport
    , discovery
    , eventsDriver
}: UpArgs) => async (running = true) => {
    handleRunState(node, running)
    await transport.bind()
    await discovery.start()

    eventsDriver.emit(EVENTS.SYSTEM.UP, {
        payload: {
            time: node.up.time
        }
    })
}

type DownArgs = {
    node: Node
    , transport: Transport
    , discovery: Discovery
    , eventsDriver: EventsDriver
    , detachHandleShutdown: () => void
}

const down = ({
    node
    , transport
    , discovery
    , eventsDriver
    , detachHandleShutdown }: DownArgs) => async () => {
        handleTerminateState(node)
        detachHandleShutdown()
        await discovery.stop('down', null)
        await transport.close()

        eventsDriver.emit(EVENTS.SYSTEM.DOWN, {
            payload: {
                time: node.down.time
            }
        })
    }

/**
 * Terminate all process in safe way.
 * First it send unregistered event, after stop all internals functions,
 * by last close all socket connections opened.
 */
const downAbrupt = (
    node: Node
    , discovery: Discovery
    , transport: Transport
    , eventsDriver: EventsDriver) => async (signal: string, code?: number) => {
        handleTerminateState(node)
        await discovery.stop(signal, code)
        await transport.close()

        eventsDriver.emit(EVENTS.SYSTEM.DOWN, {
            payload: {
                time: node.down.time
            }
        })
    }

export type Implementables = {
    node: Node
    , discovery: Discovery
    , orchester: Orchester
    , transport: Transport
    , nodePicker: NodePicker
    , eventsDriver: EventsDriver
    , nodesRepository: Repository<NodeRegistre>
    , dependencyManager: DependencyManager
    , detachHandleShutdown: () => void
}

export const implementations = (options: KableComposedOptions): Implementables => {
    const nodesStore = createStore<NodeRegistre>()
    const eventsDriver = createEventsDriver()
    const nodesRepository = createRepository<NodeRegistre>(nodesStore)
    const node = createNode({
        options: {
            id: options.id
            , host: options.host
            , port: options.port
            , meta: options.meta
            , replica: options.replica
            , ignoreProcess: options.ignoreProcess
            , ignoreInstance: options.ignoreInstance
        }
    })

    const orchester = createOrchester(nodesRepository)

    const transport = createTransport({
        type: TransportTypes.DGRAM
        , eventsDriver
        , options: {
            key: options.key
            , tport: options.tport
            , taddress: options.taddress
            , unicast: options.unicast
            , multicast: options.multicast
            , broadcast: options.broadcast
            , reuseAddr: options.reuseAddr
            , protocol: options.protocol
        }
    })

    const discovery = createDiscovery({
        node
        , transport
        , eventsDriver
        , nodesRepository
        , options: {
            advertisementTime: options.advertisementTime
        }
    })

    const dependencyManager = createdependencyManager({
        nodesRepository
        , options: {
            depedencies: options.depedencies
        }
    })

    const nodePicker = createNodePicker({
        orchester
        , options: {
            pickTimeoutOut: options.pickTimeoutOut
        }
    })

    // datach events of main process, to prevent overload of events emitter
    const detachHandleShutdown = handleShutdown(downAbrupt(node, discovery, transport, eventsDriver))

    return {
        node
        , discovery
        , orchester
        , transport
        , nodePicker
        , eventsDriver
        , nodesRepository
        , dependencyManager
        , detachHandleShutdown
    }
}

export const Kable = (implementables: Implementables): Kable => {
    const {
        node
        , transport
        , discovery
        , nodePicker
        , eventsDriver
        , detachHandleShutdown
    } = implementables

    return {
        start: start(node, eventsDriver)
        , stop: stop(node, eventsDriver)
        , doing: doing(node, eventsDriver)
        , up: up({
            node
            , transport
            , discovery
            , eventsDriver
        })
        , down: down({
            node
            , transport
            , discovery
            , eventsDriver
            , detachHandleShutdown
        })
        , pick: nodePicker.pick
        , get id() {
            return node.id
        }
        , get pid() {
            return node.pid
        }
        , get iid() {
            return node.iid
        }
        , get host() {
            return node.host
        }
        , get port() {
            return node.port
        }
        , get meta() {
            return node.meta
        }
        , get state() {
            return node.state
        }
        , get index() {
            return node.index
        }
        , get hostname() {
            return node.hostname
        }
    }
}

const createKable = (id?: string, options?: KableComposedOptions) => {
    const opts = {
        id
        , ...options
    }

    return Kable(implementations(opts))
}

export default createKable
