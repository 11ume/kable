import test from 'ava'
import kable from '../main'

test.serial('check normal functionalities, create node and pick one', async (t) => {
    const foo = kable('foo')
    const bar = kable('bar')

    await foo.up()
    await bar.up()

    const check = await foo.pick('bar')
    t.is(check.id, 'bar')

    foo.down()
    bar.down()
})

test.serial('check normal functionalities, create node and pick one, whit custom host, port, metadata', async (t) => {
    const id = 'bar'
    const host = '192.168.0.1'
    const port = 25565
    const meta = {
        id: 'service-bar'
        , description: 'cool service'
    }

    const foo = kable('foo')
    const bar = kable(id, { host, port, meta })

    await foo.up()
    await bar.up()

    const check = await foo.pick(id)
    t.is(check.id, id)
    t.is(check.host, host)
    t.is(check.port, port)
    t.deepEqual(check.meta, meta)

    foo.down()
    bar.down()
})