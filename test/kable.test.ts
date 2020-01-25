import test from 'ava'
import kable from '../main'

test.serial('check normal functionalities, create node and pick', async (t) => {
    const id = 'bar'
    const host = '192.168.0.1'
    const port = 25565

    const foo = kable('foo')
    const bar = kable(id, { host, port })

    await foo.up()
    await bar.up()

    const check = await foo.pick(id)
    t.is(check.id, id)
    t.is(check.host, host)
    t.is(check.port, port)

    foo.down()
    bar.down()
})