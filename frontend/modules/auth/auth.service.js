angular.module('helixcare.auth')
.service('AuthService', ['$http', '$window', '$q', function($http, $window, $q) {
    var API_URL = 'http://localhost:3000/api/v1/auth';

    this.login = function(credentials) {
        var deferred = $q.defer();

        $http.post(API_URL + '/login', credentials)
            .success(function(response) {
                console.log("Payload de Login recebido do backend:", response);
                var token = response.access_token || response.token;
                var user = response.user || { role: response.role };
                if (token) {
                    $window.localStorage.setItem('hc_token', token);
                    $window.localStorage.setItem('hc_user', JSON.stringify(user));
                    deferred.resolve(user);
                } else {
                    deferred.reject({ message: "Token não encontrado na resposta do servidor." });
                }
            })
            .error(function(err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    this.logout = function() {
        $window.localStorage.removeItem('hc_token');
        $window.localStorage.removeItem('hc_user');
    };

    this.getCurrentUser = function() {
        var user = $window.localStorage.getItem('hc_user');
        return user ? JSON.parse(user) : null;
    };

    this.isAuthenticated = function() {
        return !!$window.localStorage.getItem('hc_token');
    };

    this.getUserRole = function() {
        var user = this.getCurrentUser();
        return user ? user.role : null;
    };
    
    this.hasAnyRole = function(allowedRoles) {
        if (!allowedRoles || allowedRoles.length === 0) return true;
        
        var userRole = this.getUserRole();
        if (!userRole) return false;
    
        return allowedRoles.indexOf(userRole) !== -1;
    };
}]);