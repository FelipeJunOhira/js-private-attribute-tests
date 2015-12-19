module.exports = (function() {
  function DEFAULT_CONSTRUCTOR() {};

  function ClassBuilder() {
    this.public = {};
    this.private = {};
  }

  ClassBuilder.prototype.build = function() {
    this._setPrivateHierarchy();
    return this._buildContructor();
  };

  ClassBuilder.prototype._setPrivateHierarchy = function() {
    this.private.__proto__ = this.public;
  };

  ClassBuilder.prototype._buildImplementationObject = function() {
      var implementation = {};
      implementation.__proto__ = this.private;
      return implementation;
  };

  ClassBuilder.prototype._buildContructor = function() {
    var builder = this;
    var customConstructor = this.constructor;

    return function() {
      _delegateAllCallsToInternalImplementation.call(this, builder);
      customConstructor.apply(this, arguments);
    };
  };

  ClassBuilder.prototype.constructor = DEFAULT_CONSTRUCTOR;

  function _delegateAllCallsToInternalImplementation(builder) {
    var self = this;
    var implementation = builder._buildImplementationObject();

    _forEachAttribute(builder.public, _delegateCallToImplementationObject);

    function _delegateCallToImplementationObject(key, value) {
      if (typeof value === 'function') {
        self[key] = function() {
          return implementation[key].apply(implementation, arguments);
        };
      } else {
        Object.defineProperty(self, key, {
          get: function() { return implementation[key]; },
          set: function(value) { implementation[key] = value; },
          enumerable: true,
          configurable: false
        });
      }
    };
  }

  function _forEachAttribute(obj, fn) {
    for (var key in obj) {
      fn(key, obj[key]);
    }
  }

  return ClassBuilder;
})();
