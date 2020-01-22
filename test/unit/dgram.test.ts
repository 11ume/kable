import test from 'ava'
import * as crypto from 'crypto'
import * as EVENTS from '../../lib/constants/events'
import { createEventsDriver } from '../../lib/eventDriver'
import { createDgramTransport } from '../../lib/transport/dgram'

test.serial('transport dgram: force error when send message', async (t) => {
    const eventsDriver = createEventsDriver()
    const dgram = createDgramTransport({ eventsDriver })
    await dgram.bind()

    try {
        await dgram.connection.socket.close()
        await dgram.send({})
    } catch (err) {
        t.is(err.name, 'Error')
        t.is(err.message, 'Not running')
    }

    t.true(dgram.isClosed)
})

test.serial('transport dgram: ensure dgram message', async (t) => {
    const key = crypto.randomBytes(32)
    const barEventDriver = createEventsDriver()
    const foo = createDgramTransport({ eventsDriver: createEventsDriver(), options: { key } })
    const bar = createDgramTransport({ eventsDriver: barEventDriver, options: { key } })
    await foo.bind()
    await bar.bind()

    type Message = {
        ensured: boolean
    }

    const onMessage = (): Promise<Message> => new Promise((resolve) => {
        barEventDriver.on(EVENTS.TRANSPORT.MESSAGE, resolve)
    })

    await foo.send({ key })
    const message = await onMessage()

    t.true(message.ensured)
    t.true(bar.isClosed)
    t.true(bar.isClosed)
})
