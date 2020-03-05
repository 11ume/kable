<br>

### Getting started

<br>

The architecture of kable is based on a decentralized service system where each service have in his memory an record of the location and status of all others services that are in his same cluster.

* The main objective of **Kable** is to facilitate the service discovery process.
* Instead of each service having to register, deregister and update your status in a central system, each service has is responsible for carrying out this work separately **with a low cost**, it may seem unattractive in a first impression but, **what benefits have it?**
  * Is highly fault tolerant, by his decentralized nature. 
  * Don't require nothing outside of **Node.js** ecosystem. 
  * No extra hops, in a decentralized system many request are made to achieve something simple, this is very expensive in terms of performance, resource consumption and add network traffic noise.

Once they implement **Kable** in some service, is turned into a **node**, since it now starts to be a part of a network of connected nodes.

These nodes send messages to the other nodes to inform about their state of health their location,metadata, and other things, these messages are sent in time intervals.


<br>
<br>

#### Installation

```bash
npm install https://github.com/11ume/kable
```

<br>

> The project is under development but you can still try it.

<br>

#### Usage

<br>

In the following context, we have two HTTP services what should communicate between them. The services are running in the port **3000** and **3001**.

<br>

The first service is called **foo**, this will be your identifier inside of your nodes cluster, and looks like this

<br>

> Note: kable does **not admits duplicate node ids** ⚠️

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

The **foo** node requests the updated information and location of **bar** node

``` typescript
foo.pick('bar'): Promise<NodeRegistre> 
```

<br>

> Possibles scenarios

* The **bar** service has not yet started or is in a state of unavailable.
  * The node pick method, will put the request in a wait queue until the node **bar** has been announced, then will take the node immediately.
  
 <br>
  
 
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

<br>

Well, kable uses **UDP Broadcast**, to locate each node inside of same subnet.
Each node sends and receives information on his location and current status every certain time, or immediately when a status update is performed in some node. 

<br>

> Note: In most production environments like **Digitalocean** or **AWS EC2** etc, it is not possible to perform UDP brodcasting, therefore is necessary to use an **[overlay network](https://en.wikipedia.org/wiki/Overlay_network)**
like those provided by **Docker Swarm**. In a future Kable could solve this problem by implementing a protocol called **[SWIM](https://www.brianstorti.com/swim/)**

<br>

The first thing that is done when the **pick** method is called, is look for the requested node in the node registry **(In his memory)**. 
If he cannot found it in his **cache** of nodes, he will wait for that node for an estimated time, 
by default **5 minutes**, This operation may be aborted when you deem it necessary.

<br> 

* Normally, if everything goes well, the node always look for the required node in his cache, or in case of replicas existence, it will send the first available replica, This is really **fast** and that's where the speed of kable lies.

<br> 

The method **up**, will puts kable to work and set the node in the second state called **running**.

<br>

The method **down**, stops all cable tasks, and will set the node in the latest state called **down**. 

<br>

> **Note**: Each node contains a states machine, with five possible states: **up** - **running** - **doing** - **stopped** - **down**.

<br>

What happening if some node don't call the **down** method?, well, kable always tries to issue his termination status, therefore if the process ends abruptly, it will intercept the termination signal before of this happening, and will issue the termination status **down**, with the signal and the exit code.

<br>

In the case of an controlled closing be invoked or an abrupt closure is never be emitted, each node has a **node timeout controller**, that will remove the inactive node from his registry, once the estimated waiting time is over by default **3 seconds**.

<br>

#### Node sentinels

<br>

> A sentinel node is a especial node prepared to run with the minimum configuration. 
His only objective is observe the status of a particular resource, such as a database or an external service, for then inform the other nodes.


You can see an example of how this work, in the examples folder of this repo:

<br>

**[Sentinel example](https://github.com/11ume/kable/tree/master/examples/sentinel)**

<br>

#### Duplicate node ids

<br>

when a node detects a duplicate node id, it emits an especial event called:

* duplicate_node_id

The nodes with duplicate id are ignored by all nodes that already have it in their list.




