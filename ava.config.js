export default {
    cache: true,
    concurrency: 6,
    babel: {
        compileEnhancements: false
    },
    files: [
        '!dist'
        , '!dev'
    ],
    require: ['ts-node/register'],
    extensions: ['ts']
}