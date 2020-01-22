export type RepositoryRegistre<T extends Registre> = Map<number, T>

export type Registre = {
    id: string
}

export interface Repository<T extends Registre> {
    add: (key: number, registre: T) => void
    remove: (key: number, _nodeRegistre?: T) => boolean
    clearAll: () => void
    getOne: (key: number) => T
    getAll: () => IterableIterator<T>
    getOneById: (id: string) => T
    size: () => number
}

const size = <T extends Registre>(registres: RepositoryRegistre<T>) => () => registres.size

const add = <T extends Registre>(registres: RepositoryRegistre<T>) => (key: number, node: T) => {
    registres.set(key, node)
}

const clear = <T extends Registre>(registres: RepositoryRegistre<T>) => () => registres.clear()

const remove = <T extends Registre>(registres: RepositoryRegistre<T>) => (key: number, _nodeRegistre?: T) => registres.delete(key)

const getAll = <T extends Registre>(registres: RepositoryRegistre<T>) => () => registres.values()

const getOne = <T extends Registre>(registres: RepositoryRegistre<T>) => (key: number) => registres.get(key)

const getOneById = <T extends Registre>(registres: RepositoryRegistre<T>) => (id: string): T => {
    for (const n of registres.values()) {
        if (n.id === id) {
            return n
        }
    }

    return null
}

const Repository = <T extends Registre>(registres: RepositoryRegistre<T>): Repository<T> => {
    return {
        add: add(registres)
        , remove: remove(registres)
        , clearAll: clear(registres)
        , getOne: getOne(registres)
        , getAll: getAll(registres)
        , getOneById: getOneById(registres)
        , size: size(registres)
    }
}

export const createRepository = <T extends Registre>(registres: RepositoryRegistre<T>): Repository<T> => {
    return Repository(registres)
}
