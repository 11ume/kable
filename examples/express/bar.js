const kable = require('kable')
const express = require('express')
const createError = require('http-errors')
const { createServer } = require('http')

const service = kable('bar', { port: 3001 })
const app = express()
const handler = (req, res) => res.json({ message: 'world' })

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