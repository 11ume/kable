import test from 'ava'
import kable from '../../lib/kable'
import { checkNodeRegistre } from '../utils/helpers'

test.serial('kable dgram methods: broadcast', async (t) => {
    const foo = kable('foo')
    const bar = kable('bar', { broadcast: '255.255.255.0' })

    await foo.up()
    await bar.up()

    checkNodeRegistre(t, await foo.pick('bar'), bar)

    foo.down()
    bar.down()
})

test.serial('kable dgram methods: unicast', async (t) => {
    const foo = kable('foo')
    const bar = kable('bar', { unicast: '0.0.0.0' })

    await foo.up()
    await bar.up()

    checkNodeRegistre(t, await foo.pick('bar'), bar)

    foo.down()
    bar.down()
})
