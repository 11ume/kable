export enum ERROR_TYPES {
    SOCKET_DGRAM = 'socket_dgram'
    , SOCKET_DGRAM_SEND = 'socket_dgram_send'
    , ENCODING_DGRAM_MESSAGE = 'encoding_dgram_message'
    , DECODING_DGRAM_MESSAGE = 'decoding_dgram_message'
    , DISCOVERY_SEND_HELLO = 'discovery_send_hello'
    , DISCOVERY_SEND_UPDATE = 'discovery_send_update'
    , DISCOVERY_SEND_UNREGISTRE = 'discovery_send_unregistre'
    , DISCOVERY_SEND_ADVERTISEMENT = 'discovery_send_advertisement'
}

export enum CUSTOM_ERROR_TYPE {
    DUPLICATE_NODE_ID = 'duplicate_node_id'
}

export enum NODE_UPDATE_TYPES {
    START = 'start'
    , STOP = 'stop'
    , DOING = 'doing'
}
