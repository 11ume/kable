<br>

### API

<br>

> Kable is designed to be extremely simple and easy to implement and learn.

<br>

```typescript
import kable from 'kable'
```

### Function contructor of kable service

```ts
kable(id?: string, options?: Options): Kable

// example
const foo = kable('foo')
```
<br>

#### Constructor options

<br>

* id?: <string>
  > Unieque identificator of each service
  - By default: hostname  

* options?: <Options>
  * host? <string>
    > IP address of that node
    - By default: your ip  
  * port? <number>
    > Port of that node
    - By default: 3000  
  * meta? <NodeMetadata>
    > Drastic description of this node  
    - By default: null  
  * avaliable?: <boolean>
    > Check if it node is in available state
    - By default: true  
  * key? <string | Buffer>
    > Encryption key, is used to encrypt messages that are sent between nodes 
    - By default: null  
  * replica? <boolean>
    > Its for indicated if this module is a replica of another node 
    - By default: false  
  * adTime? <number>
    > Indicate in miliseconds, how often this node should be announced 
    - By default: 2 seconds  
  * ignorable? <boolean>
    > if it is true it node will be ignored by the other nodes in the same network 
    - By default: false  
  * ignoreProcess? <boolean>
    > If true, this node will ignore all messages received from your same process 
    - By default: false  
  * ignoreInstance? <boolean>
    > If true, this node will ignore all messages received from your same instance 
    - By default: true  
  * pickTimeoutOut? <number>
    > Indicate in milliseconds how often wait for the registration of all requested nodes
    - By default: 5 minutes  
  * tport? <number>
    > Port used internally to send messages
    - By default: 5000  
  * taddress? <number>
    > Address used internally to send messages
    - By default: 0.0.0.0
  * unicast? <string | string[]>
    > Set UDP unicast addresses
    - By default: null
  * multicast? <string | string[]>
    > Set UDP multicast addresses
    - By default: null
  * broadcast? <string | string[]>
    > Set UDP brodcast addresses
    - By default: 255.255.255.0
  * reuseAddr? <boolean>
    > If true it node can reuse the same port, for send UDP messages
    - By default: true
  * protocol? <DgramProtocol>
    > The address family ('IPv4' or 'IPv6')
    - By default: 'IPv4'
  * exclusive? <boolean>
    > The options object may contain an additional exclusive property that is used when using dgram.Socket objects with the cluster module. When exclusive is set to false (the default), cluster workers will use the same underlying socket handle allowing connection handling duties to be shared. When exclusive is true, however, the handle is not shared and attempted port sharing results in an error.
    - By default: false
  * depedencies? <string | string[]>
    > Dependency list of this node
    - By default: null

<br>

> Start all internals processes and set that node in up state

```ts
up(): Promise<void>
```

<br>

> Terminate all internals processes and set that node in down state

```ts
down(): Promise<void>
```

> Set that node in running state 

<br>

```ts
start(): void
```

<br>

> Set that node in stopped state 

```ts
stop(reason?: string): void
```

<br>

> Set that node in doing something state
 
```ts
doing(reason?: string): void
```

<br>

> Request a node by you identificator.
  This method will wait an default time, if the requested node has not been announceyet once the time is up, a timeout error will be issued.
  This request is a promise and can be aborted, using an operation controller.
  [op-abort](https://github.com/11ume/op-abort)

```ts
pick(id: string, options?: PickOptions): Promise<NodeRegistre>
```

<br>

> Start to listening events of a node.

```ts
suscribe(id: string, fn: SuscriberFn): void
```

> Stop listening events.

```ts
unsubscribe(fn: SuscriberFn): void
```

<br>

> Start to listen events in all available nodes.

```ts
suscribeAll(fn: SuscriberFn): void
```







