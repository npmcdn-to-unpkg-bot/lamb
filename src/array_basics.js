/**
 * Checks if all the elements in an array-like object satisfy the given predicate.<br/>
 * The function will stop calling the predicate as soon as it returns a <em>falsy</em> value.<br/>
 * Note that an empty array-like will always produce a <code>true</code> result regardless of the
 * predicate because of [vacuous truth]{@link https://en.wikipedia.org/wiki/Vacuous_truth}.<br/>
 * Also note that unlike the native
 * [Array.prototype.every]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every},
 * this function won't skip deleted or unassigned indexes.
 * @example
 * var persons = [
 *     {"name": "Jane", "age": 12, active: true},
 *     {"name": "John", "age": 40, active: true},
 *     {"name": "Mario", "age": 17, active: true},
 *     {"name": "Paolo", "age": 15, active: true}
 * ];
 * var isAdult = function (user) { return user.age >= 18; };
 * var isActive = _.hasKeyValue("active", true);
 *
 * _.everyIn(persons, isAdult) // => false
 * _.everyIn(persons, isActive) // => true
 *
 * @example <caption>Showing the difference with <code>Array.prototype.every</code>:</caption>
 * var isDefined = _.not(_.isUndefined);
 * var arr = new Array(5);
 * arr[3] = 99;
 *
 * arr.every(isDefined) // => true
 * _.everyIn(arr, isDefined) // => false
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @see {@link module:lamb.every|every}
 * @see {@link module:lamb.some|some}, {@link module:lamb.someIn|someIn}
 * @param {ArrayLike} arrayLike
 * @param {ListIteratorCallback} predicate
 * @param {Object} predicateContext
 * @returns {Boolean}
 */
var everyIn = _makeArrayChecker(true);

/**
 * A curried version of {@link module:lamb.everyIn|everyIn} expecting a predicate and its optional
 * context to build a function waiting for the array-like to act upon.
 * @example
 * var data = [2, 3, 5, 6, 8];
 * var isEven = function (n) { return n % 2 === 0; };
 * var isInteger = function (n) { return Math.floor(n) === n; };
 * var allEvens = _.every(isEven);
 * var allIntegers = _.every(isInteger);
 *
 * allEvens(data) // => false
 * allIntegers(data) // => true
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @see {@link module:lamb.everyIn|everyIn}
 * @see {@link module:lamb.some|some}, {@link module:lamb.someIn|someIn}
 * @param {ListIteratorCallback} predicate
 * @param {Object} predicateContext
 * @returns {Function}
 */
var every = _partialWithIteratee(everyIn);

/**
 * Builds an array comprised of all values of the array-like object passing the <code>predicate</code>
 * test.<br/>
 * Since version <code>0.34.0</code> this function is no longer a generic version of
 * [Array.prototype.filter]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter}
 * for performance reasons.<br/>
 * Note that unlike the native array method this function doesn't skip unassigned or deleted indexes.
 * @example
 * var isLowerCase = function (s) { return s.toLowerCase() === s; };
 *
 * _.filter(["Foo", "bar", "baZ"], isLowerCase) // => ["bar"]
 *
 * // the function will work with any array-like object
 * _.filter("fooBAR", isLowerCase) // => ["f", "o", "o"]
 *
 * @memberof module:lamb
 * @category Array
 * @see {@link module:lamb.filterWith|filterWith}
 * @param {ArrayLike} arrayLike
 * @param {ListIteratorCallback} predicate
 * @param {Object} [predicateContext]
 * @returns {Array}
 */
function filter (arrayLike, predicate, predicateContext) {
    var len = arrayLike.length;
    var result = [];

    if (arguments.length === 3) {
        predicate = predicate.bind(predicateContext);
    }

    for (var i = 0; i < len; i++) {
        predicate(arrayLike[i], i, arrayLike) && result.push(arrayLike[i]);
    }

    return result;
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
 * @function
 * @see {@link module:lamb.filter|filter}
 * @param {ListIteratorCallback} predicate
 * @param {Object} [predicateContext]
 * @returns {Function}
 */
var filterWith = _partialWithIteratee(filter);

/**
 * Executes the provided <code>iteratee</code> for each element of the given array-like object.<br/>
 * Since version <code>0.34.0</code> this function is no longer a generic version of
 * [Array.prototype.forEach]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach}
 * for performance reasons.<br/>
 * Note that unlike the native array method this function doesn't skip unassigned or deleted indexes.
 * @example <caption>Adding a CSS class to all elements of a NodeList in a browser environment</caption>
 * var addClass = _.curry(function (className, element) {
 *     element.classList.add(className);
 * });
 * var paragraphs = document.querySelectorAll("#some-container p");
 *
 * _.forEach(paragraphs, addClass("main"));
 * // each "p" element in the container will have the "main" class now
 *
 * @memberof module:lamb
 * @category Array
 * @param {ArrayLike} arrayLike
 * @param {ListIteratorCallback} iteratee
 * @param {Object} [iterateeContext]
 * @returns {Undefined}
 */
function forEach (arrayLike, iteratee, iterateeContext) {
    if (arguments.length === 3) {
        iteratee = iteratee.bind(iterateeContext);
    }

    for (var i = 0, len = arrayLike.length >>> 0; i < len; i++) {
        iteratee(arrayLike[i], i, arrayLike);
    }
}

/**
 * Builds a new array by applying the iteratee function to each element of the
 * received array-like object.<br/>
 * Since version <code>0.34.0</code> this function is no longer a generic version of
 * [Array.prototype.map]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map}
 * for performance reasons.<br/>
 * Note that unlike the native array method this function doesn't skip unassigned or deleted indexes.
 * @example
 * _.map(["Joe", "Mario", "Jane"], _.invoker("toUpperCase")) // => ["JOE", "MARIO", "JANE"]
 *
 * _.map([4, 9, 16], Math.sqrt); // => [2, 3, 4]
 *
 * @memberof module:lamb
 * @category Array
 * @see {@link module:lamb.mapWith|mapWith}
 * @param {ArrayLike} arrayLike
 * @param {ListIteratorCallback} iteratee
 * @param {Object} [iterateeContext]
 * @returns {Array}
 */
function map (arrayLike, iteratee, iterateeContext) {
    var len = arrayLike.length >>> 0;
    var result = Array(len);

    if (arguments.length === 3) {
        iteratee = iteratee.bind(iterateeContext);
    }

    for (var i = 0; i < len; i++) {
        result[i] = iteratee(arrayLike[i], i, arrayLike);
    }

    return result;
}

/**
 * Builds a partial application of {@link module:lamb.map|map} using the given iteratee and the
 * optional context. The resulting function expects the array-like object to act upon.
 * @example
 * var square = function (n) { return n * n; };
 * var getSquares = _.mapWith(square);
 *
 * getSquares([1, 2, 3, 4, 5]) // => [1, 4, 9, 16, 25]
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @see {@link module:lamb.map|map}
 * @param {ListIteratorCallback} iteratee
 * @param {Object} [iterateeContext]
 * @returns {function}
 */
var mapWith = _partialWithIteratee(map);

/**
 * Reduces (or folds) the values of an array-like object, starting from the first, to a new
 * value using the provided <code>accumulator</code> function.<br/>
 * Since version <code>0.34.0</code> this function is no longer a generic version of
 * [Array.prototype.reduce]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce}
 * for performance reasons.<br/>
 * Note that unlike the native array method this function doesn't skip unassigned or deleted indexes.
 * @example
 * _.reduce([1, 2, 3, 4], _.add) // => 10
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @see {@link module:lamb.reduceRight|reduceRight}
 * @see {@link module:lamb.reduceWith|reduceWith}, {@link module:lamb.reduceRightWith|reduceRightWith}
 * @param {ArrayLike} arrayLike
 * @param {AccumulatorCallback} accumulator
 * @param {*} [initialValue]
 * @returns {*}
 */
var reduce = _makeReducer(1);

/**
 * Same as {@link module:lamb.reduce|reduce}, but starts the fold operation from the last
 * element instead.<br/>
 * Since version <code>0.34.0</code> this function is no longer a generic version of
 * [Array.prototype.reduceRight]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight}
 * for performance reasons.<br/>
 * Note that unlike the native array method this function doesn't skip unassigned or deleted indexes.
 * @memberof module:lamb
 * @category Array
 * @function
 * @see {@link module:lamb.reduce|reduce}
 * @see {@link module:lamb.reduceWith|reduceWith}, {@link module:lamb.reduceRightWith|reduceRightWith}
 * @param {ArrayLike} arrayLike
 * @param {AccumulatorCallback} accumulator
 * @param {*} [initialValue]
 * @returns {*}
 */
var reduceRight = _makeReducer(-1);

/**
 * A partial application of {@link module:lamb.reduce|reduceRight} that uses the
 * provided <code>accumulator</code> and the optional <code>initialValue</code> to
 * build a function expecting the array-like object to act upon.
 * @example
 * var arr = [1, 2, 3, 4, 5];
 *
 * _.reduceRightWith(_.add)(arr) // => 15
 * _.reduceRightWith(_.subtract)(arr) // => -5
 * _.reduceRightWith(_.subtract, 0)(arr) // => -15
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @see {@link module:lamb.reduceWith|reduceWith}
 * @see {@link module:lamb.reduce|reduce}, {@link module:lamb.reduce|reduceRight}
 * @param {AccumulatorCallback} accumulator
 * @param {*} [initialValue]
 * @returns {Function}
 */
var reduceRightWith = _partialWithIteratee(reduceRight);

/**
 * A partial application of {@link module:lamb.reduce|reduce} that uses the
 * provided <code>accumulator</code> and the optional <code>initialValue</code> to
 * build a function expecting the array-like object to act upon.
 * @example
 * var arr = [1, 2, 3, 4, 5];
 *
 * _.reduceWith(_.add)(arr) // => 15
 * _.reduceWith(_.subtract)(arr) // => -13
 * _.reduceWith(_.subtract, 0)(arr) // => -15
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @see {@link module:lamb.reduceRightWith|reduceRightWith}
 * @see {@link module:lamb.reduce|reduce}, {@link module:lamb.reduce|reduceRight}
 * @param {AccumulatorCallback} accumulator
 * @param {*} [initialValue]
 * @returns {Function}
 */
var reduceWith = _partialWithIteratee(reduce);

/**
 * Builds an array by extracting a portion of an array-like object.<br/>
 * It's a generic version of [Array.prototype.slice]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice}.
 * @example
 * _.slice(["foo", "bar", "baz"], 0, 2) // => ["foo", "bar"]
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @param {ArrayLike} arrayLike - Any array like object.
 * @param {Number} [start=0] - Zero-based index at which to begin extraction.
 * @param {Number} [end=arrayLike.length] - Zero-based index at which to end extraction.
 * Extracts up to but not including end.
 * @returns {Array}
 */
var slice = generic(_arrayProto.slice);

/**
 * Checks if at least one element in an array-like object satisfies the given predicate.<br/>
 * The function will stop calling the predicate as soon as it returns a <em>truthy</em> value.<br/>
 * Note that unlike the native
 * [Array.prototype.some]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some},
 * this function won't skip deleted or unassigned indexes.
 * @example
 * var persons = [
 *     {"name": "Jane", "age": 12, active: false},
 *     {"name": "John", "age": 40, active: false},
 *     {"name": "Mario", "age": 17, active: false},
 *     {"name": "Paolo", "age": 15, active: false}
 * ];
 * var isAdult = function (user) { return user.age >= 18; };
 * var isActive = _.hasKeyValue("active", true);
 *
 * _.someIn(persons, isAdult) // => true
 * _.someIn(persons, isActive) // => false
 *
 * @example <caption>Showing the difference with <code>Array.prototype.some</code>:</caption>
 * var arr = new Array(5);
 * arr[3] = 99;
 *
 * arr.some(_.isUndefined) // => false
 * _.someIn(arr, _.isUndefined) // => true
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @see {@link module:lamb.some|some}
 * @see {@link module:lamb.every|every}, {@link module:lamb.everyIn|everyIn}
 * @param {ArrayLike} arrayLike
 * @param {ListIteratorCallback} predicate
 * @param {Object} predicateContext
 * @returns {Boolean}
 */
var someIn = _makeArrayChecker(false);

/**
 * A curried version of {@link module:lamb.someIn|someIn} expecting a predicate and its optional
 * context to build a function waiting for the array-like to act upon.
 * @example
 * var data = [1, 3, 5, 6, 7, 8];
 * var isEven = function (n) { return n % 2 === 0; };
 * var isInteger = function (n) { return Math.floor(n) === n; };
 * var containsEvens = _.some(isEven);
 * var containsStrings = _.some(_.isType("String"));
 *
 * containsEvens(data) // => true
 * containsStrings(data) // => false
 *
 * @memberof module:lamb
 * @category Array
 * @function
 * @see {@link module:lamb.someIn|someIn}
 * @see {@link module:lamb.every|every}, {@link module:lamb.everyIn|everyIn}
 * @param {ListIteratorCallback} predicate
 * @param {Object} predicateContext
 * @returns {Function}
 */
var some = _partialWithIteratee(someIn);

lamb.every = every;
lamb.everyIn = everyIn;
lamb.filter = filter;
lamb.filterWith = filterWith;
lamb.forEach = forEach;
lamb.map = map;
lamb.mapWith = mapWith;
lamb.reduce = reduce;
lamb.reduceRight = reduceRight;
lamb.reduceRightWith = reduceRightWith;
lamb.reduceWith = reduceWith;
lamb.slice = slice;
lamb.some = some;
lamb.someIn = someIn;
