angular.module("helixcare.patients").controller("PatientDetailController", [
    "$scope",
    "$stateParams",
    "$state",
    "PatientsService",
    "ToastService",
    function ($scope, $stateParams, $state, PatientsService, ToastService) {
        
        $scope.patient = null;
        $scope.isLoading = true;
        $scope.patientAge = 0;
        
        $scope.activeTab = 'RESUMO'; 
        
        $scope.setTab = function(tabName) {
            $scope.activeTab = tabName;
        };

        function calculateAge(birthDateString) {
            if (!birthDateString) return 0;
            var today = new Date();
            var birthDate = new Date(birthDateString);
            var age = today.getFullYear() - birthDate.getFullYear();
            var m = today.getMonth() - birthDate.getMonth();

            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        }

        $scope.init = function() {
            var patientId = $stateParams.id;
            
            if (!patientId) {
                ToastService.error("ID do paciente não fornecido.");
                $state.go('patients');
                return;
            }

            PatientsService.getPatientById(patientId)
                .then(function(data) {
                    $scope.patient = data;
                    $scope.patientAge = calculateAge(data.birth_date);
                })
                .catch(function(err) {
                    console.error("Erro ao buscar paciente:", err);
                    ToastService.error("Erro ao carregar dados do paciente.");
                    $state.go('patients');
                })
                .finally(function() {
                    $scope.isLoading = false;
                });
        };

        $scope.init();
    }
]);