import kable from 'kable'
import * as http from 'http'
import { MongoClient } from 'mongodb'
import { connection } from './db'

type Ping = {
    ok: number
}

const createServer = async (conn: Promise<MongoClient>) => {
    const c = await conn
    const db = c.db()
    const admin = db.admin()
    return http.createServer(async (_req, res) => {
        const ping: Ping = await admin.ping()
        res.end(ping.ok.toString())
    })
}

async function main() {
    const service = kable('foo')
    await service.up(false)
    const db = connection(service, 'admin', 'mongo')
    const server = await createServer(db.connect())

    server.listen(service.port)
    server.on('close', service.down)
    server.on('listening', service.start)
}

main()