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
> You should not worry about management separately of a load balancer, or a name resolution server, neither of service discovery system. 
<br>

**why?**

> Creating and maintaining a distributed services architectures, is a very expensive process, that involves things like load balancing between services, service discovery, health checking, knowing at every moment in which state the service is, fault tolerance, replication etc. The goal of Kable is to make all this easier to do. 
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
* Each node maintains his own state, and knows in each moment the state of the nodes that are in their same subnet.
* Secured, encrypting sensitive information of each emitted datagram.
* Horizontally scalable, support node process replication.
* Intelligent node load balancing applying round robin algorithm.
* Agnostic, works in conjunction with any technology, Nest.js, Micro.js, Express.js, Apollo, MQTT, ZeroMQ, etc.
* Monitoring the status of external resources, through sentinel nodes.
* No need externals DNS servers, load balancers or centralized systems of discovery service.
* No needed extra requests, everything a node might required is found in his memory.
* Emits low amount of data. How?, not emitting redundant data and applying serialization via **[Message Pack](https://msgpack.org/)**.
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

| Sentry                                                  | target              |
| ------------------------------------------------------- | ------------------- |
| **[kable-mongo](https://github.com/11ume/kable-mongo)** | Mongo database      |
| **[kable-pg](https://github.com/11ume/kable-pg)**       | Postgresql database |
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
<br>

In the following context, we have two HTTP services what should communicate between them. The services are running in the port **3000** and **3001**.

<br>
<br>

The first service is called **foo** and looks like this:

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

<br>
<br>

The second service is called **bar**:

<br>

```typescript
const bar = kable('bar', { port: 3001 })
const server = createServer(async (_req, res) => {
    const pick = await bar.pick('foo')
    res.end(`service ${pick.id} ${pick.host} ${pick.port} ${pick.state}`)
})

server.on('listening', bar.up)
server.on('close', bar.down)
server.listen(bar.port)
```

<br>
<br>

Surely you are wondering what is happening under the hood?

<br>

Well, kable uses UDP Broadcast, to locate each node inside of same subnet.
Each node sends and receives information on his location and current status every certain time, or immediately when a status update is performed in some node.

The first thing that is done when the **pick** method is called, is look for the requested node in the node registry **(In his memory)**. 
If he cannot found it in his **cache** of nodes, he will wait for that node for an estimated time, 
by default **5 minutes**, This operation may be aborted when you deem it necessary.

Normally, if everything goes well, the node always look for the required node in his cache, or in case of replicas existence, it will send the first available replica node.


<br> 

The method **up**, will puts kable to work and set the node it the second state called **running**.

<br>

The method **down**, stops all cable tasks, and will set the node in the latest state called **down**. 

<br>

> **Note**: Each node contains a states machine, with 5 possible states: **up** - **running** - **doing** - **stopped** - **down**.

<br>

What happening if some node don't call the **down** method?, well, kable always tries to issue his termination status, therefore if the process ends abruptly, it will intercept the termination signal before of this happening, and will issue the termination status **down**, with the signal and the exit code.

<br>

In the case of an controlled closing be invoked or an abrupt closure is never be emitted, each node has a **node timeout controller**, that will remove the inactive node from his registry, once the estimated waiting time is over by default **3 seconds**.

<br>

In the following context, we have the two previous services, but one of theses, need of some external service like a database.

<br>

> Here is where an sentinel node make sense.

<br>

All sentinel nodes are ready to run with the minimum configuration required.

<br>

```bash
npm install https://github.com/11ume/kable-mongo
npm run -id mongo -uri mongodb://localhost:27017/admin
```

<br>

```typescript
import kable from 'kable'
import { createServer } from 'http'

const foo = kable('foo')
const server = createServer(async (_req, res) => {
    const pick = await foo.pick('mongo')
    res.end(`service ${pick.id} ${pick.host} ${pick.port} ${pick.state}`)
})

server.on('listening', foo.up)
server.on('close', foo.down)
server.listen(foo.port)
```

<br>