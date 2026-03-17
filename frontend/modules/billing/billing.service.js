angular.module('helixcare.billing')
.service('BillingService', ['$http', '$q', function($http, $q) {
    var API_URL = 'http://localhost:3000/api/v1/invoices';

    this.getInvoices = function(filters) {
        var deferred = $q.defer();
        $http.get(API_URL, { params: filters })
            .then(function(res) { deferred.resolve(res.data); })
            .catch(function(err) { deferred.reject(err.data || err); });
        return deferred.promise;
    };

    this.createInvoice = function(payload) {
        var deferred = $q.defer();
        $http.post(API_URL, payload)
            .then(function(res) { deferred.resolve(res.data); })
            .catch(function(err) { deferred.reject(err.data || err); });
        return deferred.promise;
    };

    this.updateStatus = function(id, payload) {
        var deferred = $q.defer();
        $http.put(API_URL + '/' + id + '/status', payload)
            .then(function(res) { deferred.resolve(res.data); })
            .catch(function(err) { deferred.reject(err.data || err); });
        return deferred.promise;
    };

    this.deleteInvoice = function(id) {
        var deferred = $q.defer();
        $http.delete(API_URL + '/' + id)
            .then(function(res) { deferred.resolve(res.data); })
            .catch(function(err) { deferred.reject(err.data || err); });
        return deferred.promise;
    };

    this.getInvoiceById = function(id) {
        var deferred = $q.defer();
        $http.get(API_URL + '/' + id)
            .then(function(res) { deferred.resolve(res.data); })
            .catch(function(err) { deferred.reject(err.data || err); });
        return deferred.promise;
    };
}]);