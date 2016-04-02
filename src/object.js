
function _immutable (obj, seen) {
    if (seen.indexOf(obj) === -1) {
        seen.push(Object.freeze(obj));

        Object.getOwnPropertyNames(obj).forEach(function (key) {
            var value = obj[key];

            if (typeof value === "object" && !isNull(value)) {
                _immutable(value, seen);
            }
        });
    }

    return obj;
}

function _keyToPair (key) {
    return [key, this[key]];
}

function _merge (getKeys) {
    return reduce(slice(arguments, 1), function (result, source) {
        forEach(getKeys(source), function (key) {
            result[key] = source[key];
        });

        return result;
    }, {});
}

var _pairsFrom = _curry(function (getKeys, obj) {
    return getKeys(obj).map(_keyToPair, obj);
});

var _tearFrom = _curry(function  (getKeys, obj) {
    return getKeys(obj).reduce(function (result, key) {
        result[0].push(key);
        result[1].push(obj[key]);
        return result;
    }, [[], []]);
});

var _valuesFrom = _curry(function (getKeys, obj) {
    return getKeys(obj).map(partial(getIn, obj));
});

/**
 * Builds a <code>checker</code> function meant to be used with {@link module:lamb.validate|validate}.<br/>
 * Note that the function accepts multiple <code>keyPaths</code> as a means to compare their values. In
 * other words all the received <code>keyPaths</code> will be passed as arguments to the <code>predicate</code>
 * to run the test.<br/>
 * If you want to run the same single property check with multiple properties, you should build
 * multiple <code>checker</code>s and combine them with {@link module:lamb.validate|validate}.
 * @example
 * var user = {
 *     name: "John",
 *     surname: "Doe",
 *     login: {
 *         username: "jdoe",
 *         password: "abc123",
 *         passwordConfirm: "abc123"
 *     }
 * };
 * var pwdMatch = _.checker(
 *     _.is,
 *     "Passwords don't match",
 *     ["login.password", "login.passwordConfirm"]
 * );
 *
 * pwdMatch(user) // => []
 *
 * user.login.passwordConfirm = "avc123";
 *
 * pwdMatch(user) // => ["Passwords don't match", ["login.password", "login.passwordConfirm"]]
 *
 * @memberof module:lamb
 * @category Object
 * @param {Function} predicate - The predicate to test the object properties
 * @param {String} message - The error message
 * @param {String[]} keyPaths - The array of property names, or {@link module:lamb.getPathIn|paths}, to test.
 * @param {String} [pathSeparator="."]
 * @returns {Array<String, String[]>} An error in the form <code>["message", ["propertyA", "propertyB"]]</code> or an empty array.
 */
function checker (predicate, message, keyPaths, pathSeparator) {
    return function (obj) {
        var getValues = partial(getPathIn, obj, _, pathSeparator);
        return predicate.apply(obj, keyPaths.map(getValues)) ? [] : [message, keyPaths];
    };
}

/**
 * Creates an array with all the enumerable properties of the given object.
 * @example <caption>showing the difference with <code>Object.keys</code></caption>
 * var baseFoo = Object.create({a: 1}, {b: {value: 2}});
 * var foo = Object.create(baseFoo, {
 *     c: {value: 3},
 *     d: {value: 4, enumerable: true}
 * });
 *
 * Object.keys(foo) // => ["d"]
 * _.enumerables(foo) // => ["d", "a"]
 *
 * @memberof module:lamb
 * @category Object
 * @see [Object.keys]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys}
 * @param {Object} obj
 * @returns {String[]}
 */
function enumerables (obj) {
    var keys = [];

    for (var key in obj) {
        keys.push(key);
    }

    return keys;
}

/**
 * Builds an object from a list of key / value pairs like the one
 * returned by [pairs]{@link module:lamb.pairs} or {@link module:lamb.ownPairs|ownPairs}.<br/>
 * In case of duplicate keys the last key / value pair is used.
 * @example
 * _.fromPairs([["a", 1], ["b", 2], ["c", 3]]) // => {"a": 1, "b": 2, "c": 3}
 * _.fromPairs([["a", 1], ["b", 2], ["a", 3]]) // => {"a": 3, "b": 2}
 * _.fromPairs([[1], [void 0, 2], [null, 3]]) // => {"1": undefined, "undefined": 2, "null": 3}
 *
 * @memberof module:lamb
 * @category Object
 * @param {Array<Array<String, *>>} pairsList
 * @returns {Object}
 */
function fromPairs (pairsList) {
    var result = {};

    pairsList.forEach(function (pair) {
        result[pair[0]] = pair[1];
    });

    return result;
}

/**
 * Returns the value of the object property with the given key.
 * @example
 * var user = {name: "John"};
 *
 * _.getIn(user, "name") // => "John";
 * _.getIn(user, "surname") // => undefined
 *
 * @memberof module:lamb
 * @category Object
 * @see {@link module:lamb.getKey|getKey}
 * @see {@link module:lamb.getPath|getPath}, {@link module:lamb.getPathIn|getPathIn}
 * @param {Object} obj
 * @param {String} key
 * @returns {*}
 */
function getIn (obj, key) {
    return obj[key];
}

/**
 * A curried version of {@link module:lamb.getIn|getIn}.<br/>
 * Receives a property name and builds a function expecting the object from which we want to retrieve the property.
 * @example
 * var user1 = {name: "john"};
 * var user2 = {name: "jane"};
 * var getName = _.getKey("name");
 *
 * getName(user1) // => "john"
 * getName(user2) // => "jane"
 *
 * @memberof module:lamb
 * @category Object
 * @see {@link module:lamb.getIn|getIn}
 * @see {@link module:lamb.getPath|getPath}, {@link module:lamb.getPathIn|getPathIn}
 * @function
 * @param {String} key
 * @returns {Function}
 */
var getKey = _curry(getIn, 2, true);

/**
 * Builds a partial application of {@link module:lamb.getPathIn|getPathIn} with the given
 * path and separator, expecting the object to act upon.
 * @example
 *  var user = {
 *     name: "John",
 *     surname: "Doe",
 *     login: {
 *         "user.name": "jdoe",
 *         password: "abc123"
 *     }
 * };
 *
 * var getPwd = _.getPath("login.password");
 * var getUsername = _.getPath("login/user.name", "/");
 *
 * getPwd(user) // => "abc123";
 * getUsername(user) // => "jdoe"
 *
 * @memberof module:lamb
 * @category Object
 * @see {@link module:lamb.getPathIn|getPathIn}
 * @see {@link module:lamb.getIn|getIn}, {@link module:lamb.getKey|getKey}
 * @param {String} path
 * @param {String} [separator="."]
 * @returns {Function}
 */
function getPath (path, separator) {
    return partial(getPathIn, _, path, separator);
}

/**
 * Gets a nested property value from an object using the given path.<br/>
 * The path is a string with property names separated by dots by default, but
 * it can be customised with the optional third parameter.
 * @example
 * var user = {
 *     name: "John",
 *     surname: "Doe",
 *     login: {
 *         "user.name": "jdoe",
 *         password: "abc123"
 *     }
 * };
 *
 * // same as _.getIn if no path is involved
 * _.getPathIn(user, "name") // => "John"
 *
 * _.getPathIn(user, "login.password") // => "abc123";
 * _.getPathIn(user, "login/user.name", "/") // => "jdoe"
 * _.getPathIn(user, "name.foo") // => undefined
 * _.getPathIn(user, "name.foo.bar") // => throws a TypeError
 *
 * @memberof module:lamb
 * @category Object
 * @see {@link module:lamb.getPath|getPath}
 * @see {@link module:lamb.getIn|getIn}, {@link module:lamb.getKey|getKey}
 * @param {Object|ArrayLike} obj
 * @param {String} path
 * @param {String} [separator="."]
 * @returns {*}
 */
function getPathIn (obj, path, separator) {
    return path.split(separator || ".").reduce(getIn, obj);
}

/**
 * Verifies the existence of a property in an object.
 * @example
 * var user1 = {name: "john"};
 *
 * _.has(user1, "name") // => true
 * _.has(user1, "surname") // => false
 * _.has(user1, "toString") // => true
 *
 * var user2 = Object.create(null);
 *
 * // not inherited through the prototype chain
 * _.has(user2, "toString") // => false
 *
 * @memberof module:lamb
 * @category Object
 * @param {Object} obj
 * @param {String} key
 * @returns {Boolean}
 */
function has (obj, key) {
    return key in obj;
}

/**
 * Curried version of {@link module:lamb.has|has}.<br/>
 * Returns a function expecting the object to check against the given key.
 * @example
 * var user1 = {name: "john"};
 * var user2 = {};
 * var hasName = _.hasKey("name");
 *
 * hasName(user1) // => true
 * hasName(user2) // => false
 *
 * @memberof module:lamb
 * @category Object
 * @function
 * @param {String} key
 * @returns {Function}
 */
var hasKey = _curry(has, 2, true);

/**
 * Builds a function expecting an object to check against the given key / value pair.
 * @example
 * var hasTheCorrectAnswer = _.hasKeyValue("answer", 42);
 *
 * hasTheCorrectAnswer({answer: 2}) // false
 * hasTheCorrectAnswer({answer: 42}) // true
 *
 * @memberof module:lamb
 * @category Object
 * @function
 * @param {String} key
 * @param {*} value
 * @returns {Function}
 */
var hasKeyValue = function (key, value) {
    return compose(partial(is, value), getKey(key));
};

/**
 * Verifies if an object has the specified property and that the property isn't inherited through
 * the prototype chain.<br/>
 * @example <caption>Comparison with <code>has</code>.</caption>
 * var user = {name: "john"};
 *
 * _.has(user, "name") // => true
 * _.has(user, "surname") // => false
 * _.has(user, "toString") // => true
 *
 * _.hasOwn(user, "name") // => true
 * _.hasOwn(user, "surname") // => false
 * _.hasOwn(user, "toString") // => false
 *
 * @memberof module:lamb
 * @category Object
 * @function
 * @param {Object} obj
 * @param {String} key
 * @returns {Boolean}
 */
var hasOwn = generic(_objectProto.hasOwnProperty);

/**
 * Curried version of {@link module:lamb.hasOwn|hasOwn}.<br/>
 * Returns a function expecting the object to check against the given key.
 * @example
 * var user = {name: "john"};
 * var hasOwnName = _.hasOwnKey("name");
 * var hasOwnToString = _.hasOwnToString("toString");
 *
 * hasOwnName(user) // => true
 * hasOwnToString(user) // => false
 *
 * @memberof module:lamb
 * @category Object
 * @function
 * @param {String} key
 * @returns {Function}
 */
var hasOwnKey = _curry(hasOwn, 2, true);

/**
 * Makes an object immutable by recursively calling [Object.freeze]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze}
 * on its members.<br/>
 * Any attempt to extend or modify the object can throw a <code>TypeError</code> or fail silently,
 * depending on the environment and the [strict mode]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode} directive.
 * @example
 * var user = _.immutable({
 *     name: "John",
 *     surname: "Doe",
 *     login: {
 *         username: "jdoe",
 *         password: "abc123"
 *     },
 *     luckyNumbers: [13, 17]
 * });
 *
 * // All of these statements will fail and possibly
 * // throw a TypeError (see the function description)
 * user.name = "Joe";
 * delete user.name;
 * user.newProperty = [];
 * user.login.password = "foo";
 * user.luckyNumbers.push(-13);
 *
 * @memberof module:lamb
 * @category Object
 * @param {Object} obj
 * @returns {Object}
 */
function immutable (obj) {
    return _immutable(obj, []);
}

/**
 * Builds an object from the two given lists, using the first one as keys and the last one as values.<br/>
 * If the list of keys is longer than the values one, the keys will be created with <code>undefined</code> values.<br/>
 * If more values than keys are supplied, the extra values will be ignored.<br/>
 * See also {@link module:lamb.tear|tear} and {@link module:lamb.tearOwn|tearOwn} for the reverse operation.
 * @example
 * _.make(["a", "b", "c"], [1, 2, 3]) // => {a: 1, b: 2, c: 3}
 * _.make(["a", "b", "c"], [1, 2]) // => {a: 1, b: 2, c: undefined}
 * _.make(["a", "b"], [1, 2, 3]) // => {a: 1, b: 2}
 * _.make([null, void 0, 2], [1, 2, 3]) // => {"null": 1, "undefined": 2, "2": 3}
 *
 * @memberof module:lamb
 * @category Object
 * @param {String[]} keys
 * @param {Array} values
 * @returns {Object}
 */
function make (keys, values) {
    var result = {};
    var valuesLen = values.length;

    for (var i = 0, len = keys.length; i < len; i++) {
        result[keys[i]] = i < valuesLen ? values[i] : void 0;
    }

    return result;
}

/**
 * Merges the enumerable properties of the provided sources into a new object.<br/>
 * In case of key homonymy each source has precedence over the previous one.<br/>
 * See also {@link module:lamb.mergeOwn|mergeOwn} for merging only own properties of
 * the given sources.
 * @example
 * _.merge({a: 1}, {b: 3, c: 4}, {b: 5}) // => {a: 1, b: 5, c: 4}
 *
 * @memberof module:lamb
 * @category Object
 * @function
 * @param {...Object} source
 * @returns {Object}
 */
var merge = partial(_merge, enumerables);

/**
 * Same as {@link module:lamb.merge|merge}, but only the own properties of the sources are taken into account.
 * @example <caption>showing the difference with <code>merge</code></caption>
 * var baseFoo = Object.create({a: 1}, {b: {value: 2, enumerable: true}, z: {value: 5}});
 * var foo = Object.create(baseFoo, {
 *     c: {value: 3, enumerable: true}
 * });
 *
 * var bar = {d: 4};
 *
 * _.merge(foo, bar) // => {a: 1, b: 2, c: 3, d: 4}
 * _.mergeOwn(foo, bar) // => {c: 3, d: 4}
 *
 *
 * @memberof module:lamb
 * @category Object
 * @function
 * @param {...Object} source
 * @returns {Object}
 */
var mergeOwn = partial(_merge, Object.keys);

/**
 * Same as {@link module:lamb.pairs|pairs}, but only the own enumerable properties of the object are
 * taken into account.<br/>
 * See also {@link module:lamb.fromPairs|fromPairs} for the reverse operation.
 * @example <caption>showing the difference with <code>pairs</code></caption>
 * var baseFoo = Object.create({a: 1}, {b: {value: 2, enumerable: true}, z: {value: 5}});
 * var foo = Object.create(baseFoo, {
 *     c: {value: 3, enumerable: true}
 * });
 *
 * _.pairs(foo) // => [["c", 3], ["b", 2], ["a", 1]]
 * _.ownPairs(foo) // => [["c", 3]]
 *
 * @memberof module:lamb
 * @category Object
 * @function
 * @param {Object} obj
 * @returns {Array<Array<String, *>>}
 */
var ownPairs = _pairsFrom(Object.keys);

/**
 * Same as {@link module:lamb.values|values}, but only the own enumerable properties of the object are
 * taken into account.<br/>
 * @example <caption>showing the difference with <code>values</code></caption>
 * var baseFoo = Object.create({a: 1}, {b: {value: 2, enumerable: true}, z: {value: 5}});
 * var foo = Object.create(baseFoo, {
 *     c: {value: 3, enumerable: true}
 * });
 *
 * _.values(foo) // => [3, 2, 1]
 * _.ownValues(foo) // => [3]
 *
 * @memberof module:lamb
 * @category Object
 * @function
 * @param {Object} obj
 * @returns {Array}
 */
var ownValues = _valuesFrom(Object.keys);

/**
 * Converts an object into an array of key / value pairs of its enumerable properties.<br/>
 * See also {@link module:lamb.ownPairs|ownPairs} for picking only the own enumerable
 * properties and {@link module:lamb.fromPairs|fromPairs} for the reverse operation.
 * @example
 * _.pairs({a: 1, b: 2, c: 3}) // => [["a", 1], ["b", 2], ["c", 3]]
 *
 * @memberof module:lamb
 * @category Object
 * @function
 * @param {Object} obj
 * @returns {Array<Array<String, *>>}
 */
var pairs = _pairsFrom(enumerables);

/**
 * Returns an object containing only the specified properties of the given object.<br/>
 * Non existent properties will be ignored.
 * @example
 * var user = {name: "john", surname: "doe", age: 30};
 *
 * _.pick(user, ["name", "age"]) // => {"name": "john", "age": 30};
 * _.pick(user, ["name", "email"]) // => {"name": "john"}
 *
 * @memberof module:lamb
 * @category Object
 * @see {@link module:lamb.pickIf|pickIf}
 * @param {Object} source
 * @param {String[]} whitelist
 * @returns {Object}
 */
function pick (source, whitelist) {
    var result = {};

    whitelist.forEach(function (key) {
        if (key in source) {
            result[key] = source[key];
        }
    });

    return result;
}

/**
 * Builds a function expecting an object whose properties will be checked against the given predicate.<br/>
 * The properties satisfying the predicate will be included in the resulting object.
 * @example
 * var user = {name: "john", surname: "doe", age: 30};
 * var pickIfIsString = _.pickIf(_.isType("String"));
 *
 * pickIfIsString(user) // => {name: "john", surname: "doe"}
 *
 * @memberof module:lamb
 * @category Object
 * @see {@link module:lamb.pick|pick}
 * @param {ObjectIteratorCallback} predicate
 * @param {Object} [predicateContext]
 * @returns {Function}
 */
function pickIf (predicate, predicateContext) {
    return function (source) {
        var result = {};

        for (var key in source) {
            if (predicate.call(predicateContext, source[key], key, source)) {
                result[key] = source[key];
            }
        }

        return result;
    };
}

/**
 * Sets the specified key to the given value in a copy of the provided object.<br/>
 * All the enumerable keys of the source object will be simply copied to an empty
 * object without breaking references.<br/>
 * If the specified key is not part of the source object, it will be added to the
 * result.<br/>
 * The main purpose of the function is to work on simple plain objects used as
 * data structures, such as JSON objects, and makes no effort to play nice with
 * objects created from an OOP perspective (it's not worth it).<br/>
 * For example the prototype of the result will be <code>Object</code>'s regardless
 * of the <code>source</code>'s one.
 * @example
 * var user = {name: "John", surname: "Doe", age: 30};
 *
 * _.setIn(user, "name", "Jane") // => {name: "Jane", surname: "Doe", age: 30}
 *
 * // `user` still is {name: "John", surname: "Doe", age: 30}
 *
 * @memberof module:lamb
 * @category Object
 * @see {@link module:lamb.setKey|setKey}
 * @param {Object} source
 * @param {String} key
 * @param {*} value
 * @returns {Object}
 */
function setIn (source, key, value) {
    return _merge(enumerables, source, make([key], [value]));
}

/**
 * Builds a partial application of {@link module:lamb.setIn|setIn} with the provided
 * <code>key</code> and <code>value</code>.<br/>
 * The resulting function expects the object to act upon.<br/>
 * Please refer to {@link module:lamb.setIn|setIn}'s description for explanations about
 * how the copy of the source object is made.
 * @example
 * var user = {name: "John", surname: "Doe", age: 30};
 * var setAgeTo40 = _.setKey("age", 40);
 *
 * setAgeTo40(user) // => {name: "john", surname: "doe", age: 40}
 *
 * // `user` still is {name: "John", surname: "Doe", age: 30}
 *
 * @memberof module:lamb
 * @category Object
 * @see {@link module:lamb.setIn|setIn}
 * @param {String} key
 * @param {*} value
 * @returns {Function}
 */
function setKey (key, value) {
    return partial(setIn, _, key, value);
}

/**
 * Returns a copy of the source object without the specified properties.
 * @example
 * var user = {name: "john", surname: "doe", age: 30};
 *
 * _.skip(user, ["name", "age"]) // => {surname: "doe"};
 * _.skip(user, ["name", "email"]) // => {surname: "doe", age: 30};
 *
 * @memberof module:lamb
 * @category Object
 * @see {@link module:lamb.skipIf|skipIf}
 * @param {Object} source
 * @param {String[]} blacklist
 * @returns {Object}
 */
function skip (source, blacklist) {
    var result = {};

    for (var key in source) {
        if (blacklist.indexOf(key) === -1) {
            result[key] = source[key];
        }
    }

    return result;
}

/**
 * Builds a function expecting an object whose properties will be checked against the given predicate.<br/>
 * The properties satisfying the predicate will be omitted in the resulting object.
 * @example
 * var user = {name: "john", surname: "doe", age: 30};
 * var skipIfIstring = _.skipIf(_.isType("String"));
 *
 * skipIfIstring(user) // => {age: 30}
 *
 * @memberof module:lamb
 * @category Object
 * @see {@link module:lamb.skip|skip}
 * @param {ObjectIteratorCallback} predicate
 * @param {Object} [predicateContext]
 * @returns {Function}
 */
function skipIf (predicate, predicateContext) {
    return pickIf(not(predicate), predicateContext);
}

/**
 * Tears an object apart by transforming it in an array of two lists: one containing its enumerable keys,
 * the other containing the corresponding values.<br/>
 * Although this "tearing apart" may sound as a rather violent process, the source object will be unharmed.<br/>
 * See also {@link module:lamb.tearOwn|tearOwn} for picking only the own enumerable properties and
 * {@link module:lamb.make|make} for the reverse operation.
 * @example
 * _.tear({a: 1, b: 2, c: 3}) // => [["a", "b", "c"], [1, 2, 3]]
 *
 * @memberof module:lamb
 * @category Object
 * @function
 * @param {Object} obj
 * @returns {Array<Array<String>, Array<*>>}
 */
var tear = _tearFrom(enumerables);

/**
 * Same as {@link module:lamb.tear|tear}, but only the own properties of the object are taken into account.<br/>
 * See also {@link module:lamb.make|make} for the reverse operation.
 * @example <caption>showing the difference with <code>tear</code></caption>
 * var baseFoo = Object.create({a: 1}, {b: {value: 2, enumerable: true}, z: {value: 5}});
 * var foo = Object.create(baseFoo, {
 *     c: {value: 3, enumerable: true}
 * });
 *
 * _.tear(foo) // => [["c", "b", "a"], [3, 2, 1]]
 * _.tearOwn(foo) // => [["c"], [3]]
 *
 * @memberof module:lamb
 * @category Object
 * @function
 * @param {Object} obj
 * @returns {Array<Array<String>, Array<*>>}
 */
var tearOwn = _tearFrom(Object.keys);

/**
 * Validates an object with the given list of {@link module:lamb.checker|checker} functions.
 * @example
 * var hasContent = function (s) { return s.trim().length > 0; };
 * var isAdult = function (age) { return age >= 18; };
 * var userCheckers = [
 *     _.checker(hasContent, "Name is required", ["name"]),
 *     _.checker(hasContent, "Surname is required", ["surname"]),
 *     _.checker(isAdult, "Must be at least 18 years old", ["age"])
 * ];
 *
 * var user1 = {name: "john", surname: "doe", age: 30};
 * var user2 = {name: "jane", surname: "", age: 15};
 *
 * _.validate(user1, userCheckers) // => []
 * _.validate(user2, userCheckers) // => [["Surname is required", ["surname"]], ["Must be at least 18 years old", ["age"]]]
 *
 * @memberof module:lamb
 * @category Object
 * @param {Object} obj
 * @param {Function[]} checkers
 * @returns {Array<Array<String, String[]>>} An array of errors in the form returned by {@link module:lamb.checker|checker}, or an empty array.
 */
function validate (obj, checkers) {
    return checkers.reduce(function (errors, checker) {
        var result = checker(obj);
        result.length && errors.push(result);
        return errors;
    }, []);
}

/**
 * A curried version of {@link module:lamb.validate|validate} accepting a list of {@link module:lamb.checker|checkers} and
 * returning a function expecting the object to validate.
 * @example
 * var hasContent = function (s) { return s.trim().length > 0; };
 * var isAdult = function (age) { return age >= 18; };
 * var userCheckers = [
 *     _.checker(hasContent, "Name is required", ["name"]),
 *     _.checker(hasContent, "Surname is required", ["surname"]),
 *     _.checker(isAdult, "Must be at least 18 years old", ["age"])
 * ];
 * var validateUser = _.validateWith(userCheckers);
 *
 * var user1 = {name: "john", surname: "doe", age: 30};
 * var user2 = {name: "jane", surname: "", age: 15};
 *
 * validateUser(user1) // => []
 * validateUser(user2) // => [["Surname is required", ["surname"]], ["Must be at least 18 years old", ["age"]]]
 *
 * @memberof module:lamb
 * @category Object
 * @function
 * @param {Function[]} checkers
 * @returns {Function}
 */
var validateWith = _curry(validate, 2, true);

/**
 * Generates an array with the values of the enumerable properties of the given object.<br/>
 * See also {@link module:lamb.ownValues|ownValues} for picking only the own properties of the object.
 * @example
 * var user = {name: "john", surname: "doe", age: 30};
 *
 * _.values(user) // => ["john", "doe", 30]
 *
 * @memberof module:lamb
 * @category Object
 * @function
 * @param {Object} obj
 * @returns {Array}
 */
var values = _valuesFrom(enumerables);

lamb.checker = checker;
lamb.enumerables = enumerables;
lamb.fromPairs = fromPairs;
lamb.getIn = getIn;
lamb.getKey = getKey;
lamb.getPath = getPath;
lamb.getPathIn = getPathIn;
lamb.has = has;
lamb.hasKey = hasKey;
lamb.hasKeyValue = hasKeyValue;
lamb.hasOwn = hasOwn;
lamb.hasOwnKey = hasOwnKey;
lamb.immutable = immutable;
lamb.make = make;
lamb.merge = merge;
lamb.mergeOwn = mergeOwn;
lamb.ownPairs = ownPairs;
lamb.ownValues = ownValues;
lamb.pairs = pairs;
lamb.pick = pick;
lamb.pickIf = pickIf;
lamb.setIn = setIn;
lamb.setKey = setKey;
lamb.skip = skip;
lamb.skipIf = skipIf;
lamb.tear = tear;
lamb.tearOwn = tearOwn;
lamb.validate = validate;
lamb.validateWith = validateWith;
lamb.values = values;
