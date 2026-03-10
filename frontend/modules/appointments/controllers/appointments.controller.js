angular.module('helixcare.appointments')
.controller('AppointmentsController', [
    '$scope',
    '$filter',
    'AppointmentsService',
    'PatientsService',
    'ToastService',
    function($scope, $filter, AppointmentsService, PatientsService, ToastService) {
        
        $scope.appointments = [];
        $scope.isLoading = true;
        
        $scope.filters = {
            page: 1,
            limit: 10,
            status: '',
            date: null,
            patient_id: '',
            doctor_id: ''
        };

        $scope.pagination = {
            totalItems: 0,
            totalPages: 1
        };

        $scope.typeahead = {
            patient: { term: '', results: [], isOpen: false, loading: false },
            doctor:  { term: '', results: [], isOpen: false, loading: false }
        };

        $scope.init = function() {
            $scope.loadAppointments();
        };

        $scope.applyFilters = function() {
            $scope.filters.page = 1;
            $scope.loadAppointments();
        };

        $scope.clearFilters = function() {
            $scope.filters.page = 1;
            $scope.filters.status = '';
            $scope.filters.date = null;
            $scope.filters.patient_id = '';
            $scope.filters.doctor_id = '';
            
            $scope.typeahead.patient.term = '';
            $scope.typeahead.doctor.term = '';
            
            $scope.loadAppointments();
        };

        function formatDateToISO(dateObj) {
            if (!dateObj) return null;
            var d = new Date(dateObj);
            var month = '' + (d.getMonth() + 1), day = '' + d.getDate(), year = d.getFullYear();
            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;
            return [year, month, day].join('-');
        }

        $scope.loadAppointments = function() {
            $scope.isLoading = true;
            
            var queryParams = angular.copy($scope.filters);
            
            if (queryParams.date) { queryParams.date = formatDateToISO(queryParams.date); }
            else { delete queryParams.date; }
            
            if (!queryParams.status) delete queryParams.status;
            if (!queryParams.patient_id) delete queryParams.patient_id;
            if (!queryParams.doctor_id) delete queryParams.doctor_id;

            AppointmentsService.getAppointments(queryParams)
                .then(function(res) {
                    $scope.appointments = res.items || res.data || res;
                    
                    if (res.meta) {
                        $scope.pagination.totalItems = res.meta.totalItems || res.meta.total;
                        $scope.pagination.totalPages = res.meta.totalPages || res.meta.last_page;
                    } else {
                        $scope.pagination.totalItems = $scope.appointments.length;
                        $scope.pagination.totalPages = 1;
                    }
                })
                .catch(function(err) {
                    ToastService.error("Falha ao carregar a agenda.");
                })
                .finally(function() {
                    $scope.isLoading = false;
                });
        };

        $scope.goToPage = function(pageNumber) {
            if (pageNumber < 1 || pageNumber > $scope.pagination.totalPages || pageNumber === $scope.filters.page) return;
            $scope.filters.page = pageNumber;
            $scope.loadAppointments();
        };

        $scope.getPageNumbers = function() {
            var pages = [];
            var maxPagesToShow = 5;
            var startPage = Math.max(1, $scope.filters.page - 2);
            var endPage = Math.min($scope.pagination.totalPages, startPage + maxPagesToShow - 1);
            
            startPage = Math.max(1, endPage - maxPagesToShow + 1);

            for (var i = startPage; i <= endPage; i++) { pages.push(i); }
            return pages;
        };

        $scope.changeStatus = function(appointment, newStatus) {
            var originalStatus = appointment.status;
            appointment.status = newStatus;

            AppointmentsService.updateStatus(appointment.id, newStatus)
                .then(function() {
                    ToastService.success("Status atualizado com sucesso.");
                })
                .catch(function(err) {
                    appointment.status = originalStatus;
                    ToastService.error("Falha ao atualizar status.");
                });
        };

        $scope.deleteAppointment = function(appointment) {
            if (!confirm("Tem certeza que deseja cancelar permanentemente este agendamento?")) return;

            AppointmentsService.deleteAppointment(appointment.id)
                .then(function() {
                    var index = $scope.appointments.indexOf(appointment);
                    if (index !== -1) $scope.appointments.splice(index, 1);
                    
                    $scope.pagination.totalItems--;
                    ToastService.success("Agendamento removido.");
                })
                .catch(function(err) {
                    ToastService.error(err.message || "Não foi possível remover o agendamento.");
                });
        };

        $scope.getStatusConfig = function(status) {
            var config = {
                'SCHEDULED': { class: 'bg-info/15 text-info', icon: 'schedule', text: 'Agendado' },
                'CONFIRMED': { class: 'bg-success/15 text-success', icon: 'check_circle', text: 'Confirmado' },
                'COMPLETED': { class: 'bg-slate-200 text-slate-600', icon: 'task_alt', text: 'Concluído' },
                'CANCELED': { class: 'bg-danger/15 text-danger', icon: 'cancel', text: 'Cancelado' }
            };
            return config[status] || { class: 'bg-slate-100 text-slate-500', icon: 'help', text: status };
        };

        $scope.searchPatients = function() {
            $scope.filters.patient_id = null;

            if (!$scope.typeahead.patient.term) {
                $scope.typeahead.patient.isOpen = false;
                $scope.applyFilters();
                return;
            }

            $scope.typeahead.patient.loading = true;
            
            PatientsService.getPatients({ search: $scope.typeahead.patient.term })
                .then(function(res) {
                    $scope.typeahead.patient.results = res.items || res.data || res;
                    $scope.typeahead.patient.isOpen = true;
                })
                .finally(function() {
                    $scope.typeahead.patient.loading = false;
                });
        };

        $scope.selectPatient = function(patient) {
            $scope.filters.patient_id = patient.id;
            
            var cpfFormatado = $filter('cpfFilter')(patient.cpf);
            $scope.typeahead.patient.term = patient.name + ' | CPF: ' + cpfFormatado;            

            $scope.typeahead.patient.isOpen = false;
            $scope.applyFilters();
        };

        $scope.searchDoctors = function() {
            $scope.filters.doctor_id = null;

            if (!$scope.typeahead.doctor.term) {
                $scope.typeahead.doctor.isOpen = false;
                $scope.applyFilters();
                return;
            }

            $scope.typeahead.doctor.loading = true;
            
            AppointmentsService.searchUsers($scope.typeahead.doctor.term)
                .then(function(res) {
                    $scope.typeahead.doctor.results = res.items || res.data || res;
                    $scope.typeahead.doctor.isOpen = true;
                })
                .finally(function() {
                    $scope.typeahead.doctor.loading = false;
                });
        };

        $scope.selectDoctor = function(doctor) {
            $scope.filters.doctor_id = doctor.id;
            $scope.typeahead.doctor.term = doctor.name + ' | E-mail: ' + doctor.email;
            
            $scope.typeahead.doctor.isOpen = false;
            $scope.applyFilters();
        };

        $scope.closeTypeaheads = function() {
            $scope.typeahead.patient.isOpen = false;
            $scope.typeahead.doctor.isOpen = false;
        };

        $scope.init();
    }
]);