
// alias used as a placeholder argument for partial application
var _ = lamb;

// some prototype shortcuts for internal use
var _arrayProto = Array.prototype;
var _objectProto = Object.prototype;
var _reProto = RegExp.prototype;

/**
 * Builds a function that returns a constant value.
 * It's actually the simplest form of the K combinator or Kestrel.
 * @example
 * var truth = _.always(true);
 *
 * truth() // => true
 * truth(false) // => true
 * truth(1, 2) // => true
 *
 * // the value being returned is actually the
 * // very same value passed to the function
 * var foo = {bar: "baz"};
 * var alwaysFoo = _.always(foo);
 *
 * alwaysFoo() === foo // => true
 *
 * @memberof module:lamb
 * @category Core
 * @see [SKI combinator calculus]{@link https://en.wikipedia.org/wiki/SKI_combinator_calculus}
 * @param {*} value
 * @returns {Function}
 */
function always (value) {
    return function () {
        return value;
    };
}

/**
 * Returns a function that is the composition of the functions given as parameters.
 * Each function consumes the result of the function that follows.
 * @example
 * var sayHi = function (name) { return "Hi, " + name; };
 * var capitalize = function (s) {
 *     return s[0].toUpperCase() + s.substr(1).toLowerCase();
 * };
 * var fixNameAndSayHi = _.compose(sayHi, capitalize);
 *
 * sayHi("bOb") // => "Hi, bOb"
 * fixNameAndSayHi("bOb") // "Hi, Bob"
 *
 * var getName = _.getKey("name");
 * var users = [{name: "fred"}, {name: "bOb"}];
 * var sayHiToUser = _.compose(fixNameAndSayHi, getName);
 *
 * users.map(sayHiToUser) // ["Hi, Fred", "Hi, Bob"]
 *
 * @memberof module:lamb
 * @category Function
 * @param {...Function} fn
 * @returns {Function}
 */
function compose () {
    var functions = arguments;

    return function () {
        var args = arguments;
        var len = functions.length;

        while (len--) {
            args = [functions[len].apply(this, args)];
        }

        return args[0];
    };
}

/**
 * Creates generic functions out of methods.
 * @memberof module:lamb
 * @category Core
 * @author A very little change on a great idea by [Irakli Gozalishvili]{@link https://github.com/Gozala/}.
 * Thanks for this *beautiful* one-liner (never liked your "unbind" naming choice, though).
 * @function
 * @example
 * // Lamb's "slice" is actually implemented like this
 * var slice = _.generic(Array.prototype.slice);
 *
 * slice(["foo", "bar", "baz"], 0, -1) // => ["foo", "bar"]
 *
 * // the function will work with any array-like object
 * slice("fooBAR", 0, 3) // => ["f", "o", "o"]
 *
 * @param {Function} method
 * @returns {Function}
 */
var generic = Function.bind.bind(Function.call);

/**
 * The I combinator. Any value passed to the function is simply returned as it is.
 * @example
 * var foo = {bar: "baz"};
 *
 * _.identity(foo) === foo // true
 *
 * @memberof module:lamb
 * @category Core
 * @see [SKI combinator calculus]{@link https://en.wikipedia.org/wiki/SKI_combinator_calculus}
 * @param {*} value
 * @returns {*} The value passed as parameter.
 */
function identity (value) {
    return value;
}

/**
 * Builds a partially applied function. The <code>lamb</code> object itself can be used
 * as a placeholder argument and it's useful to alias it as <code>_</code> or <code>__</code>.
 * @example
 * var weights = ["2 Kg", "10 Kg", "1 Kg", "7 Kg"];
 * var parseInt10 = _.partial(parseInt, _, 10);
 *
 * weights.map(parseInt10) // => [2, 10, 1, 7]
 *
 * @memberof module:lamb
 * @category Function
 * @param {Function} fn
 * @param {...*} args
 * @returns {Function}
 */
function partial (fn) {
    var args = _argsTail.apply(null, arguments);

    return function () {
        var lastIdx = 0;
        var newArgs = [];
        var argsLen = args.length;

        for (var i = 0, boundArg; i < argsLen; i++) {
            boundArg = args[i];
            newArgs[i] = boundArg === _ ? arguments[lastIdx++] : boundArg;
        }

        for (var len = arguments.length; lastIdx < len; lastIdx++) {
            newArgs[i++] = arguments[lastIdx];
        }

        return fn.apply(this, newArgs);
    };
}

lamb.always = always;
lamb.compose = compose;
lamb.generic = generic;
lamb.identity = identity;
lamb.partial = partial;
