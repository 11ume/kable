import ERROR from '../constants/error'
import { EventsDriver } from '../eventDriver'
import { createDgramTransport, DgramTransportOptions } from './dgram'
import { createError } from '../utils'

export enum TransportTypes {
    DGRAM = 'dgram'
}

export interface TransportOptions {
    key?: string | Buffer
    , tport?: number
    , taddress?: string
}

export type Transport = {
    bind: () => Promise<void>
    , close: () => Promise<void>
    , send: <T extends object>(packet: T) => Promise<void>
    , isClosed: boolean
}

export type TransportOptionsCompose = DgramTransportOptions

type TransporArgs = {
    type: TransportTypes
    , eventsDriver: EventsDriver
    , options: TransportOptionsCompose
}

const transportOptions: TransportOptions = {
    key: null
    , tport: 5000
    , taddress: '0.0.0.0'
}

export const createTransport = ({ type, ...args }: TransporArgs): Transport => {
    const options = args.options || transportOptions
    const {
        key = transportOptions.key
        , tport = transportOptions.tport
        , taddress = transportOptions.taddress } = options

    const errKey = ERROR.WRONG_LENGTH_SECURITY_KEY
    if (key && Buffer.byteLength(key) !== 32) {
        throw createError(errKey.name, errKey.message)
    }

    const defaultArgs = {
        options: {
            key
            , tport
            , taddress
        }
    }

    const composedArgs = { ...args, ...defaultArgs }
    const transportFactory = {
        dgram: () => createDgramTransport(composedArgs)
    }

    return transportFactory[type]()
}