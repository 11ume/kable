import test from 'ava'
import kableDev from '../../lib/kableDev'
import * as EVENTS from '../../lib/constants/events'
import { NodeEmitter } from '../../lib/eventDriver'

test.serial('state: send and recibe metadata', async (t) => {
    const foo = kableDev('foo', { meta: { id: 'foo', description: 'im foo' } })
    const bar = kableDev('bar')

    await foo.up()
    await bar.up()

    const recibe = (): Promise<NodeEmitter> => new Promise((resolve) => {
        bar.on(EVENTS.DISCOVERY.ADVERTISEMENT, resolve)
    })

    const data = await recibe()
    t.deepEqual(data.meta, { id: 'foo', description: 'im foo' })

    foo.down()
    bar.down()
})