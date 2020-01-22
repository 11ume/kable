import test from 'ava'
import kable from '../../lib/kable'
import ERROR from '../../lib/constants/error'
import { NODE_STATES, nodeStates } from '../../lib/node'

test.serial('state: test node state changes up | down', async (t) => {
    const foo = kable('foo')
    t.is(foo.state, NODE_STATES.DOWN)
    await foo.up()
    t.is(foo.state, NODE_STATES.RUNNING)
    await foo.down()
    t.is(foo.state, NODE_STATES.DOWN)
})

test.serial('state: test node state changes start | stop', async (t) => {
    const foo = kable('foo')
    t.is(foo.state, NODE_STATES.DOWN)
    await foo.up()
    t.is(foo.state, NODE_STATES.RUNNING)
    foo.stop()
    t.is(foo.state, NODE_STATES.STOPPED)
    foo.start()
    t.is(foo.state, NODE_STATES.RUNNING)
    await foo.down()
    t.is(foo.state, NODE_STATES.DOWN)
})

test.serial('state: test node state changes start not upning', async (t) => {
    const foo = kable('foo')
    t.is(foo.state, NODE_STATES.DOWN)
    await foo.up(false)
    t.is(foo.state, NODE_STATES.UP)
    await foo.down()
    t.is(foo.state, NODE_STATES.DOWN)
})

test.serial('state: emit error when intent call up method, before up', async (t) => {
    const foo = kable('foo')
    await foo.up()
    const up = t.throwsAsync(foo.up)
    const err = await up
    const customErr = ERROR.ILLEGAL_TRANSITION_STATE
    t.is(err.name, customErr.name)
    t.is(err.message, customErr.message(NODE_STATES.RUNNING, NODE_STATES.UP, nodeStates[foo.state]))
    foo.down()
})

test.serial('state: emit error when intent call down method, before down', async (t) => {
    const foo = kable('foo')
    await foo.up()
    await foo.down()
    const down = t.throwsAsync(foo.down)
    const err = await down
    const customErr = ERROR.ILLEGAL_TRANSITION_STATE
    t.is(err.name, customErr.name)
    t.is(err.message, customErr.message(NODE_STATES.DOWN, NODE_STATES.DOWN, nodeStates[foo.state]))
})

test.serial('state: emit error when intent call start method, before up', async (t) => {
    const foo = kable('foo')
    const err = t.throws(foo.start)
    const customErr = ERROR.ILLEGAL_TRANSITION_STATE
    t.is(err.name, customErr.name)
    t.is(err.message, customErr.message(NODE_STATES.DOWN, NODE_STATES.RUNNING, nodeStates[foo.state]))
})