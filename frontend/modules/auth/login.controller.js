angular.module('helixcare.auth')
.controller('LoginController', ['$scope', '$state', 'AuthService', function($scope, $state, AuthService) {
    
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
                console.log("Bem-vindo, " + user.role);
                $state.go('dashboard');
            })
            .catch(function(error) {
                $scope.errorMessage = error.message || "Credenciais inválidas. Tente novamente.";
            })
            .finally(function() {
                $scope.isLoading = false;
            });
    };
}]);