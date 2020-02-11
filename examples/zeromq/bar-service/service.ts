import * as zmq from 'zeromq'
import kable from 'kable'
import { delay, address } from './utils'

const sock = new zmq.Push()
const service = kable('bar')

async function main() {
    await service.up()
    await sock.bind(address(service.host, service.port))

    while (true) {
        await sock.send('hello')
        await delay(1000)
    }
}

main()