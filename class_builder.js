module.exports = (function() {
  function DEFAULT_CONSTRUCTOR() {};

  function ClassBuilder() {
    this.public = {};
    this.private = Object.create(this.public);
  }

  ClassBuilder.prototype.build = function() {
    var builder = this;
    var customConstructor = this.constructor;

    return function() {
      _delegateAllCallsToInternalImplementation.call(this, builder);
      customConstructor.apply(this, arguments);
    };
  };

  ClassBuilder.prototype.buildImplementationObject = function() {
      return Object.create(this.private);
  };

  ClassBuilder.prototype.constructor = DEFAULT_CONSTRUCTOR;

  function _delegateAllCallsToInternalImplementation(builder) {
    var self = this;
    var implementation = builder.buildImplementationObject();

    _forEachKeyValue(builder.public, function (key, value) {
      var attributeConfig = {
        enumerable: true,
        configurable: false
      };

      if (typeof value === 'function') {
        attributeConfig.get = function() {
          return implementation[key].bind(implementation);
        };
      } else {
        attributeConfig.get = function() { return implementation[key]; };
        attributeConfig.set = function(value) { implementation[key] = value; };
      }

      Object.defineProperty(self, key, attributeConfig);
    });
  }

  function _forEachKeyValue(obj, fn) {
    for (var key in obj) {
      fn(key, obj[key]);
    }
  }

  return ClassBuilder;
})();
