<br>
<br>
<br>

<div align="center">
<img src="https://github.com/11ume/kable/blob/master/images/logo.png" width="150" height="auto"/>
</div>
<br>
<br>
<br>

**Kable** — Is a decentralized discovery service and load balancer system for Node.js
<br>

> An simple and pretty alternative to others centralized systems which involve complex architectures.
> You don't need to run or take charge separately of any load balancer, or a name resolution server, neither service discovery system. 
<br>

**why?**

> Creating and maintaining a microservice architectures is a very expensive process, that involves things like load balancing between microservices, the discovery of services, health checking, knowing at every moment in which state the service is, fault tolerance replication of each service etc. The goal of Kable is to make all this easier to do, mainly in small scale projects like startup projects. 
<br>

**This project is under active developement 🔥**

<br>
<br>

<div align="center">
<img src="https://github.com/11ume/kable/blob/master/images/nodes.png" width="300" height="auto"/>
</div>
<br>


## Features

* Automatic service discovery.
* Simply, easy to use and implement.
* Completely decentralized, no single point of failure.
* Each node keeps track of its own state, and knows in each moment the state of the nodes that are in their same subnet.
* Secured, encrypting sensitive information of each emitted datagram.
* Horizontally scalable, support node process replication.
* Intelligent node load balancing applying round robin algorithm.
* Agnostic, works in conjunction with any technology, Nest.js, Micro.js, Express.js, Apollo, MQTT, ZeroMQ, etc.
* Can monitor external resources through their sentinel nodes like kable-pg, kable-mongo etc.
* No need externals DNS servers, load balancers or centralized systems of discovery service.
<br>

#### kable is constituted by a series of modules, tools and special nodes called sentries nodes:
<br>
<br>

**[kable-core](https://github.com/11ume/kable-core)**
<br>

> Contains all modules and the main logic of Kable
<br>

**[kable-internals](https://github.com/11ume/kable-internals)**
<br>

> Is a little module to interact with some deep functionalities of kable
<br>

#### A serie of node sentries
<br>

> These are a series of special nodes, responsible for controlling with precision the status of some external service. You can create your own sentinel nodes.
<br>

Sentry | target
------------ | -------------
**[kable-mongo](https://github.com/11ume/kable-mongo)** | Mongo database
**[kable-pg](https://github.com/11ume/kable-pg)** | Postgresql database
<br>

#### A cool node status visualization extension, created for vscode 🏄‍♀️
<br>

**[kable-vscode](https://github.com/11ume/kable-vscode)**
<br>

<br>
<div align="center">
<img src="https://github.com/11ume/kable/blob/master/images/vscode-ext.png" width="500" height="auto"/>
</div>
<br>


### Usage

In the following context, we have two HTTP services that must communicate with each other.
The first service is called foo and looks like this.
# Note: kable uses by default the host **0.0.0.0** and the port **3000**
<br>

```typescript
import kable from 'kable'
import { createServer } from 'http'

const foo = kable('foo')
const server = createServer(async (_req, res) => {
    const pick = await foo.pick('bar')
    res.end(`service ${pick.id} ${pick.host} ${pick.port} ${pick.state}`)
})

server.on('listening', foo.up)
server.on('close', foo.down)
server.listen(foo.port)
```
