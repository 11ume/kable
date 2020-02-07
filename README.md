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

kable is constituted by a series of modules, tools and special nodes called sentries nodes:
<br>

> Contains all modules and the main logic of Kable
<br>

**[kable-core](https://github.com/11ume/kable-core)**
<br>

> Is a little module to interact with some deep functionalities of kable
<br>

**[kable-internals](https://github.com/11ume/kable-internals)**
<br>

> A serie of node sentries. These are a series of special nodes, responsible for controlling with great precision the state of external services. You can create your own sentinel nodes.
<br>

Sentry | target
------------ | -------------
**[kable-mongo](https://github.com/11ume/kable-mongo)** | Mongo database
**[kable-pg](https://github.com/11ume/kable-pg)** | Postgresql database
<br>

> A cool node status visualization extension, created for vscode 🏄‍♀️.
<br>

**[kable-vscode](https://github.com/11ume/kable-vscode)**
<br>

<br>
<div align="center">
<img src="https://github.com/11ume/kable/blob/master/images/vscode-ext.png" width="500" height="auto"/>
</div>
<br>



