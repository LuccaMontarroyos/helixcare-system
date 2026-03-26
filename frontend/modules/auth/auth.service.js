angular.module('helixcare.auth')
.service('AuthService', ['$http', '$window', '$q', function($http, $window, $q) {
    var API_URL = 'http://localhost:3000/api/v1/auth';

    var cachedUserStr = null;
    var cachedUserObj = null;

    this.login = function(credentials) {
        var deferred = $q.defer();

        $http.post(API_URL + '/login', credentials)
            .success(function(response) {
                var token = response.access_token || response.token;
                var user = response.user || { role: response.role, name: response.name };
                if (token) {
                    $window.localStorage.setItem('hc_token', token);
                    $window.localStorage.setItem('hc_user', JSON.stringify(user));
                    cachedUserStr = null;
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
        cachedUserStr = null;
        cachedUserObj = null;
    };

    this.getCurrentUser = function() {
        var userStr = $window.localStorage.getItem('hc_user');
        
        if (userStr === cachedUserStr) {
            return cachedUserObj;
        }
        
        cachedUserStr = userStr;
        cachedUserObj = userStr ? JSON.parse(userStr) : null;
        return cachedUserObj;
    };

    this.isAuthenticated = function() {
        var token = $window.localStorage.getItem('hc_token');
        if (!token) return false;

        try {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            var payload = JSON.parse(jsonPayload);

            var isExpired = payload.exp && (payload.exp * 1000) < Date.now();

            return !isExpired;
            
        } catch (error) {
            return false;
        }
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