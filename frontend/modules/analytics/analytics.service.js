angular.module('helixcare.analytics')
.service('AnalyticsService', ['$http', '$q', function($http, $q) {
    var API_URL = 'http://localhost:3000/api/v1/analytics';

    this.getFinanceData = function(startDate, endDate) {
        var deferred = $q.defer();
        $http.get(API_URL + '/finance', { params: { start_date: startDate, end_date: endDate } })
            .then(function(res) { deferred.resolve(res.data); })
            .catch(function(err) { deferred.reject(err.data || err); });
        return deferred.promise;
    };

    this.getClinicalData = function(startDate, endDate) {
        var deferred = $q.defer();
        $http.get(API_URL + '/clinical', { params: { start_date: startDate, end_date: endDate } })
            .then(function(res) { deferred.resolve(res.data); })
            .catch(function(err) { deferred.reject(err.data || err); });
        return deferred.promise;
    };

    this.getExamsData = function(startDate, endDate) {
        var deferred = $q.defer();
        $http.get(API_URL + '/exams', { params: { start_date: startDate, end_date: endDate } })
            .then(function(res) { deferred.resolve(res.data); })
            .catch(function(err) { deferred.reject(err.data || err); });
        return deferred.promise;
    };
}]);