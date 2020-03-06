<br>

## Getting started

<br>

### Table of Contents

<br>

- **[Usage](#Usage)** 

- **[Installation](#installation)** 

- **[First impressions and goals](#first-impressions-and-goals)**

- **[What are sentinel nodes](#node-sentinels)**

- **[What are the node states](#node-state)** 
  * **[State transitions methods](#state-transitions-methods)**
  * **[State transitions table](#state-transitions-table)**

- **[How create a node replicas](#how-create-a-node-replicas)** 

- **[The service discovery](#the-service-discovery)**
  * **[Lifecycle](#lifecycle)**
  * **[Fault tolerance](#fault-tolerance)**
  * **[How discovery service works](#how-discovery-service-works)**

- **[What happens when duplicate nodes are found](#duplicate-node-ids)** 

<br>

### First impressions and goals

<br>

The architecture of kable is based on a decentralized service system where each service have in his memory an record of the location and status of all others services that are in his same cluster.

<br>

* The main objective of **Kable** is to facilitate the service discovery process.
* Kable is designed to not emit exceptions when it is in operation, they can only occur on very important occasions.
* Instead of each service having to register, deregister and update your status in a central system, each service has is responsible for carrying out this work separately **with a low cost**, it may seem unattractive in a first impression but, **what benefits have it?**
  * Is highly fault tolerant, by his decentralized nature. 
  * Don't require install nothing outside of **Node.js** ecosystem. 
  * You don't need to worry by complex configurations.
  * No extra hops, in a decentralized system many request are made to achieve something simple task, this is very expensive in terms of performance, resource consumption and add network traffic noise.
* Why kable owns a load balacer system?
  * Why kable must be support node replication. 
  * You don't need to worry about setting up anything, the load balancer is smart.
  * The architecture of Kable system depends obligatorily of one to work.
  * The load balancer works in conjunction with the service discovery system, if they are together they can work very fast.

<br>
  
Once they implement **Kable** in some service, is turned into a **node**, since it now starts to be a part of a network of connected nodes.

<br>

#### What does one of these messages look like?

<br>

```js
{
    id: 'foo'
    , host: '192.168.0.1'
    , port: 3000
    , meta: {
       id: 'foo-service'
       , description: 'is a cool service called foo'
    }
    , hostname: 'DESKTOP-3MFPTDD'
    , state: 'RUNNING'
    , ensured: false
    , ignorable: false
    , adTime: 2000
    , event: 'advertisement'
    , iid: '621a334f-c748-47bd-9f9b-a926d7619a77'
    , pid: 'e993539d-bb12-45e5-beff-b9f1d8da470b'
    , index: 16160494567343020000
    , replica: {
        is: false
    }
    , stateData: {
        time: 1583383484
    }
    , rinfo: {
        address: '192.168.0.1'
        , family: 'IPv4'
        , port: 5000
        , size: 255
    }
}
```

<br>

### Installation

```bash
npm install https://github.com/11ume/kable
```

<br>

> The project is under development but you can still try it.

<br>

### Usage

<br>

In the following context, we have two HTTP services what should communicate between them. The services are running in the port **3000** and **3001**.

<br>

The first service is called **foo**, this will be your identifier inside of your nodes cluster, and looks like this

<br>

> Note: kable does **not admits duplicate node ids, avoid this** ⚠️

**See: [duplicate node ids](#duplicate-node-ids)**

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

The **foo** node request the updated information and location of **bar** node

``` typescript
foo.pick('bar'): Promise<NodeRegistre> 
```

<br>

### Possibles scenarios after requesting a node

* The **bar** service has not yet started or is in a state of unavailable.
  * The node pick method, will put the request in a wait queue until the node **bar** has been announced, then will take the node immediately.
  
 <br>

**Note:** If everything is working normally, correctly and redundant, the next scenarios going to be the most probable and fastest.
 
* Exist multiple replicas of the **bar** service.
   * Will take the first available node replica, in the next invocation of the method **pick**, will take the following replica applying Round Robin algorithm. Each node internally contains an ordered queue of available nodes.
  
<br>

* The **bar** service is already available and is stored in the nodes registre of the service **foo**.
  * Will take the node immediately.

<br>

The second service is called **bar**, and this is similar to the first, surely you are thinking that it is a cyclic reference, but we will simply ignore this for this example and u can observe how theses two services are able to found each other immediately.

<br>

```typescript
import kable from 'kable'
import { createServer } from 'http'

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

Now surely you are wondering what is happening **under the hood**?

The first thing that is done when the **pick** method is called, is look for the requested node in the node registry **(In his memory)**. 
If he cannot found it in his **cache** of nodes, he will wait for that node for an estimated time, 
by default **5 minutes**, This operation may be aborted when you deem it necessary.

<br> 

* Normally, if everything goes well, the node always look for the required node in his cache, or in case of replicas existence, it will send the first available replica, This is really **fast** and that's where the speed of kable lies.

<br>

### Node state

<br>

> Each node contains a states machine, with five possible states
A node can change of state using the following methods:

#### State transitions methods

<br>

```typescript
const foo = kable('foo')

foo.up()
foo.start()
foo.stop()
foo.doing()
foo.down()
```
<br>

**Note:** The **up** method can receive a boolean argument, the default is true. 
When this method is invoked his places the node in the running state, is simply so you don't have to invoke **up** method and then **start**, maybe it may not make sense to you in this moment, but in another context you will need it.

<br>

```typescript
const foo = kable('foo')
foo.up(false) // start kable in up state 
```
<br>

```typescript
const foo = kable('foo')
foo.up() // start kable in running state
```
<br>

As i said kable have a state machine, so the passage from one state to another is extremely strict, **a transaction not allowed will invoke an expression**.

<br>

#### State transitions table

<br>

| States          | Possible transitions                       |
| --------------- | ------------------------------------------ |
| UP              | RUNNING - DOING_SOMETHING - STOPPED - DOWN |
| DOWN            | UP                                         |
| RUNNING         | DOING_SOMETHING - STOPPED - DOWN           |
| STOPPED         | DOING_SOMETHING - RUNNING - DOWN           |
| DOING_SOMETHING | DOING_SOMETHING - RUNNING - STOPPED - DOWN |

<br>

You will surely use other tools to monitor the status of your nodes, like PM2 but it is not enough 
for a distributed service system.

* Is of critical order and necessary react before the things happens, for this kable need know in what state are the nodes with great pressicion.
* The load balancing system needs to know what state the nodes are in to work well and faster.
* You and the visualization and control systems, need to know what state your nodes are in.
* Kable needs to know when must be start, stop, when to warn that a node is very busy or overloaded.

<br>

*The states:*

* **UP**: This is normally the initial state.
  * Indicates that the node has started to work but, it is still not serving.
* **RUNNING**: This is normally the second state after up, and the first that must be invoked after any of the others.
  * Indicates that the node totally operative and is ready to serve. 
* **STOPPED**: This state is invoqued when you need to stop the node for some reason.
  * Indicates that node is stopped and not serving. 
* **DOING_SOMETHING**: This state is invoqued when you need indicate that node is doing something and is not ready for serve, for example:
  * A use case would be when the node is waiting for another node or external service.
  * Other, can be when the node event loop is overloaded, or prone to overload.
* **DOWN**: This state is always the last state.
  * Indicates that node is totally stopped and inoperative. 

<br>

### Duplicate node ids

<br>

when a node detects a duplicate node id, it emits an **error** event called

> duplicate_node_id

The nodes with duplicate id are ignored by all nodes that already have its in their list.
You can capture this event using [Capturing the error that is emitted using the kable internals module](https://github.com/11ume/kable-core):

```ts
foo.on('err', ({ event })) => event.duplicate_node_id === 'duplicate_node_id' && console.log(event))
```

> Also with the vscode kable tool you will be able to visualize it.

<br>

### Node sentinels

> A sentinel node is a especial node prepared to run with the minimum configuration. 
His only objective is observe the status of a particular resource, such as a database or an external service, for then inform the other nodes.

You can see an example of how this work, in the examples folder of this repo:

<br>

**[Sentinel example](https://github.com/11ume/kable/tree/master/examples/sentinel)**

<br>

### Node replicas

<br>

> The replica nodes are and work in the same way as all the systems you already know.

This is where the load balancer and service discovery system come into play.
You just have to tell Kable two things, then he will do all the smart work for you:

<br>

1. The first indicate the id **"foo"**.
2. The second will be set the replica property in true **{ replica: true }**.

<br>

> The first node is called **foo**
```typescript
const foo = kable('foo')
foo.up()
```

<br>

> The second node is **replica of foo**
```typescript
const foo = kable('foo', { replica: true })
foo.up()
```

Now we have a node called foo and its replica working, soo easy right?.

<br>

### The Service discovery

<br>

### How discovery service works?

kable uses **UDP Broadcast method**, to locate each node inside of same subnet.
Each nodes send and recibe messages to the other nodes to inform about their state of health, their location, metadata, and other things, these messages are sent in intervals of time by default **3 seconds** or immediately when a status update is performed in some node.

For reduce the amout of data emited, that messages are serialized via **[Message Pack](https://msgpack.org/)**, therefore they are very small.

<br>

> Important note: In most production environments like **Digitalocean** or **AWS EC2** etc, it is not possible to perform UDP brodcasting, therefore is necessary to use an **[overlay network](https://en.wikipedia.org/wiki/Overlay_network)**
like those provided by **Docker Swarm**, **Kubernates**. In a future Kable could solve this problem by implementing a protocol called **[SWIM](https://www.brianstorti.com/swim/)**

<br>

### Lifecycle

<br>

The discovery service starts working when the **up** method is invoked, and ends when the **down** method is called.

<br>

### Fault tolerance

#### What happens if some node don't call the **down** method?

> Well, kable always tries to emit his termination status, therefore if the process ends abruptly, it will intercept the termination signal before of this happens, and will issue the termination status **down**, with the signal and the exit code.

<br>

#### what happens if a node stops working abruptly whit out singal kill

> This would be the worst that could happen since the node would remain in its last state until it was removed from the records, there is no way to predict that a node will stop working whit anticipation, can be innumerable factors those who could generate this. But each node has a **node timeout controller**, that will remove the inactive node from his registry, once the estimated waiting time is over by default **3 seconds**.
> In short, your entire system will take 3 seconds to react to this event, but if everything is properly designed and running it never shouldn't happen.

<br>
<br>

#### Security
#### The load balancer
#### The messages
#### The messages










