export const delay = (time: number) => new Promise((resolve) => setTimeout(resolve, time))
export const address = (host: string, port: number) => `tcp://${host}:${port}`
