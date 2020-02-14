<br>
### Getting started
<br>

#### Usage
<br>

In the following context, we have two HTTP services what should communicate between them. The services are running in the port **3000** and **3001**.

<br>

The first service is called **foo**, this will be your identifier within the kable node architecture, and looks like this

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

Note: kable does **not admits duplicate id nodes**  

<br>
<br>

The second service is called **bar**, and this is similar to the first, yes you are thinking that it is a cyclic referral, but we will simply ignore this for this example.

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
<br>

Now surely you are wondering what is happening **under the hood**?

<br>

Well, kable uses **UDP Broadcast**, to locate each node inside of same subnet.
Each node sends and receives information on his location and current status every certain time, or immediately when a status update is performed in some node. 

> Note: In most production environments like Digitalocean or AWS EC2 etc, it is not possible to perform UDP brodcasting, therefore it is necessary to use an **(overlay network)[https://en.wikipedia.org/wiki/Overlay_network]**
like those provided by docker swarm.

The first thing that is done when the **pick** method is called, is look for the requested node in the node registry **(In his memory)**. 
If he cannot found it in his **cache** of nodes, he will wait for that node for an estimated time, 
by default **5 minutes**, This operation may be aborted when you deem it necessary.

Normally, if everything goes well, the node always look for the required node in his cache, or in case of replicas existence, it will send the first available replica.


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
<br>
