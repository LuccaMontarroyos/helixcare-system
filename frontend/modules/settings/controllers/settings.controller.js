angular.module('helixcare.settings')
.controller('SettingsController', [
    '$scope', '$rootScope', 'AuthService', 'SettingsService', 'ToastService',
    function($scope, $rootScope, AuthService, SettingsService, ToastService) {
        
        $rootScope.pageSpecificTitle = 'Configurações da Conta';
        
        $scope.isLoading = true;
        $scope.isSaving = false;
        $scope.activeTab = 'PROFILE';
        $scope.currentUser = AuthService.getCurrentUser();
        $scope.profileData = {};

        $scope.setTab = function(tab) {
            $scope.activeTab = tab;
        };

        $scope.init = function() {
            if (!$scope.currentUser || !$scope.currentUser.id) {
                ToastService.error("Sessão inválida.");
                return;
            }

            SettingsService.getUserProfile($scope.currentUser.id)
                .then(function(data) {
                    $scope.profileData = angular.copy(data);
                })
                .catch(function(err) {
                    $scope.profileData = angular.copy($scope.currentUser);
                    console.warn("Usando dados de cache local. Erro na API:", err);
                })
                .finally(function() {
                    $scope.isLoading = false;
                });
        };

        $scope.saveProfile = function() {
            $scope.isSaving = true;
            
            var payload = {
                name: $scope.profileData.name,
                phone: $scope.profileData.phone,
                specialty: $scope.profileData.specialty,

            };

            SettingsService.updateProfile($scope.currentUser.id, payload)
                .then(function(updatedUser) {
                    ToastService.success("Perfil atualizado com sucesso!");
                    
                    var localUser = AuthService.getCurrentUser();
                    localUser.name = updatedUser.name || payload.name;
                    window.localStorage.setItem('hc_user', angular.toJson(localUser));
                })
                .catch(function(err) {
                    var msg = err.message || err.error || "Falha ao atualizar perfil.";
                    if (angular.isArray(msg)) msg = msg.join('<br>');
                    ToastService.error(msg);
                })
                .finally(function() {
                    $scope.isSaving = false;
                });
        };

        $scope.getRoleName = function(role) {
            var roles = {
                'ADMIN': 'Administrador Geral',
                'DOCTOR': 'Médico(a) Especialista',
                'RECEPTIONIST': 'Recepcionista',
                'NURSE': 'Enfermeiro(a)',
                'LAB_TECHNICIAN': 'Técnico de Laboratório'
            };
            return roles[role] || 'Staff';
        };

        $scope.isUploadingAvatar = false;

        $scope.uploadAvatar = function(element) {
            if (!element.files || element.files.length === 0) return;
            
            var file = element.files[0];
            $scope.isUploadingAvatar = true;
            $scope.$apply();

            SettingsService.uploadAvatar($scope.currentUser.id, file)
                .then(function(updatedUser) {
                    ToastService.success("Foto de perfil atualizada com sucesso!");
                    
                    var newAvatarUrl = updatedUser.avatar_url || updatedUser.data.avatar_url;
                    $scope.profileData.avatar_url = newAvatarUrl;
                    
                    var localUser = AuthService.getCurrentUser();
                    localUser.avatar_url = newAvatarUrl;
                    window.localStorage.setItem('hc_user', angular.toJson(localUser));
                })
                .catch(function(err) {
                    var msg = err.message || err.error || "Falha ao enviar a imagem.";
                    ToastService.error(msg);
                })
                .finally(function() {
                    $scope.isUploadingAvatar = false;
                    element.value = '';
                    $scope.$apply();
                });
        };

        $scope.init();
    }
]);