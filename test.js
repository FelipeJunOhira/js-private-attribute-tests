var clc = require('cli-color');

var testCounter;

function suite(fn) {
  testCounter = 0;
  var timeMark = clc.cyanBright('\nTest suite duration');
  console.time(timeMark);
  console.log('');
  try {
    fn();
    console.log('\n\n');
    console.log(clc.blueBright('All ' + testCounter + ' tests passing!'));
  } catch (e) {
    console.log(clc.redBright(e));
  } finally {
    console.log('');
    console.timeEnd(timeMark);
    console.log('\n');
  }
}

function test(description, fn) {
  try {
    fn();
    printSuccessMessage();
    testCounter++;
  } catch (e) {
    console.log('');
    throw buildTestErrorMessage(description, e.message);
  }
}

function printSuccessMessage() {
  process.stdout.write(clc.greenBright("."));
}

function buildTestErrorMessage(description, errMessage) {
  var text = "\n";
  text += "Test failed for: " + description;
  text += errMessage;
  return text;
}


// equal(expect, actual)
function equal(expect, actual) {
  console.assert(expect == actual, buildEqualErrorMessage(expect, actual));
}

function buildEqualErrorMessage(expect, actual) {
    var errMessage = "\n";
    errMessage += "\n\t\tExpect: '" + expect + "'";
    errMessage += "\n\t\tGot: '" + actual + "'";
    return errMessage;
}

// notEqual(expect, actual)
function notEqual(expect, actual) {
  console.assert(expect != actual, buildNotEqualErrorMessage(expect, actual));
}

function buildNotEqualErrorMessage(expect, actual) {
    var errMessage = "\n";
    errMessage += "\n\t\tExpect '" + expect + "'";
    errMessage += " to be different of '" + actual + "'";
    return errMessage;
}


// isInstanceOf(obj, constructor)
function isInstanceOf(obj, constructor) {
  console.assert(obj instanceof constructor, buildIsInstanceOfErrorMessage(obj, constructor));
}

function buildIsInstanceOfErrorMessage(obj, constructor) {
    var errMessage = "\n";
    errMessage += "\n\t\tExpect '" + obj + "' to be instance of '" + constructor.name + "'";
    return errMessage;
}


// hasProperty(obj, propName)
function hasProperty(obj, propName) {
  console.assert(obj.hasOwnProperty(propName), buildHasPropertyErrorMessage(obj, propName));
}

function buildHasPropertyErrorMessage(obj, propName) {
    var errMessage = "\n";
    errMessage += "\n\t\tExpect '" + obj + "' to have property '" + propName + "'";
    return errMessage;
}

// notHasProperty(obj, propName)
function notHasProperty(obj, propName) {
  console.assert(!obj.hasOwnProperty(propName), buildHasPropertyErrorMessage(obj, propName));
}

function buildHasPropertyErrorMessage(obj, propName) {
    var errMessage = "\n";
    errMessage += "\n\t\tExpect '" + obj + "' to not have property '" + propName + "'";
    return errMessage;
}

// shouldThrow(fn)
function shouldThrow(fn) {
  try {
    fn();
  } catch (e) {
    return;
  }
  throw new Error(buildShouldThrowErrorMessage());
}

function buildShouldThrowErrorMessage() {
    var errMessage = "\n";
    errMessage += "\n\t\tExpect to throw";
    return errMessage;
}



/* Tests */

var ClassBuilder = require('./class_builder');

suite(function() {
  test('ClassBuilder can be instantiated', function() {
    isInstanceOf(new ClassBuilder(), ClassBuilder);
  });

  test('ClassBuilder has public property', function() {
    hasProperty(new ClassBuilder(), 'public');
  });

  test('ClassBuilder has private property', function() {
    hasProperty(new ClassBuilder(), 'private');
  });

  test('ClassBuilder.build() returns a constructor function', function() {
    var b = new ClassBuilder();
    var constructor = b.build();
    isInstanceOf(new constructor(), constructor);
  });

  // Obj means instances of the constructor function

  test('Obj inherit from ClassBuilder public object', function() {
    var b = new ClassBuilder();

    b.public.name = 'Test123';

    b.public.sayHello = function() {
      return 'Hello';
    };

    var Constructor = b.build();

    var obj = new Constructor();
    equal('Test123', obj.name);
    equal('Hello', obj.sayHello());
  });

  test('Obj public methods can reference public properties', function() {
    var b = new ClassBuilder();

    b.public.name = 'Test123';

    b.public.getName = function() {
      return this.name;
    };

    b.public.greet = function() {
      return this.getName();
    };

    var Constructor = b.build();

    var obj = new Constructor();
    equal('Test123', obj.greet());
  });

  test('Obj private properties can be referenced inside public methods', function() {
    var b = new ClassBuilder();

    b.private.name = 'Test123';

    b.public.getName = function() {
      return this.name;
    };

    var Constructor = b.build();

    var obj = new Constructor();
    equal('Test123', obj.getName());
  });

  test('Obj private properties can not be referenced directly from Obj', function() {
    var b = new ClassBuilder();

    b.private.name = 'Test123';

    var Constructor = b.build();

    var obj = new Constructor();
    notEqual(obj.name, 'Test123');
  });

  test('Obj private methods can not be called directly from Obj', function() {
    var b = new ClassBuilder();

    b.private.getPassword = function() {
      return 1234;
    };

    var Constructor = b.build();

    var obj = new Constructor();
    shouldThrow(function() {
      obj.getPassword();
    });
  });

  test('Obj private properties can be modified only by public methods', function() {
    var b = new ClassBuilder();

    b.private.counter = 0;

    b.public.incrementCounter = function() {
      this.counter++;
    }

    b.public.getCounter = function() {
      return this.counter;
    }

    var Constructor = b.build();

    var obj = new Constructor();
    equal(0, obj.getCounter());
    obj.incrementCounter();
    equal(1, obj.getCounter());
    obj.incrementCounter();
    equal(2, obj.getCounter());
    obj.incrementCounter();
    equal(3, obj.getCounter());
  });

  test("Constructor instances don't interfer with each other", function() {
    var b = new ClassBuilder();

    b.public.counter = 0;

    b.private.internalCounter = 0;
    b.public.setInternalCounter = function(value) {
      this.internalCounter = value;
    };
    b.public.getInternalCounter = function() {
      return this.internalCounter;
    };

    var Constructor = b.build();

    var obj1 = new Constructor();
    var obj2 = new Constructor();

    equal(0, obj1.counter);
    equal(0, obj2.counter);

    obj1.counter = 10;

    equal(10, obj1.counter);
    equal(0, obj2.counter);


    equal(0, obj1.getInternalCounter());
    equal(0, obj2.getInternalCounter());

    obj1.setInternalCounter(10);

    equal(10, obj1.getInternalCounter());
    equal(0, obj2.getInternalCounter());
  });

  test('Obj can be set custom constructor', function() {
    var b = new ClassBuilder();

    b.constructor = function() {
      this.name = 'Test123';
    }

    var Constructor = b.build();

    var obj = new Constructor();
    equal('Test123', obj.name);
  });

  test('Obj can be set custom constructor with arguments', function() {
    var b = new ClassBuilder();

    b.constructor = function(name) {
      this.name = name;
    }

    var Constructor = b.build();

    var obj = new Constructor('Test123');
    equal('Test123', obj.name);
  });

  test("Set a private value don't turn it public", function() {
    var b = new ClassBuilder();

    b.private.internalCounter = 0;
    b.public.setInternalCounter = function(value) {
      this.internalCounter = value;
    };
    b.public.getInternalCounter = function() {
      return this.internalCounter;
    };

    var Constructor = b.build();

    var obj = new Constructor();

    equal(undefined, obj.internalCounter);

    obj.setInternalCounter(123);

    equal(undefined, obj.internalCounter);
    equal(123, obj.getInternalCounter());
  });

  test('Obj has no direct references to the public object', function() {
    var b = new ClassBuilder();

    b.public.internalCounter = 0;

    var Constructor = b.build();
    var obj = new Constructor();

    notHasProperty(obj, 'public');
  });

  test('Obj has no direct references to the private object', function() {
    var b = new ClassBuilder();

    b.private.internalCounter = 0;

    var Constructor = b.build();
    var obj = new Constructor();

    notHasProperty(obj, 'private');
  });
});
