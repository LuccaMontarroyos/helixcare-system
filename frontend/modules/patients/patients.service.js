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

    this.createPatient = function(patientData) {
        var deferred = $q.defer();
        $http.post(API_URL, patientData)
            .then(function(response) { deferred.resolve(response.data); })
            .catch(function(error) { deferred.reject(error.data || error); });
        return deferred.promise;
    };

    this.uploadAvatar = function(patientId, file) {
        var deferred = $q.defer();
        
        var formData = new FormData();
        formData.append('file', file);

        $http.post(API_URL + '/' + patientId + '/avatar', formData, {
            transformRequest: angular.identity,
            headers: { 'Content-Type': undefined }
        })
        .then(function(response) { deferred.resolve(response.data); })
        .catch(function(error) { deferred.reject(error.data || error); });

        return deferred.promise;
    };
}]);