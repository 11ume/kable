const kable = require('kable')
const express = require('express')
const createError = require('http-errors')

const service = kable('foo')
const app = express()

const handler = (req, res) => {
    res.header('Content-Type', 'application/json')
    res.send(JSON.stringify(res.locals.services, null, 4))
}

const kableMiddleware = (...servicesIds) => async (req, res, next) => {
    const services = []
    for (const id of servicesIds) {
        try {
            const pick = await service.pick(id, { timeout: 1000 })
            services.push(pick)
        } catch (err) {
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

app.listen(service.port, service.up)