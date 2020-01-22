import test from 'ava'
import * as crypto from 'crypto'
import { decode, encode } from '../../lib/serialization/serialization'

type Message = { foo: string }
const key = crypto.randomBytes(32)
let messageEncoded: Uint8Array = null

test('encode message', (t) => {
    const [message, errEncode] = encode(key, { foo: 'foo' })
    t.is(errEncode, null)
    t.is(message.length, 32)
    messageEncoded = message
})

test('decode message', (t) => {
    const [message, errDecode] = decode<Message>(key, messageEncoded)
    t.is(errDecode, null)
    t.deepEqual(message, { foo: 'foo' })
})
