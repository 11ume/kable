const kable = require('kable')
const express = require('express')
const createError = require('http-errors')
const fetch = require('node-fetch')
const { createServer } = require('http')

const service = kable('foo')
const app = express()

const request = (service) => fetch(`http://${service.host}:${service.port}`).then((data) => data.json())

const handler = async (req, res, next) => {
    const { services: { bar, baz } } = res.locals
    try {
        const barm = await request(bar)
        const bazm = await request(baz)
        res.send(`${barm.message} ${bazm.message}!`)
    } catch (err) {
        next(err)
        return
    }
}

const kableMiddleware = (...servicesIds) => async (req, res, next) => {
    const services = {}
    for (const id of servicesIds) {
        try {
            const pick = await service.pick(id, { timeout: 1000 })
            services[pick.id] = pick
        } catch (err) {
            res.status(503)
            next(err)
            break
        }
    }

    res.locals.services = services
    next()
}

app.use(kableMiddleware('bar', 'baz'))
app.use('/', handler)
app.use((req, res, next) => next(createError(404)))
app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.json({
        stack: err.stack
        , message: err.message
    })
})

const server = createServer(app)

server.on('listening', service.up)
server.on('close', service.down)
server.listen(service.port)