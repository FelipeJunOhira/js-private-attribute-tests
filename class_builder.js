module.exports = (function() {
  function DEFAULT_CONSTRUCTOR() {};

  function ClassBuilder() {
    this.public = {};
    this.private = {};
  }

  ClassBuilder.prototype.build = function() {
    this._setPrivateHierarchy();
    return this._buildContructor();;
  };

  ClassBuilder.prototype._setPrivateHierarchy = function() {
    this.private.__proto__ = this.public;
  }

  ClassBuilder.prototype._buildImplementationObject = function() {
      var implementation = {};
      implementation.__proto__ = this.private;
      return implementation;
  };

  ClassBuilder.prototype._buildContructor = function() {
    var builder = this;
    var customConstructor = this._getCustomConstructor();

    return function() {
      delegateAllCallsToInternalImplementation.call(this, builder);
      customConstructor.apply(this, arguments);
    };
  };

  ClassBuilder.prototype._getCustomConstructor = function() {
    return this.constructor || DEFAULT_CONSTRUCTOR;
  };

  function delegateAllCallsToInternalImplementation(builder) {
    var self = this;
    var implementation = builder._buildImplementationObject();

    function delegateCallToImplementation(key, value) {
      if (value instanceof Function) {
        self[key] = function() {
          return implementation[key].apply(implementation, arguments);
        };
      } else {
        self[key] = value;
      }
    }

    forEachAttribute(builder.public, delegateCallToImplementation);
  }

  function forEachAttribute(obj, fn) {
    for (var key in obj) {
      fn(key, obj[key]);
    }
  }

  return ClassBuilder;
})();
