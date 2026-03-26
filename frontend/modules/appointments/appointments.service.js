angular.module('helixcare.appointments')
.service('AppointmentsService', ['$http', '$q', function($http, $q) {
    var API_URL = 'http://localhost:3000/api/v1/appointments';

    this.getAppointments = function(filters) {
        var deferred = $q.defer();
        $http.get(API_URL, { params: filters })
            .then(function(response) { deferred.resolve(response.data); })
            .catch(function(error) { deferred.reject(error.data || error); });
        return deferred.promise;
    };

    this.getAppointmentById = function(id) {
        var deferred = $q.defer();
        $http.get(API_URL + '/' + id)
            .then(function(response) { deferred.resolve(response.data); })
            .catch(function(error) { deferred.reject(error.data || error); });
        return deferred.promise;
    };

    this.createAppointment = function(payload) {
        var deferred = $q.defer();
        $http.post(API_URL, payload)
            .then(function(response) { deferred.resolve(response.data); })
            .catch(function(error) { deferred.reject(error.data || error); });
        return deferred.promise;
    };

    this.updateStatus = function(id, payload) {
        var deferred = $q.defer();
        $http.put(API_URL + '/' + id, payload)
            .then(function(response) { deferred.resolve(response.data); })
            .catch(function(error) { deferred.reject(error.data || error); });
        return deferred.promise;
    };

    this.updateAppointment = function(id, payload) {
        var deferred = $q.defer();
        $http.put(API_URL + '/' + id, payload)
            .then(function(response) { deferred.resolve(response.data); })
            .catch(function(error) { deferred.reject(error.data || error); });
        return deferred.promise;
    };

    this.deleteAppointment = function(id) {
        var deferred = $q.defer();
        $http.delete(API_URL + '/' + id)
            .then(function(response) { deferred.resolve(response.data); })
            .catch(function(error) { deferred.reject(error.data || error); });
        return deferred.promise;
    };

    this.searchUsers = function(searchTerm) {
        var deferred = $q.defer();
        $http.get('http://localhost:3000/api/v1/users', { params: { search: searchTerm } })
            .then(function(response) { deferred.resolve(response.data); })
            .catch(function(error) { deferred.reject(error.data || error); });
        return deferred.promise;
    };
}]);