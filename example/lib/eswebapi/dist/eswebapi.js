/*! Entersoft Application Server WEB API - v0.0.1 - 2015-09-10
* Copyright (c) 2015 Entersoft SA; Licensed Apache-2.0 */
/***********************************
 * Entersoft SA
 * http://www.entersoft.eu
 * v0.0.72
 *
 ***********************************/

/**
 * @ngdoc overview
 * @name es.Services.Web
 * @module es.Services.Web
 * @requires ngStorage
 * @requires ngSanitize
 * @kind module
 * @description
 * This module encapsulates the services, providers, factories and constants for the **Entersoft AngularJS WEB API**
 * The main functions provided are:
 ** a()
 ** b()
 */

(function() {
    'use strict';

    /* Services */

    var esWebServices = angular.module('es.Services.Web', ['ngStorage', 'ngSanitize' /*, 'es.Services.Analytics' */ ]);

    esWebServices.
    constant('ESWEBAPI_URL', {
        __LOGIN__: "api/Login",
        __PUBLICQUERY__: "api/rpc/PublicQuery/",
        __PUBLICQUERY_INFO__: "api/rpc/PublicQueryInfo/",
        __USERSITES__: "api/Login/Usersites",
        __STANDARD_ZOOM__: "api/rpc/FetchStdZoom/",
        __SCROLLERROOTTABLE__: "api/rpc/SimpleScrollerRootTable/",
        __SCROLLER__: "api/rpc/SimpleScroller/",
        __ENTITYACTION__: "api/Entity/",
        __ENTITYBYGIDACTION__: "api/EntityByGID/",
        __ELASTICSEARCH__: "api/esearch/",
        __SERVER_CAPABILITIES__: "api/Login/ServerCapabilities/",
        __REGISTER_EXCEPTION__: "api/rpc/registerException/",
        __FETCH_COMPANY_PARAM__: "api/rpc/FetchCompanyParam/",
        __FETCH_COMPANY_PARAMS__: "api/rpc/FetchCompanyParams/",
        __SCROLLER_COMMAND__: "api/rpc/ScrollerCommand/",
        __FORM_COMMAND__: "api/rpc/FormCommand/",
        __FETCH_SESSION_INFO__: "api/rpc/FetchSessionInfo/",
        __FETCH_ODS_TABLE_INFO__: "api/rpc/FetchOdsTableInfo/",
        __FETCH_ODS_COLUMN_INFO__: "api/rpc/FetchOdsColumnInfo/",
        __FETCH_ODS_RELATION_INFO__: "api/rpc/FetchOdsRelationInfo/",
        __FETCH_ODS_DETAIL_RELATIONS_INFO__: "api/rpc/FetchOdsDetailRelationsInfo/",
        __FETCH_ODS_MASTER_RELATIONS_INFO__: "api/rpc/FetchOdsMasterRelationsInfo/",
    });

    esWebServices.value("__WEBAPI_RT__", {
        url: ""
    });


    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    function startsWith(str, prefix) {
        return str.toLowerCase().indexOf(prefix.toLowerCase()) === 0;
    }

    /**
     * @ngdoc service
     * @name es.Services.Web.esWebApi
     * @module es.Services.Web
     * @kind provider
     * @description
     * # esWebApi
     * Web API.
     */
    esWebServices.provider("esWebApi",
        function() {

            var urlWEBAPI = "";
            var unSecureWEBAPI = "";
            var secureWEBAPI = "";

            var esConfigSettings = {
                host: "",
                allowUnsecureConnection: false,
                subscriptionId: "",
                subscriptionPassword: ""
            };

            return {
                getSettings: function() {
                    return esConfigSettings;
                },

                getServerUrl: function() {
                    return urlWEBAPI;
                },

                setSettings: function(setting) {
                    var __SECURE_HTTP_PREFIX__ = "https://";
                    var __UNSECURE_HTTP_PREFIX__ = "http://";

                    esConfigSettings = setting;

                    if (esConfigSettings.host) {
                        esConfigSettings.host = esConfigSettings.host.trim();

                        if (startsWith(esConfigSettings.host, __SECURE_HTTP_PREFIX__)) {
                            esConfigSettings.host = esConfigSettings.host.slice(__SECURE_HTTP_PREFIX__.length).trim();
                        } else if (startsWith(esConfigSettings.host, __UNSECURE_HTTP_PREFIX__)) {
                            esConfigSettings.host = esConfigSettings.host.slice(__UNSECURE_HTTP_PREFIX__.length).trim();
                        }

                        if (esConfigSettings.host == "") {
                            throw "host for Entersoft WEB API Server is not specified";
                        }

                        if (!endsWith(esConfigSettings.host, "/")) {
                            esConfigSettings.host += "/";
                        }

                        unSecureWEBAPI = __UNSECURE_HTTP_PREFIX__ + esConfigSettings.host;;
                        secureWEBAPI = __SECURE_HTTP_PREFIX__ + esConfigSettings.host;

                        if (esConfigSettings.allowUnsecureConnection) {
                            urlWEBAPI = unSecureWEBAPI;
                        } else {
                            urlWEBAPI = secureWEBAPI;
                        }

                    } else {
                        throw "host for Entersoft WEB API Server is not specified";
                    }
                    return this;
                },

                $get: ['$http', '$log', '$q', '$rootScope', 'ESWEBAPI_URL', 'esGlobals', 'esMessaging',
                    function($http, $log, $q, $rootScope, ESWEBAPI_URL, esGlobals, esMessaging) {

                        function fregisterException(inMessageObj, storeToRegister) {
                            if (!inMessageObj) {
                                return;
                            }

                            var messageObj = angular.copy(inMessageObj);

                            try {
                                messageObj.__SubscriptionID = esConfigSettings.subscriptionId;
                                messageObj.__ServerUrl = urlWEBAPI;
                                messageObj.__EDate = new Date();
                                $.ajax({
                                    type: "POST",
                                    url: urlWEBAPI.concat(ESWEBAPI_URL.__REGISTER_EXCEPTION__),
                                    contentType: "application/json",
                                    headers: {
                                        "Authorization": esGlobals.getWebApiToken()
                                    },
                                    data: JSON.stringify({
                                        exceptionData: messageObj,
                                        exceptionStore: storeToRegister
                                    }, null, '\t')
                                });

                                // if google analytics are enabled register the exception as well
                                var esGA = esGlobals.getGA();
                                if (esGA) {
                                    esGA.registerException(messageObj);
                                }

                            } catch (loggingError) {

                                // For Developers - log the log-failure.
                                $log.warn("Error logging failed");
                                $log.error(loggingError);
                            }
                        }

                        function execScrollerCommand(scrollerCommandParams) {
                            if (!scrollerCommandParams || !scrollerCommandParams.ScrollerID || !scrollerCommandParams.CommandID) {
                                throw "ScrollerID and CommandID properties must be defined";
                            }
                            var surl = ESWEBAPI_URL.__SCROLLER_COMMAND__;

                            var tt = esGlobals.trackTimer("SCR", "COMMAND", scrollerCommandParams.ScrollerID.concat("/", scrollerCommandParams.CommandID));
                            tt.startTime();

                            var ht = $http({
                                method: 'post',
                                headers: {
                                    "Authorization": esGlobals.getWebApiToken()
                                },
                                url: surl,
                                data: scrollerCommandParams
                            });

                            ht.then(function() {
                                tt.endTime().send();
                            });

                            return ht;
                        }

                        function getOdsInfo(odsType, odsID) {
                            var surl = urlWEBAPI + ESWEBAPI_URL[odsType] + odsID;
                            var ht = $http({
                                method: 'get',
                                headers: {
                                    "Authorization": esGlobals.getWebApiToken()
                                },
                                url: surl
                            });
                            processWEBAPIPromise(ht);
                            return ht;
                        }

                        function execFormCommand(formCommandParams) {
                            if (!formCommandParams || !formCommandParams.EntityID || !formCommandParams.CommandID) {
                                throw "EntityID and CommandID properties must be defined";
                            }
                            var surl = urlWEBAPI + ESWEBAPI_URL.__FORM_COMMAND__;

                            var tt = esGlobals.trackTimer("FORM", "COMMAND", formCommandParams.EntityID.concat("/", formCommandParams.CommandID));
                            tt.startTime();

                            var ht = $http({
                                method: 'post',
                                headers: {
                                    "Authorization": esGlobals.getWebApiToken()
                                },
                                url: surl,
                                data: formCommandParams
                            });

                            return processWEBAPIPromise(ht, tt);
                        }

                        function execScroller(apiUrl, groupID, filterID, params) {
                            var surl = urlWEBAPI.concat(apiUrl, groupID, "/", filterID);
                            var tt = esGlobals.trackTimer("SCR", "FETCH", groupID.concat("/", filterID));
                            tt.startTime();

                            var ht = $http({
                                method: 'GET',
                                headers: {
                                    "Authorization": esGlobals.getWebApiToken()
                                },
                                url: surl,
                                params: params
                            });

                            return processWEBAPIPromise(ht, tt);
                        }

                        function processWEBAPIPromise(promise, tt) {
                            if (tt) {
                                promise.then(function() {
                                    tt.endTime().send();
                                });
                            }

                            promise.error(function(a, b) {
                                esMessaging.publish("ES_HTTP_CORE_ERR", a, b);
                            });
                            return promise;
                        }

                        return {

                            getServerUrl: function() {
                                return urlWEBAPI;
                            },

                            /**
                             * @ngdoc function
                             * @name es.Services.Web.esWebApi#openSession
                             * @methodOf es.Services.Web.esWebApi
                             * @description this is a descr
                             * @module es.Services.Web
                             * @kind function
                             * @param {object} credentials Entersoft Business Suite login credentials in the form of a JSON object with the following form:
                             <pre>
                             var credentials  = {
                                UserID: "xxxx", //Entersoft User id 
                                Password: "this is my password", // Entersoft User's password
                                BranchID: "Branch", // a valid Branch that the user has access rights and will be used as default for all operations requiring a BranchID
                                LangID: "el-GR"
                             }
                             </pre>
                             * @return {httpPromise} Returns a promise.
                             ** If success i.e. success(function(ret) {...}) the response ret is a JSON object that holds the current web session
                             * properties. In an Entersoft AngularJS SPA typical template, upon successful login i.e. openSession, the response object is stored
                             * in the browser's local storage and in most of the cases the developer will not need to use or retrieve it manually. It is up to
                             * Entersoft AngularJS WEB API calls that need the access token in order to access the Web API services and methods to retrieve it from the 
                             * local storage.
                             * 
                             * A success response object has the following form:
<pre>
var rep = {
    "data": {
        "Model": {
            "GID": "5b6f2e05-0ab6-4f29-9015-6a4352009ead",
            "UserID": "Admin",
            "Name": "Administrator",
            "Inactive": false,
            "WebApiToken": "abcd",
            "WebApiTokenExpiresAt": "2015-09-08T09:59:36.5487011+00:00",
            "PasswdKey": "*",
            "Administrator": true,
            "UserSites": [{
                "Site": {
                    "GID": "86947579-6885-4e86-914e-46378db3794f",
                    "fPersonCodeGID": "11ea77d7-f5dc-4a8d-b629-845c8ff207ac",
                    "Code": "ΑΘΗ",
                    "Description": "Κεντρικά Entersoft",
                    "Status": true,
                    "KindSite": true,
                    "KindWH": true
                },
                "GID": "198e94d8-2026-4426-8bee-b029e39fa4a2",
                "fUserGID": "5b6f2e05-0ab6-4f29-9015-6a4352009ead",
                "fCompanyCode": "ES",
                "fCompanySiteGID": "86947579-6885-4e86-914e-46378db3794f",
                "ServiceLevel": 0
            }, {
                "Site": {
                    "GID": "9a151756-7185-4f40-834f-e6153062b5e2",
                    "fPersonCodeGID": "11ea77d7-f5dc-4a8d-b629-845c8ff207ac",
                    "Code": "ΘΕΣ",
                    "Description": "Υποκατάστημα Θεσσαλονίκης ES",
                    "Status": true,
                    "KindSite": true,
                    "KindWH": true
                },
                "GID": "e1515a3c-8262-4581-8332-8663c2787964",
                "fUserGID": "5b6f2e05-0ab6-4f29-9015-6a4352009ead",
                "fCompanyCode": "ES",
                "fCompanySiteGID": "9a151756-7185-4f40-834f-e6153062b5e2",
                "ServiceLevel": 0
            }]
        },
        "SubscriptionID": "",
        "SubscriptionPassword": "passx"
    },
    "status": 200,
    "config": {
        "method": "POST",
        "transformRequest": [null],
        "transformResponse": [null],
        "url": "http://localhost/eswebapi/api/Login",
        "data": {
            "SubscriptionID": "",
            "SubscriptionPassword": "passx",
            "Model": {
                "UserID": "admin",
                "Password": "entersoft",
                "BranchID": "ΑΘΗ",
                "LangID": "el-GR"
            }
        },
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json;charset=utf-8"
        }
    },
    "statusText": "OK"
}
</pre>
                             * In case of an error i.e. function(err) {...} the err contains the Entersoft's Application Server error message and 
                             * the http error codes in case the error is network related. As in the case of success, should you use the typical Entersoft
                             * AngularJS development template for SPAs, the framework automatically handles the error response of openSession call and 
                             * performs a clean-up in browsers local storage, cache, messaging, etc. so that no valid web session exists (as if the user never)
                             * logged-in or performed a logout operation
                             * 
                             * An Entersoft application server releated response error e.g. User does not exist has the following form:
<pre>
var x = {
    "data": {
        "MessageID": "login-invalid-user",
        "UserMessage": "User [ADMINDSDSDS] is not registered",
        "Messages": []
    },
    "status": 401,
    "config": {
        "method": "POST",
        "transformRequest": [null],
        "transformResponse": [null],
        "url": "http://localhost/eswebapi/api/Login",
        "data": {
            "SubscriptionID": "",
            "SubscriptionPassword": "passx",
            "Model": {
                "UserID": "admindsdsds",
                "Password": "entersoft",
                "BranchID": "ΑΘΗ",
                "LangID": "el-GR"
            }
        },
        "headers": {
            "Accept": "application/json, text/plain",
            "Content-Type": "application/json;charset=utf-8"
        }
    },
    "statusText": "Unauthorized"
};

</pre>
                             * @example
<pre>
$scope.credentials = {
    UserID: 'admin',
    Password: 'entersoft',
    BranchID: 'ΑΘΗ',
    LangID: 'el-GR'
};

$scope.doLogin = function() {
    esWebApiService.openSession($scope.credentials)
        .then(function(rep) {
                $log.info(rep);
                $location.path("/pq");
            },
            function(err) {
                $log.error(err);
            });
}
</pre>
*/
                            openSession: function(credentials) {
                                var tt = esGlobals.trackTimer("AUTH", "LOGIN", "");
                                tt.startTime();

                                var promise = $http({
                                    method: 'post',
                                    url: urlWEBAPI + ESWEBAPI_URL.__LOGIN__,
                                    data: {
                                        SubscriptionID: esConfigSettings.subscriptionId,
                                        SubscriptionPassword: esConfigSettings.subscriptionPassword,
                                        Model: credentials
                                    }
                                }).
                                success(function(data) {
                                    esGlobals.sessionOpened(data, credentials);
                                    tt.endTime().send();
                                }).
                                error(function(data, status, headers, config) {
                                    esGlobals.sessionClosed();
                                    if (data) {
                                        $log.error(data);
                                    } else {
                                        console.log("Generic Http error");
                                    }
                                });

                                return processWEBAPIPromise(promise);
                            },

                            /**
                             * @ngdoc function
                             * @name es.Services.Web.esWebApi#logout
                             * @methodOf es.Services.Web.esWebApi
                             * @description Function that performs a web session logout. As a result of calling this function, all internal state
                             * related to the current web session, if any, is cleaned-up and no valid web session is available. The application/user must login again through openSession
                             * in order to be able to call any Entersoft WEB API autheticated method or service.
                             * @module es.Services.Web
                             * @kind function
                             * @example
<pre>
//logout sample
$scope.doLogout = function ()
{
    esWebApi.logout();
    alert("LOGGED OUT. You must relogin to run the samples");
};
</pre>
                             */
                            logout: function() {
                                esGlobals.sessionClosed();
                                $log.info("LOGOUT User");
                            },

                            /**
                             * @ngdoc function
                             * @name es.Services.Web.esWebApi#fetchCompanyParam
                             * @methodOf es.Services.Web.esWebApi
                             * @description Function that returns the ES Param for a requested ParamID.
                             * @module es.Services.Web
                             * @kind function
                             * @param {string} esParam The ID of the ES CompanyParam. The ID should not contain the @ i.e. fetchCompanyParam("MyValidParamKey")
                             * @return {httpPromise} Returns a promise.
                             ** If sucess the response.data contains the Parameter definition and parameter value.
                             ** If error the err.data object contains the Entersoft Application Server error definition. Typically the user error message is 
                             * err.data.UserMessage
                             *
                             * Success promise return value i.e. response.data is of the following form:
<pre>
var x = {
    "ID": "MyValidParamKey",
    "Value": "hello world",
    "Description": "Password for use of Google mapping service",
    "Help": "Password for use of Google mapping service",
    "ESType": 0
};
</pre>
                             *
                             * Error promise return value i.e. function(err) is of the following form:
<pre>
var f = {
    "data": {
        "MessageID": "company-parameter-not-found",
        "UserMessage": "Company parameter 'ssaS' not found",
        "Messages": []
    },
    "status": 404,
    "config": {
        "method": "GET",
        "transformRequest": [null],
        "transformResponse": [null],
        "headers": {
            "Authorization": "Bearer xyzquerty....",
            "Accept": "application/json, text/plain"
        },
        url ":",
        http: "//localhost/eswebapi/api/rpc/FetchCompanyParam/ssaS"
    },
    "statusText": "Not Found"
}; 
</pre> 
                            * @example
<pre>
// fetchCompanyParam
$scope.fetchCompanyParam = function() {
    esWebApi.fetchCompanyParam($scope.pCompanyParam)
        .then(function(x) {
                $scope.pCompanyParamValue = x.data;
            },
            function(err)
            {
                $scope.pCompanyParamValue = JSON.stringify(err);
            });
}

</pre>
*/
                            fetchCompanyParam: function(esparam) {
                                if (!esparam) {
                                    return undefined;
                                }

                                var surl = urlWEBAPI.concat(ESWEBAPI_URL.__FETCH_COMPANY_PARAM__, esparam.replace(" ", ""));
                                var ht = $http({
                                    method: 'get',
                                    headers: {
                                        "Authorization": esGlobals.getWebApiToken()
                                    },
                                    url: surl
                                });
                                return processWEBAPIPromise(ht);
                            },

                            /**
                             * @ngdoc function
                             * @name es.Services.Web.esWebApi#fetchCompanyParams
                             * @methodOf es.Services.Web.esWebApi
                             * @description Function that returns the ES Params for the requested array of parameter id's
                             * @module es.Services.Web
                             * @kind function
                             * @param {string[]=} esParams can be
                             ** an array of strings
                             ** a comma separated string of values
                             ** a string of comma separated list of es params the values of which we want to be returned.
                             * _If esParams is null or undefined or emprty string_ the complete set of ES Company Params will be returned.
                             * @return {httpPromise} Returns a promise.
                             ** If sucess the response.data contains the Array of Parameter definition and parameter value objects.
                             ** If error the err.data object contains the Entersoft Application Server error definition. Typically the user error message is 
                             * err.data.UserMessage
                             *
                             * Success promise return value i.e. *response.data* is of the following form:
<pre>
var x = [{
    "ID": "PERSONINTERESTCATEGORYVALUE",
    "Value": "ΠΡΟΤΙΜΗΣΕΙΣ ΦΥΣΙΚΟΥ ΠΡΟΣΩΠΟΥ",
    "Description": "Person preference category code",
    "Help": "It is required to define ONE preference set whose contents will be available for (multi) selection in the person form.",
    "ESType": 0
}, {
    "ID": "ES_MAIL_BODYFOOTER",
    "Value": "Powered by Entersoft Business Suite",
    "Description": "Footer in e-mail text",
    "Help": "Text to appear as footer in e-mails to be sent by the application.",
    "ESType": 0
}];

</pre>
                             *
                             * Error promise return value i.e. function(err) is of the following form:
<pre>
var f = {
    "data": {
        "MessageID": "company-parameter-not-found",
        "UserMessage": "Company parameter 'ssaS' not found",
        "Messages": []
    },
    "status": 404,
    "config": {
        "method": "GET",
        "transformRequest": [null],
        "transformResponse": [null],
        "headers": {
            "Authorization": "Bearer xyzquerty....",
            "Accept": "application/json, text/plain"
        },
        url ":",
        http: "//localhost/eswebapi/api/rpc/FetchCompanyParam/ssaS"
    },
    "statusText": "Not Found"
}; 
</pre> 
                            * @example
<pre>
//fetchCompanyParams
$scope.fetchCompanyParams = function() {
    if (!$scope.pCompanyParams) {
        $scope.pCompanyParams = null;
    }
    esWebApi.fetchCompanyParams($scope.pCompanyParams)
        .then(function(x) {
                $scope.pCompanyParamsValue = x.data;
            },

            function(err) {
                $scope.pCompanyParamsValue = JSON.stringify(err);
            });
};
</pre>
*/
                            fetchCompanyParams: function(esparams) {
                                var surl;
                                if (!esparams) {
                                    // get all parameters
                                    surl = urlWEBAPI + ESWEBAPI_URL.__FETCH_COMPANY_PARAMS__;
                                } else {
                                    if (angular.isArray(esparams)) {
                                        surl = urlWEBAPI + ESWEBAPI_URL.__FETCH_COMPANY_PARAMS__ + esparams.join("/").replace(/ /g, "");
                                    } else {
                                        surl = urlWEBAPI + ESWEBAPI_URL.__FETCH_COMPANY_PARAMS__ + esparams.replace(/,/g, "/").replace(/ /g, "");
                                    }
                                }

                                var ht = $http({
                                    method: 'get',
                                    headers: {
                                        "Authorization": esGlobals.getWebApiToken()
                                    },
                                    url: surl
                                });
                                return processWEBAPIPromise(ht);
                            },

                            registerException: fregisterException,

/**
                             * @ngdoc function
                             * @name es.Services.Web.esWebApi#fetchOdsTableInfo
                             * @methodOf es.Services.Web.esWebApi
                             * @description Function that returns the ODSTable definition from the ** Entersoft Object Description System (ODS)** repository.
                             * @module es.Services.Web
                             * @kind function
                             * @param {string} tableID The ODS Table ID or the ODS Table GID in string (guid) to retrieve
                             * @return {httpPromise}  Returns a promise.
                             ** If sucess the response.data contains the ODS Table Definition object in JSON representation
                             ** If error the err.data object contains the Entersoft Application Server error definition. Typically the user error message is 
                             * err.data.UserMessage
                             *
                             * Success promise return value i.e. response.data is of the following form:
<pre>
var odsTableforESGOCity = {
    "Role": 1,
    "ModuleID": "ESGO",
    "ID": "ESGOZCity",
    "GID": "0a3f7d43-dfb9-4a11-8610-8e2931c09868",
    "DBTableName": "ESGOZCity",
    "Flags": 1028,
    "Columns": [{
        "ID": "Code",
        "GID": "aa00f03d-640b-4c0c-8bbe-4b3adabea477",
        "TableID": "ESGOZCity",
        "TableGID": "0a3f7d43-dfb9-4a11-8610-8e2931c09868",
        "DBColumnName": "Code",
        "AllowEQUC": true,
        "Size": 20,
        "ODSType": "ESZOOMCODE",
        "Precision": 0,
        "Nullable": false,
        "ChoiceType": "",
        "Flags": 0,
        "HelpTxt": "",
        "SeqNum": 1
    }, {
        "ID": "Description",
        "GID": "b92ab124-86c0-4c70-9093-53337f91577b",
        "TableID": "ESGOZCity",
        "TableGID": "0a3f7d43-dfb9-4a11-8610-8e2931c09868",
        "DBColumnName": "Description",
        "AllowEQUC": true,
        "Size": 100,
        "ODSType": "ESFIELD",
        "Precision": 0,
        "Nullable": true,
        "ChoiceType": "",
        "Flags": 0,
        "HelpTxt": "",
        "SeqNum": 2
    }, {
        "ID": "AlternativeDescription",
        "GID": "bcccdd8d-afe8-4fca-a448-cacde6593adc",
        "TableID": "ESGOZCity",
        "TableGID": "0a3f7d43-dfb9-4a11-8610-8e2931c09868",
        "DBColumnName": "AlternativeDescription",
        "AllowEQUC": true,
        "Size": 100,
        "ODSType": "ESFIELD",
        "Precision": 0,
        "Nullable": true,
        "ChoiceType": "",
        "Flags": 0,
        "HelpTxt": "",
        "SeqNum": 3
    }, {
        "ID": "Inactive",
        "GID": "df7e74e8-af69-4f9f-bd5a-8bec32361423",
        "TableID": "ESGOZCity",
        "TableGID": "0a3f7d43-dfb9-4a11-8610-8e2931c09868",
        "DBColumnName": "Inactive",
        "AllowEQUC": false,
        "Size": -1,
        "ODSType": "ESBOOL",
        "Precision": 0,
        "Nullable": false,
        "ChoiceType": "",
        "Flags": 0,
        "HelpTxt": "",
        "SeqNum": 4
    }, {
        "ID": "PhonePrefix",
        "GID": "806db65c-9f30-4859-b5b0-7f91a32d6aca",
        "TableID": "ESGOZCity",
        "TableGID": "0a3f7d43-dfb9-4a11-8610-8e2931c09868",
        "DBColumnName": "PhonePrefix",
        "AllowEQUC": true,
        "Size": 15,
        "ODSType": "ESTELNO",
        "Precision": 0,
        "Nullable": true,
        "ChoiceType": "",
        "Flags": 0,
        "HelpTxt": "",
        "SeqNum": 5
    }, {
        "ID": "fMunicipalityCode",
        "GID": "3ebdcae6-a3a4-4cfd-8371-8b8825a1d542",
        "TableID": "ESGOZCity",
        "TableGID": "0a3f7d43-dfb9-4a11-8610-8e2931c09868",
        "DBColumnName": "fMunicipalityCode",
        "AllowEQUC": false,
        "Size": 20,
        "ODSType": "ESFZOOMCODE",
        "Precision": 0,
        "Nullable": true,
        "ChoiceType": "",
        "Flags": 0,
        "HelpTxt": "",
        "SeqNum": 6
    }]
};
</pre>
                             *
                             * Error promise return value i.e. function(err) is of the following form:
<pre>
// fetchOdsTableInfo("escity"), which does not exist in the ODS
var f = {
        "data": {
            "MessageID": "invalid-table-id",
            "UserMessage": "invalid table id: escity",
            "Messages": []
        },
        "status": 404,
        "config": {
            "method": "GET",
            "transformRequest": [null],
            "transformResponse": [null],
            "headers": {
                "Authorization": "Bearer xyzquerty....",
                "Accept": "application/json, text/plain},"
                url ":"
                http: //localhost/eswebapi/api/rpc/FetchOdsTableInfo/escity"},"statusText":"Not Found"};

</pre> 
                            * @example
<pre>
//fetchODSTableInfo example
$scope.fetchOdsTableInfo = function() {
    esWebApi.fetchOdsTableInfo($scope.odsID)
        .then(function(ret) {
            $scope.pTableInfo = ret.data;
        }, function(err) {
            $scope.pTableInfo = err;
        });
}
</pre>
*/
                            fetchOdsTableInfo: function(tableID) {
                                tableID = tableID ? tableID.replace(/ /g, "") : "";
                                return getOdsInfo("__FETCH_ODS_TABLE_INFO__", tableID);
                            },

/**
                             * @ngdoc function
                             * @name es.Services.Web.esWebApi#fetchOdsColumnInfo
                             * @methodOf es.Services.Web.esWebApi
                             * @description Function that returns the ODSTable definition from the ** Entersoft Object Description System (ODS)** repository.
                             * @module es.Services.Web
                             * @kind function
                             * @param {string} tableID The ODS Table ID i.e. "ESFFitem". If columnID parameter is undefined, null or empty string **then**
                             * additional forms of tableid-column id definition are available:
                             ** Fully qualified column name i.e. "ESFIItem.Description"
                             ** ODS Column's GID in string i.e. "74c82778-6b49-4928-9f06-81b4384bf677"
                             * @param {string=} columnID The ODS Column/Field ID  to retrieve i.e. "Description". If columnID is undefined or null or empty string
                             * then tableID should be one of the forms described above.
                             * @return {httpPromise}  Returns a promise.
                             ** If sucess the response.data contains the ODS Column/Field Definition object in JSON representation
                             ** If error the err.data object contains the Entersoft Application Server error definition. Typically the user error message is 
                             * err.data.UserMessage
                             *
                             * Success promise return value i.e. response.data is of the following form:
<pre>
var odsColumnforESFIItem_Code = {
    "ID": "Code",
    "GID": "74c82778-6b49-4928-9f06-81b4384bf677",
    "TableID": "ESFIItem",
    "TableGID": "8445cfd5-9dda-47cc-8f3a-01b5586347d2",
    "DBColumnName": "Code",
    "AllowEQUC": true,
    "Size": 50,
    "ODSType": "ESCODE",
    "Precision": 0,
    "Nullable": false,
    "ChoiceType": "",
    "Flags": 2112,
    "HelpTxt": "",
    "SeqNum": 2
};
</pre>
                             *
                             * Error promise return value i.e. function(err) is of the following form:
<pre>
// fetchOdsColumnInfo("esfiitem", "codeg"), which does not exist in the ODS
var f = {
        "data": {
            "MessageID": "invalid-column-id",
            "UserMessage": "invalid column id: esfiitem.codeg",
            "Messages": []
        },
        "status": 404,
        "config": {
            "method": "GET",
            "transformRequest": [null],
            "transformResponse": [null],
            "headers": {
                "Authorization": "Bearer xyzquerty....",
                "Accept": "application/json, text/plain},"
                url ":"
                http: //localhost/eswebapi/api/rpc/FetchOdsColumnInfo/esfiitem/codeg"},"statusText":"Not Found"};

</pre> 
                            * @example
<pre>
 //fetchODSColumnInfo example
$scope.fetchOdsColumnInfo = function() {
    esWebApi.fetchOdsColumnInfo($scope.odsID, $scope.odsColumnID)
        .then(function(ret) {
            $scope.pColumnInfo = ret.data;
        }, function(err) {
            $scope.pColumnInfo = err;
        });
}
</pre>
*/
                            fetchOdsColumnInfo: function(tableID, columnID) {
                                tableID = tableID ? tableID.replace(/ /g, "") : "";
                                columnID = columnID ? columnID.replace(/ /g, "") : "";
                                var odsItem = "";columnID ? tableID + "/" + columnID : tableID;
                                if (columnID) {
                                    odsItem = tableID + "/" + columnID;
                                } else {
                                    var ids = tableID.split(".");
                                    if (ids.length == 2) {
                                        odsItem = ids[0] + "/" + ids[1];
                                    } else {
                                        odsItem = tableID;
                                    }
                                }
                                return getOdsInfo("__FETCH_ODS_COLUMN_INFO__", odsItem);
                            },

/**
                             * @ngdoc function
                             * @name es.Services.Web.esWebApi#fetchOdsRelationInfo
                             * @methodOf es.Services.Web.esWebApi
                             * @description Function that returns the ODS Releation definition from the ** Entersoft Object Description System (ODS)** repository.
                             * @module es.Services.Web
                             * @kind function
                             * @param {string} relationID The ODS Relation ID or the ODS Relation GID in string (guid) to retrieve
                             * @return {httpPromise}  Returns a promise.
                             ** If sucess the response.data contains the ODS Relation Definition object in JSON representation
                             ** If error the err.data object contains the Entersoft Application Server error definition. Typically the user error message is 
                             * err.data.UserMessage
                             *
                             * Success promise return value i.e. response.data is of the following form:
<pre>
var odsRelation = {
    "ID": "FK_ESFIPricelistItem_ESFIPricelist",
    "GID": "87fbc76d-7ac7-4102-a7cd-00374a6a4338",
    "NameInDB": "FK_ESFIPricelistItem_ESFIPricelist",
    "MTableID": "ESFIPricelist",
    "DTableID": "ESFIPricelistItem",
    "MTableGID": "1f361b65-09e3-40c7-b675-ba70d24ec33d",
    "MValue1GID": "2c8ea6ae-5438-46a3-bcb0-2d0208a84ad0",
    "DTableGID": "1aae96fc-f1bc-448a-9940-1d122a935e37",
    "DValue1GID": "3a9f7b4b-c4fd-4900-8337-cddb9e4cf1f5",
    "IsVirtual": false,
    "IsDeleted": false,
    "MasterColumns": [{
        "ID": "GID",
        "GID": "2c8ea6ae-5438-46a3-bcb0-2d0208a84ad0",
        "TableID": "ESFIPricelist",
        "TableGID": "1f361b65-09e3-40c7-b675-ba70d24ec33d",
        "DBColumnName": "GID",
        "AllowEQUC": false,
        "Size": -1,
        "ODSType": "ESGID",
        "Precision": 0,
        "Nullable": false,
        "ChoiceType": "",
        "Flags": 0,
        "HelpTxt": "",
        "SeqNum": 1
    }],
    "DetailColumns": [{
        "ID": "fPricelistGID",
        "GID": "3a9f7b4b-c4fd-4900-8337-cddb9e4cf1f5",
        "TableID": "ESFIPricelistItem",
        "TableGID": "1aae96fc-f1bc-448a-9940-1d122a935e37",
        "DBColumnName": "fPricelistGID",
        "AllowEQUC": false,
        "Size": -1,
        "ODSType": "ESFGID",
        "Precision": 0,
        "Nullable": true,
        "ChoiceType": "",
        "Flags": 2048,
        "HelpTxt": "",
        "SeqNum": 2
    }]
};

</pre>
                             *
                             * Error promise return value i.e. function(err) is of the following form:
<pre>
// fetchRelationInfo("abcd"), which does not exist in the ODS
var f = {
        "data": {
            "MessageID": "invalid-relation-id",
            "UserMessage": "invalid relation id: abcd",
            "Messages": []
        },
        "status": 404,
        "config": {
            "method": "GET",
            "transformRequest": [null],
            "transformResponse": [null],
            "headers": {
                "Authorization": "Bearer xyzquerty....",
                "Accept": "application/json, text/plain},"
                url ":"
                http: //localhost/eswebapi/api/rpc/FetchOdsRelationInfo/abcd"},"statusText":"Not Found"};


</pre> 
                            * @example
<pre>
//fetchOdsRelationInfo example
$scope.fetchOdsRelationInfo = function() {
    esWebApi.fetchOdsRelationInfo($scope.odsID)
        .then(function(ret) {
            $scope.pRelationInfo = ret.data;
        }, function(err) {
            $scope.pRelationInfo = err;
        });
}
</pre>
*/
                            fetchOdsRelationInfo: function(relationID) {
                                relationID = relationID ? relationID.replace(/ /g, "") : "";
                                return getOdsInfo("__FETCH_ODS_RELATION_INFO__", relationID);
                            },

/**
                             * @ngdoc function
                             * @name es.Services.Web.esWebApi#fetchOdsMasterRelationsInfo
                             * @methodOf es.Services.Web.esWebApi
                             * @description Function that returns the Master Relations ODS Relation definitions that exist in the ODS Repository for a given Master TableID on a given foreign ColumnID of the Master TableID
                             * from the ** Entersoft Object Description System (ODS)** repository.
                             * @module es.Services.Web
                             * @kind function
                             * @param {string} tableID The ODS Table ID i.e. "ESFFitem". 
                             * @param {string} columnID The ODS Column/Field ID  to retrieve i.e. "fDim1Code".
                             * @return {httpPromise}  Returns a promise..
                             ** If sucess the response.data contains an Array of Master relations of the ODS Relation Definition objects in JSON representation, that exist
                             * for the given *tableID* and foreign *columnID*
                             ** If error the err.data object contains the Entersoft Application Server error definition. Typically the user error message is 
                             * err.data.UserMessage
                             *
                             * Success promise return value i.e. response.data is of the following form:
<pre>
var odsMasterRelations = [{
    "ID": "FK_ESFIPricelistItem_ESFIPricelist",
    "GID": "87fbc76d-7ac7-4102-a7cd-00374a6a4338",
    "NameInDB": "FK_ESFIPricelistItem_ESFIPricelist",
    "MTableID": "ESFIPricelist",
    "DTableID": "ESFIPricelistItem",
    "MTableGID": "1f361b65-09e3-40c7-b675-ba70d24ec33d",
    "MValue1GID": "2c8ea6ae-5438-46a3-bcb0-2d0208a84ad0",
    "DTableGID": "1aae96fc-f1bc-448a-9940-1d122a935e37",
    "DValue1GID": "3a9f7b4b-c4fd-4900-8337-cddb9e4cf1f5",
    "IsVirtual": false,
    "IsDeleted": false,
    "MasterColumns": [{
        "ID": "GID",
        "GID": "2c8ea6ae-5438-46a3-bcb0-2d0208a84ad0",
        "TableID": "ESFIPricelist",
        "TableGID": "1f361b65-09e3-40c7-b675-ba70d24ec33d",
        "DBColumnName": "GID",
        "AllowEQUC": false,
        "Size": -1,
        "ODSType": "ESGID",
        "Precision": 0,
        "Nullable": false,
        "ChoiceType": "",
        "Flags": 0,
        "HelpTxt": "",
        "SeqNum": 1
    }],
    "DetailColumns": [{
        "ID": "fPricelistGID",
        "GID": "3a9f7b4b-c4fd-4900-8337-cddb9e4cf1f5",
        "TableID": "ESFIPricelistItem",
        "TableGID": "1aae96fc-f1bc-448a-9940-1d122a935e37",
        "DBColumnName": "fPricelistGID",
        "AllowEQUC": false,
        "Size": -1,
        "ODSType": "ESFGID",
        "Precision": 0,
        "Nullable": true,
        "ChoiceType": "",
        "Flags": 2048,
        "HelpTxt": "",
        "SeqNum": 2
    }]
}];
</pre>
                             *
                             * Error promise return value i.e. function(err) is of the following form:
<pre>
// fetchOdsMasterRelationsInfo("esfiitem", "fnon"), which does not exist in the ODS
var f = {
    "data": {
        "MessageID": "invalid-column-id",
        "UserMessage": "invalid column id: esfiitem.fnon",
        "Messages": []
    },
    "status": 404,
    "config": {
        "method": "GET",
        "transformRequest": [null],
        "transformResponse": [null],
        "headers": {
            "Authorization": "Bearer xyzquerty....",
            "Accept": "application/json, text/plain"
        },
        "url": "http://localhost/eswebapi/api/rpc/FetchOdsMasterRelationsInfo/esfiitem/fnon"
    },
    "statusText": "Not Found"
};
</pre>
                            * @example
<pre>
//fetchOdsMasterRelationsInfo example
$scope.fetchOdsMasterRelationsInfo = function() {
    esWebApi.fetchOdsMasterRelationsInfo($scope.odsID, $scope.odsColumnID)
        .then(function(ret) {
            $scope.pRelationInfo = ret.data;
        }, function(err) {
            $scope.pRelationInfo = err;
        });
}
</pre>
*/
                            fetchOdsMasterRelationsInfo: function(tableID, columnID) {
                                tableID = tableID ? tableID.replace(/ /g, "") : "";
                                columnID = columnID ? columnID.replace(/ /g, "") : "";
                                return getOdsInfo("__FETCH_ODS_MASTER_RELATIONS_INFO__", tableID + "/" + columnID);
                            },

/**
                             * @ngdoc function
                             * @name es.Services.Web.esWebApi#fetchOdsDetailRelationsInfo
                             * @methodOf es.Services.Web.esWebApi
                             * @description Function that returns the Detail ODS Relation definitions that exist in the ODS Repository for a given Master TableID on a given ColumnID of the Master TableID
                             * from the ** Entersoft Object Description System (ODS)** repository.
                             * @module es.Services.Web
                             * @kind function
                             * @param {string} tableID The ODS Table ID i.e. "ESFFitem". 
                             * @param {string} columnID The ODS Column/Field ID  to retrieve i.e. "GID".
                             * @return {httpPromise}  Returns a promise..
                             ** If sucess the response.data contains an Array of the Detail ODS Relation Definition objects in JSON representation, that exist
                             * for the given *tableID* and foreign *columnID*
                             ** If error the err.data object contains the Entersoft Application Server error definition. Typically the user error message is 
                             * err.data.UserMessage
                             *
                             * Success promise return value i.e. response.data is of the following form:
<pre>
var odsDetailRelations = [{
    "ID": "FK_ESFIItemPriceHistory_ESFIPricelist",
    "GID": "6ec8be7a-bfac-42c2-95c2-c15b68cca9d2",
    "NameInDB": "FK_ESFIItemPriceHistory_ESFIPricelist",
    "MTableID": "ESFIPricelist",
    "DTableID": "ESFIItemPriceHistory",
    "MTableGID": "1f361b65-09e3-40c7-b675-ba70d24ec33d",
    "MValue1GID": "2c8ea6ae-5438-46a3-bcb0-2d0208a84ad0",
    "DTableGID": "08b1d27b-5425-4dbf-8dc5-8f340f289d84",
    "DValue1GID": "71f4b69d-0db5-4fd3-9e62-772f50673b69",
    "IsVirtual": false,
    "IsDeleted": false,
    "MasterColumns": [{
        "ID": "GID",
        "GID": "2c8ea6ae-5438-46a3-bcb0-2d0208a84ad0",
        "TableID": "ESFIPricelist",
        "TableGID": "1f361b65-09e3-40c7-b675-ba70d24ec33d",
        "DBColumnName": "GID",
        "AllowEQUC": false,
        "Size": -1,
        "ODSType": "ESGID",
        "Precision": 0,
        "Nullable": false,
        "ChoiceType": "",
        "Flags": 0,
        "HelpTxt": "",
        "SeqNum": 1
    }],
    "DetailColumns": [{
        "ID": "fPricelistGID",
        "GID": "71f4b69d-0db5-4fd3-9e62-772f50673b69",
        "TableID": "ESFIItemPriceHistory",
        "TableGID": "08b1d27b-5425-4dbf-8dc5-8f340f289d84",
        "DBColumnName": "fPricelistGID",
        "AllowEQUC": false,
        "Size": -1,
        "ODSType": "ESFGID",
        "Precision": 0,
        "Nullable": true,
        "ChoiceType": "",
        "Flags": 0,
        "HelpTxt": "",
        "SeqNum": 7
    }]
},

// ...
// ...

}];

</pre>
                             *
                             * Error promise return value i.e. function(err) is of the following form:
<pre>
// fetchOdsDetailRelationsInfo("ESFIPricelist", "gidc"), which does not exist in the ODS
var f = {
    "data": {
        "MessageID": "invalid-column-id",
        "UserMessage": "invalid column id: ESFIPricelist.gidc",
        "Messages": []
    },
    "status": 404,
    "config": {
        "method": "GET",
        "transformRequest": [null],
        "transformResponse": [null],
        "headers": {
            "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1bmlxdWVfbmFtZSI6ImFkbWluIiwieC1lcy11c2VyLXBhc3N3b3JkIjoiZW50ZXJzb2Z0IiwieC1lcy11c2VyLWJyYW5jaC1pZCI6Is6RzpjOlyIsIngtZXMtdXNlci1sYW5nLWlkIjoiZWwtR1IiLCJ4LWVzbG9naW5pbmZvLVN1YnNjcmlwdGlvblBhc3N3b3JkIjoicGFzc3giLCJpc3MiOiJFbnRlcnNvZnQiLCJhdWQiOiJodHRwOi8vbG9jYWxob3N0IiwiZXhwIjoxNDQxODkyMDcwLCJuYmYiOjE0NDE4ODYwNzB9.tCuasMPd4kXT02kQo0Z9M8MuwnoGCTkexDs58OeRwcI",
            "Accept": "application/json, text/plain"
        },
        "url": "http://localhost/eswebapi/api/rpc/FetchOdsDetailRelationsInfo/ESFIPricelist/gidc"
    },
    "statusText": "Not Found"
};
</pre>
                            * @example
<pre>
//fetchOdsDetailRelationsInfo example
$scope.fetchOdsDetailRelationsInfo = function() {
    esWebApi.fetchOdsDetailRelationsInfo($scope.odsID, $scope.odsColumnID)
        .then(function(ret) {
            $scope.pRelationInfo = ret.data;
        }, function(err) {
            $scope.pRelationInfo = err;
        });
}
</pre>
*/
                            fetchOdsDetailRelationsInfo: function(tableID, columnID) {
                                tableID = tableID ? tableID.replace(/ /g, "") : "";
                                columnID = columnID ? columnID.replace(/ /g, "") : "";
                                return getOdsInfo("__FETCH_ODS_DETAIL_RELATIONS_INFO__", tableID + "/" + columnID);
                            },

 /**
                             * @ngdoc function
                             * @name es.Services.Web.esWebApi#fetchServerCapabilities
                             * @methodOf es.Services.Web.esWebApi
                             * @description Function that returns the WEB API Server capabilities in terms of http(s). This service does not require
                             * authorization prior to call
                             * @module es.Services.Web
                             * @kind function
                             * @return {httpPromise} If success i.e. function(ret) { ... } **_ret_** is a JSON object of the current WEB API Server capabilities.
                             * The return object has the following structure:
<pre>
var srvCapabilities = {
    AllowInsecureHttp: boolean, 
    // If false, WEB API Server does not allow unsecure conncetions. ONLY httpS is supported
    // If true, WEB API Server allows for unsecure connection. This scenario is most likely expected in VPN connections for LOB applications
    WebApiVersion: {
        Major: int, // i.e. 1
        Minor: int, // i.e. 7
        Patch: int  // i.e. 7
    }
};
</pre>
                             * @example
<pre>
$scope.fetchServerCapabilities = function()
{
    esWebApi.fetchServerCapabilities()
        .then(function(ret) {
            $scope.pSrvCapabilities = ret;
        }, function(err) {
            $scope.pSrvCapabilities = err;
        });
}
</pre>
*/
                            fetchServerCapabilities: function() {

                                var defered = $q.defer();

                                $http.get(unSecureWEBAPI + ESWEBAPI_URL.__SERVER_CAPABILITIES__)
                                    .success(function(data) {
                                        defered.resolve(data);
                                    })
                                    .error(function() {
                                        $http.get(secureWEBAPI + ESWEBAPI_URL.__SERVER_CAPABILITIES__)
                                            .success(function(data) {
                                                defered.resolve(data);
                                            })
                                            .error(function(dat, stat, header, config) {
                                                defered.reject([dat, stat, header, config]);
                                            });
                                    });

                                return defered.promise;
                            },

                            fetchScroller: function(groupID, filterID, params) {
                                return execScroller(ESWEBAPI_URL.__SCROLLER__, groupID, filterID, params);
                            },

                            fetchSimpleScrollerRootTable: function(groupID, filterID, params) {
                                return execScroller(ESWEBAPI_URL.__SCROLLERROOTTABLE__, groupID, filterID, params);
                            },

 /**
                             * @ngdoc function
                             * @name es.Services.Web.esWebApi#fetchUserSites
                             * @methodOf es.Services.Web.esWebApi
                             * @description Function that returns ESGOSites of the current ESCompany that the given user has access to
                             * authorization prior to call
                             * @module es.Services.Web
                             * @kind function
                             * @param {string} ebsuser The Entersoft Business Suite UserID for whom we want to fetch the ESGOSites of the current ESCompany
                             * the user has access to.
                             * @return {httpPromise} If success i.e. function(ret) { ... } ret.data is an Array of JSON objects representing the ESGOSites user has access to whitin the context of the current ESCompany.
                             * The return object has the following structure:
<pre>
var UserSite = {
    Key: string,  // The ESGOSite Code i.e. "ΑΘΗ",
    Value: string // The ESGOSite Description i.e. "Κεντρικά Entersoft" 
};
</pre>
                             * @example
<pre>
$scope.fetchUserSites = function()
{
    esWebApi.fetchUserSites($scope.pUser)
        .then(function(ret) {
            $scope.pUserSites = ret.data;
        }, function(err) {
            $scope.pUserSites = err;
        });
}

// results based on EBS Demo fetchUserSites("esmaster") =>
// ret.data ===> [{"Key":"ΑΘΗ","Value":"Κεντρικά Entersoft"},{"Key":"ΘΕΣ","Value":"Υποκατάστημα Θεσσαλονίκης ES"}]
</pre>
*/
                            fetchUserSites: function(ebsuser) {
                                var ht = $http({
                                    method: 'post',
                                    url: urlWEBAPI + ESWEBAPI_URL.__USERSITES__,
                                    data: {
                                        SubscriptionID: esConfigSettings.subscriptionId,
                                        SubscriptionPassword: esConfigSettings.subscriptionPassword,
                                        Model: ebsuser
                                    }
                                });
                                return processWEBAPIPromise(ht);
                            },

/**
                             * @ngdoc function
                             * @name es.Services.Web.esWebApi#fetchSessionInfo
                             * @methodOf es.Services.Web.esWebApi
                             * @description Function that returns Entersoft Application Server session information
                             * @module es.Services.Web
                             * @kind function
                             * @return {httpPromise} Returns a promise.
                             ** If sucess the **response.data.ESProperty** contains the array of the session properties objects.
                             * Each session property object is fo the following form:
<pre>
var sessprop = {
    ID: string, // property ID i.e. "101"
    Description: string, // property Description in the session's language translation i.e. "Έκδοση Εγκατάστασης"
    ValueS: string, // property Value in string format i.e. "4.0.36 - 2"
    Type: int // property EBS Type i.e. 0
};
</pre>
                             ** If error the err.data object contains the Entersoft Application Server error definition. Typically the user error message is 
                             * err.data.UserMessage
                             *
                             * Success promise return value i.e. response.data is of the following form:
<pre>
var x = {
    "ESProperty": [{
        "ID": "101",
        "Description": "Έκδοση Εγκατάστασης",
        "ValueS": "4.0.36 - 2",
        "Type": 0
    }, {
        "ID": "102",
        "Description": "Έκδοση Παραστατικών",
        "ValueS": "167",
        "Type": 0
    }, 
    // ... more properties
    {
        "ID": "16",
        "Description": "Τρέχων Αριθμός Χρηστών",
        "ValueS": "BackOffice = 1, Retail = 0, Mobile = 6, Web = 0",
        "Type": 0
    }]
};

</pre>
                             * @example
<pre>
//fetchSessionInfo example
$scope.fetchSessionInfo = function() {
    esWebApi.fetchSessionInfo()
        .then(function(ret) {
            $scope.pSessionInfo = ret.data;
        }, function(err) {
            $scope.pSessionInfo = err;
        });
}
</pre>
*/
                            fetchSessionInfo: function() {
                                var promise = $http({
                                    method: 'get',
                                    headers: {
                                        "Authorization": esGlobals.getWebApiToken()
                                    },
                                    url: urlWEBAPI + ESWEBAPI_URL.__FETCH_SESSION_INFO__
                                });

                                return processWEBAPIPromise(promise);
                            },

                            executeNewEntityAction: function(entityType, actionID, commandParams) {
                                var surl = urlWEBAPI.concat(ESWEBAPI_URL.__ENTITYACTION__, entityType, "/", actionID);
                                var tt = esGlobals.trackTimer("ACTION", "NEW_ENTITY", entityType.concat("/", actionID));
                                tt.startTime();

                                var ht = $http({
                                    method: 'post',
                                    headers: {
                                        "Authorization": esGlobals.getWebApiToken()
                                    },
                                    url: surl,
                                    data: commandParams
                                });
                                return processWEBAPIPromise(ht, tt);
                            },

                            executeEntityActionByCode: function(entityType, entityCode, actionID, commandParams) {
                                var surl = urlWEBAPI.concat(ESWEBAPI_URL.__ENTITYACTION__, entityType, "/", entityCode, "/", actionID);
                                var tt = esGlobals.trackTimer("ACTION", "ENTITY_CODE", entityType.concat("/", actionID));
                                tt.startTime();

                                var ht = $http({
                                    method: 'post',
                                    headers: {
                                        "Authorization": esGlobals.getWebApiToken()
                                    },
                                    url: surl,
                                    data: commandParams
                                });

                                return processWEBAPIPromise(ht, tt);
                            },

                            executeEntityActionByGID: function(entityType, entityGID, actionID, commandParams) {
                                var surl = urlWEBAPI.concat(ESWEBAPI_URL.__ENTITYBYGIDACTION__, entityType, "/", entityGID, "/", actionID);
                                var tt = esGlobals.trackTimer("ACTION", "ENTITY_GID", entityType.concat("/", actionID));
                                tt.startTime();

                                var ht = $http({
                                    method: 'post',
                                    headers: {
                                        "Authorization": esGlobals.getWebApiToken()
                                    },
                                    url: surl,
                                    data: commandParams
                                });

                                return processWEBAPIPromise(ht, tt);

                            },

                            executeFormCommand: function(formCommandParams) {
                                return execFormCommand(formCommandParams);
                            },

                            executeFormCommandDS: function(entityID, commandID, commandParams, ds) {
                                var params = {
                                    EntityID: entityID,
                                    CommandID: commandID,
                                    CommandParams: commandParams
                                };
                                if (ds) {
                                    params.EntityDataset = ds;
                                }

                                return execFormCommand(params);
                            },

                            executeScrollerCommandSRV: function(groupID, filterID, commandID, scrollerParams, commandParams) {

                                var scrollerCommandParams = {
                                    ScrollerID: groupID + "/" + filterID,
                                    CommandID: commandID,
                                    ScrollerParams: scrollerParams,
                                    CommandParams: commandParams
                                };
                                return execScrollerCommand(scrollerCommandParams);
                            },

                            executeScrollerCommandDS: function(groupID, filterID, commandID, dataSet, commandParams) {
                                var scrollerCommandParams = {
                                    ScrollerID: groupID + "/" + filterID,
                                    CommandID: commandID,
                                    ScrollerDataset: dataSet,
                                    CommandParams: commandParams
                                };
                                return execScrollerCommand(scrollerCommandParams);
                            },

                            /**
                             * @ngdoc function
                             * @name es.Services.Web.esWebApi#fetchPublicQueryInfo
                             * @methodOf es.Services.Web.esWebApi
                             * @description Function that returns the Entersoft Janus based GridExLayout as a JSON object.
                             * @module es.Services.Web
                             * @kind function
                             * @param {string} GroupID Entersoft Public Query GroupID
                             * @param {string} FilterID Entersoft Public Query FilterID
                             * @return {httpPromise} Returns a promise. 
                             ** If success i.e. success(function(ret) {...}) the response ret is a JSON object representing the Entersoft 
                             * Business Suite Janus based GridEx Layout. See the example on how to use the returned value in order to create an esGrid options object
                             *
                             ** If error i.e. error(function(err, status) { ... }) the err contains the server error object and if available the status code i.e. 400
                             * @example
<pre>
function($scope, esWebApi, esWebUIHelper) {
    $scope.pGroup = "ESMMStockItem";
    $scope.pFilter = "ESMMStockItem_def";
    $scope.fetchPQInfo = function() {
        esWebApi.fetchPublicQueryInfo($scope.pGroup, $scope.pFilter)
            .success(function(ret) {
                // This is the gridlayout as defined in the EBS Public Query based on .NET Janus GridEx Layout
                $scope.esJanusGridLayout = ret;

                // This is the neutral-abstract representation of the Janus GridEx Layout according to the ES WEB UI simplification
                $scope.esWebGridInfo = esWebUIHelper.winGridInfoToESGridInfo($scope.pGroup, $scope.pFilter, $scope.esJanusGridLayout);

                // This is the kendo-grid based layout ready to be assigned to kendo-grid options attribute for rendering the results
                // and for executing the corresponding Public Query
                $scope.esWebGridLayout = esWebUIHelper.esGridInfoToKInfo(esWebApi, $scope.pGroup, $scope.pFilter, {}, $scope.esWebGridInfo);
            })
            .error(function(err, status) {
                alert(a.UserMessage || a.MessageID || "Generic Error");
            });
    }
}
</pre>
                             */
                            fetchPublicQueryInfo: function(GroupID, FilterID) {
                                var surl = urlWEBAPI.concat(ESWEBAPI_URL.__PUBLICQUERY_INFO__, GroupID, "/", FilterID);
                                var tt = esGlobals.trackTimer("PQ", "INFO", GroupID.concat("/", FilterID));
                                tt.startTime();

                                var ht = $http({
                                    method: 'get',
                                    headers: {
                                        "Authorization": esGlobals.getWebApiToken()
                                    },
                                    url: surl
                                });
                                return processWEBAPIPromise(ht, tt);
                            },

                            /**
                             * @ngdoc function
                             * @name es.Services.Web.esWebApi#fetchStdZoom
                             * @methodOf es.Services.Web.esWebApi
                             * @module es.Services.Web
                             * @kind function
                             * @param {string} zoomID Entersoft Public Query GroupID
                             * @param {object} pqOptions Entersoft Public Query execution options with respect to Paging, PageSize and CountOf.
                             * pqOptions is a JSON object of the following type:
 <pre>
var pqOptions = {
    WithCount: boolean,
    Page: int,
    PageSize: int
};
</pre>
                             *
                             ** If pqOptions is null or undefined OR pqOptions.Page is null OR undefined OR NaN OR less than or equal to 0 THEN
                             * the Public Query will be executed at the Entersoft Application Server with no paging at all, which means that ALL the 
                             * rows will be returned.
                             *
                             ** If pqOptions is valid and pqOptions.PageSize is null OR undefined OR NaN OR less or equal to 0 THEN 
                             * the Public Query will be executed with PageSize equal to 20 which is the server's default
                             *
                             ** If pqOptions is valid and pqOptions.WithCount is true THEN the result will also include the total count of records 
                             * (no natter what the pagesize is) found in the server for the given Public Query and pqParams supplied for the PQ execution.
                             ** If pqOptions is valid and pqOptions.WithCount is false, the result still might contain information about the 
                             * total records depending on the other parameters. See the return section for detailed information about the returned value.
                             * @return {httpPromise} Returns a promise.
                             ** If success i.e. then(function(ret) { ... }) ret.data holds the result of the Zoom Records.
                             * In any success response, ret.data.Table will hold as string the Public Query MasterTableName as defined through the Entersoft Scroller Designer.
                             * The response has the typical form as follows:
<pre>
var x = {
    Table: string, // The name of the standard i.e. in the form ESXXZxxxx provided in the **_zoomID_** parameter
    Rows: [{Record 1}, {Record 2}, ....], // An array of JSON objects each one representing a record in the form of fieldName: fieldValue
    Count: int, // In contrast to fetchPublicQuery, for fetchZoom, Count will always have value no matter of the options parameter and fields.
    Page: int, // If applicable the requested Page Number (1 based), otherwise -1
    PageSize: int, // If applicable the Number of records in the Page (i.e. less or equal to the requested PageSize) otherwise -1
}
</pre>                        
                             *
                             ** If error i.e. function(err) { ... } then err.data contains the Entersoft Application server error object.
                             * @example
<pre>
$scope.fetchStdZoom = function()
{
    var zoomOptions = {
        WithCount: false,
        Page: 2,
        PageSize: 5

    };
    esWebApi.fetchStdZoom($scope.pZoomID, zoomOptions)
        .then(function(ret) {
            $scope.pZoomResults = ret.data;
        }, function(err) {
            $scope.pZoomResults = err;
        });
}
</pre>
                             */
                            fetchStdZoom: function(zoomID, pqOptions) {
                                zoomID = zoomID ? zoomID.replace(/ /g, "") : "";
                                var surl = urlWEBAPI.concat(ESWEBAPI_URL.__STANDARD_ZOOM__, zoomID);
                                var tt = esGlobals.trackTimer("ZOOM", "FETCH", zoomID);
                                tt.startTime();

                                var ht = $http({
                                    method: 'get',
                                    headers: {
                                        "Authorization": esGlobals.getWebApiToken(),
                                        "X-ESPQOptions": JSON.stringify(pqOptions)
                                    },
                                    url: surl
                                });
                                return processWEBAPIPromise(ht, tt);
                            },

                            /**
                             * @ngdoc function
                             * @name es.Services.Web.esWebApi#fetchPublicQuery
                             * @methodOf es.Services.Web.esWebApi
                             * @module es.Services.Web
                             * @kind function
                             * @param {string} pqGroupID Entersoft Public Query GroupID
                             * @param {string} pqFilterID Entersoft Public Query FilterID
                             * @param {object} pqOptions Entersoft Public Query execution options with respect to Paging, PageSize and CountOf.
                             * pqOptions is a JSON object of the following type:
 <pre>
var pqOptions = {
    WithCount: boolean,
    Page: int,
    PageSize: int
};
</pre>
                             *
                             ** If pqOptions is null or undefined OR pqOptions.Page is null OR undefined OR NaN OR less than or equal to 0 THEN
                             * the Public Query will be executed at the Entersoft Application Server with no paging at all, which means that ALL the 
                             * rows will be returned.
                             *
                             ** If pqOptions is valid and pqOptions.PageSize is null OR undefined OR NaN OR less or equal to 0 THEN 
                             * the Public Query will be executed with PageSize equal to 20 which is the server's default
                             *
                             ** If pqOptions is valid and pqOptions.WithCount is true THEN the result will also include the total count of records 
                             * (no natter what the pagesize is) found in the server for the given Public Query and pqParams supplied for the PQ execution.
                             ** If pqOptions is valid and pqOptions.WithCount is false, the result still might contain information about the 
                             * total records depending on the other parameters. See the return section for detailed information about the returned value.
                             * @param {object} pqParams Parameters that will be used for the execution of the Public Query at the Entersoft Application Server
                             * The typical structure of the pqParams object is:
<pre>
var pqParams = {
    Name: "a*",
    RegDate: "ESDateRange(Day)"
};
</pre>
                             * pqParams is a typical JSON object of key: value properties, where key is the parameter name as defined in the Public Query 
                             * (through Entersoft Scroller Designer) and value is an Entersoft Application server acceptable value for the given parameter, depending on the
                             * parameter type and properties as defined in the Public Query (through Entersoft Scroller Designer)
                             *
                             ** If pqParams is null or undefined or empty object i.e. {} THEN the Public Query will be executed by the Entersoft Application Server
                             * with all parameters assigned the value null.
                             *
                             ** If pqParams is not null and some parameters are specified THEN all the parameters that are not explicitly assigned a value i.e. are missing or are null or undefined in the pqParams object 
                             * at the execution time will be treated by the Entersoft Application Server as having null value.
                             * @param {string=} httpVerb Parameter to specify HTTP verb. Default is GET
                             * @return {httpPromise} Returns a promise.
                             ** If success i.e. then(function(ret) { ... }) ret.data holds the result of the Public Query Execution.
                             * In any success response, ret.data.Table will hold as string the Public Query MasterTableName as defined through the Entersoft Scroller Designer.
                             * The response has the typical form as follows:
<pre>
var x = {
    Table: string, // The name of the MasterTable as defined in the Public Query definition (through the Scroller Designer)
    Rows: [{Record 1}, {Record 2}, ....], // An array of JSON objects each one representing a record in the form of fieldName: fieldValue
    Count: int, // If applicable and capable the total number of records found in the server at the execution time for the current execution of Public Query / pqParams 
    Page: int, // If applicable the requested Page Number (1 based), otherwise -1
    PageSize: int, // If applicable the Number of records in the Page (i.e. less or equal to the requested PageSize) otherwise -1
}
</pre>                        
                             *                              * 
                             * If **NO PAGING** is taking place (no matter how), which means that all data are returned from the server THEN
                             * ret.data.Count will always be greater or equal to 0 and it will always be equal to the ret.data.Rows.length i.e. the number of 
                             * records returned by the server. If the query returns no data, the ret.Count will be 0 and ret.data.Rows will always be an empty array []. 
                             * So, if NO PAGING is taking place, we always have ret.data.Count == ret.data.Rows.length.
                             * 
                             * **ATTENTION** If no records are returned by the Server ret.data.Rows will NOT BE null or undefined or not defined. It will be an empty array. ret.data.PageSize will be -1, ret.data.Page will be -1, 
                             * 
                             *If **PAGING** is taking place the following pseudo code diagram reflects the contents of ret.data response:
<pre>
IF WithCount == TRUE THEN
    {
        Count: 0, // (if no data at all exist or the number of records found in the database for the specific pq & params execution),
        Page: inputPage,
        PageSize: inputPageSize,
        Rows: [{} empty i.e. length = 0 or > 0 num of elements], // no page exists or the page has no data. IF Rows.length == 0 and Count == 0 THEN page is empty because in general no data exist
        Table: “xxxx”
    }
ELSE
    {
        Count: -1,
        Page: inputPage,
        PageSize: inputPageSize,
        Rows: [{} empty i.e. length = 0 or > 0 num of elements], // 0 length means that either no data at all exist or no page exists or the page has no data
        Table: “xxxx”
    }
END IF
</pre>
                             *
                             ** If error i.e. function(err) { ... } then err.data contains the Entersoft Application server error object.
                             * @example
<pre>
$scope.dofetchPublicQuery = function() {
    var group = "ESGOPerson";
    var filter = "PersonList";
    $scope.pqResult = "";

    var pqOptions = {
        WithCount: false,
        Page: 2,
        PageSize: 5
    };

    var pqParams = {
        Name: "a*"
    };

    esWebApi.fetchPublicQuery(group, filter, pqOptions, pqParams)
        .then(function(ret) {
                $scope.pqResult = ret.data;
                $log.info(ret);
            },
            function(err) {
                $scope.pqResult = ret;
                $log.error(err);
            });
}
</pre>
                             */
                            fetchPublicQuery: function(pqGroupID, pqFilterID, pqOptions, pqParams, httpVerb) {
                                pqGroupID = pqGroupID ? pqGroupID.replace(/ /g, "") : "";
                                pqFilterID = pqFilterID ? pqFilterID.replace(/ /g, "") : "";

                                var surl = urlWEBAPI.concat(ESWEBAPI_URL.__PUBLICQUERY__, pqGroupID, "/", pqFilterID);
                                var tt = esGlobals.trackTimer("PQ", "FETCH", pqGroupID.concat("/", pqFilterID));
                                tt.startTime();

                                /**
                                 * $http object configuration
                                 * @type {Object}
                                 */
                                var httpConfig = {
                                    headers: {
                                        "Authorization": esGlobals.getWebApiToken()
                                    },
                                    url: surl,
                                    params: pqParams
                                };

                                if (pqOptions) {
                                    httpConfig.headers["X-ESPQOptions"] = JSON.stringify(pqOptions);
                                }

                                //if called with 3 arguments then default to a GET request
                                httpConfig.method = httpVerb || 'GET';

                                //if not a GET request, switch to data instead of params
                                if (httpConfig.method !== 'GET') {
                                    delete httpConfig.params;
                                    httpConfig.data = pqParams;
                                }

                                var ht = $http(httpConfig);
                                return processWEBAPIPromise(ht, tt);
                            },



                            eSearch: function(eUrl, eMethod, eBody) {
                                var surl = urlWEBAPI.concat(ESWEBAPI_URL.__ELASTICSEARCH__, eUrl);

                                var ht = $http({
                                    method: eMethod,
                                    headers: {
                                        "Authorization": esGlobals.getWebApiToken()
                                    },
                                    url: surl,
                                    data: eBody
                                }).success(function(data) {
                                    // if google analytics are enabled register the exception as well
                                    var esGA = esGlobals.getGA();
                                    if (esGA) {
                                        esGA.registerEventTrack({
                                            category: "ELASTIC_SEARCH",
                                            action: "SEARCH",
                                            label: eUrl
                                        });
                                    }
                                }).error(function(err) {
                                    try {
                                        fregisterException(err);
                                    } catch (exc) {

                                    }
                                });

                                return processWEBAPIPromise(ht);
                            }
                        }
                    }
                ]
            }
        }
    );

    esWebServices.factory('esElasticSearch', ['esWebApi',
        function(esWebApi) {
            return {
                searchIndex: function(index, body) {
                    var eUrl = index + "/_search";
                    return esWebApi.eSearch(eUrl, "post", body);
                },

                searchIndexAndDocument: function(index, docType, body) {
                    var eUrl = index + "/" + docType + "/_search";
                    return esWebApi.eSearch(eUrl, "post", body);
                },

                searchFree: esWebApi.eSearch
            };
        }
    ]);

}());

    (function() {
        'use strict';

        var esModule = angular.module('es.Services.Analytics', []);
        esModule.provider("es.Services.GA",
            function() {
                var settings = {
                    gaKey: undefined,
                    pageTracking: {
                        autoTrackFirstPage: true,
                        autoTrackVirtualPages: true,
                        trackRelativePath: false,
                        autoBasePath: false,
                        basePath: ''
                    },
                    developerMode: false // Prevent sending data in local/development environment
                };

                return {
                    setGAKey: function(key) {
                        gaKey = key;
                    },
                    settings: settings,
                    virtualPageviews: function(value) {
                        this.settings.pageTracking.autoTrackVirtualPages = value;
                    },
                    firstPageview: function(value) {
                        this.settings.pageTracking.autoTrackFirstPage = value;
                    },
                    withBase: function(value) {
                        this.settings.pageTracking.basePath = (value) ? angular.element('base').attr('href').slice(0, -1) : '';
                    },
                    withAutoBase: function(value) {
                        this.settings.pageTracking.autoBasePath = value;
                    },
                    developerMode: function(value) {
                        this.settings.developerMode = value;
                    },

                    start: function(key, domain) {
                        if (window.ga && (key && key != "")) {
                            settings.gaKey = key;
                            ga('create', key, domain);
                        }
                    },

                    $get: ['$window', function($window) {
                        return {
                            settings: settings,

                            registerPageTrack: function(path) {
                                if ($window.ga) {
                                    $window.ga('send', 'pageview', path);
                                }
                            },

                            registerException: function(excObj) {
                                if ($window.ga && excObj) {
                                    $window.ga('send', 'exception', {
                                        exDescription: JSON.stringify(excObj),
                                        exFatal: false
                                    });
                                }
                            },

                            registerTiming: function(properties) {
                                if ($window.ga) {
                                    // do nothing if there is no category (it's required by GA)
                                    if (!properties || !properties.timingCategory || !properties.timingVar || !properties.timingValue) {
                                        return;
                                    }

                                     if (properties.timingValue) {
                                        var parsed = parseInt(properties.timingValue, 10);
                                        properties.timingValue = isNaN(parsed) ? 0 : parsed;
                                        if (properties.timingValue == 0) {
                                            return;
                                        }
                                    }
                                    
                                    $window.ga('send', 'timing', properties);
                                    /*
                                    angular.forEach($analyticsProvider.settings.ga.additionalAccountNames, function(accountName) {
                                        ga(accountName + '.send', 'event', eventOptions);
                                    });
                                    */
                                }
                            },

                            registerEventTrack: function(properties) {
                                if ($window.ga) {
                                    // do nothing if there is no category (it's required by GA)
                                    if (!properties || !properties.category) {
                                        return;
                                    }
                                    // GA requires that eventValue be an integer, see:
                                    // https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#eventValue
                                    // https://github.com/luisfarzati/angulartics/issues/81
                                    if (properties.value) {
                                        var parsed = parseInt(properties.value, 10);
                                        properties.value = isNaN(parsed) ? 0 : parsed;
                                    }

                                    var eventOptions = {
                                        eventCategory: properties.category || null,
                                        eventAction: properties.action || null,
                                        eventLabel: properties.label || null,
                                        eventValue: properties.value || null,
                                        nonInteraction: properties.noninteraction || null
                                    };

                                    // add custom dimensions and metrics
                                    for (var idx = 1; idx <= 20; idx++) {
                                        if (properties['dimension' + idx.toString()]) {
                                            eventOptions['dimension' + idx.toString()] = properties['dimension' + idx.toString()];
                                        }
                                        if (properties['metric' + idx.toString()]) {
                                            eventOptions['metric' + idx.toString()] = properties['metric' + idx.toString()];
                                        }
                                    }
                                    $window.ga('send', 'event', eventOptions);
                                    /*
                                    angular.forEach($analyticsProvider.settings.ga.additionalAccountNames, function(accountName) {
                                        ga(accountName + '.send', 'event', eventOptions);
                                    });
                                    */
                                }
                            }
                        }
                    }]
                };
            }
        );

        esModule.run(['$rootScope', '$window', 'es.Services.GA', '$injector', function($rootScope, $window, esAnalytics, $injector) {
            if (esAnalytics.settings.pageTracking.autoTrackFirstPage) {
                $injector.invoke(['$location', function($location) {
                    /* Only track the 'first page' if there are no routes or states on the page */
                    var noRoutesOrStates = true;
                    if ($injector.has('$route')) {
                        var $route = $injector.get('$route');
                        for (var route in $route.routes) {
                            noRoutesOrStates = false;
                            break;
                        }
                    } else if ($injector.has('$state')) {
                        var $state = $injector.get('$state');
                        for (var state in $state.get()) {
                            noRoutesOrStates = false;
                            break;
                        }
                    }
                    if (noRoutesOrStates) {
                        if (esAnalytics.settings.pageTracking.autoBasePath) {
                            esAnalytics.settings.pageTracking.basePath = $window.location.pathname;
                        }
                        if (esAnalytics.settings.trackRelativePath) {
                            var url = esAnalytics.settings.pageTracking.basePath + $location.url();
                            esAnalytics.registerPageTrack(url, $location);
                        } else {
                            esAnalytics.registerPageTrack($location.absUrl(), $location);
                        }
                    }
                }]);
            }

            if (esAnalytics.settings.pageTracking.autoTrackVirtualPages) {
                $injector.invoke(['$location', function($location) {
                    if (esAnalytics.settings.pageTracking.autoBasePath) {
                        /* Add the full route to the base. */
                        esAnalytics.settings.pageTracking.basePath = $window.location.pathname + "#";
                    }
                    if ($injector.has('$route')) {
                        $rootScope.$on('$routeChangeSuccess', function(event, current) {
                            if (current && (current.$$route || current).redirectTo) return;
                            var url = esAnalytics.settings.pageTracking.basePath + $location.url();
                            esAnalytics.registerPageTrack(url, $location);
                        });
                    }
                    if ($injector.has('$state')) {
                        $rootScope.$on('$stateChangeSuccess', function(event, current) {
                            var url = esAnalytics.settings.pageTracking.basePath + $location.url();
                            esAnalytics.registerPageTrack(url, $location);
                        });
                    }
                }]);
            }
            if (esAnalytics.settings.developerMode) {
                angular.forEach(esAnalytics, function(attr, name) {
                    if (typeof attr === 'function') {
                        esAnalytics[name] = function() {};
                    }
                });
            }
        }]);

        esModule.directive('esAnalyticsOn', ['$document', 'es.Services.GA', function($document, esAnalytics) {

            function isAnchor(element) {
                return element.tagName.toLowerCase() + ':' + (element.type || '') == "a:";
            }

            function isCommand(element) {
                return ['button:', 'button:button', 'button:submit', 'input:button', 'input:submit'].indexOf(
                    element.tagName.toLowerCase() + ':' + (element.type || '')) >= 0;
            }

            function inferEventType(element) {
                if (isCommand(element) || isAnchor(element)) {
                    return 'click';
                }

                return 'click';
            }

            function inferCategory(element) {
                if (isCommand(element)) {
                    return "Command";
                }

                if (isAnchor(element)) {

                    if (!element.href) {
                        return "Navigate";
                    }

                    var href = element.href;
                    var filetypes = /\.(mov|jpg|png|rar|avi|zip|exe|pdf|doc*|xls*|ppt*|mp*)$/i;

                    if (href.match(/^https?\:/i)) {
                        var isFileType = href.match(filetypes);
                        if (!href.match($document[0].domain)) {
                            if (isFileType) {
                                return "External Download";
                            }
                            return "External Link";
                        } else {
                            if (isFileType) {
                                return "Internal Download";
                            }
                            return "Internal Link";
                        }
                    }

                    if (href.match(/^mailto\:/i)) {
                        return "Mail To";
                    }
                    if (href.match(filetypes)) {
                        return "Download";
                    }

                    return "Navigate";

                }

                return element.id || element.name || element.tagName;
            }


            function inferAction(element) {
                if (isCommand(element)) {
                    return element.tagName.toLowerCase() + ':' + (element.type || '');
                }

                if (isAnchor(element)) {
                    if (element.href) {
                        return element.href;
                    }
                    return element.innerText || element.value;
                }

                return element.id || element.name || element.tagName;
            }

            function inferLabel(element) {
                if (isCommand(element) || isAnchor(element)) {
                    return element.innerText || element.value;
                }

                return element.id || element.name || element.tagName;
            }

            function isProperty(name) {
                return name.substr(0, 11) === 'esAnalytics' && ['On', 'If', 'Properties', 'EventType'].indexOf(name.substr(11)) === -1;
            }

            function propertyName(name) {
                var s = name.slice(11); // slice off the 'analytics' prefix
                if (typeof s !== 'undefined' && s !== null && s.length > 0) {
                    return s.substring(0, 1).toLowerCase() + s.substring(1);
                } else {
                    return s;
                }
            }

            return {
                restrict: 'A',
                link: function($scope, $element, $attrs) {
                    var eventType = $attrs.esAnalyticsOn || inferEventType($element[0]);
                    var trackingData = {};

                    angular.forEach($attrs.$attr, function(attr, name) {
                        if (isProperty(name)) {
                            trackingData[propertyName(name)] = $attrs[name];
                            $attrs.$observe(name, function(value) {
                                trackingData[propertyName(name)] = value;
                            });
                        }
                    });

                    trackingData.category = trackingData.category || inferCategory($element[0], $document);
                    trackingData.action = trackingData.action || inferAction($element[0], $document);
                    trackingData.label = trackingData.label || inferLabel($element[0], $document);

                    angular.element($element[0]).bind(eventType, function($event) {
                        if ($attrs.esAnalyticsIf) {
                            if (!$scope.$eval($attrs.esAnalyticsIf)) {
                                return; // Cancel this event if we don't pass the analytics-if condition
                            }
                        }
                        // Allow components to pass through an expression that gets merged on to the event properties
                        // eg. analytics-properites='myComponentScope.someConfigExpression.$analyticsProperties'
                        if ($attrs.esAnalyticsProperties) {
                            angular.extend(trackingData, $scope.$eval($attrs.esAnalyticsProperties));
                        }

                        esAnalytics.registerEventTrack(trackingData);
                    });
                }
            };
        }]);

    })();

(function(angular) {
    'use strict';

    /**
     * @module
     * @name  es.Services.Web#Environment
     * @description 
     * provides mutators ofr environment options.
     */
    angular.module('es.services.Web.Environment', [])
        .provider('Environment', [function () {
            /**
             * @private @type {Object}
             * @description holds domain to stage mappings
             */
            var domainConfig = {dev: [], prod: [], staging: []};
            var _stage = 'dev';
            var _assetsPath = '/KB/app/images';
            var _templatesPath = '/KB/app/templates';

            /**
             * attempts to get base domain from url
             * @return {string | null} domain will be null if check fails
             */
            function _getDomain() {
                var matches = document.location.href.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
                return (matches && matches[1]);
            }

            return {
                /**
                 * manually set stage
                 * @param {string env
                 */
                setStage: function (env) {
                    _stage = env;
                },

                /**
                 * read the current stage
                 * @return {string}
                 */
                getStage: function () {
                    return _stage;
                },

                /**
                 * path mutators
                 */
                setAssetsPath: function (path) {
                    _assetsPath = path;
                },
                setTemplatesPath: function (path) {
                    _templatesPath = path;
                },

                /**
                 * declares domains that run development codebase
                 * @param {array} domains
                 */
                addDevelopmentDomains: function (domains) {
                    domainConfig.dev = domains;
                    return this;
                },
                addProductionDomains: function (domains) {
                    domainConfig.prod = domains;
                    return this;
                },
                addStagingDomains: function (domains) {
                    domainConfig.staging = domains;
                    return this;
                },

                /**
                 * attempts to automatically set stage from domain url based on the domainConfig object
                 */
                setStageFromDomain: function() {
                    var domain;
                    for (var stage in domainConfig) {
                        domain = _getDomain();
                        if (domainConfig[stage].indexOf(domain) >= 0) {
                            _stage = stage;
                            break;
                        }
                    }
                },

                $get: function () {
                    return {
                        stage: _stage,
                        assetsPath: _assetsPath,
                        templatesPath: _templatesPath,
                        isDev: function () {
                            return (_stage === 'dev');
                        },
                        isProduction: function () {
                            return (_stage === 'prod');
                        },
                        isStaging: function () {
                            return (_stage === 'staging');
                        },
                        getAssetsPath: function () {
                            return _assetsPath
                        },
                        getTemplatesPath: function () {
                            return _templatesPath
                        }
                    };
                }
            };
        }]);

})(window.angular);
(function(window, angular, undefined) {
    'use strict';

    // Module global settings.
    var settings = {};

    // Module global flags.
    var flags = {
        sdk: false,
        ready: false
    };

    // Deferred Object which will be resolved when the Facebook SDK is ready
    // and the `fbAsyncInit` function is called.
    var loadDeferred;

    /**
     * @name facebook
     * @kind function
     * @description
     * An Angularjs module to take approach of Facebook javascript sdk.
     *
     * @author Luis Carlos Osorio Jayk <luiscarlosjayk@gmail.com>
     */
    angular.module('es.Services.Social', []).

    // Declare module settings value
    value('settings', settings).

    // Declare module flags value
    value('flags', flags).

    /**
     * Facebook provider
     */
    provider('esFacebook', [
        function() {

            /**
             * Facebook appId
             * @type {Number}
             */
            settings.appId = null;

            this.setAppId = function(appId) {
                settings.appId = appId;
            };

            this.getAppId = function() {
                return settings.appId;
            };

            /**
             * Locale language, english by default
             * @type {String}
             */
            settings.locale = 'en_US';

            this.setLocale = function(locale) {
                settings.locale = locale;
            };

            this.getLocale = function() {
                return settings.locale;
            };

            /**
             * Set if you want to check the authentication status
             * at the start up of the app
             * @type {Boolean}
             */
            settings.status = true;

            this.setStatus = function(status) {
                settings.status = status;
            };

            this.getStatus = function() {
                return settings.status;
            };

            /**
             * Adding a Channel File improves the performance of the javascript SDK,
             * by addressing issues with cross-domain communication in certain browsers.
             * @type {String}
             */
            settings.channelUrl = null;

            this.setChannel = function(channel) {
                settings.channelUrl = channel;
            };

            this.getChannel = function() {
                return settings.channelUrl;
            };

            /**
             * Enable cookies to allow the server to access the session
             * @type {Boolean}
             */
            settings.cookie = true;

            this.setCookie = function(cookie) {
                settings.cookie = cookie;
            };

            this.getCookie = function() {
                return settings.cookie;
            };

            /**
             * Parse XFBML
             * @type {Boolean}
             */
            settings.xfbml = true;

            this.setXfbml = function(enable) {
                settings.xfbml = enable;
            };

            this.getXfbml = function() {
                return settings.xfbml;
            };

            /**
             * Auth Response
             * @type {Object}
             */

            this.setAuthResponse = function(obj) {
                settings.authResponse = obj || true;
            };

            this.getAuthResponse = function() {
                return settings.authResponse;
            };

            /**
             * Frictionless Requests
             * @type {Boolean}
             */
            settings.frictionlessRequests = false;

            this.setFrictionlessRequests = function(enable) {
                settings.frictionlessRequests = enable;
            };

            this.getFrictionlessRequests = function() {
                return settings.frictionlessRequests;
            };

            /**
             * HideFlashCallback
             * @type {Object}
             */
            settings.hideFlashCallback = null;

            this.setHideFlashCallback = function(obj) {
                settings.hideFlashCallback = obj || null;
            };

            this.getHideFlashCallback = function() {
                return settings.hideFlashCallback;
            };

            /**
             * Custom option setting
             * key @type {String}
             * value @type {*}
             * @return {*}
             */
            this.setInitCustomOption = function(key, value) {
                if (!angular.isString(key)) {
                    return false;
                }

                settings[key] = value;
                return settings[key];
            };

            /**
             * get init option
             * @param  {String} key
             * @return {*}
             */
            this.getInitOption = function(key) {
                // If key is not String or If non existing key return null
                if (!angular.isString(key) || !settings.hasOwnProperty(key)) {
                    return false;
                }

                return settings[key];
            };

            /**
             * load SDK
             */
            settings.loadSDK = true;

            this.setLoadSDK = function(a) {
                settings.loadSDK = !!a;
            };

            this.getLoadSDK = function() {
                return settings.loadSDK;
            };

            /**
             * SDK version
             */
            settings.version = 'v2.2';

            this.setSdkVersion = function(version) {
                settings.version = version;
            };

            this.getSdkVersion = function() {
                return settings.version;
            };

            /**
             * Init Facebook API required stuff
             * This will prepare the app earlier (on settingsuration)
             * @arg {Object/String} initSettings
             * @arg {Boolean} _loadSDK (optional, true by default)
             */
            this.init = function(initSettings, _loadSDK) {
                // If string is passed, set it as appId
                if (angular.isString(initSettings)) {
                    settings.appId = initSettings;
                }

                if (angular.isNumber(initSettings)) {
                    settings.appId = initSettings.toString();
                }

                // If object is passed, merge it with app settings
                if (angular.isObject(initSettings)) {
                    angular.extend(settings, initSettings);
                }

                // Set if Facebook SDK should be loaded automatically or not.
                if (angular.isDefined(_loadSDK)) {
                    settings.loadSDK = !!_loadSDK;
                }
            };

            /**
             * This defined the Facebook service
             */
            this.$get = [
                '$q',
                '$rootScope',
                '$timeout',
                '$window',
                function($q, $rootScope, $timeout, $window) {
                    /**
                     * This is the NgFacebook class to be retrieved on Facebook Service request.
                     */
                    function NgFacebook() {
                        this.appId = settings.appId;
                    }

                    /**
                     * Ready state method
                     * @return {Boolean}
                     */
                    NgFacebook.prototype.isReady = function() {
                        return flags.ready;
                    };

                    NgFacebook.prototype.login = function() {

                        var d = $q.defer(),
                            args = Array.prototype.slice.call(arguments),
                            userFn,
                            userFnIndex; // Converts arguments passed into an array

                        // Get user function and it's index in the arguments array,
                        // to replace it with custom function, allowing the usage of promises
                        angular.forEach(args, function(arg, index) {
                            if (angular.isFunction(arg)) {
                                userFn = arg;
                                userFnIndex = index;
                            }
                        });

                        // Replace user function intended to be passed to the Facebook API with a custom one
                        // for being able to use promises.
                        if (angular.isFunction(userFn) && angular.isNumber(userFnIndex)) {
                            args.splice(userFnIndex, 1, function(response) {
                                $timeout(function() {

                                    if (response && angular.isUndefined(response.error)) {
                                        d.resolve(response);
                                    } else {
                                        d.reject(response);
                                    }

                                    if (angular.isFunction(userFn)) {
                                        userFn(response);
                                    }
                                });
                            });
                        }

                        // review(mrzmyr): generalize behaviour of isReady check
                        if (this.isReady()) {
                            $window.FB.login.apply($window.FB, args);
                        } else {
                            $timeout(function() {
                                d.reject("Facebook.login() called before Facebook SDK has loaded.");
                            });
                        }

                        return d.promise;
                    };

                    /**
                     * Map some asynchronous Facebook SDK methods to NgFacebook
                     */
                    angular.forEach([
                        'logout',
                        'api',
                        'ui',
                        'getLoginStatus'
                    ], function(name) {
                        NgFacebook.prototype[name] = function() {

                            var d = $q.defer(),
                                args = Array.prototype.slice.call(arguments), // Converts arguments passed into an array
                                userFn,
                                userFnIndex;

                            // Get user function and it's index in the arguments array,
                            // to replace it with custom function, allowing the usage of promises
                            angular.forEach(args, function(arg, index) {
                                if (angular.isFunction(arg)) {
                                    userFn = arg;
                                    userFnIndex = index;
                                }
                            });

                            // Replace user function intended to be passed to the Facebook API with a custom one
                            // for being able to use promises.
                            if (angular.isFunction(userFn) && angular.isNumber(userFnIndex)) {
                                args.splice(userFnIndex, 1, function(response) {
                                    $timeout(function() {

                                        if (response && angular.isUndefined(response.error)) {
                                            d.resolve(response);
                                        } else {
                                            d.reject(response);
                                        }

                                        if (angular.isFunction(userFn)) {
                                            userFn(response);
                                        }
                                    });
                                });
                            }

                            $timeout(function() {
                                // Call when loadDeferred be resolved, meaning Service is ready to be used.
                                loadDeferred.promise.then(function() {
                                    $window.FB[name].apply(FB, args);
                                });
                            });

                            return d.promise;
                        };
                    });

                    /**
                     * Map Facebook sdk XFBML.parse() to NgFacebook.
                     */
                    NgFacebook.prototype.parseXFBML = function() {

                        var d = $q.defer();

                        $timeout(function() {
                            // Call when loadDeferred be resolved, meaning Service is ready to be used
                            loadDeferred.promise.then(function() {
                                $window.FB.XFBML.parse();
                                d.resolve();
                            });
                        });

                        return d.promise;
                    };

                    /**
                     * Map Facebook SDK subscribe/unsubscribe method to NgFacebook.
                     * Use it as Facebook.subscribe / Facebook.unsubscribe in the service.
                     */

                    angular.forEach([
                        'subscribe',
                        'unsubscribe',
                    ], function(name) {

                        NgFacebook.prototype[name] = function() {

                            var d = $q.defer(),
                                args = Array.prototype.slice.call(arguments), // Get arguments passed into an array
                                userFn,
                                userFnIndex;

                            // Get user function and it's index in the arguments array,
                            // to replace it with custom function, allowing the usage of promises
                            angular.forEach(args, function(arg, index) {
                                if (angular.isFunction(arg)) {
                                    userFn = arg;
                                    userFnIndex = index;
                                }
                            });

                            // Replace user function intended to be passed to the Facebook API with a custom one
                            // for being able to use promises.
                            if (angular.isFunction(userFn) && angular.isNumber(userFnIndex)) {
                                args.splice(userFnIndex, 1, function(response) {

                                    $timeout(function() {

                                        if (response && angular.isUndefined(response.error)) {
                                            d.resolve(response);
                                        } else {
                                            d.reject(response);
                                        }

                                        if (angular.isFunction(userFn)) {
                                            userFn(response);
                                        }
                                    });
                                });
                            }

                            $timeout(function() {
                                // Call when loadDeferred be resolved, meaning Service is ready to be used
                                loadDeferred.promise.then(function() {
                                    $window.FB.Event[name].apply(FB, args);
                                });
                            });

                            return d.promise;
                        };
                    });

                    return new NgFacebook(); // Singleton
                }
            ];

        }
    ]).

    /**
     * Module initialization
     */
    run([
        '$rootScope',
        '$q',
        '$window',
        '$timeout',
        function($rootScope, $q, $window, $timeout) {
            // Define global loadDeffered to notify when Service callbacks are safe to use
            loadDeferred = $q.defer();

            var loadSDK = settings.loadSDK;
            delete(settings['loadSDK']); // Remove loadSDK from settings since this isn't part from Facebook API.

            /**
             * Define fbAsyncInit required by Facebook API
             */
            $window.fbAsyncInit = function() {
                // Initialize our Facebook app
                $timeout(function() {
                    if (!settings.appId) {
                        throw 'Missing appId setting.';
                    }

                    FB.init(settings);

                    flags.ready = true;

                    /**
                     * Subscribe to Facebook API events and broadcast through app.
                     */
                    angular.forEach({
                        'auth.login': 'login',
                        'auth.logout': 'logout',
                        'auth.prompt': 'prompt',
                        'auth.sessionChange': 'sessionChange',
                        'auth.statusChange': 'statusChange',
                        'auth.authResponseChange': 'authResponseChange',
                        'xfbml.render': 'xfbmlRender',
                        'edge.create': 'like',
                        'edge.remove': 'unlike',
                        'comment.create': 'comment',
                        'comment.remove': 'uncomment'
                    }, function(mapped, name) {
                        FB.Event.subscribe(name, function(response) {
                            $timeout(function() {
                                $rootScope.$broadcast('Facebook:' + mapped, response);
                            });
                        });
                    });

                    // Broadcast Facebook:load event
                    $rootScope.$broadcast('Facebook:load');

                    loadDeferred.resolve(FB);
                });
            };

            /**
             * Inject Facebook root element in DOM
             */
            (function addFBRoot() {
                var fbroot = document.getElementById('fb-root');

                if (!fbroot) {
                    fbroot = document.createElement('div');
                    fbroot.id = 'fb-root';
                    document.body.insertBefore(fbroot, document.body.childNodes[0]);
                }

                return fbroot;
            })();

            /**
             * SDK script injecting
             */
            if (loadSDK) {
                (function injectScript() {
                    var src = '//connect.facebook.net/' + settings.locale + '/sdk.js',
                        script = document.createElement('script');
                    script.id = 'facebook-jssdk';
                    script.async = true;

                    // Prefix protocol
                    // for sure we don't want to ignore things, but this tests exists,
                    // but it isn't recognized by istanbul, so we give it a 'ignore if'
                    /* istanbul ignore if */
                    if ($window.location.protocol.indexOf('file:') !== -1) {
                        src = 'https:' + src;
                    }

                    script.src = src;
                    script.onload = function() {
                        flags.sdk = true;
                    };

                    // Fix for IE < 9, and yet supported by latest browsers
                    document.getElementsByTagName('head')[0].appendChild(script);
                })();
            }
        }
    ]);

})(window, angular);
(function() {
    'use strict';

    var underscore = angular.module('underscore', []);
    underscore.factory('_', function() {
        return window._; //Underscore must already be loaded on the page 
    });


    var esWebFramework = angular.module('es.Services.Web');


    esWebFramework.provider('esCache', function() {
        var cache = null;
        var settings = {};
        settings.maxSize = -1;
        settings.storage = null;

        return {
            setMaxSize: function(size) {
                if (angular.isNumber(size)) {
                    settings.maxSize = size;
                }
            },

            getMaxSize: function() {
                return settings.maxSize;
            },

            getStorageSettings: function() {
                return settings.storage;
            },

            setStorageSettings: function(setings) {
                if (settings) {
                    settings.storage = settings;
                }
            },

            $get: function() {
                if (typeof(Cache) === 'undefined') {
                    throw "You must include jscache.js";
                }

                cache = new Cache(settings.maxSize, false, settings.storage);

                return {
                    getItem: function(key) {
                        return cache.getItem(key);
                    },

                    setItem: function(key, val, options) {
                        cache.setItem(key, val, options);
                    },

                    removeItem: function(key) {
                        cache.removeItem(key);
                    },

                    removeWhere: function(f) {
                        cache.removeWhere(function(k, v) {
                            return f(k, v);
                        });
                    },

                    size: function() {
                        return cache.size();
                    },

                    clear: function() {
                        cache.clear();
                    },

                    stats: function() {
                        return cache.stats();
                    }
                }
            }

        }

    });

    // Define the factory on the module.
    // Inject the dependencies.
    // Point to the factory definition function.
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
            publish: publish,
            subscribe: subscribe,
            unsubscribe: unsubscribe
        };

        return service;
    });


    esWebFramework.factory('esGlobals', ['$sessionStorage', '$log', 'esMessaging', '$injector' /* 'es.Services.GA' */ ,
        function($sessionStorage, $log, esMessaging, $injector) {

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
                if (!err) {
                    switch (status) {
                        case 401:
                            return "Please Login first";
                        case 403:
                            return "You are not authorized. Please Login and try again";

                        case 500:
                        default:
                            return "General Error. Please check your network and internet access";
                    }
                }

                var sMsg = "";
                if (err.UserMessage) {
                    sMsg = err.UserMessage;
                    if (err.MessageID) {
                        sMsg = sMsg + " (" + err.MessageID + ")";
                    }
                    return sMsg;
                }

                if (err.Messages) {
                    if (angular.isArray(err.Messages)) {
                        var i = 0;
                        sMsg = _.reduce(err.Messages, function(ret, x) {
                            return ret + "\r\n" + "[" + i + "]" + x;
                        }, "");

                    } else {
                        sMsg = err.Messages;
                    }

                    return sMsg ? sMsg : "General Error. Please check your network and internet access";
                } else {
                    return "General Error. Please check your network and internet access";
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
                credentials: null,
                connectionModel: null,

                getWebApiToken: function() {
                    return getAuthToken(fgetModel());
                },

                setModel: fsetModel,

                getModel: fgetModel,
            };

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

                getVersion: function() {
                    return {
                        Major: 0,
                        Minor: 0,
                        Patch: 140
                    };
                },

                getGA: fgetGA,

                getWebApiToken: function() {
                    return esClientSession.getWebApiToken();
                },

                getClientSession: function() {
                    return esClientSession;
                },

                getUserMessage: getUserMessage,

                sessionClosed: function() {
                    esClientSession.setModel(null);
                },

                trackTimer: function(category, variable, opt_label) {
                    return new TrackTiming(category, variable, opt_label);
                },

                sessionOpened: function(data, credentials) {
                    try {
                        esClientSession.setModel(data.Model);
                        esClientSession.credentials = credentials;


                        var esga = fgetGA();
                        if (angular.isDefined(esga)) {
                            var i;
                            for (i = 0; i < 12; i++) {
                                if (angular.isDefined(esga)) {
                                    esga.registerEventTrack({
                                        category: 'AUTH',
                                        action: 'LOGIN',
                                        label: data.Model.GID
                                    });
                                }
                            }
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


    esWebFramework.run(['esGlobals', 'esWebApi', function(esGlobals, esWebApi) {
        var esSession = esGlobals.getClientSession();
        esSession.getModel();
        esSession.hostUrl = esWebApi.getServerUrl();
    }]);
})();


(function() {
    'use strict';

    var esWebFramework = angular.module('es.Services.Web');

    /**
     * @ngdoc service
     * @name es.Services.Web.esStackTrace
     * @description
     * # esStackTrace and other services
     * Factory used to provide the stacktracejs javascript library for complete stack trace error reporting.
     */
    esWebFramework.factory(
        "esStackTrace",

        /**
         * @ngdoc
         * @name es.Services.Web.esStackTrace#print
         * @methodOf es.Services.Web.esStackTrace
         *
         * @description
         * Method that returns the printStackTrace object from the corresponding javascript library.
         * For more information on printStackTrace please see {@link https://github.com/stacktracejs/stacktrace.js/ stacktrace.js}
         * @returns {function} printStackTrace
         **/
        function() {
            return ({
                print: printStackTrace
            });
        }
    );

    esWebFramework.provider("$log",
        function() {
            var logAppenders = [];
            var ajaxAppender = null;
            var logger = null;
            var level = log4javascript.Level.ALL;
            var lt = null;

            function getLogger() {
                return log4javascript.getLogger('esLogger');
            }

            function createDefaultAppenders(addPopup) {
                doaddAppender(new log4javascript.BrowserConsoleAppender());

                var x = angular.isDefined(addPopup) && addPopup;
                if (x) {
                    doaddAppender(new log4javascript.PopUpAppender());
                }
            }

            function setAccessToken(session, token) {
                if (!ajaxAppender) {
                    return;
                }

                if (lt && session && session.connectionModel) {
                    lt.setCustomField("userId", session.connectionModel.UserID);
                    if (session.credentials) {
                        lt.setCustomField("branchId", session.credentials.BranchID);
                        lt.setCustomField("langId", session.credentials.LangID);
                    }
                }

                var hd = ajaxAppender.getHeaders();
                if (hd) {
                    var i;
                    var foundIndex = -1;
                    for (i = 0; i < hd.length; i++) {
                        if (hd[i].name == "Authorization") {
                            foundIndex = i;
                            break;
                        }
                    }
                    if (foundIndex != -1) {
                        hd.splice(foundIndex, 1);
                    }
                }

                if (token && token != "") {
                    ajaxAppender.addHeader("Authorization", token);
                }
            }

            function doaddAppender(appender) {
                if (logAppenders.indexOf(appender) == -1) {
                    logAppenders.push(appender);
                    return true;
                }
                return false;
            }

            return {

                setLevel: function(lvl) {
                    level = lvl;
                    if (logger) {
                        logger.setLevel(level);
                    }
                },

                getLevel: function() {
                    return level;
                },

                getCurrentLevel: function() {
                    if (logger) {
                        return logger.getEffectiveLevel();
                    } else {
                        return log4javascript.Level.OFF;
                    }
                },

                addAppender: doaddAppender,

                addDefaultAppenders: createDefaultAppenders,

                addESWebApiAppender: function(srvUrl, subscriptionId) {
                    // var ajaxUrl = srvUrl + "api/rpc/log/";
                    var ajaxUrl = srvUrl + "api/rpc/registerException/";

                    ajaxAppender = new log4javascript.AjaxAppender(ajaxUrl, false);
                    ajaxAppender.setSendAllOnUnload(true);

                    lt = new log4javascript.JsonLayout();
                    lt.setCustomField("subscriptionId", subscriptionId);

                    ajaxAppender.setLayout(lt);
                    ajaxAppender.setWaitForResponse(true);
                    ajaxAppender.setBatchSize(100);
                    ajaxAppender.setTimed(true);
                    ajaxAppender.setTimerInterval(60000);
                    ajaxAppender.addHeader("Content-Type", "application/json");

                    ajaxAppender.setRequestSuccessCallback(function(xmlHttp) {
                        console.log("ES Logger, BATCH of logs upoloaded", xmlHttp.responseURL, xmlHttp.status);
                    });

                    ajaxAppender.setFailCallback(function(messg) {
                        console.error("Failed to POST Logs to the server", messg);
                    });
                    return doaddAppender(ajaxAppender);
                },

                $get: ['esMessaging',
                    function(esMessaging) {
                        try {

                            logger = getLogger();
                            logger.setLevel(level);

                            if (logAppenders.length == 0) {
                                createDefaultAppenders();
                            }

                            var i = 0;
                            for (i = 0; i < logAppenders.length; i++) {
                                logger.addAppender(logAppenders[i]);
                            }

                            esMessaging.subscribe("AUTH_CHANGED", function(session, tok) {
                                setAccessToken(session, tok)
                            });

                            logger.sendAll = function() {
                                try {
                                    if (ajaxAppender) {
                                        ajaxAppender.sendAll();
                                    }
                                } catch (exc) {

                                }
                            }

                            console.info("ES Logger started");
                            return logger;
                        } catch (exception) {
                            console.log("Error in starting entersoft logger", exception);
                            return $log;
                        }

                    }
                ]
            }
        }

    );


    // -------------------------------------------------- //
    // -------------------------------------------------- //


    // By default, AngularJS will catch errors and log them to
    // the Console. We want to keep that behavior; however, we
    // want to intercept it so that we can also log the errors
    // to the server for later analysis.
    esWebFramework.provider("$exceptionHandler",
        function() {
            var logSettings = {
                pushToServer: false,
                logServer: ""
            };
            return {
                getSettings: function() {
                    return logSettings;
                },

                setPushToServer: function(pushToServer) {
                    logSettings.pushToServer = pushToServer;
                },

                setLogServer: function(logServer) {
                    logSettings.logServer = logServer;
                },

                $get: ['$log', '$window', 'esStackTrace', '$injector',
                    function($log, $window, stacktraceService, $injector) {

                        // I log the given error to the remote server.
                        function log(exception, cause) {
                            var errorMessage, stackTrace, itm;

                            try {
                                errorMessage = exception.toString();
                                stackTrace = stacktraceService.print({
                                    e: exception
                                });

                                itm = {
                                    errorUrl: $window.location.href,
                                    errorMessage: errorMessage,
                                    stackTrace: stackTrace,
                                    cause: (cause || "")
                                };

                                $log.error(JSON.stringify(itm, null, '\t'));

                            } catch (loggingError) {
                                console.log(arguments);
                            }

                            if (logSettings.pushToServer) {
                                // Now, we need to try and log the error the server.
                                // --
                                // NOTE: In production, I have some debouncing
                                // logic here to prevent the same client from
                                // logging the same error over and over again! All
                                // that would do is add noise to the log.
                                try {
                                    var ESWEBAPI = $injector.get('esWebApi');

                                    ESWEBAPI.registerException(itm, logSettings.logServer);

                                } catch (loggingError) {

                                    // For Developers - log the log-failure.
                                    $log.warn("ES Error in registerException on store " + logSettings.logServer);
                                    $log.error(loggingError);

                                }
                            }

                        }
                        // Return the logging function.
                        return (log);
                    }
                ]

            }
        }
    );
})();

/**
 * @ngdoc overview
 * @name es.Web.UI
 * @module es.Web.UI
 * @kind module
 * @description
 * This module encapsulates a set of directives, filters, services and methods for UI
 */

(function() {
    'use strict';
    var esWEBUI = angular.module('es.Web.UI', []);

    /*
        var dateRangeResolve = function(val, dateVal) {
            var d = new Date();

            switch (val.dType) {
                case 0:
                    {
                        if (!dateVal || !(angular.isDate(dateVal.fromD) && angular.isDate(dateVal.toD))) {
                            return val.title;
                        }

                        var s = "";
                        if (angular.isDate(dateVal.fromD)) {
                            s = dateVal.fromD.toLocaleDateString("el-GR");
                        }
                        s = s + " - ";

                        var toS = "";
                        if (angular.isDate(dateVal.toD)) {
                            toS = dateVal.toD.toLocaleDateString("el-GR");
                        }
                        s = s + toS;
                        return s;
                    }
                case 1:
                    {
                        if (!dateVal || !angular.isDate(dateVal.fromD)) {
                            return val.title;
                        }
                        return dateVal.fromD.toLocaleDateString("el-GR");
                    }
                case 2:
                    return val.title;
                case 3:
                    return d.toLocaleDateString();
                case 4:
                    return "-> " + d.toLocaleDateString();
                case 5:
                    return d.toLocaleDateString() + " ->";
                case 6:
                    {
                        d.setDate(d.getDate() - 1);
                        return d.toLocaleDateString();
                    }
                case 7:
                    {
                        d.setDate(d.getDate() - 1);
                        return d.toLocaleDateString() + " ->";
                    }
                case 8:
                    {
                        d.setDate(d.getDate() + 1);
                        return d.toLocaleDateString();
                    }
                case 9:
                    {
                        d.setDate(d.getDate() + 1);
                        return d.toLocaleDateString() + " ->";
                    }
                case 10:
                    {
                        var cDay = d.getDay();
                        var sDiff = (cDay == 0) ? 6 : (cDay - 1);

                        var f = new Date(d);
                        var t = new Date(d);
                        f.setDate(d.getDate() - sDiff);
                        t.setDate(f.getDate() + 6);

                        return f.toLocaleDateString() + " - " + t.toLocaleDateString();
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

                        return f.toLocaleDateString() + " - " + t.toLocaleDateString();
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

                        return f.toLocaleDateString() + " - " + t.toLocaleDateString();
                    }
                case 13:
                    {
                        d.setDate(1);

                        var f = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                        return d.toLocaleDateString() + " - " + f.toLocaleDateString();
                    }
                case 14:
                    {
                        d.setDate(1);
                        return d.toLocaleDateString() + " ->";
                    }
                case 15:
                    {
                        var f = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                        return "-> " + f.toLocaleDateString();
                    }
                case 16:
                    {
                        var f = new Date(d.getFullYear(), d.getMonth() - 1, 1);
                        var t = new Date(d.getFullYear(), d.getMonth(), 0);
                        return f.toLocaleDateString() + " - " + t.toLocaleDateString();
                    }
                case 17:
                    {
                        var f = new Date(d.getFullYear(), d.getMonth() - 1, 1);
                        return f.toLocaleDateString() + " ->";
                    }
                case 18:
                    {
                        var f = new Date(d.getFullYear(), d.getMonth(), 0);
                        return "-> " + f.toLocaleDateString();
                    }
                case 19:
                    {
                        var m = d.getMonth();
                        var r = m % 3;

                        var f = new Date(d.getFullYear(), m - r, 1);
                        var t = new Date(d.getFullYear(), m + (3 - r), 0);
                        return f.toLocaleDateString() + " -> " + t.toLocaleDateString();
                    }
                case 20:
                    {
                        var m = d.getMonth();
                        var r = m % 3;

                        var t = new Date(d.getFullYear(), m - r, 0);
                        var f = new Date(d.getFullYear(), t.getMonth() - 2, 1);
                        return f.toLocaleDateString() + " -> " + t.toLocaleDateString();
                    }
                case 21:
                    {
                        var f = new Date(d.getFullYear(), (m >= 6) ? 6 : 0, 1);
                        var t = new Date(d.getFullYear(), (m >= 6) ? 11 : 5, (m >= 6) ? 31 : 30);
                        return f.toLocaleDateString() + " -> " + t.toLocaleDateString();
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

                        return f.toLocaleDateString() + " -> " + t.toLocaleDateString();
                    }

                case 23:
                    {
                        var y = d.getFullYear();
                        var f = new Date(y, 0, 1);
                        var t = new Date(y, 11, 31);
                        return f.toLocaleDateString() + " -> " + t.toLocaleDateString();
                    }

                case 24:
                    {
                        var y = d.getFullYear() - 1;
                        var f = new Date(y, 0, 1);
                        var t = new Date(y, 11, 31);
                        return f.toLocaleDateString() + " -> " + t.toLocaleDateString();
                    }

                default:
                    return "ooops";
            }
        }

        */

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
        caption: "...<=...<=...",
        value: "RANGE"
    }, {
        caption: "Empty",
        value: "NULL"
    }, {
        caption: "Not Empty",
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

    function ESParamVal(paramId, paramVal) {
        this.paramCode = paramId;
        this.paramValue = paramVal;
    }

    ESParamVal.prototype.getExecuteVal = function() {
        return this.paramValue;
    };


    function ESNumericParamVal(paramId, paramVal) {
        //call super constructor
        ESParamVal.call(this, paramId, paramVal);
    }

    //inherit from ESParamval SuperClass
    ESNumericParamVal.prototype = Object.create(ESParamVal.prototype);


    ESNumericParamVal.prototype.getExecuteVal = function() {
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

    function ESParamValues(vals) {
        this.setParamValues(vals);
    }

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

    function prepareStdZoom($log, zoomID, esWebApiService) {
        var xParam = {
            transport: {
                read: function(options) {

                    $log.info("FETCHing ZOOM data for [", zoomID, "] with options ", JSON.stringify(options));

                    var pqOptions = {};
                    esWebApiService.fetchStdZoom(zoomID, pqOptions)
                        .success(function(pq) {
                            // SME CHANGE THIS ONCE WE HAVE CORRECT PQ
                            if (pq.Count == -1) {
                                pq.Count = pq.Rows ? pq.Rows.length : 0;
                            }
                            // END tackling

                            options.success(pq);
                            $log.info("FETCHed ZOOM data for [", zoomID, "] with options ", JSON.stringify(options));
                        })
                        .error(function(err) {
                            options.error(err);
                        });
                }

            },
            schema: {
                data: "Rows",
                total: "Count"
            }
        }
        return new kendo.data.DataSource(xParam);
    }


    function prepareWebScroller(dsType, esWebApiService, $log, espqParams, esOptions) {
        var xParam = {
            transport: {
                read: function(options) {

                    var qParams = angular.isFunction(espqParams) ? espqParams() : espqParams;
                    $log.info("FETCHing PQ with PQParams ", JSON.stringify(qParams), " and gridoptions ", JSON.stringify(options));
                    var pqOptions = {};

                    if (options.data && options.data.page && options.data.pageSize) {
                        pqOptions.WithCount = true;
                        pqOptions.Page = options.data.page;
                        pqOptions.PageSize = options.data.pageSize
                    }

                    var executeParams = qParams.Params;
                    if (executeParams instanceof ESParamValues) {
                        executeParams = executeParams.getExecuteVals();
                    }


                    esWebApiService.fetchPublicQuery(qParams.GroupID, qParams.FilterID, pqOptions, executeParams)
                        .success(function(pq) {

                            if (!angular.isDefined(pq.Rows)) {
                                pq.Rows = [];
                                pq.Count = 0;
                            }

                            if (!angular.isDefined(pq.Count)) {
                                pq.Count = -1;
                            }

                            options.success(pq);
                            $log.info("FETCHed PQ with PQParams ", JSON.stringify(executeParams), " and gridoptions ", JSON.stringify(options));
                        })
                        .error(function(err) {
                            $log.error("Error in DataSource ", err);
                            options.error(err);
                        });
                },

            },
            requestStart: function(e) {
                $log.info("request started ", e);
            },

            schema: {
                data: "Rows",
                total: "Count"
            }
        }

        if (esOptions) {
            angular.extend(xParam, esOptions);
        }

        if (dsType && dsType === "pivot") {
            return new kendo.data.PivotDataSource(xParam);
        } else {
            return new kendo.data.DataSource(xParam);
        }
    }

    /**
     * @ngdoc filter
     * @name es.Web.UI.filter:esTrustHtml
     *
     * @description
     * Creates `esGrid` Directive
     * * If `source` is not an object or array (inc. `null` and `undefined`), `source` is returned.
     * * If `source` is identical to 'destination' an exception will be thrown.
     *
     * @requires $sce
     */
    esWEBUI.filter('esTrustHtml', ['$sce',
        function($sce) {
            return function(text) {
                return $sce.trustAsHtml(text);
            };
        }
    ]);

    esWEBUI
        .filter('esParamTypeMapper', function() {
            var f = function(pParam) {
                if (!pParam) {
                    return "";
                }

                var pt = pParam.parameterType.toLowerCase()

                //ESDateRange

                if (pt.indexOf("entersoft.framework.platform.esdaterange, queryprocess") == 0) {
                    return "esParamDateRange";
                }

                //ESNumeric
                if (pt.indexOf("entersoft.framework.platform.esnumeric") == 0) {
                    return "esParamAdvancedNumeric";
                }

                //ESString
                if (pt.indexOf("entersoft.framework.platform.esstring, queryprocess") == 0) {
                    return "esParamAdvancedString";
                }

                // Numeric (Integer or Decimal)
                if (pt.indexOf("system.string, mscorlib") == 0) {
                    switch (pParam.controlType) {
                        case 1:
                            {
                                return "esParamNumeric";
                            }
                            break;
                        case 2:
                            {
                                return "esParamNumeric";
                            }
                            break;
                    }
                }


                //case Enum 
                if (pParam.enumList && (pParam.enumList.length > 1)) {
                    if (pParam.enumOptionAll) {
                        return "esParamMultiEnum";
                    } else {
                        return "esParamEnum";
                    }
                }

                if (pParam.invSelectedMasterTable) {
                    if (pParam.invSelectedMasterTable[4] == "Z") {
                        if (pParam.multiValued) {
                            return "esParamMultiZoom";
                        } else {
                            return "esParamZoom";
                        }
                    } else {
                        return "esParamText";
                    }
                }

                return "esParamText";

            };


            return f;
        })
        /**
         * @ngdoc directive
         * @name es.Web.UI.directive:esGrid
         * @requires es.Services.Web.esWebApi Entersoft AngularJS WEB API for Entersoft Application Server
         * @requires es.Web.UI.esUIHelper
         * @requires $log
         * @restrict AE
         * @param {template} esGroupId The Entersoft Public Query Group ID
         * @param {template} esFilterId The Entersoft Public Query Filter ID
         * @param {esGridInfoOptions=} esGridOptions should grid options are already available you can explicitly assign
         * @param {object=} esExecuteParams Params object that will be used when executing the public query
         *
         * @description
         * This directive is responsible to render the html for the presentation of the results / data of an Entersoft Public Query.
         * The esGrid generates a Telerik kendo-grid web ui element {@link http://docs.telerik.com/KENDO-UI/api/javascript/ui/grid kendo-grid}.
         * 
         * In order to instantiate an esGrid with an Angular application, you have to provide the parameters esGroupId and esFilterId are required.
         * These two parameters along with esExecuteParams will be supplied to the {@link es.Services.Web.esWebApi}
         */
        .directive('esGrid', ['esWebApi', 'esUIHelper', '$log', function(esWebApiService, esWebUIHelper, $log) {
            return {
                restrict: 'AE',
                scope: {
                    esGroupId: "=",
                    esFilterId: "=",
                    esExecuteParams: "=",
                    esGridOptions: "=",
                },
                templateUrl: function(element, attrs) {
                    $log.info("Parameter element = ", element, " Parameter attrs = ", attrs);
                    return "src/partials/esGrid.html";
                },
                link: function(scope, iElement, iAttrs) {
                    if (!scope.esGroupId || !scope.esFilterId) {
                        throw "You must set GroupID and FilterID for esgrid to work";
                    }


                    if (!scope.esGridOptions && !iAttrs.esGridOptions) {
                        // Now esGridOption explicitly assigned so ask the server 
                        esWebApiService.fetchPublicQueryInfo(scope.esGroupId, scope.esFilterId)
                            .success(function(ret) {
                                var p1 = ret;
                                var p2 = esWebUIHelper.winGridInfoToESGridInfo(scope.esGroupId, scope.esFilterId, p1);
                                scope.esGridOptions = esWebUIHelper.esGridInfoToKInfo(esWebApiService, scope.esGroupId, scope.esFilterId, scope.esExecuteParams, p2);
                            });
                    }
                }
            };
        }])
        /**
         * @ngdoc directive
         * @name es.Web.UI.directive:esParam
         * @element div
         * @function
         *
         * @description
         * esGrid esParam
         *
         * 
         */
        .directive('esParam', ['$log', 'esWebApi', 'esUIHelper', function($log, esWebApiService, esWebUIHelper) {
            return {
                restrict: 'AE',
                scope: {
                    esParamDef: "=",
                    esParamVal: "=",
                    esType: "="
                },
                template: '<div ng-include src="\'src/partials/\'+esType+\'.html\'"></div>',
                link: function(scope, iElement, iAttrs) {

                    if (!scope.esParamDef) {
                        throw "You must set a param";
                    }

                    scope.esWebUIHelper = esWebUIHelper;
                    scope.esWebApiService = esWebApiService;

                    if (scope.esParamDef.invSelectedMasterTable) {
                        scope.esParamLookupDS = prepareStdZoom($log, scope.esParamDef.invSelectedMasterTable, esWebApiService);
                    }

                    // Case Date Range
                    if (scope.esParamDef.controlType == 6 || scope.esParamDef.controlType == 20) {
                        scope.dateRangeOptions = esWebUIHelper.getesDateRangeOptions(scope.esParamDef.controlType);
                        scope.dateRangeResolution = function() {
                            return "Hello World, I am parameter " + scope.esParamDef.caption;
                        }
                    }
                }
            };
        }])
        /**
         * @ngdoc directive
         * @name es.Web.UI.directive:esWebPq
         * @element div
         * @function
         *
         * @description
         * esGrid esWebPq
         *
         * 
         */
        .directive('esWebPq', ['$log', 'esWebApi', 'esUIHelper', function($log, esWebApiService, esWebUIHelper) {
            return {
                restrict: 'AE',
                scope: {
                    esGroupId: "=",
                    esFilterId: "=",
                    esGridOptions: "=",
                    esParamsValues: "=",
                },
                templateUrl: function(element, attrs) {
                    $log.info("Parameter element = ", element, " Parameter attrs = ", attrs);
                    return "src/partials/esWebPQ.html";
                },
                link: function(scope, iElement, iAttrs) {
                    if (!scope.esGroupId || !scope.esFilterId) {
                        throw "You must set the pair es-group-id and es-filter-id attrs";
                    }

                    esWebApiService.fetchPublicQueryInfo(scope.esGroupId, scope.esFilterId)
                        .success(function(ret) {
                            var v = esWebUIHelper.winGridInfoToESGridInfo(scope.esGroupId, scope.esFilterId, ret);
                            scope.esParamsValues = v.defaultValues;
                            scope.esParamsDef = v.params;
                            scope.esGridOptions = esWebUIHelper.esGridInfoToKInfo(esWebApiService, scope.esGroupId, scope.esFilterId, scope.esParamsValues, v);
                        });
                }
            };
        }])
        /**
         * @ngdoc directive
         * @name es.Web.UI.directive:esParamsPanel
         * @element div
         * @function
         *
         * @description
         * Resize textarea automatically to the size of its text content.
         *
         * 
         */
        .directive('esParamsPanel', ['$log', 'esWebApi', 'esUIHelper', function($log, esWebApiService, esWebUIHelper) {
            return {
                restrict: 'AE',
                scope: {
                    esParamsDef: '=',
                    esPqInfo: '=',
                    esParamsValues: '=',
                    esGroupId: "=",
                    esFilterId: "=",
                },
                templateUrl: function(element, attrs) {
                    $log.info("Parameter element = ", element, " Parameter attrs = ", attrs);
                    return "src/partials/esParams.html";
                },
                link: function(scope, iElement, iAttrs) {
                    if (!iAttrs.esParamsDef && !iAttrs.esPqInfo && (!scope.esGroupId || !scope.esFilterId)) {
                        throw "You must set either the es-params-def or ea-pq-info or the pair es-group-id and es-filter-id attrs";
                    }

                    if (!iAttrs.esParamsDef) {
                        if (!iAttrs.esPqInfo) {
                            // we are given groupid and filterid =>
                            // we must retrieve pqinfo on owr own
                            esWebApiService.fetchPublicQueryInfo(scope.esGroupId, scope.esFilterId)
                                .success(function(ret) {
                                    var v = esWebUIHelper.winGridInfoToESGridInfo(scope.esGroupId, scope.esFilterId, ret);
                                    scope.esParamsValues = v.defaultValues;
                                    scope.esParamsDef = v.params;
                                });
                        } else {
                            scope.esParamDef = esPqInfo.params;
                        }
                    }
                }
            };
        }]);

    /**
     * @ngdoc service
     * @name es.Web.UI.esUIHelper
     * @description
     * # esUIHelper
     * esUIHelper addons.
     */
    esWEBUI.factory('esUIHelper', ['esWebApi', '$log',
        function(esWebApiService, $log) {

            function esColToKCol(esGridInfo, esCol) {
                var tCol = {
                    field: esCol.field,
                    title: esCol.title,
                    width: esCol.width,
                    attributes: esCol.attributes,
                    values: esCol.enumValues,

                }

                if (esCol.formatString && esCol.formatString != "") {
                    tCol.format = "{0:" + esCol.formatString + "}";
                }
                return tCol;
            }

            function esGridInfoToKInfo(esWebApiService, esGroupId, esFilterId, executeParams, esGridInfo) {
                var grdopt = {
                    pageable: {
                        refresh: true
                    },
                    sortable: true,
                    filterable: true,
                    resizable: true,
                    toolbar: ["excel"],
                    excel: {
                        allPages: true,
                        fileName: esGroupId + "-" + esFilterId + ".xlsx",
                        filterable: true
                    }
                };

                var kdsoptions = {
                    serverFiltering: true,
                    serverPaging: true,
                    pageSize: 20
                };

                grdopt.columns = esGridInfo.columns;

                grdopt.dataSource = prepareWebScroller(null, esWebApiService, $log, function() {
                    return {
                        GroupID: esGroupId,
                        FilterID: esFilterId,
                        Params: executeParams
                    }
                }, kdsoptions);

                return grdopt;
            }

            function winColToESCol(inGroupID, inFilterID, gridexInfo, jCol) {
                var esCol = {
                    AA: undefined,
                    field: undefined,
                    title: undefined,
                    width: undefined,
                    visible: undefined,
                    attributes: undefined,
                    enumValues: undefined,
                    formatString: undefined,
                };

                esCol.AA = parseInt(jCol.AA);
                esCol.field = jCol.ColName;
                esCol.title = jCol.Caption;
                esCol.formatString = jCol.FormatString;
                esCol.visible = (jCol.Visible == "true");

                if (jCol.TextAlignment == "3") {
                    esCol.attributes = {
                        style: "text-align: right;"
                    };
                }

                //Enum Column
                if (jCol.EditType == "5") {
                    var l1 = _.sortBy(_.filter(gridexInfo.ValueList, function(x) {
                        var v = x.ColName == jCol.ColName;
                        v = v && (typeof x.Value != 'undefined');
                        v = v && x.fFilterID == inFilterID;
                        return v;
                    }), function(x) {
                        return !isNaN(x.Value) ? parseInt(x.Value) : null;
                    });
                    var l2 = _.map(l1, function(x) {
                        return {
                            text: x.Caption,
                            value: !isNaN(x.Value) ? parseInt(x.Value) : null
                        };
                    });

                    if (l2 && l2.length) {
                        esCol.enumValues = l2;
                    }
                }
                return esCol;
            }

            //here 
            function dateEval(pInfo, expr) {
                var SpecificDate = "SpecificDate";
                var Month = "Month";
                var SixMonth = "SixMonth";
                var Week = "Week";
                var Year = "Year";
                var Quarter = "Quarter";
                var Day = "Day";

                function isActualDate(v) {
                    return v && v != "1753/01/01" && v != "9999/01/01";
                }

                var dVal = eval(expr.replace(/#/g, '"'));
                var esdate = new ESDateParamVal(pInfo.id);

                // Specific Date
                var mD = moment(dVal, "YYYY/MM/DD");
                if (!dVal.fromType && !dVal.toType && !dVal.fromD && !dVal.toD && mD.isValid()) {
                    esdate.paramValue.dRange = "1";
                    esdate.paramValue.fromD = mD.toDate();
                    return esdate;
                }

                //From Specific Date To Specific Date
                if (dVal.fromType == SpecificDate && isActualDate(dVal.fromD) && dVal.toType == SpecificDate && isActualDate(dVal.toD)) {
                    esdate.paramValue.dRange = "0";
                    esdate.paramValue.fromD = new Date(dVal.fromD);
                    esdate.paramValue.toD = new Date(dVal.toD);
                    return esdate;
                }

                //From Specific Date To Specific Date
                if (dVal.fromType == SpecificDate && isActualDate(dVal.fromD)) {
                    esdate.paramValue.dRange = "1";
                    esdate.paramValue.fromD = new Date(dVal.fromD);
                    return esdate;
                }

                // all toher cases of esdaterange
                esdate.paramValue.dRange = expr;
                return esdate;
            }

            function esEval(pInfo, expr) {
                var EQ = {
                    oper: "EQ",
                    paramID: pInfo.id
                };
                var GE = {
                    oper: "GE",
                    paramID: pInfo.id
                };
                var GT = {
                    oper: "GT",
                    paramID: pInfo.id
                };
                var LE = {
                    oper: "LE",
                    paramID: pInfo.id
                };
                var LT = {
                    oper: "LT",
                    paramID: pInfo.id
                };
                var NE = {
                    oper: "NE",
                    paramID: pInfo.id
                };
                var RANGE = {
                    oper: "RANGE",
                    paramID: pInfo.id
                };
                var NULL = {
                    oper: "NULL",
                    paramID: pInfo.id
                };
                var NOTNULL = {
                    oper: "NOTNULL",
                    paramID: pInfo.id
                };
                return eval(expr);
            }

            function ESNumeric(inArg, val, val2) {
                var k = {
                    value: !isNaN(val) ? parseInt(val) : null,
                    valueTo: !isNaN(val2) ? parseInt(val2) : null,
                    oper: inArg.oper || "EQ"
                };
                return new ESNumericParamVal(inArg.paramID, k);
            }

            function ESString(inArg, val, val2) {
                var k = {
                    value: val,
                    valueTo: val2,
                    oper: inArg.oper || "EQ"
                };
                return new ESStringParamVal(inArg.paramID, k);
            }

            function ESDateRange(fromType, fromD, toType, toD) {
                return {
                    "fromType": fromType,
                    "fromD": fromD,
                    "toType": toType,
                    "toD": toD
                }
            }

            function getEsParamVal(esParamInfo, dx) {
                var ps = esParamInfo.parameterType.toLowerCase();

                //ESNumeric
                if (ps.indexOf("entersoft.framework.platform.esnumeric") == 0) {
                    if (!dx || dx.length == 0) {
                        return new ESNumericParamVal(esParamInfo.id, {
                            oper: "EQ",
                            value: 0
                        });
                    }
                    return esEval(esParamInfo, dx[0].Value);
                }

                //ESDateRange
                if (ps.indexOf("entersoft.framework.platform.esdaterange, queryprocess") == 0) {
                    if (!dx || dx.length == 0) {
                        return new ESDateParamVal(esParamInfo.id, esParamInfo.controlType == 6 ? null : {
                            dRange: "ESDateRange(FiscalPeriod, 0)",
                            fromD: null,
                            toD: null
                        });
                    }
                    return dateEval(esParamInfo, dx[0].Value);
                }

                //ESString
                if (ps.indexOf("entersoft.framework.platform.esstring, queryprocess") == 0) {
                    if (!dx || dx.length == 0) {
                        return new ESStringParamVal(esParamInfo.id, {
                            oper: "EQ",
                            value: null
                        });
                    }

                    return esEval(esParamInfo, dx[0].Value);
                }

                //Not set
                if (!dx || dx.length == 0) {
                    return new ESParamVal(esParamInfo.id, null);
                }

                var processedVals = _.map(dx, function(k) {
                    return processStrToken(esParamInfo, k.Value);
                });

                if (processedVals.length == 1) {
                    processedVals = processedVals[0];
                }
                return new ESParamVal(esParamInfo.id, processedVals);
            }

            function processStrToken(esParamInfo, val) {
                if (!esParamInfo) {
                    return val;
                }

                var ps = esParamInfo.parameterType.toLowerCase();
                if (ps.indexOf("system.byte") != -1 || ps.indexOf("system.int") != -1) {
                    return parseInt(val);
                }

                if (esParamInfo.enumList && esParamInfo.enumList.length > 1) {
                    return parseInt(val);
                }

                return val;
            }

            function winParamInfoToesParamInfo(winParamInfo, gridexInfo) {
                if (!winParamInfo) {
                    return null;
                }

                var esParamInfo = {
                    id: undefined,
                    aa: undefined,
                    caption: undefined,
                    toolTip: undefined,
                    controlType: undefined,
                    parameterType: undefined,
                    precision: undefined,
                    multiValued: undefined,
                    visible: undefined,
                    required: undefined,
                    oDSTag: undefined,
                    formatStrng: undefined,
                    tags: undefined,
                    visibility: undefined,
                    invSelectedMasterTable: undefined,
                    invSelectedMasterField: undefined,
                    invTableMappings: undefined,
                    defaultValues: undefined,
                    enumOptionAll: undefined,
                    enumList: undefined
                };

                esParamInfo.id = winParamInfo.ID;
                esParamInfo.aa = parseInt(winParamInfo.AA);
                esParamInfo.caption = winParamInfo.Caption;
                esParamInfo.toolTip = winParamInfo.Tooltip;
                esParamInfo.controlType = parseInt(winParamInfo.ControlType);
                esParamInfo.parameterType = winParamInfo.ParameterType;
                esParamInfo.precision = parseInt(winParamInfo.Precision);
                esParamInfo.multiValued = winParamInfo.MultiValued == "true";
                esParamInfo.visible = winParamInfo.Visible == "true";
                esParamInfo.required = winParamInfo.Required == "true";
                esParamInfo.oDSTag = winParamInfo.ODSTag;
                esParamInfo.tags = winParamInfo.Tags;
                esParamInfo.visibility = parseInt(winParamInfo.Visibility);
                esParamInfo.invSelectedMasterTable = winParamInfo.InvSelectedMasterTable;
                esParamInfo.invSelectedMasterField = winParamInfo.InvSelectedMasterField;
                esParamInfo.invTableMappings = winParamInfo.InvTableMappings;

                esParamInfo.enumOptionAll = winParamInfo.EnumOptionAll;
                var enmList = _.sortBy(_.map(_.filter(gridexInfo.EnumItem, function(x) {
                    return x.fParamID == esParamInfo.id && (typeof x.ID != 'undefined');
                }), function(e) {
                    return {
                        text: esParamInfo.oDSTag ? e.Caption.substring(e.Caption.indexOf(".") + 1) : e.Caption,
                        value: !isNaN(e.ID) ? parseInt(e.ID) : null
                    };
                }), "value");

                esParamInfo.enumList = (enmList.length) ? enmList : undefined;


                var gxDef = gridexInfo.DefaultValue;
                if (gxDef && angular.isArray(gxDef)) {
                    var dx = _.where(gxDef, {
                        fParamID: esParamInfo.id
                    });

                    esParamInfo.defaultValues = getEsParamVal(esParamInfo, dx);
                }

                return esParamInfo;
            }

            function winGridInfoToESGridInfo(inGroupID, inFilterID, gridexInfo) {
                if (!gridexInfo || !gridexInfo.LayoutColumn) {
                    return null;
                }

                var fId = inFilterID.toLowerCase();
                var filterInfo = _.filter(gridexInfo.Filter, function(x) {
                    return x.ID.toLowerCase() == fId;
                });

                if (!filterInfo || filterInfo.length != 1) {
                    return null;
                }

                var esGridInfo = {
                    id: undefined,
                    caption: undefined,
                    rootTable: undefined,
                    selectedMasterTable: undefined,
                    selectedMasterField: undefined,
                    totalRow: undefined,
                    columnHeaders: undefined,
                    columnSetHeaders: undefined,
                    columnSetRowCount: undefined,
                    columnSetHeaderLines: undefined,
                    headerLines: undefined,
                    groupByBoxVisible: undefined,
                    filterLineVisible: false,
                    previewRow: undefined,
                    previewRowMember: undefined,
                    previewRowLines: undefined,
                    columns: undefined,
                    params: undefined,
                    defaultValues: undefined,
                };

                var z2 = _.map(_.filter(gridexInfo.LayoutColumn, function(y) {
                    return y.fFilterID.toLowerCase() == fId;
                }), function(x) {
                    return winColToESCol(inGroupID, inFilterID, gridexInfo, x);
                });

                var z1 = _.sortBy(_.where(z2, {
                    visible: true
                }), function(x) {
                    return parseInt(x.AA);
                });

                var z3 = _.map(z1, function(x) {
                    return esColToKCol(esGridInfo, x);
                });

                filterInfo = filterInfo[0];
                esGridInfo.id = filterInfo.ID;
                esGridInfo.caption = filterInfo.Caption;
                esGridInfo.rootTable = filterInfo.RootTable;
                esGridInfo.selectedMasterTable = filterInfo.SelectedMasterTable;
                esGridInfo.selectedMasterField = filterInfo.SelectedMasterField;
                esGridInfo.totalRow = filterInfo.TotalRow;
                esGridInfo.columnHeaders = filterInfo.ColumnHeaders;
                esGridInfo.columnSetHeaders = filterInfo.ColumnSetHeaders;
                esGridInfo.columnSetRowCount = filterInfo.ColumnSetRowCount;
                esGridInfo.columnSetHeaderLines = filterInfo.ColumnSetHeaderLines;
                esGridInfo.headerLines = filterInfo.HeaderLines;
                esGridInfo.groupByBoxVisible = filterInfo.GroupByBoxVisible;
                esGridInfo.filterLineVisible = filterInfo.FilterLineVisible;
                esGridInfo.previewRow = filterInfo.PreviewRow;
                esGridInfo.previewRowMember = filterInfo.PreviewRowMember;
                esGridInfo.previewRowLines = filterInfo.PreviewRowLines;

                esGridInfo.columns = z3;

                esGridInfo.params = _.map(gridexInfo.Param, function(p) {
                    return winParamInfoToesParamInfo(p, gridexInfo);
                });


                var dfValues = _.map(esGridInfo.params, function(p) {
                    return p.defaultValues;
                });

                esGridInfo.defaultValues = new ESParamValues(dfValues);
                return esGridInfo;
            }

            return ({
                ESParamVal: ESParamVal,
                ESNumericParamVal: ESNumericParamVal,
                ESStringParamVal: ESStringParamVal,
                ESDateParamVal: ESDateParamVal,

                winGridInfoToESGridInfo: winGridInfoToESGridInfo,
                winColToESCol: winColToESCol,
                esColToKCol: esColToKCol,
                esGridInfoToKInfo: esGridInfoToKInfo,
                getZoomDataSource: prepareStdZoom,
                getPQDataSource: prepareWebScroller,

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

            });
        }
    ]);

})();
