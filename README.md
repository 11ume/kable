<br>
<br>
<br>

<div align="center">
    <img src="https://github.com/11ume/kable/blob/master/images/logo.png" width="100" height="auto"/>
</div>

<br>

<div align="center">
    <img src="https://github.com/11ume/kable/blob/master/images/status.png" />
</div>

<br>
<br>

<div align="center">
  
![Build](https://github.com/11ume/kable-core/workflows/Build/badge.svg?branch=master)
[![codecov.io](https://codecov.io/github/11ume/kable-core/coverage.svg?branch=master)](https://codecov.io/github/11ume/kable-core?branch=master)
[![CodeFactor](https://www.codefactor.io/repository/github/11ume/kable-core/badge)](https://www.codefactor.io/repository/github/11ume/kable-core)
[![Known Vulnerabilities](https://snyk.io/test/github/11ume/kable-core/badge.svg?targetFile=package.json)](https://snyk.io/test/github/11ume/kable-core?targetFile=package.json)

</div>

<br>

<br>

**Kable** — Is a decentralized discovery service and load balancer system for Node.js
<br>

> An simple and pretty alternative to others centralized systems which involve complex architectures. 
<br>

**why?**

> Creating and maintaining a distributed services architectures is a very complex task, that involves things like load balancing, service discovery, health and status checking, fault tolerance, replication etc. The goal of **Kable** is to make some of these tasks easier to carry out. 
<br>

**This project is under active developement 🔥**

<br>
<br>

**[Getting Started](https://github.com/11ume/kable/blob/master/docs/getting_started.md)** **In progress**

<br>

<div align="center">
<img src="https://github.com/11ume/kable/blob/master/images/nodes.png" width="300" height="auto"/>
</div>
<br>


## Main features

* Automatic service discovery.
* Simply, easy to use and implement.
* Completely decentralized, no single point of failure.
* Each node maintains his own state, and knows in each moment the state of the nodes that are in their same subnet.
* Secured, encrypting sensitive information of each emitted datagram.
* Horizontally scalable, support node process replication.
* Intelligent node load balancing applying Round Bobin algorithm and first to be available.
* Agnostic, works in conjunction with any technology, Nest.js, Micro.js, Express.js, Apollo, MQTT, ZeroMQ, etc.
* Monitoring the status of external resources, through sentinel nodes.
* No need externals DNS servers, load balancers or centralized systems of discovery service.
* High performance because elimination of extra hop, everything a node might required is found in his memory, 
and is administered before it is requested.
* Master less architecture, all nodes are equal.
* Emits low amount of data. How?, not emitting redundant data and applying serialization via **[Message Pack](https://msgpack.org/)**.
* Implement Gossip protocol, **in review**.

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

| Sentry                                                  | target     | status |
| ------------------------------------------------------- | ---------- | ------ |
| **[kable-mongo](https://github.com/11ume/kable-mongo)** | Mongo      | 🟢     |
| **[kable-redis](https://github.com/11ume/kable-redis)** | Redis      | 🟢     |
| **[kable-pg](https://github.com/11ume/kable-pg)**       | Postgresql | 🟢     |
| **[kable-Memcached]()**                                 | Memcached  | 🔨     |
| **[kable-http]()**                                      | HTTP/HTTPS | 🔨     |
| **[kable-sync]()**                                      | TCP/UDP    | 🔨     |

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
