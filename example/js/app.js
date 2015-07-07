(function(angular) {
    var eskbApp = angular.module('smeApp', [

        /* angular modules */
        'ngRoute',
        'ngStorage',

        /* Entersoft AngularJS WEB API Provider */
        'es.Services.Web',
        'smeControllers'
    ]);

    eskbApp.config(['$logProvider',
        '$routeProvider',
        'es.Services.WebApiProvider',
        '$exceptionHandlerProvider',
        function($logProvider, $routeProvider, esWebApiServiceProvider, $exceptionHandlerProvider) {

            $routeProvider
                .when('/', {
                    templateUrl: 'login.html',
                    controller: 'loginCtrl'
                })
                .when('/login', {
                    templateUrl: 'login.html',
                    controller: 'loginCtrl'
                })
                .when('/properties', {
                    templateUrl: 'properties.html',
                    controller: 'propertiesCtrl'
                })
                .when('/pq', {
                    templateUrl: 'pq.html',
                    controller: 'pqCtrl'
                });

            $logProvider.addDefaultAppenders();
            $exceptionHandlerProvider.setPushToServer(true);
            $exceptionHandlerProvider.setLogServer("Azure");

            var subscriptionId = "";
            esWebApiServiceProvider.setSettings({
                //host: "eswebapialp.azurewebsites.net",
                //host: "eswebapi.entersoft.gr",
                host: "localhost/eswebapi",
                subscriptionId: subscriptionId,
                subscriptionPassword: "passx",
                allowUnsecureConnection: true
            });

            // $logProvider.addESWebApiAppender(esWebApiServiceProvider.getServerUrl(), subscriptionId);

        }
    ]);

})(window.angular);
