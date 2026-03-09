angular.module('helixcare.patients')
.controller('PatientListController', ['$scope', 'PatientsService', function($scope, PatientsService) {
    
    $scope.patients = [];
    $scope.isLoading = true;
    
    $scope.isModalOpen = false;
    $scope.isSaving = false;
    $scope.patientForm = {};

    $scope.init = function() {
        $scope.loadPatients();
    };

    $scope.loadPatients = function() {
        PatientsService.getPatients().then(function(data) {
            $scope.patients = data.items || data;
        }).finally(function() {
            $scope.isLoading = false;
        });
    };

    $scope.openModal = function() {
        $scope.patientForm = {};
        $scope.isModalOpen = true;
    };

    $scope.closeModal = function() {
        $scope.isModalOpen = false;
    };

    $scope.savePatient = function() {
        $scope.isSaving = true;
        
        PatientsService.createPatient($scope.patientForm)
            .then(function(newPatient) {
                $scope.patients.unshift(newPatient); 
                $scope.closeModal();
            })
            .catch(function(error) {
                console.error("Erro ao salvar:", error);
                alert("Erro ao salvar paciente. Verifique os dados.");
            })
            .finally(function() {
                $scope.isSaving = false;
            });
    };

    $scope.init();
}]);