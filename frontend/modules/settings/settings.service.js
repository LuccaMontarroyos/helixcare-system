angular.module('helixcare.settings')
.service('SettingsService', ['$http', '$q', function($http, $q) {
    var API_URL = 'http://localhost:3000/api/v1/users';

    this.getUserProfile = function(userId) {
        var deferred = $q.defer();
        $http.get(API_URL + '/' + userId)
            .then(function(res) { deferred.resolve(res.data); })
            .catch(function(err) { deferred.reject(err.data || err); });
        return deferred.promise;
    };

    this.updateProfile = function(userId, payload) {
        var deferred = $q.defer();
        $http.put(API_URL + '/' + userId, payload)
            .then(function(res) { deferred.resolve(res.data); })
            .catch(function(err) { deferred.reject(err.data || err); });
        return deferred.promise;
    };

    this.uploadAvatar = function(userId, file) {
        var deferred = $q.defer();
        var formData = new FormData();
        formData.append('file', file);

        $http.post(API_URL + '/' + userId + '/avatar', formData, {
            transformRequest: angular.identity,
            headers: { 'Content-Type': undefined }
        })
        .then(function(res) { deferred.resolve(res.data); })
        .catch(function(err) { deferred.reject(err.data || err); });

        return deferred.promise;
    };
}]);