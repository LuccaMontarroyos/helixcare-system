angular.module('helixcare')
.service('GlobalSearchService', ['$http', '$q', function($http, $q) {
    var API_URL = 'http://localhost:3000/api/v1/search';

    this.search = function(searchTerm) {
        var deferred = $q.defer();
        
        $http.get(API_URL, { params: { q: searchTerm } })
            .then(function(response) { deferred.resolve(response.data); })
            .catch(function(error) { deferred.reject(error.data || error); });
            
        return deferred.promise;
    };
}]);