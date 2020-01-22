import test from 'ava'
import kable from '../../lib/kable'
import { checkNodeRegistre } from '../utils/helpers'

test.serial('pick: get a node', async (t) => {
    const foo = kable('foo')
    const bar = kable('bar')

    await foo.up()
    await bar.up()
    const pick = await foo.pick('bar')
    checkNodeRegistre(t, pick, bar)

    foo.down()
    bar.down()
})

test.serial('pick: get node whit delay', async (t) => {
    const foo = kable('foo')
    const bar = kable('bar')

    await foo.up()
    setTimeout(bar.up, 2000)
    const pick = await foo.pick('bar')
    checkNodeRegistre(t, pick, bar)

    foo.down()
    bar.down()
})