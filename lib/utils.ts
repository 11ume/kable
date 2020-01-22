import * as crypto from 'crypto'
import uuid from 'uuid'
import ERROR from './constants/error'
import { V4Options } from 'uuid/interfaces'

type StateTable = {
    [key: string]: string[]
}

export const isDev = (mode: string) => mode === 'development'
export const objIsFalsy = <T>(obj: T) => !(typeof obj !== 'undefined' && obj !== null)
export const arrIsEmpty = <T>(arr: T[]) => arr.length === 0
export const arrIsNotEmpty = <T>(arr: T[]) => arr.length > 1
export const arrNumbSortAc = (arr: number[]) => arr.sort((a, b) => a - b)
export const arrIfCheckExist = <T>(arr: T[], key: T) => Boolean(arr.filter((i) => i === key).length)

export const createUuid = (options?: V4Options) => uuid(options)

export const getDateNow = () => Date.now()

export const createError = (name: string, msg: string) => {
    const err = new Error(msg)
    err.name = name
    return err
}

export const roundRound = <T>(array: T[], index = 0) => () => {
    index >= array.length && (index = 0)
    return array[index++]
}

export const fnPatch = <T, S extends object>(name: string, source: S, invokerFn: (...args: any[]) => T) => {
    const call: (...args: any[]) => any = source[name]
    source[name] = (...args: any[]) => {
        const ret = call(...args)
        invokerFn(...args)
        return ret
    }
}

export const genRandomNumber = () => {
    const random = crypto.randomBytes(8).toString('hex')
    return parseInt(random, 16)
}

export const craateStateMachine = (stateTable: StateTable) => {
    return function transition<T extends string>(currentState: string, newState: T) {
        const allowedStates = stateTable[currentState]
        if (allowedStates && !allowedStates.includes(newState)) {
            const err = ERROR.ILLEGAL_TRANSITION_STATE
            throw createError(err.name, err.message(currentState, newState, allowedStates))
        }

        return newState
    }
}