angular.module('helixcare')
.run(['$rootScope', '$state', 'AuthService', function($rootScope, $state, AuthService) {
    
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        
        var requireAuth = toState.data && toState.data.requireAuth;
        var allowedRoles = toState.data && toState.data.allowedRoles;
        var isAuthenticated = AuthService.isAuthenticated();

        if (requireAuth && !isAuthenticated) {
            event.preventDefault();
            $state.go('login');
            return;
        }

        if (toState.name === 'login' && isAuthenticated) {
            event.preventDefault();
            $state.go('appointments');
            return;
        }

        if (requireAuth && allowedRoles && allowedRoles.length > 0) {
            if (!AuthService.hasAnyRole(allowedRoles)) {
                event.preventDefault();
                console.warn('Acesso Negado: Seu cargo não permite acessar esta rota.');
                
                if (fromState.name && fromState.name !== '^') {
                } else {
                    $state.go('appointments');
                }
            }
        }
    });
}]);