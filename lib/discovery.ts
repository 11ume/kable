import createIntervalHandler, { IntervalHandler } from 'interval-handler'
import * as EVENTS from './constants/events'
import * as EVENTS_TYPES from './constants/eventTypes'
import { getDateNow } from './utils'
import { Repository } from './repository'
import { Transport } from './transport/transport'
import { EventsDriver, NodeEmitter, NodeUpdateEmitter } from './eventDriver'
import {
    Node
    , NodeUp
    , NodeDown
    , NodeStop
    , NodeStart
    , NodePacket
    , NodeRegistre
    , NodeDoing
    , DuplicatedNodePayload
    , NODE_STATES
    , NODE_UNREGISTRE_REASON
} from './node'

export type Discovery = {
    start: () => Promise<void | Error>
    , stop: (signal: string, code?: number) => Promise<void | Error>
}

export type DiscoveryOptions = {
    advertisementTime?: number
}

type SendPayload = {
    state: NODE_STATES
    , up?: NodeUp
    , down?: NodeDown
    , stop?: NodeStop
    , start?: NodeStart
    , doing?: NodeDoing
}

const discoveryOptions: DiscoveryOptions = {
    advertisementTime: 2000
}

const wildcards = ['0.0.0.0', '::']

const onSendError = (eventsDriver: EventsDriver, event: EVENTS_TYPES.ERROR_TYPES) => (err: Error) => {
    eventsDriver.emit(EVENTS.UNIVERSAL.ERROR, {
        type: event
        , err
    })

    return err
}

const onDuplicatedIdError = (eventsDriver: EventsDriver, duplicatedId: DuplicatedNodePayload) => {
    eventsDriver.emit(EVENTS.UNIVERSAL.ERROR, {
        type: EVENTS_TYPES.CUSTOM_ERROR_TYPE.DUPLICATE_NODE_ID
        , payload: duplicatedId
    })
}

const addNodeToRepository = (eventsDriver: EventsDriver
    , nodesRepository: Repository<NodeRegistre>
    , nodeRegistre: NodeRegistre) => {
    nodesRepository.add(nodeRegistre.index, nodeRegistre)
    eventsDriver.emit(EVENTS.NODE_REGISTRE.ADD, {
        payload: {
            time: getDateNow()
            , nodeRegistre
        }
    })
}

const removeNodeFromRepository = (eventsDriver: EventsDriver
    , nodesRepository: Repository<NodeRegistre>
    , nodeRegistre: NodeRegistre
    , reason: NODE_UNREGISTRE_REASON) => {
    nodesRepository.remove(nodeRegistre.index, nodeRegistre)
    eventsDriver.emit(EVENTS.NODE_REGISTRE.REMOVE, {
        payload: {
            time: getDateNow()
            , reason
            , nodeRegistre
        }
    })
}

const checkNodesTimeout = (eventsDriver: EventsDriver, nodesRepository: Repository<NodeRegistre>, nodeTimeout: number) => {
    for (const node of nodesRepository.getAll()) {
        const timeElapsed = Math.abs(node.lastSeen - Date.now())
        if (timeElapsed >= nodeTimeout) {
            removeNodeFromRepository(eventsDriver
                , nodesRepository
                , node
                , NODE_UNREGISTRE_REASON.TIMEOUT)
        }
    }
}

const handleNodeUnregistre = (
    eventsDriver: EventsDriver
    , nodesRepository: Repository<NodeRegistre>, {
        id
        , port
        , host
        , pid
        , iid
        , index
        , meta
        , replica
        , hostname
        , ensured
        , up
        , down
        , stop
        , state
    }: NodeEmitter) => {
    const nodeRegistre = {
        id
        , port
        , host
        , pid
        , iid
        , meta
        , index
        , replica
        , hostname
        , ensured
        , up
        , down
        , stop
        , state
        , lastSeen: null
    }

    removeNodeFromRepository(eventsDriver
        , nodesRepository
        , nodeRegistre
        , NODE_UNREGISTRE_REASON.TERMINATION)
}

const manageDataToStoreInRegistre = ({
    id
    , port
    , host
    , pid
    , iid
    , meta = null
    , index
    , replica
    , hostname
    , ensured
    , up
    , down = null
    , stop = null
    , start = null
    , doing = null
    , state }: NodeEmitter): NodeRegistre => {
    const lastSeen = getDateNow()
    const data = {
        id
        , port
        , host
        , pid
        , iid
        , meta
        , index
        , replica
        , hostname
        , ensured
        , up
        , down
        , stop
        , start
        , doing
        , state
        , lastSeen
    }

    data.meta === null && delete data.meta
    data.down === null && delete data.down
    data.stop === null && delete data.stop
    data.start === null && delete data.start
    data.doing === null && delete data.doing

    return data
}

const handleNodeRegistre = (eventsDriver: EventsDriver, nodesRepository: Repository<NodeRegistre>, payload: NodeEmitter) => {
    addNodeToRepository(eventsDriver, nodesRepository, manageDataToStoreInRegistre(payload))
}

const handleRecibe = (nodesRepository: Repository<NodeRegistre>
    , eventsDriver: EventsDriver
    , payload: NodeEmitter) => {
    const event = payload.event
    const events = {
        [EVENTS.DISCOVERY.HELLO]: () => handleNodeRegistre(eventsDriver, nodesRepository, payload)
        , [EVENTS.DISCOVERY.UPDATE]: () => handleNodeRegistre(eventsDriver, nodesRepository, payload)
        , [EVENTS.DISCOVERY.UNREGISTRE]: () => handleNodeUnregistre(eventsDriver, nodesRepository, payload)
        , [EVENTS.DISCOVERY.ADVERTISEMENT]: () => handleNodeRegistre(eventsDriver, nodesRepository, payload)
    }

    if (event in events) {
        events[event]()
        eventsDriver.emit(event, payload)
    }
}

// Detect duplicated nodes ids
const checkNodeDuplicateId = (node: Node, { id, iid, port, rinfo: { address } }: NodeEmitter): DuplicatedNodePayload => {
    const ref: DuplicatedNodePayload = {
        id
        , iid
        , port
        , address
    }

    const checkIsDuplicatedNode = node.id === id && node.iid !== iid
    return checkIsDuplicatedNode ? ref : null
}

// Ignore messages from: self process | self instances
const checkIgnores = (node: Node, payload: NodeEmitter) => {
    const isSameProcess = node.ignoreProcess && payload.pid === node.pid
    const isSameInstance = node.ignoreInstance && payload.iid === node.iid
    return (isSameProcess || isSameInstance) ? true : false
}

const matcWildcardAddress = (host: string, wcards: string[]) => Boolean(wcards.find((h) => h === host))

const resolvetHostResolutionAddress = (payload: NodeEmitter) => {
    const newPayload = Object.assign({}, payload)
    if (matcWildcardAddress(payload.host, wildcards)) {
        newPayload.host = newPayload.rinfo.address
    }

    return newPayload
}

const send = (transport: Transport
    , node: Node
    , event: EVENTS.DISCOVERY
    , { state, up, down = null, start = null, stop = null, doing = null }: SendPayload) => {

    const {
        id
        , pid
        , iid
        , port
        , host
        , meta
        , index
        , replica
        , hostname
    } = node

    const data = {
        id
        , pid
        , iid
        , port
        , host
        , event
        , meta
        , index
        , replica
        , hostname
        , up
        , down
        , stop
        , start
        , doing
        , state
    }

    data.meta === null && delete data.meta
    data.down === null && delete data.down
    data.stop === null && delete data.stop
    data.start === null && delete data.start
    data.doing === null && delete data.doing

    return transport.send<NodePacket>(data)
}

const recibe = (node: Node
    , nodesRepository: Repository<NodeRegistre>
    , eventsDriver: EventsDriver) => (payload: NodeEmitter) => {
        let newPayload = Object.assign({}, payload)
        const duplicatedNode = checkNodeDuplicateId(node, newPayload)
        if (duplicatedNode) {
            onDuplicatedIdError(eventsDriver, duplicatedNode)
            return
        }

        if (checkIgnores(node, newPayload)) return
        newPayload = resolvetHostResolutionAddress(newPayload)
        handleRecibe(nodesRepository, eventsDriver, newPayload)
    }

const sendNodeHello = (transport: Transport
    , node: Node
    , eventsDriver: EventsDriver
    , payload: SendPayload) => {
    return send(transport, node, EVENTS.DISCOVERY.HELLO, payload)
        .catch(onSendError(eventsDriver, EVENTS_TYPES.ERROR_TYPES.DISCOVERY_SEND_HELLO))
}

const sendNodeAdvertisement = (transport: Transport
    , node: Node
    , eventsDriver: EventsDriver
    , payload: SendPayload) => {
    return send(transport, node, EVENTS.DISCOVERY.ADVERTISEMENT, payload)
        .catch(onSendError(eventsDriver, EVENTS_TYPES.ERROR_TYPES.DISCOVERY_SEND_ADVERTISEMENT))
}

const sendNodeUpdate = (transport: Transport
    , node: Node
    , eventsDriver: EventsDriver
    , payload: SendPayload) => {
    return send(transport, node, EVENTS.DISCOVERY.UPDATE, payload)
        .catch(onSendError(eventsDriver, EVENTS_TYPES.ERROR_TYPES.DISCOVERY_SEND_UPDATE))
}

const sendNodeUnregistre = (transport: Transport
    , node: Node
    , eventsDriver: EventsDriver
    , payload: SendPayload) => {
    return send(transport, node, EVENTS.DISCOVERY.UNREGISTRE, payload)
        .catch(onSendError(eventsDriver, EVENTS_TYPES.ERROR_TYPES.DISCOVERY_SEND_UNREGISTRE))
}

// node timeout always must be greater to advertisement Time
const setNodeTimeOut = (advertisementTime: number, nodeDefaultTimeout: number) => advertisementTime + nodeDefaultTimeout

const handleStateStop = (node: Node) => {
    const stop: NodeStop = {
        time: node.stop.time
        , reason: node.stop.reason
    }

    stop.reason === null && delete stop.reason
    return {
        stop
    }
}

const handleStateStart = (node: Node) => {
    const start: NodeStart = {
        time: node.start.time
    }

    return {
        start
    }
}

const handleStateDoing = (node: Node) => {
    const doing: NodeDoing = {
        time: node.doing.time
        , reason: node.doing.reason
    }

    doing.reason === null && delete doing.reason
    return {
        doing
    }
}

const handleHelloState = (node: Node) => {
    return {
        state: node.state
        , up: {
            time: node.up.time
        }
    }
}

const handleAdvertisementState = (node: Node) => {
    const common = {
        state: node.state
        , up: {
            time: node.up.time
        }
    }

    return {
        ...common
        , ...handleStateStart(node)
        , ...handleStateStop(node)
        , ...handleStateDoing(node)
    }
}

const handleUnregistreState = (node: Node, signal: string, code: number) => {
    return {
        state: node.state
        , down: {
            signal
            , code
            , time: node.down.time
        }
    }
}

const handleUpdateState = (node: Node, { type: event }: NodeUpdateEmitter) => {
    const common = {
        state: node.state
        , up: {
            time: node.up.time
        }
    }

    const events = {
        [EVENTS_TYPES.NODE_UPDATE_TYPES.START]: () => Object.assign(common, handleStateStart(node))
        , [EVENTS_TYPES.NODE_UPDATE_TYPES.STOP]: () => Object.assign(common, handleStateStop(node))
        , [EVENTS_TYPES.NODE_UPDATE_TYPES.DOING]: () => Object.assign(common, handleStateDoing(node))
    }

    return events[event]()
}

type StopArgs = {
    transport: Transport
    , node: Node
    , eventsDriver: EventsDriver
    , nodesRepository: Repository<NodeRegistre>
    , ihNodeTimeout: IntervalHandler
    , ihAdvertisamentTime: IntervalHandler
}

const stop = ({
    transport
    , node
    , eventsDriver
    , nodesRepository
    , ihNodeTimeout
    , ihAdvertisamentTime }: StopArgs) => (signal: string, code?: number) => {
        ihAdvertisamentTime.stop()
        ihNodeTimeout.stop()
        nodesRepository.clearAll()
        return sendNodeUnregistre(transport, node, eventsDriver, handleUnregistreState(node, signal, code))
    }

type StartArgs = {
    node: Node
    , transport: Transport
    , eventsDriver: EventsDriver
    , ihNodeTimeout: IntervalHandler
    , ihAdvertisamentTime: IntervalHandler
}

const start = ({
    node
    , transport
    , eventsDriver
    , ihNodeTimeout
    , ihAdvertisamentTime }: StartArgs) => () => {
        ihAdvertisamentTime.start()
        ihNodeTimeout.start()
        return sendNodeHello(transport, node, eventsDriver, handleHelloState(node))
    }

type DiscoveryArgs = {
    node: Node
    , transport: Transport
    , eventsDriver: EventsDriver
    , nodesRepository: Repository<NodeRegistre>
    , options?: DiscoveryOptions
}

const Discovery = ({
    node
    , transport
    , eventsDriver
    , nodesRepository
    , options: {
        advertisementTime = discoveryOptions.advertisementTime
    } = discoveryOptions }: DiscoveryArgs): Discovery => {
    const nodeDefaultTimeout = 1000
    const nodeTimeout = setNodeTimeOut(advertisementTime, nodeDefaultTimeout)
    const ihNodeTimeout = createIntervalHandler(nodeTimeout, () => checkNodesTimeout(eventsDriver, nodesRepository, nodeTimeout))
    const ihAdvertisamentTime = createIntervalHandler(advertisementTime, () => sendNodeAdvertisement(transport, node, eventsDriver, handleAdvertisementState(node)))

    eventsDriver.on(EVENTS.TRANSPORT.MESSAGE, recibe(node, nodesRepository, eventsDriver))
    eventsDriver.on(EVENTS.NODE.UPDATE, (payload) => sendNodeUpdate(transport, node, eventsDriver, handleUpdateState(node, payload)))

    return {
        start: start({
            node
            , transport
            , eventsDriver
            , ihNodeTimeout
            , ihAdvertisamentTime
        })
        , stop: stop({
            node
            , transport
            , eventsDriver
            , nodesRepository
            , ihNodeTimeout
            , ihAdvertisamentTime
        })
    }
}

export const createDiscovery = (args: DiscoveryArgs) => Discovery(args)
