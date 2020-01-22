import { pid } from '../../lib/constants/core'
import { Kable } from '../../lib/kable'
import { NodeEmitter } from '../../lib/eventDriver'
import { ExecutionContext } from 'ava'
import { createUuid, genRandomNumber } from '../../lib/utils'
import { NodeRegistre, NODE_STATES } from '../../lib/node'
import * as EVENTS from '../../lib/constants/events'
import * as os from 'os'

export const checkNodeRegistre = (t: ExecutionContext, r: NodeRegistre, k: Kable) => {
    t.is(r.id, k.id)
    t.is(r.port, k.port)
    t.truthy(r.host)
    t.is(r.pid, k.pid)
    t.is(r.iid, k.iid)
    t.is(r.hostname, os.hostname())
    t.is(typeof r.ensured, 'boolean')
    t.truthy(new Date(r.up.time))
}

export const checkNodeEvent = (t: ExecutionContext
    , p: NodeEmitter
    , k: Kable
    , type: EVENTS.DISCOVERY) => {
    t.is(p.event, type)
    t.is(p.id, k.id)
    t.is(p.pid, k.pid)
    t.is(p.iid, k.iid)
    t.is(p.port, k.port)
    t.truthy(p.host)
    t.is(p.hostname, os.hostname())
    t.is(typeof p.ensured, 'boolean')
    t.is(p.rinfo.port, 5000)
    t.truthy(p.rinfo.size)
    t.truthy(p.rinfo.family)
    t.truthy(p.rinfo.address)
}

export const createNodeRegistre = (id: string, state: NODE_STATES, replica: { is: boolean, of: string } = {
    is: false
    , of: null
}): NodeRegistre => {
    return {
        id
        , port: 5000
        , host: ''
        , pid
        , iid: createUuid()
        , meta: null
        , index: genRandomNumber()
        , replica
        , hostname: ''
        , ensured: false
        , lastSeen: 0
        , state
        , up: null
        , down: null
        , stop: null
    }
}
