import test from 'ava'
import op from 'ope-abort'
import ERROR from '../../lib/constants/error'
import { createNode } from '../../lib/node'
import { createStore } from '../../lib/store'
import { createOrchester } from '../../lib/orchester'
import { createNodePicker, NodePickerOptions } from '../../lib/nodePicker'
import { createRepository } from '../../lib/repository'
import { createNodeRegistre } from '../utils/helpers'
import { NodeRegistre, NODE_STATES } from '../../lib/node'

const create = (id: string, options: NodePickerOptions = {}) => {
    const node = createNode({ options: { id } })
    const nodeStore = createStore<NodeRegistre>()
    const nodesRepository = createRepository<NodeRegistre>(nodeStore)
    const orchester = createOrchester(nodesRepository)
    const nodePicker = createNodePicker({
        orchester
        , options
    })

    return {
        node
        , nodeStore
        , orchester
        , nodePicker
        , nodesRepository
    }
}

test('picker: get a node', async (t) => {
    const foo = create('foo')
    const rbar = createNodeRegistre('bar', NODE_STATES.RUNNING)
    foo.nodesRepository.add(rbar.index, rbar)

    const pick = await foo.nodePicker.pick('bar')
    t.is(pick.id, rbar.id)
})

test('pick: get one node whit delay', async (t) => {
    const foo = create('foo')
    const rbar = createNodeRegistre('bar', NODE_STATES.RUNNING)
    setTimeout(() => foo.nodesRepository.add(rbar.index, rbar), 500)

    const pick = await foo.nodePicker.pick('bar')
    t.is(pick.id, rbar.id)
})

test('pick: get error when pick node wait limit is exceeded', async (t) => {
    const foo = create('foo', { pickTimeoutOut: 0 })
    const pickId = 'bar'
    const pick = () => t.throwsAsync(foo.nodePicker.pick(pickId))
    const pickError = await pick()
    const err = ERROR.NODE_PICK_WAITFOR_LIMIT_EXCEEDED
    t.is(pickError.name, err.name)
    t.is(pickError.message, err.message(pickId))
})

test('pick: abort pick', async (t) => {
    const foo = create('foo')
    const opAbort = op()
    foo.nodePicker.pick('bar', { opAbort })
    opAbort.abort()
    t.truthy(opAbort.state.aborted)
})