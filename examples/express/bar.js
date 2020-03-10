const kable = require('kable')
const express = require('express')
const createError = require('http-errors')
const bodyParser = require('body-parser')

const service = kable('bar', { port: 3001 })
const app = express()

const handler = (data, req, res, next) => res.json(data)

app.use(bodyParser.json())
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