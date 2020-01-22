import * as msgpack from '@msgpack/msgpack'
import { encrypt, decrypt } from '../security/crypto'

export const encode = <T>(key: string | Buffer, data: T): [Uint8Array, Error] => {
    try {
        const payload = msgpack.encode(data)
        const message = key ? encrypt(key, payload) : payload
        return [message, null]
    } catch (err) {
        return [null, err]
    }
}

export const decode = <T>(key: string | Buffer, data: Uint8Array): [T, Error] => {
    try {
        const message = key ? (msgpack.decode(decrypt(key, data)) as T) : (msgpack.decode(data) as T)
        return [message, null]
    } catch (err) {
        return [null, err]
    }
}
