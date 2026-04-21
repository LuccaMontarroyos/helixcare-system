angular.module('helixcare.medicalRecords')
.controller('MedicalRecordsHubController', [
    '$scope', '$rootScope', '$state', 'AppointmentsService', 'AuthService', 'ToastService',
    function($scope, $rootScope, $state, AppointmentsService, AuthService, ToastService) {
        
        $rootScope.pageSpecificTitle = 'Fila de Atendimento'; 
        
        $scope.isLoading = true;
        $scope.waitingPatients = [];
        var currentUser = AuthService.getCurrentUser();

        $scope.init = function() {
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0');
            var yyyy = today.getFullYear();
            var dateString = yyyy + '-' + mm + '-' + dd;

            var filters = {
                date: dateString,
                status: 'WAITING'
            };

            if (currentUser && currentUser.role === 'DOCTOR') {
                filters.doctor_id = currentUser.id;
            }

            AppointmentsService.getAppointments(filters)
                .then(function(res) {
                    var appointments = res.items || res.data || res;
                    
                    appointments.sort(function(a, b) {
                        return new Date(a.appointment_date) - new Date(b.appointment_date);
                    });

                    $scope.waitingPatients = appointments;
                })
                .catch(function(err) {
                    ToastService.error("Falha ao carregar a fila de atendimento.");
                })
                .finally(function() {
                    $scope.isLoading = false;
                });
        };

        $scope.attendPatient = function(patientId, appointmentId) {
            var appt = null;
            for (var i = 0; i < $scope.waitingPatients.length; i++) {
                if ($scope.waitingPatients[i].id === appointmentId) {
                    appt = $scope.waitingPatients[i]; break;
                }
            }

            if (appt) {
                var payload = {
                    patient_id:       appt.patient ? appt.patient.id : appt.patient_id,
                    doctor_id:        appt.doctor  ? appt.doctor.id  : appt.doctor_id,
                    appointment_date: appt.appointment_date,
                    notes:            appt.notes || "",
                    status:           'IN_PROGRESS',
                };
                AppointmentsService.updateStatus(appointmentId, payload).catch(angular.noop);
            }

            $state.go('patient-medical-records', { patientId: patientId, appointmentId: appointmentId });
        };

        $scope.init();
    }
]);