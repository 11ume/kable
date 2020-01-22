import EventEmitter from 'events'
import { RemoteInfo } from 'dgram'
import * as EVENTS from './constants/events'
import * as EVENTS_TYPES from './constants/eventTypes'
import {
    NodeBase
    , NodeMetadata
    , NodeRegistre
    , DuplicatedNodePayload
    , NODE_UNREGISTRE_REASON
} from './node'

export type DRIVER_EVENTS = EVENTS_TYPES.ERROR_TYPES
    | EVENTS.NODE.UPDATE
    | EVENTS.NODE_REGISTRE
    | EVENTS.DISCOVERY
    | EVENTS.TRANSPORT
    | EVENTS.UNIVERSAL

export type DRIVER_FN = ErrorEmitterFn | NodeEmitterFn | NodeUpdateEmitterFn

export type NodeUpdateStartEmitter = {
    type?: EVENTS_TYPES.NODE_UPDATE_TYPES.START
    , payload: {
        time: number
    }
}

export type NodeUpdateStopEmitter = {
    type?: EVENTS_TYPES.NODE_UPDATE_TYPES.STOP
    , payload: {
        time: number
        , reason?: string
    }
}

export type NodeUpdateDoingEmitter = {
    type?: EVENTS_TYPES.NODE_UPDATE_TYPES.DOING
    , payload: {
        time: number
        , reason?: string
    }
}

export type NodeRegistreAddEmitter = {
    payload: {
        time: number
        , nodeRegistre: NodeRegistre
    }
}

export type NodeRegistreRemoveEmitter = {
    payload: {
        time: number
        , nodeRegistre?: NodeRegistre
        , reason: NODE_UNREGISTRE_REASON
    }
}

export type UpEmitter = {
    payload: {
        time: number
    }
}

export type DownEmitter = {
    payload: {
        time: number
        , signal?: string
        , code?: number
    }
}

export interface NodeEmitter extends NodeBase {
    event: EVENTS.DISCOVERY
    , ensured: boolean
    , rinfo: RemoteInfo
    , meta?: NodeMetadata
}

export type ErrorDuplicatedNodeEmitter = {
    type?: EVENTS_TYPES.CUSTOM_ERROR_TYPE.DUPLICATE_NODE_ID
    , err?: Error
    , message?: string
    , payload?: DuplicatedNodePayload
}

export type NodeUpdateEmitter = NodeUpdateStartEmitter | NodeUpdateStopEmitter | NodeUpdateDoingEmitter
export type ErrorEmitter = ErrorDefaultEmitter | ErrorDuplicatedNodeEmitter

type ErrorDefaultEmitter = {
    type?: EVENTS_TYPES.ERROR_TYPES
    , err?: Error
    , message?: string
}

type ErrorEmitterFn = (payload: ErrorEmitter) => void
type NodeEmitterFn = (payload: NodeEmitter) => void
type NodeUpdateEmitterFn = (payload: NodeUpdateEmitter) => void

export interface EventsDriver extends EventEmitter {
    on(event: EVENTS.DISCOVERY, fn: NodeEmitterFn): this
    on(event: EVENTS.NODE.UPDATE, fn: NodeUpdateEmitterFn): this
    on(event: EVENTS.TRANSPORT.MESSAGE, fn: NodeEmitterFn): this
    on(event: EVENTS.UNIVERSAL.ERROR, fn: ErrorEmitterFn): this

    off(event: DRIVER_EVENTS, fn: DRIVER_FN): this

    emit(event: EVENTS.DISCOVERY, payload: NodeEmitter): boolean
    emit(event: EVENTS.UNIVERSAL.ERROR, payload: ErrorEmitter): boolean
    emit(event: EVENTS.SYSTEM.UP, payload: UpEmitter): boolean
    emit(event: EVENTS.SYSTEM.DOWN, payload: DownEmitter): boolean
    emit(event: EVENTS.NODE_REGISTRE.ADD, payload: NodeRegistreAddEmitter): boolean
    emit(event: EVENTS.NODE_REGISTRE.REMOVE, payload: NodeRegistreRemoveEmitter): boolean
    emit(event: EVENTS.NODE.UPDATE, payload: NodeUpdateEmitter): boolean
    emit(event: EVENTS.TRANSPORT.MESSAGE, payload: NodeEmitter): boolean
}

const EventsDriver = (): EventsDriver => {
    const emitter = new EventEmitter()
    return emitter
}

export const createEventsDriver = () => {
    return EventsDriver()
}
