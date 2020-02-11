import * as zmq from 'zeromq'
import kable from 'kable'
import { Kable } from 'kable-core/lib/kable'
import { address } from './utils'

function handleEvents(serv: Kable, sock: zmq.Pull) {
    sock.events.on('connect', () => {
        if (!serv.avaliable) {
            serv.start()
        }
    })
    sock.events.on('connect:retry', () => {
        if (serv.avaliable) {
            serv.doing('connect:retry')
        }
    })
    sock.events.on('close', () => {
        if (serv.avaliable) {
            serv.stop()
        }
    })
}

async function handleMessages(sock: zmq.Pull) {
    for await (const [msg] of sock) {
        console.log(msg.toString())
    }
}

async function main() {
    const sock = new zmq.Pull()
    const serv = kable('foo')
    await serv.up(false)
    const { host, port } = await serv.pick('bar')
    sock.connect(address(host, port))

    handleEvents(serv, sock)
    handleMessages(sock)
}

main()