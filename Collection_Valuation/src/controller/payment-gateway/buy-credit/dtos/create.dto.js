module.exports = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
    },
    _participants: {
      type: 'array',
      items: { type: 'string' }
    },
  },
  required: ['message', '_participants']
}