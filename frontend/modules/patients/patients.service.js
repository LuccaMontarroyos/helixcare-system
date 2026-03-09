angular.module('helixcare.patients')
.service('PatientsService', ['$http', '$q', function($http, $q) {
    var API_URL = 'http://localhost:3000/api/v1/patients';

    this.getPatients = function(params) {
        var deferred = $q.defer();

        $http.get(API_URL, { params: params })
            .then(function(response) {
                deferred.resolve(response.data);
            })
            .catch(function(error) {
                deferred.reject(error.data || error);
            });

        return deferred.promise;
    };
}]);