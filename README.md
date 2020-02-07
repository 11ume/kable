<br>
<br>
<br>

<div align="center">
<img src="https://github.com/11ume/kable/blob/master/images/logo.png" width="150" height="auto"/>
</div>
<br>
<br>
<br>

**Kable** — Is a decentralized service discovery and load balancer system for Node.js
<br>
Is a simple and pretty alternative to others centralized systems which involve complex architectures, such as Nginx, Consul, DNS servers etc.
<br>
<br>

## Features

* Automatic service discovery
* Simply, easy to use and implement
* Completely decentralized, no single point of failure
* Each node keeps track of its own state, and knows in each moment in which state yours node peers are
* Secured, encrypting sensitive information of each emitted datagram
* Horizontally scalable, support node process replication
* Intelligent node load balancing applying round robin algorithm
* Agnostic, works in conjunction with any technology, Nest.js, Micro.js, Express.js, Apollo, MQTT, ZeroMQ, etc.
* Can monitor external resources through their sentinel nodes like kable-pg, kable-mongo etc.
* No need externals  DNS servers, load balancers or centralized systems of service discovery.

<br>

kable is constituted by a series of modules and special nodes called sentries nodes:
<br>

**[kable-core](https://github.com/11ume/kable-core)**
<br>

> Contains all modules and the main logic of Kable
<br>

**[kable-internals](https://github.com/11ume/kable-internals)**
<br>

> Contains an little module to interact and test the kable core functionalities
<br>

**[kable-mongo](https://github.com/11ume/kable-mongo)**
<br>

**[kable-pg](https://github.com/11ume/kable-pg)**
<br>

> A serie of node sentries. These are a series of special nodes, responsible for controlling with great precision the state of external services. You can create your own sentinel nodes 🏄‍♀️.

**This project is under developement 🔥**


