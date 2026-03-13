angular.module('helixcare.medicalRecords')
.service('MedicalRecordsService', ['$http', '$q', function($http, $q) {
    var API_URL = 'http://localhost:3000/api/v1/medical-records';

    this.getPatientHistory = function(patientId, params) {
        var deferred = $q.defer();
        $http.get(API_URL + '/patient/' + patientId, { params: params })
            .then(function(res) { deferred.resolve(res.data); })
            .catch(function(err) { deferred.reject(err.data || err); });
        return deferred.promise;
    };

    this.createRecord = function(payload) {
        var deferred = $q.defer();
        $http.post(API_URL, payload)
            .then(function(res) { deferred.resolve(res.data); })
            .catch(function(err) { deferred.reject(err.data || err); });
        return deferred.promise;
    };

    this.updateRecord = function(id, payload) {
        var deferred = $q.defer();
        $http.put(API_URL + '/' + id, payload)
            .then(function(res) { deferred.resolve(res.data); })
            .catch(function(err) { deferred.reject(err.data || err); });
        return deferred.promise;
    };
    
    this.lockRecord = function(id) {
        var deferred = $q.defer();
        $http.post(API_URL + '/' + id + '/lock', {})
            .then(function(res) { deferred.resolve(res.data); })
            .catch(function(err) { deferred.reject(err.data || err); });
        return deferred.promise;
    };

    this.unlockRecord = function(id) {
        return $http.post(API_URL + '/' + id + '/unlock', {}); 
    };

    this.uploadAttachment = function(recordId, file) {
        var deferred = $q.defer();
        var formData = new FormData();
        formData.append('file', file);

        $http.post(API_URL + '/' + recordId + '/upload', formData, {
            transformRequest: angular.identity,
            headers: { 'Content-Type': undefined }
        })
        .then(function(res) { deferred.resolve(res.data); })
        .catch(function(err) { deferred.reject(err.data || err); });
        return deferred.promise;
    };
}]);