export default {
    ILLEGAL_ABORT: {
        name: 'ILLEGAL_ABORT'
        , message: 'The abortion method was already invoked'
    }
    , ILLEGAL_TRANSITION_STATE: {
        name: 'TRANSITION_STATE'
        , message: (currentState: string, newState: string, allowedStates: string[]) => `Illegal state transition from ${currentState} => ${newState}, allowed: ${allowedStates.join(', ')}`
    }
    , DGRAM_MULTI_TRANSMISSION_METHOD: {
        name: 'DGRAM_MULTI_TRANSMISSION_METHOD'
        , message: 'You can only select one transmission method, unicast, multicast or broadcast'
    }
    , WRONG_LENGTH_SECURITY_KEY: {
        name: 'WRONG_LENGTH_SECURITY_KEY'
        , message: 'The security key must be 256 bit (32 characters)'
    }
    , NODE_PICK_WAITFOR_LIMIT_EXCEEDED: {
        name: 'NODE_PICK_WAITFOR_LIMIT_EXCEEDED'
        , message: (id: string) => `Exceded limit time for pick ${id}`
    }
}
