import { MongoClient, MongoClientOptions } from 'mongodb'
import { Kable } from 'kable-core/lib/kable'

export type Connection = {
    connect: () => Promise<MongoClient>
    disconnect: () => Promise<void>
}

type State = {
    connection: Promise<MongoClient>
}

const connect = (
    foo: Kable
    , serviceId: string
    , state: State
    , db: string
    , options: MongoClientOptions) => () => {
        return foo
            .pick(serviceId)
            .then(({ host, port }) => {
                const uri = `mongodb://${host}:${port}/${db}`
                state.connection = MongoClient.connect(uri, options)
                return state.connection
            })
    }

const disconnect = (state: State) => async () => {
    const conn = await state.connection
    return conn.close()
}

export const connection = (foo: Kable
    , db: string
    , serviceId: string
    , options = { useUnifiedTopology: true }): Connection => {
    const state = { connection: null }
    return {
        connect: () => {
            const conn = connect(foo, serviceId, state, db, options)
            return conn().catch((err) => {
                console.error(err)
                foo.doing('Retry a database connection')
                return conn()
            })
        }
        , disconnect: disconnect(state)
    }
}