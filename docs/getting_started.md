<br>

## Getting started

<br>

### Table of Contents

<br>

- **[Usage](#Usage)** 
  * **[Getting a node](#getting-a-node)**

- **[Installation](#installation)** 

- **[First impressions and goals](#first-impressions-and-goals)**

- **[what is a sentinel node](#node-sentinels)**

- **[What are the node states](#node-state)** 
  * **[State transitions methods](#state-transitions-methods)**
  * **[State transitions table](#state-transitions-table)**

- **[How create a node replicas](#how-create-a-node-replicas)** 

- **[The service discovery](#the-service-discovery)**
  * **[Lifecycle](#lifecycle)**
  * **[Fault tolerance](#fault-tolerance)**
  * **[How the discovery service works](#how-the-discovery-service-works)**

- **[What happens when duplicate nodes are found](#duplicate-node-ids)** 

- **[Security](#security)** 

- **[The load balancer](#the-load-balancer)** 
  * **[How the load balancer works](#how-the-load-balancer-works?)**
  * **[Nodes ignored by the your node state](#nodes-ignored-by-the-your-node-state)**
  * **[Loader balancer suggestions](#loader-balancer-suggestions)**

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

#### Getting a node

<br>

*The **pick** method is used to get the information of some node in particular.* 
> This method must be invoked for example: every time a request is made for getting another node. To know where he is located (ip:port) and know about his status.

<br>

``` typescript
foo.pick('bar'): Promise<NodeRegistre> 
```

<br>

### Possibles scenarios after requesting a node

<br>

```bash
                                               +--------------+                 
                                               | Get foo node |                 
                                               +--------------+                 
                                                      |                         
                                         +---------------------------+                 
                                         |       Is in cache?        | <----------------- +
                                         +---------------------------+                    |
                                         |                           |                    |
                                   +-----+                           +-----+              |
                                   | Yes |                           | No  |              |
                                   +-----+                           +-----+              |
                                         |                           |                    |
                        +----------------+                           +--------------------+
                        | Have replicas? |                           |    Wait for he     |
                        +----------------+                           +--------------------+
                        |                |
                  +-----+                +-----+              
                  | Yes |                | No  |              
                  +-----+                +-----+  
                  |                            |
   +-------------------------------+           +---------------------------------+
   | Get first replica immediately |           | Get the unique node immediately |  
   +-------------------------------+           +---------------------------------+                               

```

<br>

- The **bar** service has not yet started or is in a state of unavailable.
  * The node pick method, will put the request in a wait queue until the node **bar** has been announced, then will take the node immediately.
  
- Exist multiple replicas of the **bar** service.
   * Will take the first available node replica, in the next invocation of the method **pick**, will take the following replica applying Round Robin algorithm. Each node internally contains an ordered queue of available nodes.
  
- The **bar** service is already available and is stored in the nodes registre of the service **foo**.
  * Will take the node immediately.

<br>

***Note:** If everything is working normally, correctly and redundant, the second and the third scenarios going to be the most probable and fastest.*

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
by default **5 minutes**. 
This operation may be aborted when you deem is necessary, using a especial utility created by me [op-abort](https://github.com/11ume/op-abort).

<br>

*Unfortunately the promises do not have a native logic of cancellation, to canceled it, is necessary to use external tools.*

<br>

```bash
npm install op-abort
```

<br>

```typescript
import kable from 'kable'
import oa from 'op-abort'

(async function() {
    const foo = kable('foo')
    await foo.up()

    const opAbort = oa()
    await foo.pick('non-existent-node', { opAbort })

    setTimeout(opAbort.abort, 1000)
    console.log('This runs after 5 seconds')
}())

```

<br>

*We have requested a node that does not exist, so the **pick** method will wait 5 seconds until the  **non-existent-node** until it is announced, and this will never happens. In somes contexts like the shown in the previous example, the pick method could block the process for 5 seconds and whitout op-abort, you would have no way to cancel the operation.*

<br>

To understand that other magic 🧙 things are happening see: **[The service discovery](#the-service-discovery)**

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

As i said kable have a state machine, so the passage from one state to another is extremely strict, **a transitions not allowed will invoke an expression**.

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
* **STOPPED**: This state is invoked when you need to stop the node for some reason.
  * Indicates that node is stopped and not serving. 
* **DOING_SOMETHING**: This state is invoked when you need indicate that node is doing something, and its not ready for serve, for example:
  * A use case would be when the node is waiting for another node or external service.
  * When the node event loop is overloaded, or prone to overload.
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
import kableInternals from 'kable-internals'

const foo = kableInternals('foo')
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

#### How the discovery service works?

<br>

The service discovery system is really fast and automatic.

<br>

> kable uses **UDP Broadcast method** whit a [Broadcast address](https://en.wikipedia.org/wiki/Broadcast_address), by default **255.255.255.0**, to locate each node inside of same network.
 
> Each nodes send and recibe messages to the other nodes to inform about their state of health, their location, metadata, and other things, these messages are sent in intervals of time by default **3 seconds** or immediately when a status update is performed in some node.

> Each node keeps a record in his memory of all nodes that are found in his same network, this record is updated periodically.

> For reduce the amout of data emited, that messages are serialized via **[Message Pack](https://msgpack.org/)**, therefore they are very small.

> The messages are emitted every time an event is triggered:

  * **update**
    * Is emitted when the node change of state. 
  * **unregistre**
    * Is emitted when the node informs that it will unsubscribe.
  * **advertisement**
    * Is emitted periodically to inform in what state the node is, similar to a health check.

<br>

**Note:** Kable also supports **unicast** and **multicast**, but is recommended use always **broadcast**.

<br>

> **Important note**: In most of production environments like **Digitalocean** or **AWS EC2** etc, it is not possible to perform UDP brodcasting, therefore is necessary to use an **[overlay network](https://en.wikipedia.org/wiki/Overlay_network)**
like those provided by **Docker Swarm**, **Kubernates**. In a future Kable could solve this problem by implementing a protocol called **[SWIM](https://www.brianstorti.com/swim)**.

<br>

### Lifecycle

<br>

The discovery service starts to working when the **up** method is invoked, and ends when the **down** method is called.

<br>

### Fault tolerance

<br>

#### What happens if some node don't call the **down** method?

> Well, kable always tries to emit his termination status, therefore if the process ends abruptly, it will intercept the termination signal before of this happens, and will issue the termination status **down**, with the signal and the exit code.

<br>

#### what happens if a node stops working abruptly whit out singal kill?

> This would be the worst that could happen since the node would remain in its last state until it was removed from the records, there is no way to predict that a node will stop working whit anticipation, can be innumerable factors those who could generate this. But each node has a **node timeout controller**, that will remove the inactive node from his registry, once the estimated waiting time is over by default **3 seconds**.
> In short, your entire system will take 3 seconds to react to this event, but if everything is properly designed and running it never shouldn't happen.

<br>

### Security

<br>

**kable** handles the security of the messages it emits and receives through encryption.
As explained above, **Kable** emits UDP messages via the broadcast method, by default these messages travel in plain text. 

And anyone who is on the same network, will be able to read and modify these messages using [MitM](https://en.wikipedia.org/wiki/Man-in-the-middle_attack) attack.

To mitigate this, **Kable** implements the encryption of each message that is emitted applying **[AES CBC 256](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)** algorithm.

*This will not prevent you from being a victim of a **MitM** attack, but **the attacker will not be able to read the messages or modify them***.

<br>

> For example you can use **openssl** bash command to generates 32 random bytes (256 bits) key.

```bash
openssl rand -base64 32
```

<br>

> This node now will encrypt all his messages, and rejects all messages coming from other nodes that do not have the same key.

<br>

```typescript
const foo = kable('foo', { key: 'x4wl1vHLBcENpF+vbvnyWqYbNyZ1xUjNDZYAbLROTLE='})
foo.up()
```

<br>

> The best way to create keys and manage them is using tools like **[Vault](https://www.vaultproject.io/)**.
*You can devise your own way of sharing the keys but make sure it be safe*.

<br>
<br>

### The load balancer

<br>

**kable** have an smart and implicit load balancer. 

<br>

### How the load balancer works?

<br>

The load balancer has a queue of nodes in its register.
Every time a node is announced or unsubscribed this add or removes that node from its queue.

As kable is based on a series of distributed nodes that will start and stop in asynchronously, 
the load balancer system, needs to find the best way to organize this node queue in each node of same way. For this each node has an especial property called **index**, that is an **unique** number.

<br>

**Node:** The load balancer applying Round Bobin algorithm and first to be available to work. 

<br>

So each node, have the same **no sequencial** but organized node queue inside. 

<br>

*In the next example we have seven nodes **foo**, **bar** and **baz** and a few foo replicas, let's see how their node tails look:*

<br>

> Foo node
```bash
foo  
  ├── baz
  └── bar
```

> Bar node
```bash
bar  
  ├── baz
  ├── foo
  ├── foo:3
  ├── foo:1
  └── foo:2
```

> Baz node
```bash
baz  
  ├── bar
  ├── foo
  ├── foo:3
  ├── foo:1
  └── foo:2
```

<br>

Now let's go back to the example where explain what happens when a node is requested [Getting a node](#Getting-a-node)

<br>

> If we see the organization of the row that i showed previously, and knowing as I said earlier that the load balancer uses the round Robing Algorithm, is possible to predict the following behavior, of these requests:

<br>

``` typescript
bar.pick('foo') // foo
bar.pick('foo') // foo:3
bar.pick('foo') // foo:1
bar.pick('foo') // foo:2
```
<br>

``` typescript
baz.pick('foo') // foo
baz.pick('foo') // foo:3
baz.pick('foo') // foo:1
baz.pick('foo') // foo:2
```

*Thanks to this organization the load is always divided evenly and we do not overload any node*.

<br>

Now remember that I said that Kable has an internal state machine, well the load balancer is based on the state of each node to decide whether to take a node or request the next one in the row.

The nodes found in the next states are totally ignored by the load balacer alogorithm, and are not in the work queue:

<br>

### Nodes ignored by the your node state

<br>

| States          | Ignored |
| --------------- | ------- |
| UP              | yes     |
| DOWN            | yes     |
| STOPPED         | yes     |
| RUNNING         | no      |
| DOING_SOMETHING | yes     |

<br>

Let's look at an example of this

<br>

> Foo node states

<br>

```bash
foo:running  
  ├── foo3:running
  ├── foo1:stopped
  └── foo2:up
```
<br>

*suppose the **foo2** node can be in running state after **2 seconds***

<br>

The result would be the following:

<br>

``` typescript
baz.pick('foo') // foo
baz.pick('foo') // foo3
baz.pick('foo') // foo
baz.pick('foo') // foo3

// 2 seconds after 
baz.pick('foo') // foo2
baz.pick('foo') // foo
```

<br>

### Loader balancer suggestions

<br>

Now that you know how it works you can help load balancer to make it more efficient.

<br>

#### **How?**

<br>

One of the ways is to notify the load balacer that a node is overloaded or that it will be busy for a long time.

<br>

**How are you going to achieve this, very easy see:**

<br>

Using tools like [node-toobusy](https://github.com/lloyd/node-toobusy), we can know the state of the event loop and anticipate that a request arrives at this node.

<br>

```typescript
import kable from 'kable'
import toobusy from 'toobusy'
import { createServer } from 'http'

const middleware = (bar, next) => (_req, res) => {
  const id = Symbol()
  const state = bar.state

  if (toobusy()) {
      res.statusCode = 503
      bar.doing('Is too busy', id)
      return
    }

    if (state.id === id) {
      bar.start()
    }

    next()
}

const handler = async (_req, res) => {
  // processing this request requires some work!
  let i = 0
  while (i < 1e5) i++
}

const bar = kable('foo')
const server = createServer(middleware(bar, handler))
server.on('listening', bar.up)
server.on('close', bar.down)
server.listen(bar.port)
```

<br>

#### The messages
#### Interact whit deep logic of kable










