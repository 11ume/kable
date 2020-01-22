import { NodeRegistre } from './node'
import { Repository } from './repository'
import { fnPatch, objIsFalsy } from './utils'

export type DependencyManager = {
    add: (id: string) => void
    , remove: (id: string) => void
    , getAll: () => DepedencyStack
}

export type DependencyManagerOptions = {
    depedencies?: string | string[]
}

export type DependencyManagerArgs = {
    nodesRepository: Repository<NodeRegistre>
    , options: DependencyManagerOptions
}

export type NodeDependency = {
    satisfied: boolean
}

type DepedencyStack = Map<string, NodeDependency>

const add = (depedencyStack: DepedencyStack) => (id: string) => depedencyStack.set(id, { satisfied: false })
const remove = (depedencyStack: DepedencyStack) => (id: string) => depedencyStack.delete(id)
const getAll = (depedencyStack: DepedencyStack) => () => new Map(depedencyStack)

const handleDepedencyStack = (depedencyStack: DepedencyStack, { id }: NodeRegistre) => {
    const dependency = depedencyStack.get(id)
    if (dependency) {
        const satisfied = !dependency.satisfied
        depedencyStack.set(id, { satisfied })
        return
    }
}

const addDependeciesToStack = (depedencies: string | string[], dependecyStack: DepedencyStack) => {
    if (Array.isArray(depedencies)) depedencies.forEach((id) => {
        dependecyStack.set(id, { satisfied: false })
    })
    else dependecyStack.set(depedencies, { satisfied: false })
}

const DependencyManager = ({ nodesRepository, options: { depedencies = null } }: DependencyManagerArgs): DependencyManager => {
    const depedencyStack: DepedencyStack = new Map()
    const dependecyManager: DependencyManager = {
        add: add(depedencyStack)
        , remove: remove(depedencyStack)
        , getAll: getAll(depedencyStack)
    }

    if (objIsFalsy(depedencies)) return dependecyManager
    addDependeciesToStack(depedencies, depedencyStack)
    fnPatch('add', nodesRepository, (_: string, nodeRegistre: NodeRegistre) => handleDepedencyStack(depedencyStack, nodeRegistre))
    fnPatch('remove', nodesRepository, (_: string, nodeRegistre: NodeRegistre) => handleDepedencyStack(depedencyStack, nodeRegistre))

    return dependecyManager
}

export const createdependencyManager = (args: DependencyManagerArgs) => {
    return DependencyManager(args)
}
