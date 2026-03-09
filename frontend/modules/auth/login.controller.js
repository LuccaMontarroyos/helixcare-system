angular.module('helixcare.auth')
.controller('LoginController', ['$scope', '$state', 'AuthService', 'ToastService', function($scope, $state, AuthService, ToastService) {
    
    $scope.credentials = {
        email: '',
        password: ''
    };
    
    $scope.isLoading = false;

    $scope.submitLogin = function() {
        if (!$scope.credentials.email || !$scope.credentials.password) {
            ToastService.warning("Por favor, preencha todos os campos.", "Campos Vazios");
            return;
        }

        $scope.isLoading = true;

        AuthService.login($scope.credentials)
            .then(function(user) {
                ToastService.success("Autenticação realizada com sucesso.", "Bem-vindo");
                $state.go('dashboard');
            })
            .catch(function(error) {
                if (!error) {
                    ToastService.error("Servidor indisponível. Verifique sua conexão ou se a API está online.", "Falha de Rede");
                    return;
                }

                var msg = error.message || error.error || "Credenciais inválidas. Tente novamente.";
                ToastService.error(msg, "Falha no Login");
            })
            .finally(function() {
                $scope.isLoading = false;
            });
    };
}]);