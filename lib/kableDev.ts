import { NodeStack } from './orchester'
import { EventsDriver } from './eventDriver'
import { NodeDependency } from './dependency'
import {
    Kable
    , Implementables
    , implementations
    , KableComposedOptions
} from './kable'

export interface Kabledev extends Kable, EventsDriver {
    /** Get queue of promises, which are waiting to take a node */
    getPickQueue(): Map<symbol, { id: string }>
    /** Get node work pool, is a stack of enlisted and organized nodes, used to apply the load balancer algorithm */
    getNodeWorkPool(): NodeStack
    /** Get node dependecies */
    getDepedencies(): NodeDependency[]
}

const KableDev = (implement: Implementables): Kabledev => {
    const { eventsDriver, nodePicker, orchester, dependencyManager } = implement
    const k = Kable(implement)
    const Kdriver = Object.assign(eventsDriver, k)
    return Object.assign(Kdriver, {
        getPickQueue: nodePicker.getPickQueue
        , getNodeWorkPool: orchester.getNodeWorkPool
        , getDepedencies() {
            return Array.from(dependencyManager.getAll().values())
        }
    })
}

const createKableDev = (id?: string, options?: KableComposedOptions) => {
    const opts = {
        id
        , ...options
    }

    return KableDev(implementations(opts))
}

export default createKableDev