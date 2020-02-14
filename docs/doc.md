<br>

### API

<br>

> Kable aims to be extremely simple to hide all unnecessary complexity.

<br>

```typescript
import kable from 'kable'
```

### Function contructor of kable service

```ts
function kable(id?: string, options?: KableComposedOptions): Kable
```

<br>

```ts 
type KableComposedOptions = {
    host?: string
    , port?: number
    , meta?: NodeMetadata
    , key?: string | Buffer
    , replica?: boolean
    , adTime?: number
    , ignorable?: boolean
    , ignoreProcess?: boolean
    , ignoreInstance?: boolean
    , pickTimeoutOut?: number
    , tport?: number
    , taddress?: string
    , unicast?: string | string[]
    , multicast?: string
    , broadcast?: string
    , reuseAddr?: boolean
    , protocol?: DgramProtocol
    , exclusive?: boolean
    , depedencies?: string | string[]
}
```

<br>

```ts
function up(): Promise<void>
```

<br>

```ts
function down(): Promise<void>
```

<br>

```ts
function start(): void
```

<br>

```ts
function stop(reason?: string): void
```

<br>

```ts
function doing(reason?: string): void
```

<br>

```ts
function pick(id: string, options?: PickOptions): Promise<NodeRegistre>
```

<br>

```ts
function suscribe(id: string, fn: SuscriberFn): void
```

<br>

```ts
function suscribeAll(fn: SuscriberFn): void
```

<br>

```ts
function unsubscribe(fn: SuscriberFn): void
```







