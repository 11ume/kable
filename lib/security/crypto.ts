import crypto from 'crypto'

export const encrypt = (key: string | Buffer, payload: Uint8Array): Buffer => {
    const KEY = Buffer.isBuffer(key) ? key : Buffer.from(key)
    const IV = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', KEY, IV)
    let encrypted = cipher.update(payload)

    encrypted = Buffer.concat([encrypted, cipher.final()])
    return Buffer.concat([IV, encrypted])
}

export const decrypt = (key: string | Buffer, payload: Uint8Array): Uint8Array => {
    const KEY = Buffer.isBuffer(key) ? key : Buffer.from(key)
    const IV = payload.slice(0, 16)
    const encryptedText = payload.slice(16, payload.length)
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, IV)
    let decrypted = decipher.update(encryptedText)

    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted
}
