module.exports = function defaultSchemaAttributePlugin(schema, options) {
  schema.add({
    created: {
      type: Date,
      mergeable: false,
      default: Date.now,
    },
    modified: {
      type: Date,
      mergeable: false,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  });
  schema.pre('save', function preSave(next) {
    if (!this.isNew) {
      this.modified = Date.now;
    }
    next();
  });

  if (options && options.indexPaths) {
    Object.keys(options.indexPaths).forEach((key) =>
      schema.path(key).index(options.indexPaths[key])
    );
  }
};
