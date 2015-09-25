'use strict';

/* Controllers */

var smeControllers = angular.module('smeControllers', ['kendo.directives', 'underscore', 'es.Web.UI']);

smeControllers.controller('mainCtrl', ['$location', '$scope', '$log', 'esMessaging', 'esWebApi', 'esGlobals',
    function($location, $scope, $log, esMessaging, esWebApiService, esGlobals) {

        $scope.theGlobalUser = "";

        $scope.odscinfo = null;
        $scope.press = function() {
            esWebApiService.fetchOdsTableInfo("ESFICustomer").success(function(x) {
                $scope.odscinfo = x;
            });
        };

        esMessaging.subscribe("ES_HTTP_CORE_ERR", function(rejection, status) {
            var s = esGlobals.getUserMessage(rejection, status);
            $scope.esnotify.error(s);
        });

        esMessaging.subscribe("AUTH_CHANGED", function(esSession, b) {
            if (!b) {
                $scope.theGlobalUser = "Nobody";
                alert("You are nobody");
                return;
            }

            $scope.theGlobalUser = esSession.connectionModel.Name;

            alert("Welcome " + JSON.stringify(a));
        });
    }
]);

smeControllers.controller('loginCtrl', ['$location', '$rootScope', '$scope', '$log', 'esWebApi', 'esUIHelper', '_', 'esCache', 'esMessaging', 'esGlobals',
    function($location, $rootScope, $scope, $log, esWebApiService, esWebUIHelper, _, cache, esMessaging, esGlobals) {
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

        $scope.version = {};

        /* Date Range Sample Section */
        var x = function(p) {
            return "Hello World";
        };

        $scope.y = function() {
            return "Hi !!!";
        }


        $scope.onChange = function(kendoEvent) {
            if (!kendoEvent) {
                return;
            }
            //kendoEvent.sender.text(mapper(kendoEvent.sender.dataItem(), $scope.myDateVal));
        }

        $scope.myDateVal = new esWebUIHelper.ESDateParamVal("myP", {
            //dRange: 'ESDateRange(SpecificDate, #1753/01/01#, Day, 0)', ESDateRange(SpecificDate, #9999/01/01#, SpecificDate, #1753/01/01#)
            dRange: 'ESDateRange(SpecificDate, #9999/01/01#, SpecificDate, #1753/01/01#)',
            fromD: null,
            toD: null
        });


        /* End Section */

    }
]);

smeControllers.controller('propertiesCtrl', ['$location', '$scope', '$log', 'esWebApi', 'esUIHelper', '_', 'esCache', 'esMessaging', 'esGlobals',
    function($location, $scope, $log, esWebApiService, esWebUIHelper, _, cache, esMessaging, esGlobals) {

        $scope.getVersionInfo = function() {
            $scope.version = {};

            $scope.version.esAngularVersion = esGlobals.getVersion();

            esWebApiService.fetchServerCapabilities().then(function(data) {
                $scope.version.esWebAPIVersion = data.WebApiVersion;

                esWebApiService.fetchSessionInfo()
                    .success(function(data) {
                        $scope.version.esEBSVersion = data;
                    });
            });
        };

        $scope.getVersionInfo();
    }
]);

smeControllers.controller('examplesCtrl', ['$log', '$scope', 'esWebApi', 'esUIHelper', 'esGlobals',
    function($log, $scope, esWebApi, esWebUIHelper, esGlobals) {

        $scope.pGroup = "ESMMStockItem";
        $scope.pFilter = "ESMMStockItem_def";
        $scope.esWebAPI = esWebApi;

        $scope.uploadPic = function(myFile) {
            var okf = function(retFile) {
                $log.information("file uploaded ....");
            };

            var errf = function(response) {
                if (response.status > 0)
                    $scope.errorMsg = response.status + ': ' + response.data;
                else {
                    $scope.errorMsg = "Ooops something wnet wrong";
                }
                $log.error($scope.errorMsg);
            };

            var progressf = function(evt) {
                myFile.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
            };

            esWebApi.addES00Document("abcd", "fff", $scope.username, myFile, okf, errf, progressf);
        }

        //fetchPublicQueryInfo sample
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

        // fetchPublicQuery sample
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
                Name: "ao*"
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

        //fetchSessionInfo example
        $scope.fetchSessionInfo = function() {
            esWebApi.fetchSessionInfo()
                .then(function(ret) {
                    $scope.pSessionInfo = ret.data;
                }, function(err) {
                    $scope.pSessionInfo = err;
                });
        }

        //fetchODSTableInfo example
        $scope.fetchOdsTableInfo = function() {
            esWebApi.fetchOdsTableInfo($scope.odsID)
                .then(function(ret) {
                    $scope.pTableInfo = ret.data;
                }, function(err) {
                    $scope.pTableInfo = err;
                });
        }

        //fetchODSColumnInfo example
        $scope.fetchOdsColumnInfo = function() {
            esWebApi.fetchOdsColumnInfo($scope.odsID, $scope.odsColumnID)
                .then(function(ret) {
                    $scope.pColumnInfo = ret.data;
                }, function(err) {
                    $scope.pColumnInfo = err;
                });
        }

        //fetchOdsRelationInfo example
        $scope.fetchOdsRelationInfo = function() {
            esWebApi.fetchOdsRelationInfo($scope.odsID)
                .then(function(ret) {
                    $scope.pRelationInfo = ret.data;
                }, function(err) {
                    $scope.pRelationInfo = err;
                });
        }

        //fetchOdsMasterRelationsInfo example
        $scope.fetchOdsMasterRelationsInfo = function() {
            esWebApi.fetchOdsMasterRelationsInfo($scope.odsID, $scope.odsColumnID)
                .then(function(ret) {
                    $scope.pRelationInfo = ret.data;
                }, function(err) {
                    $scope.pRelationInfo = err;
                });
        }

        //fetchOdsDetailRelationsInfo example
        $scope.fetchOdsDetailRelationsInfo = function() {
            esWebApi.fetchOdsDetailRelationsInfo($scope.odsID, $scope.odsColumnID)
                .then(function(ret) {
                    $scope.pRelationInfo = ret.data;
                }, function(err) {
                    $scope.pRelationInfo = err;
                });
        }

        $scope.fetchServerCapabilities = function() {
            esWebApi.fetchServerCapabilities()
                .then(function(ret) {
                    $scope.pSrvCapabilities = ret;
                }, function(err) {
                    $scope.pSrvCapabilities = err;
                });
        }

        $scope.fetchUserSites = function() {
            esWebApi.fetchUserSites($scope.pUser)
                .then(function(ret) {
                    $scope.pUserSites = ret.data;
                }, function(err) {
                    $scope.pUserSites = err;
                });
        }

        $scope.fetchStdZoom = function() {
            var zoomOptions = {
                WithCount: false,
                Page: 300,
                PageSize: 5

            };
            esWebApi.fetchStdZoom($scope.pZoomID, zoomOptions)
                .then(function(ret) {
                    $scope.pZoomResults = ret.data;
                }, function(err) {
                    $scope.pZoomResults = err;
                });
        }

        //logout sample
        $scope.doLogout = function() {
            esWebApi.logout();
        };

        // fetchCompanyParam
        $scope.fetchCompanyParam = function() {
            esWebApi.fetchCompanyParam($scope.pCompanyParam)
                .then(function(x) {
                        $scope.pCompanyParamValue = x.data;
                    },
                    function(err) {
                        $scope.pCompanyParamValue = JSON.stringify(err);
                    });
        }

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

        //generic function for executing esWebApi functions that take no params
        $scope.voidgeneric = function() {

            var f = esWebApi[$scope.pMethod];
            if (!f) {
                $scope.pMethodResults = "Method [" + $scope.pMethod + "] not found";
                return;
            }

            var retVal = f();
            if (retVal.then) {
                retVal.then(function(x) {
                        $scope.pMethodResults = x;
                    },

                    function(err) {
                        $scope.pMethodResults = JSON.stringify(err);
                    });
            } else {
                $scope.pMethodResults = retVal;
            }

        };

        // fetchScroller sample
        $scope.fetchScroller = function() {
            var scroller_params = {
                Name: "a*"
            };
            esWebApi.fetchScroller($scope.pGroup, $scope.pFilter, scroller_params)
                .then(function(ret) {
                        $scope.pScrollerResults = ret.data;
                        $log.info(ret);
                    },
                    function(err) {
                        $scope.pScrollerResults = err;
                        $log.error(err);
                    });
        }

        // fetchSimpleScrollerRootTable sample
        $scope.fetchSimpleScrollerRootTable = function() {
            var scroller_params = {
                Name: "a*"
            };
            esWebApi.fetchSimpleScrollerRootTable($scope.pGroup, $scope.pFilter, scroller_params)
                .then(function(ret) {
                        $scope.pScrollerResults = ret.data;
                        $log.info(ret);
                    },
                    function(err) {
                        $scope.pScrollerResults = err;
                        $log.error(err);
                    });
        }

        $scope.ImagefetchEASWebAsset = function(options) {
            esWebApi.fetchEASWebAsset($scope.pAsset, options)
                .then(function(ret) {
                        $scope.pImageResults = ret.data;
                    },
                    function(err) {
                        alert(err);
                    });
        }

        $scope.TextfetchEASWebAsset = function(options) {
            esWebApi.fetchEASWebAsset($scope.pAsset, options)
                .then(function(ret) {
                        $scope.pTextResults = ret.data;
                    },
                    function(err) {
                        alert(err);
                    });
        }

        $scope.fetchEASWebAsset = function(options) {
            esWebApi.fetchEASWebAsset($scope.pAsset, options)
                .then(function(ret) {
                        $scope.pAssetResults = ret.data;

                        var sType = esGlobals.getMimeTypeForExt($scope.pAsset);
                        $log.info("File " + $scope.pAsset + " ===> " + sType);
                        var file = new Blob([ret.data], {
                            type: sType
                        });
                        //saveAs(file, "test.pdf");
                        var fU = URL.createObjectURL(file);
                        window.open(fU);
                    },
                    function(err) {
                        $scope.pAssetResults = err;
                    });
        }

        $scope.fetchES00DocumentByGID = function() {
            esWebApi.fetchES00DocumentByGID($scope.pES00Doc)
                .then(function(ret) {
                        $scope.pES00DocResults = ret.data;
                    },
                    function(err) {
                        $scope.pES00DocResults = err;
                    });
        }

        $scope.fetchES00DocumentByCode = function() {
            esWebApi.fetchES00DocumentByCode($scope.pES00Doc)
                .then(function(ret) {
                        $scope.pES00DocResults = ret.data;
                    },
                    function(err) {
                        $scope.pES00DocResults = err;
                    });
        }

        $scope.fetchES00DocumentsByEntityGID = function() {
            esWebApi.fetchES00DocumentsByEntityGID($scope.pES00Doc)
                .then(function(ret) {
                        $scope.pES00DocResults = ret.data;
                    },
                    function(err) {
                        $scope.pES00DocResults = err;
                    });
        }

        $scope.fetchES00DocumentBlobDataByGID = function() {
            esWebApi.fetchES00DocumentByGID($scope.pES00Doc)
                .then(function(ret) {
                        var esDoc = ret.data;
                        $scope.pAssetResults = esDoc;

                        esWebApi.fetchES00DocumentBlobDataByGID($scope.pES00Doc)
                            .then(function(ret) {
                                    var sType = esGlobals.getMimeTypeForExt(esDoc.FType);
                                    $log.info("File " + $scope.pAsset + " ===> " + sType);
                                    var file = new Blob([ret.data], {
                                        type: sType
                                    });
                                    //saveAs(file, "test.pdf");
                                    var fU = URL.createObjectURL(file);
                                    window.open(fU);
                                },
                                function(err) {
                                    $log.error(err);
                                });
                    },
                    function(err) {
                        $scope.pES00DocResults = err;
                    });
        }
    }
]);

smeControllers.controller('pqCtrl', ['$location', '$scope', '$log', 'esWebApi', 'esUIHelper', '_', 'esCache', 'esMessaging', 'esGlobals',
    function($location, $scope, $log, esWebApiService, esWebUIHelper, _, cache, esMessaging, esGlobals) {

        $scope.pqs = [{
            groupId: "ESFICustomer",
            filterId: "CS_CollectionPlanning",
            gridOptions: null,
            pVals: null
        }, {
            groupId: "ESFICustomer",
            filterId: "ESFITradeAccountCustomer_def",
            gridOptions: null,
            pVals: null
        }, {
            groupId: "ESMMStockItem",
            filterId: "ESMMStockItem_def",
            gridOptions: null,
            pVals: null
        }];


        $scope.doRun = function(pq) {
            pq.gridOptions.dataSource.read();

        }
    }
]);
