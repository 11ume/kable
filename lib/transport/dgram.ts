import dgram from 'dgram'
import * as EVENTS from '../constants/events'
import * as EVENTS_TYPES from '../constants/eventTypes'
import ERROR from '../constants/error'
import { createError } from '../utils'
import { EventsDriver, NodeEmitter } from '../eventDriver'
import { Transport, TransportOptions } from './transport'
import { decode, encode } from '../serialization/serialization'

export interface DgramTransportOptions extends TransportOptions {
    unicast?: string | string[]
    multicast?: string
    broadcast?: string
    reuseAddr?: boolean
    protocol?: DgramProtocol
}

interface Dgram extends Transport {
    connection: Connection
}

enum TRANSPORT_METHODS {
    UNICAST = 'unicast'
    , MULTICAST = 'multicast'
    , BROADCAST = 'broadcast'
}

type DgramArgs = {
    eventsDriver: EventsDriver
    , options?: DgramTransportOptions
}

type Connection = {
    socket: dgram.Socket
    removeEvents?: () => void
}

type Send = {
    key: string | Buffer
    , tport: number
    , transmission: Transmission
}

type CreateSocket = {
    protocol?: DgramProtocol
    , reuseAddr: boolean
}

type DgramBind = {
    tport: number
    , taddress: string
    , transmission: Transmission
    , multicastTTL: number
    , protocol?: DgramProtocol
    , reuseAddr: boolean
    , key: string | Buffer
}

type DgramProtocol = 'udp4' | 'udp6'
type Transmission = TransmissionUnicast | TransmissionMulticast | TransmissionBroadcast

type TransmissionUnicast = {
    method: TRANSPORT_METHODS.UNICAST
    destination: string | string[]
}

type TransmissionMulticast = {
    method: TRANSPORT_METHODS.MULTICAST
    destination: string
}

type TransmissionBroadcast = {
    method: TRANSPORT_METHODS.BROADCAST
    destination: string
}

const dgramOptions: DgramTransportOptions = {
    key: null
    , tport: 5000
    , taddress: '0.0.0.0'
    , unicast: undefined
    , multicast: undefined
    , broadcast: undefined
    , reuseAddr: true
    , protocol: ('udp4' as DgramProtocol)
}

const onSocketError = (eventsDriver: EventsDriver) => (err: Error) => {
    eventsDriver.emit(EVENTS.UNIVERSAL.ERROR, {
        type: EVENTS_TYPES.ERROR_TYPES.SOCKET_DGRAM
        , err
    })
}

const onSocketSendError = (eventsDriver: EventsDriver, err: Error) => {
    eventsDriver.emit(EVENTS.UNIVERSAL.ERROR, {
        type: EVENTS_TYPES.ERROR_TYPES.SOCKET_DGRAM_SEND
        , err
    })
}

const onEncodeError = (eventsDriver: EventsDriver, err: Error) => {
    eventsDriver.emit(EVENTS.UNIVERSAL.ERROR, {
        type: EVENTS_TYPES.ERROR_TYPES.ENCODING_DGRAM_MESSAGE
        , err
    })
}

const onDecodeError = (eventsDriver: EventsDriver, err: Error) => {
    eventsDriver.emit(EVENTS.UNIVERSAL.ERROR, {
        type: EVENTS_TYPES.ERROR_TYPES.DECODING_DGRAM_MESSAGE
        , err
    })
}

const sendMessage = (socket: dgram.Socket
    , eventsDriver: EventsDriver
    , tport: number
    , message: Uint8Array
    , destination: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const offset = 0
        socket.send(message, offset, message.length, tport, destination, (err) => {
            if (err) {
                onSocketSendError(eventsDriver, err)
                reject(err)
                return
            }
            resolve()
        })
    })
}

const preparePacket = (packet: object, key: string | Buffer) => {
    const aggregateDate = {
        ensured: Boolean(key)
    }

    return { ...aggregateDate, ...packet }
}

const sendMultiDestinations = (socket: dgram.Socket
    , eventsDriver: EventsDriver
    , destinations: string[]
    , message: Uint8Array
    , tport: number): Promise<void> => {
    return Promise
        .all(destinations.map((destination) => sendMessage(socket, eventsDriver, tport, message, destination)))
        .then(Function.call)
}

const sendOnlyDestination = (socket: dgram.Socket
    , eventsDriver: EventsDriver
    , destination: string
    , message: Uint8Array
    , tport: number) => sendMessage(socket, eventsDriver, tport, message, destination)

const send = <T extends object>(connection: Connection
    , eventsDriver: EventsDriver
    , { key
        , tport
        , transmission }: Send) => (packet: T): Promise<void> => {
            return new Promise((resolve, reject) => {
                const { destination } = transmission
                const data = preparePacket(packet, key)
                const [message, errEncode] = encode(key, data)

                if (errEncode) {
                    onEncodeError(eventsDriver, errEncode)
                    reject(errEncode)
                    return
                }

                if (Array.isArray(destination)) {
                    sendMultiDestinations(connection.socket, eventsDriver, destination, message, tport)
                        .then(resolve)
                        .catch(reject)
                    return
                }

                sendOnlyDestination(connection.socket, eventsDriver, destination, message, tport)
                    .then(resolve)
                    .catch(reject)
            })
        }

const setSocketTransmission = (
    unicast: string | string[]
    , multicast: string
    , broadcast: string): Transmission => {
    if (unicast) {
        return {
            method: TRANSPORT_METHODS.UNICAST
            , destination: unicast
        }
    }

    if (multicast) {
        return {
            method: TRANSPORT_METHODS.MULTICAST
            , destination: multicast
        }
    }

    return {
        method: TRANSPORT_METHODS.BROADCAST
        , destination: broadcast
    }
}

const onSocketRecibeMessage = (eventsDriver: EventsDriver, key: string | Buffer) => (message: Buffer, rinfo: dgram.RemoteInfo) => {
    const [messageDecoded, errDecode] = decode<NodeEmitter>(key, message)
    if (errDecode) {
        onDecodeError(eventsDriver, errDecode)
        return
    }

    eventsDriver.emit(EVENTS.TRANSPORT.MESSAGE, {
        ...messageDecoded
        , rinfo
    })
}

const checkMultipleTrasmitionMethods = (...transmission: Array<string | string[]>) => transmission.filter(Boolean).length > 1

const setTransmissionPreferences = (socket: dgram.Socket
    , transmission: Transmission
    , multicastTTL: number) => {
    const trans = transmission
    switch (trans.method) {
        case 'unicast': {
            socket.setBroadcast(false)
            break
        }
        case 'multicast': {
            socket.setMulticastTTL(multicastTTL)
            socket.addMembership(trans.destination)
            break
        }
        case 'broadcast': {
            socket.setBroadcast(true)
        }
    }
}

const addSocketEvents = (connection: Connection, eventsDriver: EventsDriver, key: string | Buffer) => {
    const onErr = onSocketError(eventsDriver)
    const onMsg = onSocketRecibeMessage(eventsDriver, key)
    connection.socket.on('error', onErr)
    connection.socket.on('message', onMsg)
    return () => {
        connection.socket.off('error', onErr)
        connection.socket.off('message', onMsg)
    }
}

const createSocket = ({ protocol, reuseAddr }: CreateSocket) => {
    const socket = dgram.createSocket({
        type: protocol
        , reuseAddr
    })

    return socket
}

const bind = (connection: Connection, eventsDriver: EventsDriver, {
    tport
    , taddress
    , transmission
    , multicastTTL
    , protocol
    , reuseAddr
    , key }: DgramBind): Promise<void> => {
    return new Promise((resolve) => {
        connection.socket = createSocket({ protocol, reuseAddr })
        connection.removeEvents = addSocketEvents(connection, eventsDriver, key)

        const options: dgram.BindOptions = {
            port: tport
            , address: taddress
            , exclusive: false
        }

        const bindcall = () => {
            setTransmissionPreferences(connection.socket, transmission, multicastTTL)
            resolve()
        }

        connection.socket.bind(options, bindcall)
    })
}

const close = (connection: Connection): Promise<void> => new Promise((resolve) => {
    connection.socket.close(() => {
        connection.removeEvents()
        connection.removeEvents = null
        connection.socket = null
        resolve()
    })
})

const DgramTransport = ({
    eventsDriver
    , options: {
        key = dgramOptions.key
        , tport = dgramOptions.tport
        , taddress = dgramOptions.taddress
        , unicast = dgramOptions.unicast
        , multicast = dgramOptions.multicast
        , broadcast = dgramOptions.broadcast
        , reuseAddr = dgramOptions.reuseAddr
        , protocol = dgramOptions.protocol
    } = dgramOptions }: DgramArgs): Dgram => {
    const MULTICAST_TTL = 1
    const connection: Connection = {
        socket: null
    }
    let isClosed = true

    const errTrasmitionMethod = ERROR.DGRAM_MULTI_TRANSMISSION_METHOD
    if (checkMultipleTrasmitionMethods(unicast, multicast, broadcast)) {
        throw createError(errTrasmitionMethod.name, errTrasmitionMethod.message)
    }

    const brod = broadcast !== undefined ? broadcast : '255.255.255.255'
    const transmission = setSocketTransmission(unicast, multicast, brod)

    return {
        isClosed
        , get connection() {
            return connection
        }
        , send: send(connection, eventsDriver, { transmission, tport, key })
        , bind: () => {
            return bind(connection, eventsDriver, {
                tport
                , taddress
                , transmission
                , multicastTTL: MULTICAST_TTL
                , protocol
                , reuseAddr
                , key
            })
                .then(() => {
                    isClosed = false
                })
        }
        , close: () => {
            return close(connection)
                .then(() => {
                    isClosed = true
                })
        }
    }
}

export const createDgramTransport = (args: DgramArgs) => {
    return DgramTransport(args)
}
