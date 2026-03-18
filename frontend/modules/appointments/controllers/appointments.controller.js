angular.module("helixcare.appointments").controller("AppointmentsController", [
    "$scope",
    "$filter",
    "AppointmentsService",
    "PatientsService",
    "ToastService",
    function ($scope, $filter, AppointmentsService, PatientsService, ToastService) {
        $scope.appointments = [];
        $scope.isLoading = true;

        $scope.filters = {
            page: 1,
            limit: 10,
            status: "",
            date: null,
            patient_id: "",
            doctor_id: "",
        };

        $scope.pagination = {
            totalItems: 0,
            totalPages: 1,
        };
        
        $scope.pageNumbers = [1]; 

        $scope.typeahead = {
            patient: { term: "", results: [], isOpen: false, loading: false },
            doctor: { term: "", results: [], isOpen: false, loading: false },
        };

        $scope.init = function () {
            $scope.loadAppointments();
        };

        $scope.applyFilters = function () {
            $scope.filters.page = 1;
            $scope.loadAppointments();
        };

        $scope.clearFilters = function () {
            $scope.filters.page = 1;
            $scope.filters.status = "";
            $scope.filters.date = null;
            $scope.filters.patient_id = "";
            $scope.filters.doctor_id = "";
            $scope.typeahead.patient.term = "";
            $scope.typeahead.doctor.term = "";
            $scope.loadAppointments();
        };

        $scope.searchPatients = function () {
            if (!$scope.typeahead.patient.term) { 
                $scope.typeahead.patient.isOpen = false; 
                $scope.filters.patient_id = "";
                $scope.applyFilters();
                return; 
            }
            $scope.typeahead.patient.loading = true;
            
            PatientsService.getPatients({ search: $scope.typeahead.patient.term })
                .then(function (res) {
                    $scope.typeahead.patient.results = res.items || res.data || res;
                    $scope.typeahead.patient.isOpen = true;
                })
                .finally(function () { $scope.typeahead.patient.loading = false; });
        };

        $scope.selectPatient = function (patient) {
            $scope.typeahead.patient.term = patient.name;
            $scope.filters.patient_id = patient.id;
            $scope.typeahead.patient.isOpen = false;
            $scope.applyFilters();
        };

        $scope.searchDoctors = function () {
            if (!$scope.typeahead.doctor.term) { 
                $scope.typeahead.doctor.isOpen = false; 
                $scope.filters.doctor_id = "";
                $scope.applyFilters();
                return; 
            }
            $scope.typeahead.doctor.loading = true;
            
            AppointmentsService.searchUsers($scope.typeahead.doctor.term)
                .then(function (res) {
                    $scope.typeahead.doctor.results = res.items || res.data || res;
                    $scope.typeahead.doctor.isOpen = true;
                })
                .finally(function () { $scope.typeahead.doctor.loading = false; });
        };

        $scope.selectDoctor = function (doctor) {
            $scope.typeahead.doctor.term = doctor.name;
            $scope.filters.doctor_id = doctor.id;
            $scope.typeahead.doctor.isOpen = false;
            $scope.applyFilters();
        };

        function formatDateToISO(dateObj) {
            if (!dateObj) return null;
            var d = new Date(dateObj);
            var month = "" + (d.getMonth() + 1), day = "" + d.getDate(), year = d.getFullYear();
            if (month.length < 2) month = "0" + month;
            if (day.length < 2) day = "0" + day;
            return [year, month, day].join("-");
        }

        function generatePageNumbers() {
            var pages = [];
            var maxPagesToShow = 5;
            var startPage = Math.max(1, $scope.filters.page - 2);
            var endPage = Math.min($scope.pagination.totalPages, startPage + maxPagesToShow - 1);
            startPage = Math.max(1, endPage - maxPagesToShow + 1);

            for (var i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
            $scope.pageNumbers = pages;
        }

        $scope.loadAppointments = function () {
            $scope.isLoading = true;
            var queryParams = angular.copy($scope.filters);

            if (queryParams.date) { queryParams.date = formatDateToISO(queryParams.date); } 
            else { delete queryParams.date; }

            if (!queryParams.status) delete queryParams.status;
            if (!queryParams.patient_id) delete queryParams.patient_id;
            if (!queryParams.doctor_id) delete queryParams.doctor_id;

            AppointmentsService.getAppointments(queryParams)
                .then(function (res) {
                    $scope.appointments = res.items || res.data || res;
                    if (res.meta) {
                        $scope.pagination.totalItems = res.meta.totalItems || res.meta.total;
                        $scope.pagination.totalPages = res.meta.totalPages || res.meta.last_page;
                    } else {
                        $scope.pagination.totalItems = $scope.appointments.length;
                        $scope.pagination.totalPages = 1;
                    }
                    generatePageNumbers();
                })
                .catch(function (err) { ToastService.error("Falha ao carregar a agenda."); })
                .finally(function () { $scope.isLoading = false; });
        };

        $scope.goToPage = function (pageNumber) {
            if (pageNumber < 1 || pageNumber > $scope.pagination.totalPages || pageNumber === $scope.filters.page) return;
            $scope.filters.page = pageNumber;
            $scope.loadAppointments();
        };

        $scope.changeStatus = function (appointment, newStatus) {
            var originalStatus = appointment.status;
            appointment.status = newStatus;

            var payload = {
                patient_id: appointment.patient.id,
                doctor_id: appointment.doctor ? appointment.doctor.id : null,
                appointment_date: appointment.appointment_date,
                notes: appointment.notes || "",
                status: newStatus,
            };

            AppointmentsService.updateAppointment(appointment.id, payload)
                .then(function () { ToastService.success("Status atualizado para " + newStatus); })
                .catch(function (err) {
                    appointment.status = originalStatus;
                    var msg = err.message || err.error || "Falha ao atualizar o status.";
                    if (angular.isArray(msg)) msg = msg.join("<br>");
                    ToastService.error(msg, "Erro");
                });
        };

        $scope.deleteAppointment = function (appointment) {
            if (!confirm("Tem certeza que deseja cancelar permanentemente este agendamento?")) return;
            AppointmentsService.deleteAppointment(appointment.id)
                .then(function () {
                    var index = $scope.appointments.indexOf(appointment);
                    if (index !== -1) $scope.appointments.splice(index, 1);
                    $scope.pagination.totalItems--;
                    ToastService.success("Agendamento removido.");
                })
                .catch(function (err) { ToastService.error(err.message || "Erro ao remover."); });
        };

        $scope.isSaving = false;
        $scope.isEditMode = false;
        $scope.isModalOpen = false;
        $scope.appointmentForm = {};

        $scope.modalTypeahead = {
            patient: { term: "", results: [], isOpen: false, loading: false },
            doctor: { term: "", results: [], isOpen: false, loading: false },
        };

        $scope.openModal = function (appt) {
            $scope.isSaving = false;
            $scope.modalTypeahead.patient.results = [];
            $scope.modalTypeahead.doctor.results = [];
            $scope.modalTypeahead.patient.isOpen = false;
            $scope.modalTypeahead.doctor.isOpen = false;

            if (appt) {
                $scope.isEditMode = true;
                var d = new Date(appt.appointment_date);

                $scope.appointmentForm = {
                    id: appt.id,
                    patient_id: appt.patient.id,
                    doctor_id: appt.doctor ? appt.doctor.id : null,
                    date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
                    time: ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2),
                    notes: appt.notes || "",
                    status: appt.status
                };

                $scope.modalTypeahead.patient.term = appt.patient.name + " | CPF: " + $filter("cpfFilter")(appt.patient.cpf);
                if (appt.doctor) {
                    $scope.modalTypeahead.doctor.term = appt.doctor.name + " | E-mail: " + appt.doctor.email;
                } else {
                    $scope.modalTypeahead.doctor.term = "";
                }
            } else {
                $scope.isEditMode = false;
                $scope.appointmentForm = {
                    patient_id: null,
                    doctor_id: null,
                    date: null,
                    time: null,
                    notes: "",
                    status: "SCHEDULED"
                };
                $scope.modalTypeahead.patient.term = "";
                $scope.modalTypeahead.doctor.term = "";
            }

            $scope.isModalOpen = true;
        };

        $scope.closeModal = function () {
            $scope.isModalOpen = false;
        };

        $scope.searchModalPatients = function () {
            $scope.appointmentForm.patient_id = null;
            if (!$scope.modalTypeahead.patient.term) { $scope.modalTypeahead.patient.isOpen = false; return; }
            $scope.modalTypeahead.patient.loading = true;

            PatientsService.getPatients({ search: $scope.modalTypeahead.patient.term })
                .then(function (res) {
                    $scope.modalTypeahead.patient.results = res.items || res.data || res;
                    $scope.modalTypeahead.patient.isOpen = true;
                })
                .finally(function () { $scope.modalTypeahead.patient.loading = false; });
        };

        $scope.selectModalPatient = function (patient) {
            $scope.appointmentForm.patient_id = patient.id;
            $scope.modalTypeahead.patient.term = patient.name + " | CPF: " + $filter("cpfFilter")(patient.cpf);
            $scope.modalTypeahead.patient.isOpen = false;
        };

        $scope.searchModalDoctors = function () {
            $scope.appointmentForm.doctor_id = null;
            if (!$scope.modalTypeahead.doctor.term) { $scope.modalTypeahead.doctor.isOpen = false; return; }
            $scope.modalTypeahead.doctor.loading = true;

            AppointmentsService.searchUsers($scope.modalTypeahead.doctor.term)
                .then(function (res) {
                    $scope.modalTypeahead.doctor.results = res.items || res.data || res;
                    $scope.modalTypeahead.doctor.isOpen = true;
                })
                .finally(function () { $scope.modalTypeahead.doctor.loading = false; });
        };

        $scope.selectModalDoctor = function (doctor) {
            $scope.appointmentForm.doctor_id = doctor.id;
            $scope.modalTypeahead.doctor.term = doctor.name + " | E-mail: " + doctor.email;
            $scope.modalTypeahead.doctor.isOpen = false;
        };


        $scope.saveAppointment = function () {
            if (!$scope.appointmentForm.patient_id || !$scope.appointmentForm.doctor_id || !$scope.appointmentForm.date || !$scope.appointmentForm.time) {
                ToastService.warning("Preencha todos os campos obrigatórios (*)."); return;
            }

            $scope.isSaving = true;
            var finalDate = new Date($scope.appointmentForm.date);
            var timeVal = $scope.appointmentForm.time;

            if (angular.isString(timeVal)) {
                var parts = timeVal.split(":");
                var h = parseInt(parts[0], 10) || 0;
                var m = parseInt(parts[1], 10) || 0;
                finalDate.setHours(h, m, 0, 0);
            } else {
                var timeObj = new Date(timeVal);
                finalDate.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);
            }

            var payload = {
                patient_id: $scope.appointmentForm.patient_id,
                doctor_id: $scope.appointmentForm.doctor_id,
                appointment_date: finalDate.toISOString(),
                notes: $scope.appointmentForm.notes || "",
            };

            if ($scope.isEditMode) payload.status = $scope.appointmentForm.status;

            var request = $scope.isEditMode ? AppointmentsService.updateAppointment($scope.appointmentForm.id, payload) : AppointmentsService.createAppointment(payload);

            request.then(function () {
                ToastService.success($scope.isEditMode ? "Agendamento atualizado!" : "Consulta agendada!");
                $scope.closeModal();
                $scope.loadAppointments();
            }).catch(function (err) {
                var msg = err.message || err.error || "Erro ao salvar.";
                if (angular.isArray(msg)) msg = msg.join("<br>");
                ToastService.error(msg, "Falha na Requisição");
            }).finally(function () { $scope.isSaving = false; });
        };

        $scope.getStatusConfig = function (status) {
            var config = {
                SCHEDULED: { class: "bg-info/15 text-info", icon: "schedule", text: "Agendado" },
                CONFIRMED: { class: "bg-success/15 text-success", icon: "check_circle", text: "Confirmado" },
                COMPLETED: { class: "bg-slate-200 text-slate-600", icon: "task_alt", text: "Concluído" },
                CANCELED: { class: "bg-danger/15 text-danger", icon: "cancel", text: "Cancelado" }
            };
            return config[status] || { class: "bg-slate-100 text-slate-500", icon: "help", text: status };
        };

        $scope.init();
    }
]);