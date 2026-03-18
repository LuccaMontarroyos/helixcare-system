angular.module('helixcare.auth')
.controller('LoginController', ['$scope', '$state', 'AuthService', 'ToastService', function($scope, $state, AuthService, ToastService) {
    
    $scope.credentials = {
        email: '',
        password: ''
    };
    
    $scope.isLoading = false;
    $scope.errorMessage = null;

    $scope.submitLogin = function() {
        if (!$scope.credentials.email || !$scope.credentials.password) {
            $scope.errorMessage = "Por favor, preencha todos os campos.";
            return;
        }

        $scope.isLoading = true;
        $scope.errorMessage = null;

        AuthService.login($scope.credentials)
            .then(function(user) {
                ToastService.success("Bem-vindo(a) ao sistema, " + (user.name || ''), "Autenticado");
                $state.go('patients');
            })
            .catch(function(error) {
                if (!error) {
                    $scope.errorMessage = "Servidor indisponível. Verifique sua conexão.";
                } else {
                    $scope.errorMessage = error.message || error.error || "Credenciais inválidas. Tente novamente.";
                }
            })
            .finally(function() {
                $scope.isLoading = false;
            });
    };
}]);