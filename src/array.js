
function _findSliceEndIndex (arrayLike, predicate, predicateContext) {
    var idx = -1;
    var len = arrayLike.length;

    while (++idx < len && predicate.call(predicateContext, arrayLike[idx], idx, arrayLike));

    return idx;
}

function _flatten (array, output) {
    array.forEach(function (value) {
        if (Array.isArray(value)) {
            _flatten(value, output);
        } else {
            output.push(value);
        }
    });

    return output;
}

function _getInsertionIndex (array, element, comparer, reader, start, end) {
    if (array.length === 0) {
        return 0;
    }

    comparer = comparer || sorter.ascending;
    reader = reader || identity;
    start = start || 0;
    end = end || array.length;

    var pivot = (start + end) >> 1;
    var compared = comparer(reader(element), reader(array[pivot]));

    if (end - start <= 1) {
        return compared === -1 ? pivot : pivot + 1;
    }

    switch (compared) {
        case -1:
            return _getInsertionIndex(array, element, comparer, reader, start, pivot);
        case 0:
            return pivot + 1;
        case 1:
            return _getInsertionIndex(array, element, comparer, reader, pivot, end);
    }
}

/**
 * Builds a predicate to check if an array-like object contains the given value.<br/>
 * Please note that the equality test is made with {@link module:lamb.isSVZ|isSVZ}; so you can
 * check for <code>NaN</code>, but <code>0</code> and <code>-0</code> are the same value.<br/>
 * See also {@link module:lamb.isIn|isIn} for an uncurried version.
 * @example
 * var containsNaN = _.contains(NaN, 0);
 *
 * containsNaN([0, 1, 2, 3, NaN]) // => true
 *
 * @memberof module:lamb
 * @category Array
 * @param {*} value
 * @param {Number} [fromIndex=0] The position at which to begin searching for the given value.
 * @returns {Function}
 */
function contains (value, fromIndex) {
    return function (arrayLike) {
        return isIn(arrayLike, value, fromIndex);
    };
}

/**
 * Returns an array of items present only in the first of the given arrays.<br/>
 * Note that since version <code>0.13.0</code> this function uses the ["SameValueZero" comparison]{@link module:lamb.isSVZ|isSVZ}.
 * @example
 * var a1 = [1, 2, 3, 4];
 * var a2 = [2, 4, 5];
 * var a3 = [4, 5, 3, 1];
 *
 * _.difference(a1, a2) // => [1, 3]
 * _.difference(a1, a2, a3) // => []
 *
 * @memberof module:lamb
 * @category Array
 * @param {Array} array
 * @param {...Array} other
 * @returns {Array}
 */
function difference (array) {
    var rest = shallowFlatten(slice(arguments, 1));
    var isInRest = partial(isIn, rest, _, 0);
    return array.filter(not(isInRest));
}

/**
 * Builds an array without the first <code>n</code> elements of the given array or array-like object.
 * Note that, being this only a shortcut for a specific use case of {@link module:lamb.slice|slice},
 * <code>n</code> can be a negative number.
 * @example
 * var arr = [1, 2, 3, 4, 5];
 *
 * _.drop(arr, 2) // => [3, 4, 5]
 * _.drop(arr, -1) // => [5]
 * _.drop(arr, -10) // => [1, 2, 3, 4, 5]
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @param {ArrayLike} arrayLike
 * @param {Number} n
 * @returns {Array}
 */
var drop = aritize(slice, 2);

/**
 * A curried version of {@link module:lamb.drop|drop} that expects the number of elements
 * to drop to build a function waiting for the list to take the elements from.
 * See the note and examples for {@link module:lamb.drop|drop} about passing a negative <code>n</code>.
 * @example
 * var drop2 = _.dropN(2);
 *
 * drop2([1, 2, 3, 4, 5]) // => [3, 4, 5]
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @param {Number} n
 * @returns {Function}
 */
var dropN = _curry(drop, 2, true);

/**
 * Builds a function that drops the first <code>n</code> elements satisfying a predicate from an array or array-like object.
 * @example
 * var isEven = function (n) { return n % 2 === 0; };
 * var dropWhileIsEven = _.dropWhile(isEven);
 *
 * dropWhileIsEven([2, 4, 6, 8]) // => []
 * dropWhileIsEven([2, 4, 7, 8]) // => [7, 8]
 *
 * @memberof module:lamb
 * @category Array
 * @param {ListIteratorCallback} predicate
 * @param {Object} [predicateContext]
 * @returns {Function}
 */
function dropWhile (predicate, predicateContext) {
    return function (arrayLike) {
        return slice(arrayLike, _findSliceEndIndex(arrayLike, predicate, predicateContext));
    };
}

/**
 * Returns a partial application of {@link module:lamb.filter|filter} that uses the given predicate and
 * the optional context to build a function expecting the array-like object to act upon.
 * @example
 * var isLowerCase = function (s) { return s.toLowerCase() === s; };
 * var getLowerCaseEntries = _.filterWith(isLowerCase);
 *
 * getLowerCaseEntries(["Foo", "bar", "baZ"]) // => ["bar"]
 *
 * // array-like objects can be used as well
 * getLowerCaseEntries("fooBAR") // => ["f", "o", "o"]
 *
 * @memberof module:lamb
 * @category Array
 * @param {ListIteratorCallback} predicate
 * @param {Object} [predicateContext]
 * @returns {Function}
 */
function filterWith (predicate, predicateContext) {
    return partial(filter, _, predicate, predicateContext);
}

/**
 * Searches for an element satisfying the predicate in the given array-like object and returns it if
 * the search is successful. Returns <code>undefined</code> otherwise.
 * @example
 * var persons = [
 *     {"name": "Jane", "surname": "Doe", "age": 12},
 *     {"name": "John", "surname": "Doe", "age": 40},
 *     {"name": "Mario", "surname": "Rossi", "age": 18},
 *     {"name": "Paolo", "surname": "Bianchi", "age": 40}
 * ];
 *
 * _.find(persons, _.hasKeyValue("age", 40)) // => {"name": "John", "surname": "Doe", "age": 40}
 * _.find(persons, _.hasKeyValue("age", 41)) // => undefined
 *
 * @memberof module:lamb
 * @category Array
 * @param {ArrayLike} arrayLike
 * @param {ListIteratorCallback} predicate
 * @param {Object} [predicateContext]
 * @returns {*}
 */
function find (arrayLike, predicate, predicateContext) {
    var result;

    for (var i = 0, len = arrayLike.length, element; i < len; i++) {
        element = arrayLike[i];

        if (predicate.call(predicateContext, element, i, arrayLike)) {
            result = element;
            break;
        }
    }

    return result;
}

/**
 * Searches for an element satisfying the predicate in the given array-like object and returns its
 * index if the search is successful. Returns <code>-1</code> otherwise.
 * @example
 * var persons = [
 *     {"name": "Jane", "surname": "Doe", "age": 12},
 *     {"name": "John", "surname": "Doe", "age": 40},
 *     {"name": "Mario", "surname": "Rossi", "age": 18},
 *     {"name": "Paolo", "surname": "Bianchi", "age": 40}
 * ];
 *
 * _.findIndex(persons, _.hasKeyValue("age", 40)) // => 1
 * _.findIndex(persons, _.hasKeyValue("age", 41)) // => -1
 *
 * @memberof module:lamb
 * @category Array
 * @param {ArrayLike} arrayLike
 * @param {ListIteratorCallback} predicate
 * @param {Object} [predicateContext]
 * @returns {Number}
 */
function findIndex (arrayLike, predicate, predicateContext) {
    var result = -1;

    for (var i = 0, len = arrayLike.length; i < len; i++) {
        if (predicate.call(predicateContext, arrayLike[i], i, arrayLike)) {
            result = i;
            break;
        }
    }

    return result;
}

/**
 * Similar to {@link module:lamb.map|map}, but if the mapping function returns an array this will
 * be concatenated, rather than pushed, to the final result.
 * @example <caption>showing the difference with <code>map</code></caption>
 * var words = ["foo", "bar"];
 * var toCharArray = function (s) { return s.split(""); };
 *
 * _.map(words, toCharArray) // => [["f", "o", "o"], ["b", "a", "r"]]
 * _.flatMap(words, toCharArray) // => ["f", "o", "o", "b", "a", "r"]
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @param {Array} array
 * @param {ListIteratorCallback} iteratee
 * @param {Object} [iterateeContext]
 * @returns {Array}
 */
var flatMap = compose(shallowFlatten, map);

/**
 * Builds a partial application of {@link module:lamb.flatMap|flatMap} using the given iteratee
 * and the optional context. The resulting function expects the array to act upon.
 * @example
 * var toCharArray = function (s) { return s.split(""); };
 * var wordsToCharArray = _.flatMapWith(toCharArray);
 *
 * wordsToCharArray(["foo", "bar"]) // => ["f", "o", "o", "b", "a", "r"]
 *
 * @memberof module:lamb
 * @category Array
 * @param {ListIteratorCallback} iteratee
 * @param {Object} [iterateeContext]
 * @returns {Function}
 */
function flatMapWith (iteratee, iterateeContext) {
    return partial(flatMap, _, iteratee, iterateeContext);
}

/**
 * Flattens an array. See also {@link module:lamb.shallowFlatten|shallowFlatten}.
 * @example <caption>showing the difference with <code>shallowFlatten</code></caption>
 * var arr = [1, 2, [3, 4, [5, 6]], 7, 8];
 *
 * _.flatten(arr) // => [1, 2, 3, 4, 5, 6, 7, 8]
 * _.shallowFlatten(arr) // => [1, 2, 3, 4, [5, 6], 7, 8]
 *
 * @memberof module:lamb
 * @category Array
 * @param {Array} array
 * @returns {Array}
 */
function flatten (array) {
    return _flatten(array, []);
}

/**
 * Transforms an array-like object into a lookup table using the provided iteratee as a grouping
 * criterion to generate keys and values.
 * @example
 * var persons = [
 *     {"name": "Jane", "city": "New York"},
 *     {"name": "John", "city": "New York"},
 *     {"name": "Mario", "city": "Rome"},
 *     {"name": "Paolo"}
 * ];
 * var getCity = _.getKey("city");
 * var personsByCity = _.group(persons, getCity);
 *
 * // "personsByCity" holds:
 * // {
 * //     "New York": [
 * //         {"name": "Jane", "city": "New York"},
 * //         {"name": "John", "city": "New York"}
 * //     ],
 * //     "Rome": [
 * //         {"name": "Mario", "city": "Rome"}
 * //     ],
 * //     "undefined": [
 * //         {"name": "Paolo"}
 * //     ]
 * // }
 *
 * @example <caption>Adding a custom value for missing keys</caption>
 *
 * var getCityOrUnknown = _.condition(
 *     _.hasKey("city"),
 *     getCity,
 *     _.always("Unknown")
 * );
 *
 * personsByCity = _.group(persons, getCityOrUnknown);
 *
 * // "personsByCity" now holds:
 * // {
 * //     "New York": [
 * //         {"name": "Jane", "city": "New York"},
 * //         {"name": "John", "city": "New York"}
 * //     ],
 * //     "Rome": [
 * //         {"name": "Mario", "city": "Rome"}
 * //     ],
 * //     "Unknown": [
 * //         {"name": "Paolo"}
 * //     ]
 * // }
 *
 * @memberof module:lamb
 * @category Array
 * @param {ArrayLike} arrayLike
 * @param {ListIteratorCallback} iteratee
 * @param {Object} [iterateeContext]
 * @returns {Object}
 */
function group (arrayLike, iteratee, iterateeContext) {
   var result = {};
    var len = arrayLike.length;

    for (var i = 0, element; i < len; i++) {
        element = arrayLike[i];
        var key = iteratee.call(iterateeContext, element, i, arrayLike);

        if (key in result) {
            result[key].push(element);
        } else {
            result[key] = [element];
        }
    }

    return result;
}

/**
 * Using the provided iteratee, and its optional context, builds a [partial application]{@link module:lamb.partial}
 * of {@link module:lamb.group|group} expecting the array-like object to act upon.
 * @example
 * var persons = [
 *     {"name": "Jane", "age": 12},
 *     {"name": "John", "age": 40},
 *     {"name": "Mario", "age": 18},
 *     {"name": "Paolo", "age": 15}
 * ];
 *
 * var getAgeStatus = function (person) { return person.age > 20 ? "over 20" : "under 20"; };
 * var groupByAgeStatus = _.groupBy(getAgeStatus);
 *
 * var personsByAgeStatus = groupByAgeStatus(persons);
 *
 * // "personsByAgeStatus" holds:
 * // {
 * //     "under 20": [
 * //         {"name": "Jane", "age": 12},
 * //         {"name": "Mario", "age": 18},
 * //         {"name": "Paolo", "age": 15}
 * //     ],
 * //     "over 20": [
 * //         {"name": "John", "age": 40}
 * //     ]
 * // }
 *
 * @memberof module:lamb
 * @category Array
 * @param {ListIteratorCallback} iteratee
 * @param {Object} [iterateeContext]
 * @returns {Function}
 */
function groupBy (iteratee, iterateeContext) {
    return partial(group, _, iteratee, iterateeContext);
}

/**
 * Returns an array of every item present in all given arrays.<br/>
 * Note that since version <code>0.13.0</code> this function uses the ["SameValueZero" comparison]{@link module:lamb.isSVZ|isSVZ}.
 * @example
 * var a1 = [1, 2, 3, 4];
 * var a2 = [2, 5, 4, 6];
 * var a3 = [5, 6, 7];
 *
 * _.intersection(a1, a2) // => [2, 4]
 * _.intersection(a1, a3) // => []
 *
 * @memberof module:lamb
 * @category Array
 * @param {...Array} array
 * @return {Array}
 */
function intersection () {
    var rest = slice(arguments, 1);
    return uniques(arguments[0]).filter(function (item) {
        return rest.every(contains(item));
    });
}

/**
 * Inserts an element in a copy of a sorted array respecting the sort order.
 * @example <caption>with simple values</caption>
 * _.insert([], 1) // => [1]
 * _.insert([2, 4, 6], 5) // => [2, 4, 5, 6]
 * _.insert([4, 2, 1], 3, _.sorter.descending) // => [4, 3, 2, 1]
 *
 * @example <caption>with complex values</caption>
 * var persons = [
 *     {"name": "jane", "surname": "doe"},
 *     {"name": "John", "surname": "Doe"},
 *     {"name": "Mario", "surname": "Rossi"}
 * ];
 *
 * var getLowerCaseName = _.compose(
 *     _.invoker("toLowerCase"),
 *     _.getKey("name")
 * );
 *
 * var result = _.insert(
 *     persons,
 *     {"name": "marco", "surname": "Rossi"},
 *     _.sorter.ascending,
 *     getLowerCaseName
 * );
 *
 * // `result` holds:
 * // [
 * //     {"name": "jane", "surname": "doe"},
 * //     {"name": "John", "surname": "Doe"},
 * //     {"name": "marco", "surname": "Rossi"},
 * //     {"name": "Mario", "surname": "Rossi"}
 * // ]
 *
 * @memberof module:lamb
 * @category Array
 * @param {Array} array
 * @param {*} element
 * @param {Function} [comparer={@link module:lamb.sorter|sorter.ascending}] - The comparer function used to sort the array.
 * @param {Function} [reader={@link module:lamb.identity|identity}] - The function that evaluates the array elements and supplies values for comparison.
 * @returns {Array}
 */
function insert (array, element, comparer, reader) {
    var result = array.concat();
    result.splice(_getInsertionIndex(array, element, comparer, reader), 0, element);
    return result;
}

/**
 * Checks if an array-like object contains the given value.<br/>
 * Please note that the equality test is made with {@link module:lamb.isSVZ|isSVZ}; so you can
 * check for <code>NaN</code>, but <code>0</code> and <code>-0</code> are the same value.<br/>
 * See also {@link module:lamb.contains|contains} for a curried version building a predicate.
 * @example
 * var numbers = [0, 1, 2, 3, NaN];
 *
 * _.isIn(numbers, 1) // => true
 * _.isIn(numbers, 0) // => true
 * _.isIn(numbers, -0) // => true
 * _.isIn(numbers, NaN) // => true
 * _.isIn(numbers, 2, 3) // => false
 *
 * @memberof module:lamb
 * @category Array
 * @param {ArrayLike} arrayLike
 * @param {*} value
 * @param {Number} [fromIndex=0] The position at which to begin searching for the given value.
 * @returns {Boolean}
 */
function isIn (arrayLike, value, fromIndex) {
    var result = false;

    for (var i = fromIndex | 0, len = arrayLike.length; i < len; i++) {
        if (isSVZ(value, arrayLike[i])) {
            result = true;
            break;
        }
    }

    return result;
}

/**
 * Generates an array with the values passed as arguments.
 * @example
 * _.list(1, 2, 3) // => [1, 2, 3]
 *
 * @memberof module:lamb
 * @category Array
 * @param {...*} value
 * @returns {Array}
 */
function list () {
    return slice(arguments);
}

/**
 * Builds a partial application of {@link module:lamb.map|map} using the given iteratee and the optional context.
 * The resulting function expects the array-like object to act upon.
 * @example
 * var square = function (n) { return n * n; };
 * var getSquares = _.mapWith(square);
 *
 * getSquares([1, 2, 3, 4, 5]) // => [1, 4, 9, 16, 25]
 *
 * @memberof module:lamb
 * @category Array
 * @param {ListIteratorCallback} iteratee
 * @param {Object} [iterateeContext]
 * @returns {function}
 */
function mapWith (iteratee, iterateeContext) {
    return partial(map, _, iteratee, iterateeContext);
}

/**
 * Splits an array-like object in two lists: the first with the elements satisfying the given predicate,
 * the others with the remaining elements.
 * @example
 * var isEven = function (n) { return n % 2 === 0; };
 * var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
 *
 * _.partition(numbers, isEven) // => [[2, 4, 6, 8, 10], [1, 3, 5, 7, 9]]
 *
 * @memberof module:lamb
 * @category Array
 * @param {ArrayLike} arrayLike
 * @param {ListIteratorCallback} predicate
 * @param {Object} [predicateContext]
 * @returns {Array<Array<*>, Array<*>>}
 */
function partition (arrayLike, predicate, predicateContext) {
    var result = [[], []];
    var len = arrayLike.length;

    for (var i = 0, el; i < len; i++) {
        el = arrayLike[i];
        result[predicate.call(predicateContext, el, i, arrayLike) ? 0 : 1].push(el);
    }

    return result;
}

/**
 * Builds a partial application of {@link module:lamb.partition|partition} using the given predicate and the optional context.
 * The resulting function expects the array-like object to act upon.
 * @example
 * var users = [
 *     {"name": "Jane", "surname": "Doe", "active": false},
 *     {"name": "John", "surname": "Doe", "active": true},
 *     {"name": "Mario", "surname": "Rossi", "active": true},
 *     {"name": "Paolo", "surname": "Bianchi", "active": false}
 * ];
 * var isActive = _.hasKeyValue("active", true);
 * var splitByActiveStatus = _.partitionWith(isActive);
 *
 * splitByActiveStatus(users) // =>
 * // [[
 * //     {"name": "John", "surname": "Doe", "active": true},
 * //     {"name": "Mario", "surname": "Rossi", "active": true}
 * // ], [
 * //     {"name": "Jane", "surname": "Doe", "active": false},
 * //     {"name": "Paolo", "surname": "Bianchi", "active": false}
 * // ]]
 *
 * @memberof module:lamb
 * @category Array
 * @param {ListIteratorCallback} predicate
 * @param {Object} [predicateContext]
 * @returns {Function}
 */
function partitionWith (predicate, predicateContext) {
    return partial(partition, _, predicate, predicateContext);
}

/**
 * "Plucks" the values of the specified key from a list of objects.
 * @example
 * var persons = [
 *     {"name": "Jane", "surname": "Doe", "age": 12},
 *     {"name": "John", "surname": "Doe", "age": 40},
 *     {"name": "Mario", "surname": "Rossi", "age": 18},
 *     {"name": "Paolo", "surname": "Bianchi", "age": 15}
 * ];
 *
 * _.pluck(persons, "age") // => [12, 40, 18, 15]
 *
 * var lists = [
 *     [1, 2],
 *     [3, 4, 5],
 *     [6]
 * ];
 *
 * _.pluck(lists, "length") // => [2, 3, 1]
 *
 * @memberof module:lamb
 * @category Array
 * @param {ArrayLike} arrayLike
 * @param {String} key
 * @returns {Array}
 */
function pluck (arrayLike, key) {
    return map(arrayLike, getKey(key));
}

/**
 * A curried version of {@link module:lamb.pluck|pluck} expecting the key to retrieve to
 * build a function waiting for the array-like object to act upon.
 * @example
 * var persons = [
 *     {"name": "Jane", "surname": "Doe", "age": 12},
 *     {"name": "John", "surname": "Doe", "age": 40},
 *     {"name": "Mario", "surname": "Rossi", "age": 18},
 *     {"name": "Paolo", "surname": "Bianchi", "age": 15}
 * ];
 * var getAges = _.pluckKey("age");
 *
 * getAges(persons) // => [12, 40, 18, 15]
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @param {String} key
 * @returns {Function}
 */
function pluckKey (key) {
    return mapWith(getKey(key));
}

/**
 * Flattens the "first level" of an array.<br/>
 * See also {@link module:lamb.flatten|flatten}.
 * @example <caption>showing the difference with <code>flatten</code></caption>
 * var arr = [1, 2, [3, 4, [5, 6]], 7, 8];
 *
 * _.flatten(arr) // => [1, 2, 3, 4, 5, 6, 7, 8]
 * _.shallowFlatten(arr) // => [1, 2, 3, 4, [5, 6], 7, 8]
 *
 * @memberof module:lamb
 * @category Array
 * @param {Array} array
 * @returns {Array}
 */
function shallowFlatten (array) {
    return _arrayProto.concat.apply([], array);
}

/**
 * Generates a function to sort arrays of complex values.
 * @example
 * var weights = ["2 Kg", "10 Kg", "1 Kg", "7 Kg"];
 * var asNumbers = _.sorter(_.sorter.ascending, parseFloat);
 *
 * weights.sort() // => ["1 Kg", "10 Kg", "2 Kg", "7 Kg"]
 * weights.sort(asNumbers) // => ["1 Kg", "2 Kg", "7 Kg", "10 Kg"]
 *
 * @memberof module:lamb
 * @category Array
 * @property {Function} ascending - A default ascending comparer.
 * @property {Function} descending - A default descending comparer.
 * @param {Function} comparer - A comparer function to be passed to the [Array.prototype.sort]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort} method.
 * @param {Function} reader - A function meant to generate a simple value from a complex one. The function should evaluate the array element and supply the value to be passed to the comparer.
 * @returns {Function}
 */
function sorter (comparer, reader) {
    return function (a, b) {
        return comparer(reader(a), reader(b));
    };
}
sorter.ascending = function (a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
};
sorter.descending = function (a, b) {
    return b < a ? -1 : b > a ? 1 : 0;
};

/**
 * Retrieves the first <code>n</code> elements from an array or array-like object.
 * Note that, being this a partial application of {@link module:lamb.slice|slice},
 * <code>n</code> can be a negative number.
 * @example
 * var arr = [1, 2, 3, 4, 5];
 *
 * _.take(arr, 3) // => [1, 2, 3]
 * _.take(arr, -1) // => [1, 2, 3, 4]
 * _.take(arr, -10) // => []
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @param {ArrayLike} arrayLike
 * @param {Number} n
 * @returns {Array}
 */
var take = partial(slice, _, 0, _);

/**
 * A curried version of {@link module:lamb.take|take} that expects the number of elements
 * to retrieve to build a function waiting for the list to take the elements from.
 * See the note and examples for {@link module:lamb.take|take} about passing a negative <code>n</code>.
 * @example
 * var take2 = _.takeN(2);
 *
 * take2([1, 2, 3, 4, 5]) // => [1, 2]
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @param {Number} n
 * @returns {Function}
 */
var takeN = _curry(take, 2, true);

/**
 * Builds a function that takes the first <code>n</code> elements satisfying a predicate from an array or array-like object.
 * @example
 * var isEven = function (n) { return n % 2 === 0; };
 * var takeWhileIsEven = _.takeWhile(isEven);
 *
 * takeWhileIsEven([1, 2, 4, 6, 8]) // => []
 * takeWhileIsEven([2, 4, 7, 8]) // => [2, 4]
 *
 * @memberof module:lamb
 * @category Array
 * @param {ListIteratorCallback} predicate
 * @param {Object} predicateContext
 * @returns {Function}
 */
function takeWhile (predicate, predicateContext) {
    return function (arrayLike) {
        return slice(arrayLike, 0, _findSliceEndIndex(arrayLike, predicate, predicateContext));
    };
}

/**
 * Transposes a matrix. Can also be used to reverse a {@link module:lamb.zip|zip} operation.<br/>
 * Just like {@link module:lamb.zip|zip}, the received array-like objects will be truncated to the
 * shortest length.
 * @example <caption>transposing a matrix</caption>
 * _.transpose([
 *     [1, 2, 3],
 *     [4, 5, 6],
 *     [7, 8, 9]
 * ]) // =>
 * // [
 * //     [1, 4, 7],
 * //     [2, 5, 8],
 * //     [3, 6, 9]
 * // ]
 *
 * @example <caption>showing the relationship with <code>zip</code></caption>
 * var zipped = _.zip(["a", "b", "c"], [1, 2, 3]); // => [["a", 1], ["b", 2], ["c", 3]]
 *
 * _.transpose(zipped) // => [["a", "b", "c"], [1, 2, 3]]
 *
 * @memberof module:lamb
 * @category Array
 * @param {ArrayLike<ArrayLike<*>>} arrayLike
 * @returns {Array<Array<*>>}
 */
function transpose (arrayLike) {
    var result = [];
    var minLen = apply(Math.min, pluck(arrayLike, "length")) | 0;
    var len = arrayLike.length;

    for (var i = 0, j; i < minLen; i++) {
        result.push([]);

        for (j = 0; j < len; j++) {
            result[i][j] = arrayLike[j][i];
        }
    }

    return result;
}

/**
 * Returns a list of every unique element present in the given array-like objects.
 * @example
 * _.union([1, 2, 3, 2], [3, 4], [1, 5]) // => [1, 2, 3, 4, 5]
 * _.union("abc", "bcd", "cde") // => ["a", "b", "c", "d", "e"]
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @param {...ArrayLike} arrayLike
 * @returns {Array}
 */
var union = compose(uniques, flatMapWith(unary(slice)), list);

/**
 * Returns an array comprised of the unique elements of the given array-like object.<br/>
 * Can work with lists of complex objects if supplied with an iteratee.<br/>
 * Note that since version <code>0.13.0</code> this function uses the ["SameValueZero" comparison]{@link module:lamb.isSVZ|isSVZ}.
 * @example <caption>with simple values</caption>
 * _.uniques([1, 2, 2, 3, 4, 3, 5, 1]) // => [1, 2, 3, 4, 5]
 *
 * @example <caption>with complex values</caption>
 * var data  = [
 *     {id: "1"},
 *     {id: "4"},
 *     {id: "5"},
 *     {id: "1"},
 *     {id: "5"},
 * ];
 *
 * _.uniques(data, _.getKey("id")) // => [{id: "1"}, {id: "4"}, {"id": 5}]
 *
 * @memberof module:lamb
 * @category Array
 * @param {ArrayLike} arrayLike
 * @param {ListIteratorCallback} [iteratee] Defaults to the [identity function]{@link module:lamb.identity}.
 * @param {Object} [iterateeContext]
 * @returns {Array}
 */
function uniques (arrayLike, iteratee, iterateeContext) {
    if (typeof iteratee !== "function") {
        iteratee = identity;
    }

    var result = [];
    var seen = [];
    var value;

    for (var i = 0; i < arrayLike.length; i++) {
        value = iteratee.call(iterateeContext, arrayLike[i], i , arrayLike);

        if (!isIn(seen, value)) {
            seen.push(value);
            result.push(arrayLike[i]);
        }
    }

    return result;
}

/**
 * Builds a list of arrays out of the given array-like objects by pairing items with the same index.<br/>
 * The received array-like objects will be truncated to the shortest length.<br/>
 * See also {@link module:lamb.zipWithIndex|zipWithIndex} and {@link module:lamb.transpose|transpose} for the reverse operation.
 * @example
 * _.zip(
 *     ["a", "b", "c"],
 *     [1, 2, 3],
 *     [true, false, true]
 * ) // => [["a", 1, true], ["b", 2, false], ["c", 3, true]]
 *
 * _.zip([1, 2, 3, 4], [5, 6, 7]) // => [[1, 5], [2, 6], [3, 7]]
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @param {...ArrayLike} arrayLike
 * @returns {Array<Array<*>>}
 */
var zip = compose(transpose, list);

/**
 * "{@link module:lamb.zip|Zips}" an array-like object by pairing its values with their index.
 * @example
 * _.zipWithIndex(["a", "b", "c"]) // => [["a", 0], ["b", 1], ["c", 2]]
 *
 * @memberof module:lamb
 * @category Array
 * @param {ArrayLike} arrayLike
 * @returns {Array<Array<*, Number>>}
 */
function zipWithIndex (arrayLike) {
    return transpose([arrayLike, range(0, arrayLike.length)]);
}

lamb.contains = contains;
lamb.difference = difference;
lamb.drop = drop;
lamb.dropN = dropN;
lamb.dropWhile = dropWhile;
lamb.filterWith = filterWith;
lamb.find = find;
lamb.findIndex = findIndex;
lamb.flatMap = flatMap;
lamb.flatMapWith = flatMapWith;
lamb.flatten = flatten;
lamb.group = group;
lamb.groupBy = groupBy;
lamb.intersection = intersection;
lamb.insert = insert;
lamb.isIn = isIn;
lamb.list = list;
lamb.mapWith = mapWith;
lamb.partition = partition;
lamb.partitionWith = partitionWith;
lamb.pluck = pluck;
lamb.pluckKey = pluckKey;
lamb.shallowFlatten = shallowFlatten;
lamb.sorter = sorter;
lamb.take = take;
lamb.takeN = takeN;
lamb.takeWhile = takeWhile;
lamb.transpose = transpose;
lamb.union = union;
lamb.uniques = uniques;
lamb.zip = zip;
lamb.zipWithIndex = zipWithIndex;
