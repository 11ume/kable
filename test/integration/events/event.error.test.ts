import test from 'ava'
import kableDev from '../../../lib/kable.dev'
import * as EVENTS from '../../../lib/constants/events'
import * as EVENTS_TYPES from '../../../lib/constants/eventTypes'
import { ErrorDuplicatedNodeEmitter } from '../../../lib/eventDriver'

test.serial('pick: detect duplicated id error event', async (t) => {
    const foo = kableDev('foo')
    const fooDuplicated = kableDev('foo')

    await foo.up()
    await fooDuplicated.up()

    const err = (): Promise<ErrorDuplicatedNodeEmitter> => new Promise((resolve) => {
        foo.on(EVENTS.UNIVERSAL.ERROR, (payload) => {
            if (payload.type === EVENTS_TYPES.CUSTOM_ERROR_TYPE.DUPLICATE_NODE_ID) {
                resolve(payload)
            }
        })
    })

    const errEvent = await err()

    t.is(errEvent.payload.id, fooDuplicated.id)
    t.is(errEvent.payload.iid, fooDuplicated.iid)
    t.is(errEvent.payload.port, fooDuplicated.port)
    t.truthy(errEvent.payload.address)

    foo.down()
    fooDuplicated.down()
})