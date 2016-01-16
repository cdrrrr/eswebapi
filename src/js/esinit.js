(function() {
    'use strict';

    var underscore = angular.module('underscore', []);
    underscore.factory('_', function() {
        return window._; //Underscore must already be loaded on the page 
    });

    var version = "1.7.2";
    var vParts = _.map(version.split("."), function(x) {
        return parseInt(x);
    });

    var esAngularAPIVer = {
        Major: vParts[0],
        Minor: vParts[1],
        Patch: vParts[2]
    };


    var esWebFramework = angular.module('es.Services.Web');


    /**
     * @ngdoc service
     * @name es.Services.Web.esCacheProvider
     * @kind provider
     * @description
     * esCacheProvider exposes a set of functions that can be used to configure the esCache servive prior to its use. Configuration usually takes place
     * at the _app.js_ file of the AngularJS SPA in the _app.config_ function.
     */

    /**
     * @ngdoc service
     * @name es.Services.Web.esCache
     * @module es.Services.Web
     * @kind provider
     * @description
     * esCache is a service that provides chachinf functionality to the Entersoft AngularJS API library that can be also used from the application developer
     * for the needs of his/her Single Page Application. Although, the functions offered by the service are not specific to any of the publicly 
     * available javascript libraries, the current version of the service relies on jscache, but this can change any time in the future with 100%
     * compatibility to the functions offered by the service i.e. the exposed functions and their signature is an **interface** to the client developer, but not the
     * implementation.
     */
    esWebFramework.provider('esCache', function() {
        var cache = null;
        var settings = {};
        settings.maxSize = -1;
        settings.storage = null;

        return {
            /**
             * @ngdoc function
             * @name es.Services.Web.esCacheProvider#setMaxSize
             * @methodOf es.Services.Web.esCacheProvider
             * @module es.Services.Web
             * @kind function
             * @description This function is used to set the maximum number of items that the cache can hold.
             * @param {number} size the maximum number of items that the cache can hold. If parameter does not resolve to a number it is set to -1 i.e. 
             * **no limitation** in the number of cache items.
             **/
            setMaxSize: function(size) {
                if (angular.isNumber(size)) {
                    settings.maxSize = size;
                } else {
                    settings.maxSize = -1;
                }
            },

            /**
             * @ngdoc function
             * @name es.Services.Web.esCacheProvider#getMaxSize
             * @methodOf es.Services.Web.esCacheProvider
             * @module es.Services.Web
             * @kind function
             * @description This function returns the current maxsize for the cache.
             * @return {number} the maxSize that cache engine has been set to.
             **/
            getMaxSize: function() {
                return settings.maxSize;
            },

            /**
             * @ngdoc function
             * @name es.Services.Web.esCacheProvider#getStorageSettings
             * @methodOf es.Services.Web.esCacheProvider
             * @module es.Services.Web
             * @kind function
             * @description This function returns the storage object that cache engine has been configured to use, if any.
             * @return {Object} The storage object that cache engine has been configured to use, if any.
             **/
            getStorageSettings: function() {
                return settings.storage;
            },

            /**
             * @ngdoc function
             * @name es.Services.Web.esCacheProvider#setStorageSettings
             * @methodOf es.Services.Web.esCacheProvider
             * @module es.Services.Web
             * @kind function
             * @description This function sets the storage object to be used as a 2nd level cache by the cache engine.
             * @param {Object} storage The storage object to be used by the cache engine for 2nd level cache.
             **/
            setStorageSettings: function(storage) {
                if (settings) {
                    settings.storage = storage;
                }
            },

            $get: function() {
                if (typeof(Cache) === 'undefined') {
                    throw "You must include jscache.js";
                }

                window.Cache = Cache;
                cache = new Cache(settings.maxSize, false, settings.storage);

                return {
                    /**
                     * @ngdoc function
                     * @name es.Services.Web.esCache#getItem
                     * @methodOf es.Services.Web.esCache
                     * @module es.Services.Web
                     * @kind function
                     * @description This function is used to get a value that might exist in the cache under the unique id **key**.
                     * @param {Object|string} key Typically _key_ is of type string but it can be an object.
                     * @return {Object} If the key exists in the cache, the value of that key is returned, otherwise _undefined_
                     **/
                    getItem: function(key) {
                        return cache.getItem(key);
                    },

                    /**
                     * @ngdoc function
                     * @name es.Services.Web.esCache#setItem
                     * @methodOf es.Services.Web.esCache
                     * @module es.Services.Web
                     * @kind function
                     * @description This function is used to set a key, value pair in the cache. If the key is already in the cache, its value will 
                     * be replaced by the new value i.e. val
                     * @param {Object|string} key Typically _key_ is of type string but it can be an object.
                     * @param {Object} val The value to be stored under the key
                     * @param {Object=} options Caching options. For more information please visit [monsur jscache](https://github.com/monsur/jscache).
                     **/
                    setItem: function(key, val, options) {
                        cache.setItem(key, val, options);
                    },

                    /**
                     * @ngdoc function
                     * @name es.Services.Web.esCache#removeItem
                     * @methodOf es.Services.Web.esCache
                     * @module es.Services.Web
                     * @kind function
                     * @description This function is used to remove an entry from the cache identified by **key**
                     * @param {Object|string} key Typically _key_ is of type string but it can be an object.
                     **/
                    removeItem: function(key) {
                        cache.removeItem(key);
                    },

                    /**
                     * @ngdoc function
                     * @name es.Services.Web.esCache#removeWhere
                     * @methodOf es.Services.Web.esCache
                     * @module es.Services.Web
                     * @kind function
                     * @description This function is used to remove entries from the cache according to the resolution of the f supplied function
                     * @param {function(key, val)} f a function which takes two arguments (key, val) and it should return a boolean value. This function 
                     * will called against all cache entries and those that this function qualifies to true will be deleted from the cache.
                     **/
                    removeWhere: function(f) {
                        cache.removeWhere(function(k, v) {
                            return f(k, v);
                        });
                    },

                    /**
                     * @ngdoc function
                     * @name es.Services.Web.esCache#size
                     * @methodOf es.Services.Web.esCache
                     * @module es.Services.Web
                     * @kind function
                     * @description This function returns the current number of entries that the cache holds.
                     * @return {number} The current number of entries that the cache holds.
                     **/
                    size: function() {
                        return cache.size();
                    },

                    /**
                     * @ngdoc function
                     * @name es.Services.Web.esCache#clear
                     * @methodOf es.Services.Web.esCache
                     * @module es.Services.Web
                     * @kind function
                     * @description This function clears the cache, by removing **ALL** its entries.
                     **/
                    clear: function() {
                        cache.clear();
                    },

                    /**
                     * @ngdoc function
                     * @name es.Services.Web.esCache#stats
                     * @methodOf es.Services.Web.esCache
                     * @module es.Services.Web
                     * @kind function
                     * @description This function returns cache statistics
                     * @return {object} It returns an object holding all cache statistics i.e.
```js
{
    "hits": 5,
    "misses": 1
}

```
                     **/
                    stats: function() {
                        return cache.getStats();
                    }
                }
            }

        }

    });

    /**
     * @ngdoc service
     * @name es.Services.Web.esMessaging
     * @kind factory
     * @description
     * esMessaging is a factory service that provides all the primitive functions for a publisher-subscribers messaging event system that its is not based 
     * on the AngularJS events or watch pattern but in pure callaback function pattern.
     */
    esWebFramework.factory('esMessaging', function() {
        //#region Internal Properties
        var cache = {};

        //#endregion

        //#region Internal Methods
        function publish() {
            if (!arguments || arguments.Length < 1) {
                throw "Publishing events requires at least one argument for topic id";
            }

            var topic = arguments[0];
            var restArgs = Array.prototype.slice.call(arguments, 1);

            cache[topic] && angular.forEach(cache[topic], function(callback) {
                try {
                    callback.apply(null, restArgs);
                } catch (exc) {
                    console.log("Error in messaging handler for topic ", topic);
                }
            });
        }

        function subscribe(topic, callback) {
            if (!cache[topic]) {
                cache[topic] = [];
            }
            cache[topic].push(callback);
            return [topic, callback];
        }

        function unsubscribe(handle) {
            var t = handle[0];
            cache[t] && angular.forEach(cache[t], function(idx) {
                if (this == handle[1]) {
                    cache[t].splice(idx, 1);
                }
            });
        }

        //#endregion

        // Define the functions and properties to reveal.
        var service = {

            /**
             * @ngdoc function
             * @name es.Services.Web.esMessaging#publish
             * @methodOf es.Services.Web.esMessaging
             * @module es.Services.Web
             * @kind function
             * @description This function is used to raise - publish that an event-topic has occurred. As a consequence, all the subscribed to 
             * this topic-event subsciption callback functions will be triggered and executed sequentially.
             * @param {object} args One or more arguments, with the first being the string for the topic-event that occurred. The rest of the arguments
             * if any will be supplied to the callback functions that will be fired. These extra arguments are considered to be specific to the nature 
             * of the topic-event.
             * @example
             * esMessaging is also used by the Entersoft AngularJS API in order to implement the login, logout, session expired, etc. logical events
             * that need to be handled and properly managed in any application based on the API. 
             *
             * This call is used by the API to publish an event that occured. The topic-event is the "AUTH_CHANGED" and it is this event-topic that any interested in 
             * party should subscribe to in order to be notified whenever this event occurs. The rest arguments, i.e. esClientSession and getAuthToken(model) are the
             * parameters that will be supplied to the callback functions that have been registered to this topic-event.
```js
esMessaging.publish("AUTH_CHANGED", esClientSession, getAuthToken(model));
```
             **/
            publish: publish,


            /**
             * @ngdoc function
             * @name es.Services.Web.esMessaging#subscribe
             * @methodOf es.Services.Web.esMessaging
             * @module es.Services.Web
             * @kind function
             * @description This function is used to subscribe to a specific event-topic and register a callback function to be called (i.e. fired)
             * once the event-topic is being raised - published.
             * @param {string} topic the event name to which this function will subscribe to the callback
             * @param {function} callback the callback function that will be fired once this event-topic is being **raised - published**
             * @return {object} An object representic the handle to this specific subscription instance. 
             * If you need to unsubscribe from this event-topic then you need to store the returned handle value, otherwise you do not need to keep the result
             * @example
             * In a controller, typically the root controller of an ng-app, we need to register for the "AUTH_CHANGED" topic event in order to properly configure and
             * handle the logic of our application depending on the current login / authentication state with the Entersoft Application Server. For this, we need to
             * use the subscribe function as in the example below:
```js
smeControllers.controller('mainCtrl', ['$location', '$scope', '$log', 'esMessaging', 'esWebApi', 'esGlobals',
    function($location, $scope, $log, esMessaging, esWebApiService, esGlobals) {

        // ... other things

        esMessaging.subscribe("AUTH_CHANGED", function(sess, apitoken) {
            $scope.esnotify.error(s);
        });
    }
]);
```
            *  
            **/
            subscribe: subscribe,

            /**
             * @ngdoc function
             * @name es.Services.Web.esMessaging#unsubscribe
             * @methodOf es.Services.Web.esMessaging
             * @module es.Services.Web
             * @kind function
             * @description This function is used to unsubscribe from an event-topic to which there was a subscription with the subscribe function
             * @param {object} handle The handle that the subscribe function returned as a result when we first did the subscription.
             **/
            unsubscribe: unsubscribe
        };

        return service;
    });

    /**
     * @ngdoc service
     * @name es.Services.Web.esGeoLocationSrv
     * @requires $q
     * @requires $window
     * @kind factory
     * @description
     * esGeoLocationSrv is a factory service that provides Html5 geolocation services to the API developer.
     */
    esWebFramework.factory('esGeoLocationSrv', ['$q', '$window', function($q, $window) {
        'use strict';

        function getCurrentPosition() {
            var deferred = $q.defer();

            if (!$window.navigator.geolocation) {
                deferred.reject('Geolocation not supported.');
            } else {
                $window.navigator.geolocation.getCurrentPosition(
                    function(position) {
                        deferred.resolve(position);
                    },
                    function(err) {
                        deferred.reject(err);
                    });
            }

            return deferred.promise;
        }

        return {
            getCurrentPosition: getCurrentPosition
        };
    }]);


    /**
     * @ngdoc service
     * @name es.Services.Web.esGlobals
     * @requires $sessionStorage
     * @requires $log
     * @requires $injector
     * @requires es.Services.Web.esMessaging
     * @kind factory
     * @description
     * esGlobals is a factory service that provides functions, constructs and messaging events for common _global_ nature in the context of a typical
     * AngularJS SPA based on Entersoft AngularJS API.
     */
    esWebFramework.factory('esGlobals', ['$sessionStorage', '$log', 'esMessaging', 'esCache', '$injector' /* 'es.Services.GA' */ ,
        function($sessionStorage, $log, esMessaging, esCache, $injector) {

            function esConvertGIDtoId(gid) {
                if (!gid) {
                    return 'gid';
                }
                return 'gid' + gid.replace(/-/g, '_');
            }

            function esConvertIDtoGID(id) {
                if (!id) {
                    return '';
                }

                if (id.slice(0, 'gid'.length) != 'gid') {
                    return id;
                }
                return id.slice(3).replace(/_/g, '-');
            }

            function ESPropertySet(ps) {
                this.ps = ps;
            }

            ESPropertySet.prototype.getSections = function() {
                var p = this.ps;

                if (!p || !p.Lines) {
                    return [];
                }

                return _.groupBy(p.Lines, 'Category_Code');
            }

            function ESPublicQueryDef(ctxId, groupId, filterId, pqOptions, params) {
                this.CtxID = ctxId;
                this.GroupID = groupId;
                this.FilterID = filterId;
                this.PQOptions = pqOptions;
                this.Params = params;
            }

            function ESMultiZoomDef(zoomId, pqOptions, useCache) {
                this.ZoomID = zoomId;
                this.PQOptions = pqOptions;
                this.UseCache = !!useCache;
            }

            function ESPQOptions(page, pageSize, withCount) {
                this.Page = page || -1;
                this.PageSize = pageSize || -1;
                this.WithCount = !!withCount;
            }

            var esComplexParamFunctionOptions = [{
                caption: "=",
                value: "EQ"
            }, {
                caption: "<>",
                value: "NE"
            }, {
                caption: "<",
                value: "LT"
            }, {
                caption: "<=",
                value: "LE"
            }, {
                caption: ">",
                value: "GT"
            }, {
                caption: ">=",
                value: "GE"
            }, {
                caption: "[]",
                value: "RANGE"
            }, {
                caption: "Κενό",
                value: "NULL"
            }, {
                caption: "Μη κενό",
                value: "NOTNULL"
            }];

            var dDateRangeClass = {
                6: [0, 1, 2, 3, 6, 8, 10, 11, 12, 13, 16, 19, 20, 21, 22, 23, 24],
                20: [0, 1, 25, 26, 27, 28, 29, 30],
            };

            var esDateRangeOptions = [{
                dValue: "0",
                dType: 0,
                title: "Specific Date Range"
            }, {
                dValue: "1",
                dType: 1,
                title: "Specific Date"
            }, {
                dValue: 'ESDateRange(SpecificDate, #9999/01/01#, SpecificDate, #1753/01/01#)',
                dType: 2,
                title: "Anything"
            }, {
                dValue: "ESDateRange(Day)",
                dType: 3,
                title: "Today"
            }, {
                dValue: 'ESDateRange(SpecificDate, #1753/01/01#, Day, 0)',
                dType: 4,
                title: "Up Today"
            }, {
                dValue: 'ESDateRange(Day, 0, SpecificDate, #9999/01/01#)',
                dType: 5,
                title: "Starting from Today"
            }, {
                dValue: "ESDateRange(Day, -1)",
                dType: 6,
                title: "Yesterday"
            }, {
                dValue: 'ESDateRange(SpecificDate, #1753/01/01#, Day, -1)',
                dType: 7,
                title: "Up To Yesterday"
            }, {
                dValue: "ESDateRange(Day, 1)",
                dType: 8,
                title: "Tomorrow"
            }, {
                dValue: 'ESDateRange(Day, 1, SpecificDate, #9999/01/01#)',
                dType: 9,
                title: "Starting from Tomorrow"
            }, {
                dValue: "ESDateRange(Week)",
                dType: 10,
                title: "Current week"
            }, {
                dValue: "ESDateRange(Week, -1)",
                dType: 11,
                title: "Previous week"
            }, {
                dValue: "ESDateRange(Week, 1)",
                dType: 12,
                title: "Next week"
            }, {
                dValue: "ESDateRange(Month)",
                dType: 13,
                title: "Current month"
            }, {
                dValue: 'ESDateRange(Month, 0, SpecificDate, #9999/01/01#)',
                dType: 14,
                title: "Since 1st of month"
            }, {
                dValue: 'ESDateRange(SpecificDate, #1753/01/01#, Month, 0)',
                dType: 15,
                title: "Up to end of month"
            }, {
                dValue: "ESDateRange(Month, -1)",
                dType: 16,
                title: "Last month"
            }, {
                dValue: 'ESDateRange(Month, -1, SpecificDate, #9999/01/01#)',
                dType: 17,
                title: "Since 1st of last month"
            }, {
                dValue: 'ESDateRange(SpecificDate, #1753/01/01#, Month, -1)',
                dType: 18,
                title: "Up to end of last month"
            }, {
                dValue: "ESDateRange(Quarter)",
                dType: 19,
                title: "Current quarter"
            }, {
                dValue: "ESDateRange(Quarter, -1)",
                dType: 20,
                title: "Last quarter"
            }, {
                dValue: "ESDateRange(SixMonth)",
                dType: 21,
                title: "This HY"
            }, {
                dValue: "ESDateRange(SixMonth, -1)",
                dType: 22,
                title: "Last HY"
            }, {
                dValue: "ESDateRange(Year)",
                dType: 23,
                title: "Current Year"
            }, {
                dValue: "ESDateRange(Year, -1)",
                dType: 24,
                title: "Last Year"
            }, {
                dValue: "ESDateRange(FiscalPeriod, 0)",
                dType: 25,
                title: "Current Fiscal Period"
            }, {
                dValue: "ESDateRange(FiscalYear, 0, Day, 0)",
                dType: 26,
                title: "Since start of FY up today"
            }, {
                dValue: "ESDateRange(FiscalYear, 0, FiscalPeriod, 0)",
                dType: 27,
                title: "Since start of FY up to end of Fiscal Period"
            }, {
                dValue: "ESDateRange(FiscalPeriod, -1)",
                dType: 28,
                title: "Last Fiscal Period"
            }, {
                dValue: "ESDateRange(FiscalPeriod, -1, Day, 0)",
                dType: 29,
                title: "Since start of last Fiscal Period up today"
            }, {
                dValue: "ESDateRange(FiscalYear, 0, FiscalPeriod, -1)",
                dType: 30,
                title: "Since start of FY up to last Fiscal Period"
            }, ];

            var dateRangeResolve = function(dateVal) {
                if (!dateVal || !dateVal.dRange) {
                    return '';
                }

                var d = new Date();

                var dObj = _.findWhere(esDateRangeOptions, {
                    dValue: dateVal.dRange
                });
                if (!dObj) {
                    return '';
                }

                var loc = "el-GR";
                var t = esClientSession;
                if (t && t.connectionModel && t.connectionModel.LangID) {
                    loc = t.connectionModel.LangID;
                }

                switch (dObj.dType) {
                    case 0:
                        {
                            if (!angular.isDate(dateVal.fromD) && !angular.isDate(dateVal.toD)) {
                                return "";
                            }

                            var s = "";
                            if (angular.isDate(dateVal.fromD)) {
                                s = dateVal.fromD.toLocaleDateString(loc);
                            }
                            s = s + " - ";

                            var toS = "";
                            if (angular.isDate(dateVal.toD)) {
                                toS = dateVal.toD.toLocaleDateString(loc);
                            }
                            s = s + toS;
                            return s;
                        }
                    case 1:
                        {
                            if (!angular.isDate(dateVal.fromD)) {
                                return "";
                            }
                            return dateVal.fromD.toLocaleDateString(loc);
                        }
                    case 2:
                        return "";
                    case 3:
                        return d.toLocaleDateString(loc);
                    case 4:
                        return "-> " + d.toLocaleDateString(loc);
                    case 5:
                        return d.toLocaleDateString(loc) + " ->";
                    case 6:
                        {
                            d.setDate(d.getDate() - 1);
                            return d.toLocaleDateString(loc);
                        }
                    case 7:
                        {
                            d.setDate(d.getDate() - 1);
                            return d.toLocaleDateString(loc) + " ->";
                        }
                    case 8:
                        {
                            d.setDate(d.getDate() + 1);
                            return d.toLocaleDateString(loc);
                        }
                    case 9:
                        {
                            d.setDate(d.getDate() + 1);
                            return d.toLocaleDateString(loc) + " ->";
                        }
                    case 10:
                        {
                            var cDay = d.getDay();
                            var sDiff = (cDay == 0) ? 6 : (cDay - 1);

                            var f = new Date(d);
                            var t = new Date(d);
                            f.setDate(d.getDate() - sDiff);
                            t.setDate(f.getDate() + 6);

                            return f.toLocaleDateString(loc) + " - " + t.toLocaleDateString(loc);
                        }
                    case 11:
                        {
                            d.setDate(d.getDate() - 7);

                            var cDay = d.getDay();
                            var sDiff = (cDay == 0) ? 6 : (cDay - 1);

                            var f = new Date(d);
                            var t = new Date(d);
                            f.setDate(d.getDate() - sDiff);
                            t.setDate(f.getDate() + 6);

                            return f.toLocaleDateString(loc) + " - " + t.toLocaleDateString(loc);
                        }
                    case 12:
                        {
                            d.setDate(d.getDate() + 7);

                            var cDay = d.getDay();
                            var sDiff = (cDay == 0) ? 6 : (cDay - 1);

                            var f = new Date(d);
                            var t = new Date(d);
                            f.setDate(d.getDate() - sDiff);
                            t.setDate(f.getDate() + 6);

                            return f.toLocaleDateString(loc) + " - " + t.toLocaleDateString(loc);
                        }
                    case 13:
                        {
                            d.setDate(1);

                            var f = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                            return d.toLocaleDateString(loc) + " - " + f.toLocaleDateString(loc);
                        }
                    case 14:
                        {
                            d.setDate(1);
                            return d.toLocaleDateString(loc) + " ->";
                        }
                    case 15:
                        {
                            var f = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                            return "-> " + f.toLocaleDateString(loc);
                        }
                    case 16:
                        {
                            var f = new Date(d.getFullYear(), d.getMonth() - 1, 1);
                            var t = new Date(d.getFullYear(), d.getMonth(), 0);
                            return f.toLocaleDateString(loc) + " - " + t.toLocaleDateString(loc);
                        }
                    case 17:
                        {
                            var f = new Date(d.getFullYear(), d.getMonth() - 1, 1);
                            return f.toLocaleDateString(loc) + " ->";
                        }
                    case 18:
                        {
                            var f = new Date(d.getFullYear(), d.getMonth(), 0);
                            return "-> " + f.toLocaleDateString(loc);
                        }
                    case 19:
                        {
                            var m = d.getMonth();
                            var r = m % 3;

                            var f = new Date(d.getFullYear(), m - r, 1);
                            var t = new Date(d.getFullYear(), m + (3 - r), 0);
                            return f.toLocaleDateString(loc) + " -> " + t.toLocaleDateString(loc);
                        }
                    case 20:
                        {
                            var m = d.getMonth();
                            var r = m % 3;

                            var t = new Date(d.getFullYear(), m - r, 0);
                            var f = new Date(d.getFullYear(), t.getMonth() - 2, 1);
                            return f.toLocaleDateString(loc) + " -> " + t.toLocaleDateString(loc);
                        }
                    case 21:
                        {
                            var f = new Date(d.getFullYear(), (m >= 6) ? 6 : 0, 1);
                            var t = new Date(d.getFullYear(), (m >= 6) ? 11 : 5, (m >= 6) ? 31 : 30);
                            return f.toLocaleDateString(loc) + " -> " + t.toLocaleDateString(loc);
                        }
                    case 22:
                        {
                            var f;
                            var t;
                            var y = d.getFullYear();
                            if (m >= 6) {
                                f = new Date(y, 0, 1);
                                t = new Date(y, 5, 30);
                            } else {
                                f = new Date(y - 1, 6, 1);
                                t = new Date(y - 1, 11, 31);
                            }

                            return f.toLocaleDateString(loc) + " -> " + t.toLocaleDateString(loc);
                        }

                    case 23:
                        {
                            var y = d.getFullYear();
                            var f = new Date(y, 0, 1);
                            var t = new Date(y, 11, 31);
                            return f.toLocaleDateString(loc) + " -> " + t.toLocaleDateString(loc);
                        }

                    case 24:
                        {
                            var y = d.getFullYear() - 1;
                            var f = new Date(y, 0, 1);
                            var t = new Date(y, 11, 31);
                            return f.toLocaleDateString(loc) + " -> " + t.toLocaleDateString(loc);
                        }
                    default:
                        return dObj.title;
                }
            }


            function ESParamVal(paramId, paramVal, enumList) {
                this.paramCode = paramId;
                this.paramValue = paramVal;
                this.enumList = enumList;
            }

            ESParamVal.prototype.getExecuteVal = function() {
                return this.paramValue;
            };

            ESParamVal.prototype.pValue = function(v) {
                if (!arguments || arguments.length == 0) {
                    // get
                    return this.paramValue;
                }

                if (this.paramValue === arguments[0]) {
                    return false;
                }

                this.paramValue = arguments[0];
                return true;
            }

            ESParamVal.prototype.strVal = function() {
                var lst = this.enumList;
                if (!lst || lst.length == 0) {
                    // typical case, not an enum / option
                    return this.paramValue ? this.paramValue.toString() : '';
                }

                if (!this.paramValue) {
                    return '';
                }

                var vals;
                vals = angular.isArray(this.paramValue) ? this.paramValue : [this.paramValue];

                var s = _.reduce(vals, function(memo, x) {
                    var es = _.findWhere(lst, {
                        value: x
                    });
                    return memo + (es ? es.text : x.toString()) + " + ";
                }, '');

                return s.substring(0, s.lastIndexOf(" + "));
            };


            function ESNumericParamVal(paramId, paramVal) {
                //call super constructor
                ESParamVal.call(this, paramId, paramVal);
            }

            //inherit from ESParamval SuperClass
            ESNumericParamVal.prototype = Object.create(ESParamVal.prototype);

            ESNumericParamVal.prototype.strVal = function() {
                var zero = 0;
                zero = zero.toString();
                var froms = this.paramValue.value ? this.paramValue.value.toString() : zero;
                var tos = this.paramValue.valueTo ? this.paramValue.valueTo.toString() : zero;
                switch (this.paramValue.oper) {
                    case "RANGE":
                        return "ΑΠΟ " + froms + " ΕΩΣ " + tos;

                    case "NULL":
                        return "KENO";

                    case "NOTNULL":
                        return "MH KENO";

                    default:
                        return this.paramValue.oper.toString() + " " + froms;
                }
            }

            ESNumericParamVal.prototype.getExecuteVal = function() {
                this.paramValue.value = this.paramValue.value || 0;
                this.paramValue.valueTo = this.paramValue.valueTo || 0;

                switch (this.paramValue.oper) {
                    case "RANGE":
                        return "ESNumeric(" + this.paramValue.oper + ", '" + this.paramValue.value + "', '" + this.paramValue.valueTo + "')";
                    case "NULL":
                    case "NOTNULL":
                        return "ESNumeric(" + this.paramValue.oper + ", '0')";
                    default:
                        return "ESNumeric(" + this.paramValue.oper + ", '" + this.paramValue.value + "')";
                }
            }

            function ESStringParamVal(paramId, paramVal) {
                //call super constructor
                ESParamVal.call(this, paramId, paramVal);
            }

            //inherit from ESParamval SuperClass
            ESStringParamVal.prototype = Object.create(ESParamVal.prototype);

            ESStringParamVal.prototype.strVal = function() {
                var froms = this.paramValue.value ? this.paramValue.value.toString() : '';
                var tos = this.paramValue.valueTo ? this.paramValue.valueTo.toString() : '';
                switch (this.paramValue.oper) {
                    case "RANGE":
                        return "ΑΠΟ " + froms + " ΕΩΣ " + tos;

                    case "NULL":
                        return "KENO";

                    case "NOTNULL":
                        return "MH KENO";

                    default:
                        return this.paramValue.oper.toString() + " " + froms;
                }
            }

            ESStringParamVal.prototype.getExecuteVal = function() {
                switch (this.paramValue.oper) {
                    case "EQ":
                        return this.paramValue.value;
                    case "RANGE":
                        return "ESString(" + this.paramValue.oper + ", '" + this.paramValue.value + "', '" + this.paramValue.valueTo + "')";
                    case "NULL":
                    case "NOTNULL":
                        return "ESString(" + this.paramValue.oper + ", '')";
                    default:
                        return "ESString(" + this.paramValue.oper + ", '" + this.paramValue.value + "')";
                }
            }

            function ESDateParamVal(paramId, paramVal) {
                //call super constructor
                //param id will be given at a later assignment
                if (!paramVal) {
                    paramVal = {
                        // empty date range is treated as ANYTHING
                        dRange: 'ESDateRange(SpecificDate, #9999/01/01#, SpecificDate, #1753/01/01#)',
                        fromD: null,
                        toD: null
                    };
                }
                ESParamVal.call(this, paramId, paramVal);
            }

            ESDateParamVal.prototype = Object.create(ESParamVal.prototype);

            ESDateParamVal.prototype.strVal = function() {
                return dateRangeResolve(this.paramValue);
            }

            ESDateParamVal.prototype.getExecuteVal = function() {
                var s = this.paramValue.dRange;
                if (s == "0" || s == "1") {
                    var sFromD = "#1753/01/01#";
                    var sToD = "#9999/01/01#";
                    var isEmpty = true;

                    // Fix the fromD
                    var mFromD = moment(this.paramValue.fromD);
                    if (mFromD.isValid()) {
                        isEmpty = false;
                        sFromD = mFromD.format('YYYY/MM/DD');
                    }

                    var mToD = moment(this.paramValue.toD);
                    if (mToD.isValid()) {
                        isEmpty = false;
                        sToD = mToD.format('YYYY/MM/DD');
                    }

                    if (s == "0" || isEmpty) {
                        return "ESDateRange(SpecificDate, " + "#" + sFromD + "#" + ", SpecificDate, " + "#" + sToD + "#" + ")";
                    }

                    return "ESDateRange(SpecificDate, " + "#" + sFromD + "#" + ")";
                }

                return this.paramValue.dRange;
            }

            /**
             * @ngdoc constructor
             * @name es.Services.Web.esGlobals#ESParamValues
             * @methodOf es.Services.Web.esGlobals
             * @module es.Services.Web
             * @kind constructor
             * @constructor
             * @description Constructs an ESParamValues object to be used in es-params-panel directive or public query execution
             * @param {object=} vals a JSON object with key-value properties representing the params
             * @return {ESParamValues} Returns a new instance of the ESParamValue class.
             * @example
```js
var esVals = new esGlobals.ESParamValues({pCode: 'Hello World'});
var esVals2 = new esGlobals.ESParamValues();
```
            */
            function ESParamValues(vals) {
                this.setParamValues(vals);
            }

            /**
             * @ngdoc function
             * @name es.Services.Web.esGlobals#ESParamValues.merge
             * @methodOf es.Services.Web.esGlobals
             * @module es.Services.Web
             * @kind function
             * @description Merges into the current instance of the ESParamValues object the values provided by the val parameter
             * @param {ESParamValues|object} val an object that is either of type ESParamValues or a simple JSON object with key-value pairs
             * with the constraint that the value should be of type {@link es.Services.Web.esGlobals#methods_ESParamVal ESParamVal}.
             * @example
```js
var pA = new esGlobals.ESParamValues({p1: 'Hello', p2: 5});
var pB = new esGlobals.ESParamValues({p3: 'Hello'});
pA.merge(pB);
$log.info(JSON.stringify(pA));
// will result into p1, p2, p3
```
            */
            ESParamValues.prototype.merge = function(val) {
                var x = this;
                if (val) {
                    for (var prop in val) {
                        if (!val[prop] || !val[prop] instanceof ESParamVal) {
                            throw new Error("Invalid parameter type in merge function in paramvalues");
                        }

                        if (!x.hasOwnProperty(prop)) {
                            // property xxx i.e. param xxx does not exist at all. So we must add it during the merge
                            x[prop] = val[prop];
                        } else {
                            //property xxx i.e. param xxx already exists. Check the type of the value
                            if (x[prop] instanceof ESParamVal) {

                                x[prop].enumList = val[prop].enumList;
                            } else {
                                // existing property i.e. param is not of ESParamVal type. In that case we override the value to the source one
                                x[prop] = val[prop];
                            }

                        }
                    }
                }
                return this;
            }

            /**
             * @ngdoc function
             * @name es.Services.Web.esGlobals#ESParamValues.setParamValues
             * @methodOf es.Services.Web.esGlobals
             * @module es.Services.Web
             * @kind function
             * @description Assigns or merges into the current instance of ESParamValues the given vals. If the current instance 
             * already holds parameter values then their values will be replaced by the vals property values if they exists or unmodified
             * if the they do not exists in the vals object
             * @param {object=} vals a JSON object with key-value properties representing the params
             * @example
```js
var x = new esGlobals.ESParamValues();
x.setParamValues({p1: 'Hello World'});
```
            */
            ESParamValues.prototype.setParamValues = function(vals) {
                var x = this;

                //delete any previsously assigned properties
                for (var prop in x) {
                    if (x.hasOwnProperty(prop)) {
                        delete x[prop];
                    }
                };

                //asign new properties
                if (!vals || !_.isArray(vals) || vals.length == 0) {
                    return;
                }

                vals.forEach(function(element, index, array) {
                    x[element.paramCode] = element;
                });
            }

            ESParamValues.prototype.getExecuteVals = function() {
                var x = this;
                var ret = {};
                for (var prop in x) {
                    if (x.hasOwnProperty(prop)) {
                        var p = x[prop];

                        if (p.paramValue || (angular.isNumber(p.paramValue) && p.paramValue == 0)) {
                            ret[p.paramCode] = p.getExecuteVal();
                        }
                    }
                }
                return ret;
            }

            function fgetGA() {
                if (!$injector) {
                    return undefined;
                }

                try {
                    return $injector.get('es.Services.GA');
                } catch (x) {
                    return undefined;
                }

            }

            function fgetModel() {
                if (!esClientSession.connectionModel) {

                    // check to see if session data are stored in the session storage so that 
                    // we can use this object as model
                    var inStorage = $sessionStorage;
                    var session = null;
                    if (typeof inStorage.__esrequest_sesssion !== 'undefined' && inStorage.__esrequest_sesssion !== null) {
                        session = inStorage.__esrequest_sesssion;
                        esClientSession.connectionModel = session;

                        esMessaging.publish("AUTH_CHANGED", esClientSession, getAuthToken(session));

                        var esga = fgetGA();
                        if (angular.isDefined(esga)) {

                            esga.registerEventTrack({
                                category: 'AUTH',
                                action: 'RELOGIN',
                                label: esClientSession.connectionModel.GID
                            });
                        }

                        $log.info("RELOGIN User ", esClientSession.connectionModel.Name);
                    } else {
                        esMessaging.publish("AUTH_CHANGED", null, getAuthToken(null));
                        $log.info("NO RELOGIN from stored state");
                    }
                }

                return esClientSession.connectionModel;
            }

            function fsetModel(model) {
                var currentGID = null;

                if (esClientSession.connectionModel) {
                    currentGID = esClientSession.connectionModel.GID;
                }

                esClientSession.connectionModel = model;

                if (!model) {
                    delete $sessionStorage.__esrequest_sesssion;

                    var esga = fgetGA();
                    if (angular.isDefined(esga)) {
                        esga.registerEventTrack({
                            category: 'AUTH',
                            action: 'LOGOUT',
                            label: currentGID
                        });
                    }

                } else {
                    $sessionStorage.__esrequest_sesssion = model;
                }

                esMessaging.publish("AUTH_CHANGED", esClientSession, getAuthToken(model));
            }

            function getUserMessage(err, status) {

                var rep = {
                    isLogin: false,
                    messageToShow: ""
                };

                if (!err) {
                    switch (status) {
                        case 401:
                            rep.isLogin = true;
                            rep.messageToShow = "Please Login first";
                            break;

                        case 403:
                            rep.isLogin = true;
                            rep.messageToShow = "You are not authorized. Please Login and try again";
                            break;

                        case 500:
                        default:
                            rep.isLogin = true;
                            rep.messageToShow = "General Error. Please check your network and internet access";
                            break;
                    }
                    return rep;
                }

                rep.isLogin = (err.status == 401) || (err.status == 403) || (status == 401) || (status == 403);

                if (err instanceof ArrayBuffer) {
                    // In case that response is of type ArrayBuffer instead of an object
                    try {
                        err = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(err)));
                    } catch (x) {

                    }
                }

                var sMsg = "";
                if (err.UserMessage) {
                    sMsg = err.UserMessage;
                    if (err.MessageID) {
                        sMsg = sMsg + " (" + err.MessageID + ")";
                    }
                    rep.messageToShow = sMsg;
                    return rep;
                }

                if (err.Messages) {
                    if (angular.isArray(err.Messages)) {
                        var i = 0;
                        sMsg = _.reduce(err.Messages, function(ret, x) {
                            return ret + "\r\n" + "[" + ++i + "] " + x;
                        }, "");

                    } else {
                        sMsg = err.Messages;
                    }

                    rep.messageToShow = sMsg ? sMsg : "General Error. Please check your network and internet access";
                    return rep;
                } else {
                    rep.messageToShow = "General Error. Please check your network and internet access";
                    return rep;
                }
            }


            function getAuthToken(model) {
                if (model) {
                    return 'Bearer ' + model.WebApiToken;
                }
                return '';
            }

            // Private variables//
            var esClientSession = {
                hostUrl: "",
                connectionModel: null,

                setWebApiToken: function(newToken, reqUrl) {
                    if (esClientSession.connectionModel && newToken && angular.isString(newToken)) {
                        if (newToken !== esClientSession.connectionModel.WebApiToken) {
                            esClientSession.connectionModel.WebApiToken = newToken;
                            $log.warn("Changing wep api token for [" + reqUrl + "]");
                        } else {
                            $log.warn("[" + reqUrl + "] => For some strange reason I have been ordered to store a new web api token but the new one is the same to the old");
                        }
                    }
                },

                getWebApiToken: function() {
                    //sme fake
                    var s = getAuthToken(fgetModel());

                    /*
                    if (s) {
                        s = s.replace("j", "f").replace("x", "h");
                    }
                    */

                    return s;
                },

                setModel: fsetModel,

                getModel: fgetModel,
            };

            function getMimeTypes() {
                return mimes;
            }

            function TrackTiming(category, variable, opt_label) {
                this.category = category;
                this.variable = variable;
                this.label = opt_label ? opt_label : undefined;
                this.startTime;
                this.endTime;
                return this;
            }

            TrackTiming.prototype.startTime = function() {
                this.startTime = new Date().getTime();
                return this;
            }

            TrackTiming.prototype.endTime = function() {
                this.endTime = new Date().getTime();
                return this;
            }

            TrackTiming.prototype.send = function() {
                var timeSpent = this.endTime - this.startTime;
                var esga = fgetGA();
                if (!esga) {
                    return;
                }

                esga.registerTiming({
                    timingCategory: this.category,
                    timingVar: this.variable,
                    timingValue: timeSpent,
                    timingLabel: this.label
                });
                return this;
            }



            return {

                /**
                 * @ngdoc function
                 * @name es.Services.Web.esGlobals#esConvertGIDtoId
                 * @methodOf es.Services.Web.esGlobals
                 * @module es.Services.Web
                 * @kind function
                 * @description Converts a string value represeting a GID to a string value that can act as a value for the name attribute in html elements.
                 * This is a useful function that can be used to convert a gid to an id that can be assigned as an HTML element name i.e. in a form field declartion.
                 * @param {string} gid the gid in string value representation to be converted
                 * @return {string} the converted value to string that is of the form "gid" + gid as string BUT with the - char replaced to _.
                 * If the parameter is null or undefined then the static string "gid" is returned.
                 * @example
```html
<input 
    class="es-survey-question-control es-param-control" 
    kendo-date-time-picker
        name="{{esGlobals.esConvertGIDtoId(esQuestion.GID)}}" 
        ng-required="esQuestion.Mandatory" 
        ng-model="esPsVal[esQuestion.Code]" 
/>
```
                 **/
                esConvertGIDtoId: esConvertGIDtoId,

                /**
                 * @ngdoc function
                 * @name es.Services.Web.esGlobals#esConvertIDtoGID
                 * @methodOf es.Services.Web.esGlobals
                 * @module es.Services.Web
                 * @kind function
                 * @description Converts a string value represeting a GID to a string value that can act as a value for the name attribute in html elements.
                 * This is a useful function that can be used to convert a gid to an id that can be assigned as an HTML element name i.e. in a form field declartion.
                 * @param {string} id the string value representation of a gid (as a result of the {@link es.Services.Web.esGlobals#methods_esConvertGIDtoId esConvertGIDtoId function call}) to be converted back to a gid string
                 * @return {string} the original gid value in string representation.
                 * If the parameter is null or undefined then the static string "gid" is returned.
                 **/
                esConvertIDtoGID: esConvertIDtoGID,


                /**
                 * @ngdoc function
                 * @name es.Services.Web.esGlobals#getVersion
                 * @methodOf es.Services.Web.esGlobals
                 * @module es.Services.Web
                 * @kind function
                 * @description Function that returns the current version of the Entersoft AngularJS API.
                 * @return {object} A JSON object representing the current version of the Entersoft AngularJS API in sem-ver semantics
```js
var esAPIversion = {
    Major: int, // i.e. 1
    Minor: int, // i.e. 0
    Patch: int // i.e. 1
}
```
                **/
                getVersion: function() {
                    return esAngularAPIVer;
                },

                /**
                 * @ngdoc function
                 * @name es.Services.Web.esGlobals#getMimeTypeForExt
                 * @methodOf es.Services.Web.esGlobals
                 * @module es.Services.Web
                 * @kind function
                 * @description Function that returns the mime-type for the given input filename or extension.
                 * 
                 * **REQUIRES ESWebAPIServer >= 1.7.9**
                 *
                 * @param {object[]} mimelist An array of objects of type {mime: string, extension: string, IsText: boolean} that holds a mime representation record.
                 * For more information on how to get a list of supported mime types please read {@link es.Services.Web.esWebApi#methods_getMimeTypes mimeTypes}.
                 * @param {string} filenamewithext the fullpath or just the filename or just the extension for which we want to have the corresponding mime-type
                 * i.e. "/abc/xyz/masterfile.pdf" or "docx" or ".xlsx", etc.
                 * @return {string} The mime-type string for the extension or filename provided in the _filenamewithext_ param. If no mime-type is registered for 
                 * this extension the function returns an empty string ''.
                 * @example
                 * 
```js
var mimeType = esGlobals.getMimeTypeForExt(mimelist, "myfile.docx");
// mimeType will be "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
```
                */
                getMimeTypeForExt: function(mimelist, filenamewithext) {
                    if (!filenamewithext) {
                        return "";
                    }
                    var parts = filenamewithext.split(".");
                    var ext = parts[parts.length - 1].toLowerCase();
                    if (!ext) {
                        return "";
                    }

                    var mime = _.find(mimelist, function(x) {
                        return x.extension.indexOf(ext) != -1;
                    });
                    if (mime) {
                        return mime.mime;
                    }
                    return "";
                },

                /**
                 * @ngdoc function
                 * @name es.Services.Web.esGlobals#getExtensionsForMimeType
                 * @methodOf es.Services.Web.esGlobals
                 * @module es.Services.Web
                 * @kind function
                 * @description Function that returns an array of extensions that match the given mimeType
                 * 
                 * **REQUIRES ESWebAPIServer >= 1.7.9**
                 *
                 * @param {object[]} mimelist An array of objects of type {mime: string, extension: string, IsText: boolean} that holds a mime representation record.
                 * For more information on how to get a list of supported mime types please read {@link es.Services.Web.esWebApi#methods_getMimeTypes mimeTypes}.
                 * @param {string} mimeType The mimeType string for which we want the string array of extensions that are mapped to this mimeType
                 * @return {string[]} The array of strings that are mapped to this mimeType. If no map is found, an empty array i.e. [] will be returned
                 * @example
                 * 
```js
var exts = esGlobals.getExtensionsForMimeType(mimelist, "text/plain");
//exts will be ["txt", "text", "conf", "def", "list", "log", "in"]
```
                */
                getExtensionsForMimeType: function(mimilist, mimeType) {
                    if (!mimeType) {
                        return [];
                    }

                    mimeType = mimeType.toLowerCase();
                    var mime = _.find(mimelist, function(x) {
                        return x.mime == mimeType;
                    });

                    if (mime) {
                        return mime.extension;
                    }
                    return [];
                },

                getGA: fgetGA,

                setWebApiToken: esClientSession.setWebApiToken,

                getWebApiToken: function() {
                    return esClientSession.getWebApiToken();
                },

                getClientSession: function() {
                    return esClientSession;
                },

                /**
                 * @ngdoc function
                 * @name es.Services.Web.esGlobals#getUserMessage
                 * @methodOf es.Services.Web.esGlobals
                 * @module es.Services.Web
                 * @kind function
                 * @description This function is used to process the error obejct as well as the status code of any type of error in order to get the best match
                 * for a user **Error Message** string to be presented to the user.
                 * @param {object} err The error object we got from i.e. http or promise failure. 
                 * @param {number=} status The status int code we got from an http or promise failure
                 * @return {object} A JSON object with the following type: 
```js
{
    isLogin: boolean, // boolean value indicating whether the error is related to the login process
    messageToShow: string // The string message to be shown to the user
}
```
                 * @example
```js
smeControllers.controller('mainCtrl', ['$location', '$scope', '$log', 'esMessaging', 'esWebApi', 'esGlobals',
    function($location, $scope, $log, esMessaging, esWebApiService, esGlobals) {

        // other things to do

        esMessaging.subscribe("ES_HTTP_CORE_ERR", function(rejection, status) {
            var s = esGlobals.getUserMessage(rejection, status);
            $scope.esnotify.error(s.messageToShow);
        });
    }
]);
```             **/
                getUserMessage: getUserMessage,

                /**
                 * @ngdoc function
                 * @name es.Services.Web.esGlobals#ESPublicQueryDef
                 * @methodOf es.Services.Web.esGlobals
                 * @module es.Services.Web
                 * @kind constructor
                 * @constructor
                 * @description Constructs an ESPublicQueryDef object that will be used to specify the execution of a PublicQuery in a call to multiPublicQuery
                 * @param {string} CtxID A unique identifier for this PQ execution call (unique in the context of the array of ESPublicQueryDef that will be used in the execution of multiPublicQuery)
                 * @param {string} GroupID The GroupID of the Public Query
                 * @param {string} FilterID The FilterID of the Public Query
                 * @param {ESPQOptions} The paging options for the Public Query Execution. See {@link es.Services.Web.esGlobals#methods_ESPQOptions ESPQOptions}.
                 * @param {object} Params The params to be used for the execution of the Public Query
                 */
                ESPublicQueryDef: ESPublicQueryDef,

                /**
                 * @ngdoc function
                 * @name es.Services.Web.esGlobals#ESMultiZoomDef
                 * @methodOf es.Services.Web.esGlobals
                 * @module es.Services.Web
                 * @kind constructor
                 * @constructor
                 * @description Constructs an ESPublicQueryDef object that will be used to specify the execution of a PublicQuery in a call to multiPublicQuery
                 * @param {string} ZoomID The ID of the ES Zoom to be retrieved i.e. "__ESGOZCountry__"
                 * @param {ESPQOptions} PQOptions The server side paging options to be used for the Zoom retrieval. See {@link es.Services.Web.esGlobals#methods_ESPQOptions ESPQOptions}.
                 * @param {boolean} UseCache A boolean value indicating whether the contents of this specific Zoom will be retrieved and stored in the ESWebAPI client-side memory cache.
                 */
                ESMultiZoomDef: ESMultiZoomDef,

                /**
                 * @ngdoc constructor
                 * @name es.Services.Web.esGlobals#ESPQOptions
                 * @methodOf es.Services.Web.esGlobals
                 * @module es.Services.Web
                 * @kind constructor
                 * @constructor
                 * @description Constructs an ESPQOptions object that specifies the server side paging options of a Public Query execution
                 * @param {number} Page The Server Side Page Number (__1-based__) to be retrieved. Valid is considered any value represeting a number >= 1
                 * @param {number} PageSize The Server Side size of page (> =1) to be retrieved from the server. 
                 * @param {boolean} WithCount If true, the result of the execution will also have the total number of records that exist for this execution run of the PQ
                 */
                ESPQOptions: ESPQOptions,

                ESParamValues: ESParamValues,
                ESParamVal: ESParamVal,
                ESNumericParamVal: ESNumericParamVal,
                ESStringParamVal: ESStringParamVal,
                ESDateParamVal: ESDateParamVal,

                getesDateRangeOptions: function(dateRangeClass) {
                    if (!dateRangeClass || !dDateRangeClass[dateRangeClass]) {
                        return esDateRangeOptions;
                    }

                    var arr = dDateRangeClass[dateRangeClass];
                    if (!_.isArray(arr) || arr.length == 0) {
                        return esDateRangeOptions;
                    }

                    var x = [];
                    var i;
                    for (i = 0; i < arr.length; i++) {
                        x[i] = esDateRangeOptions[arr[i]];
                    }
                    return x;
                },

                getesComplexParamFunctionOptions: function() {
                    return esComplexParamFunctionOptions;
                },


                sessionClosed: function() {
                    esClientSession.setModel(null);
                    try {
                        esCache.clear();
                    } catch (x) {

                    }
                },

                trackTimer: function(category, variable, opt_label) {
                    return new TrackTiming(category, variable, opt_label);
                },

                sessionOpened: function(data, credentials) {
                    try {
                        try {
                            esCache.clear();
                        } catch (x) {

                        }

                        data.Model.LangID = data.Model.LangID || credentials.LangID;
                        data.Model.LangID = data.Model.LangID || "el-GR";

                        data.Model.BranchID = data.Model.BranchID || credentials.BranchID || "-";

                        esClientSession.setModel(data.Model);

                        var esga = fgetGA();
                        if (angular.isDefined(esga)) {
                            esga.registerEventTrack({
                                category: 'AUTH',
                                action: 'LOGIN',
                                label: data.Model.GID
                            });
                        }

                        $log.info("LOGIN User ", data.Model.Name);

                    } catch (exc) {
                        $log.error(exc);
                        throw exc;
                    }
                }
            }
        }
    ]);
})();
