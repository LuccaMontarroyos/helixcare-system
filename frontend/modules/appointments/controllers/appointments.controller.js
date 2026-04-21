angular.module("helixcare.appointments").controller("AppointmentsController", [
  "$scope",
  "$filter",
  "AppointmentsService",
  "PatientsService",
  "AuthService",
  "ToastService",
  "APPOINTMENT_TYPES",
  function (
    $scope,
    $filter,
    AppointmentsService,
    PatientsService,
    AuthService,
    ToastService,
    APPOINTMENT_TYPES,
  ) {
    $scope.currentUser = AuthService.getCurrentUser();
    $scope.appointments = [];
    $scope.isLoading = true;
    $scope.isDoctorUser =
      $scope.currentUser && $scope.currentUser.role === "DOCTOR";

    $scope.week = {
      days: [],
      label: "",
      counts: {},
      isLoadingCounts: false,
      anchorDate: _getWeekStart(new Date()),
      jumpDate: null,
      selectedISO: null,
    };

    $scope.filters = {
      page: 1,
      limit: 10,
      status: "",
      start_date: null,
      end_date: null,
      patient_id: "",
      doctor_id: "",
    };

    $scope.pagination = { totalItems: 0, totalPages: 1 };
    $scope.pageNumbers = [1];

    $scope.typeahead = {
      patient: { term: "", results: [], isOpen: false, loading: false },
      doctor: { term: "", results: [], isOpen: false, loading: false },
    };

    var DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    var MONTHS_LONG = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    function _getWeekStart(date) {
      var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      d.setDate(d.getDate() - d.getDay());
      return d;
    }

    function _localDate(year, month, day) {
      return new Date(year, month, day, 0, 0, 0, 0);
    }

    function _toISODate(date) {
      return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
      );
    }

    function _dayUTCBounds(localDate) {
      var start = new Date(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        0,
        0,
        0,
        0,
      );
      var end = new Date(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        23,
        59,
        59,
        999,
      );
      return { start: start.toISOString(), end: end.toISOString() };
    }

    function _weekUTCBounds(anchorDate) {
      var weekEnd = new Date(anchorDate);
      weekEnd.setDate(anchorDate.getDate() + 6);
      var start = new Date(
        anchorDate.getFullYear(),
        anchorDate.getMonth(),
        anchorDate.getDate(),
        0,
        0,
        0,
        0,
      );
      var end = new Date(
        weekEnd.getFullYear(),
        weekEnd.getMonth(),
        weekEnd.getDate(),
        23,
        59,
        59,
        999,
      );
      return { start: start.toISOString(), end: end.toISOString() };
    }

    function _buildWeekDays(anchorDate) {
      var todayISO = _toISODate(new Date());
      var days = [];
      for (var i = 0; i < 7; i++) {
        var d = _localDate(
          anchorDate.getFullYear(),
          anchorDate.getMonth(),
          anchorDate.getDate() + i,
        );
        var iso = _toISODate(d);
        var bounds = _dayUTCBounds(d);
        days.push({
          date: d,
          iso: iso,
          label: DAYS_SHORT[d.getDay()],
          dayNum: d.getDate(),
          isToday: iso === todayISO,
          isSelected: iso === $scope.week.selectedISO,
          count: $scope.week.counts[iso] || 0,
          utcBounds: bounds,
        });
      }
      var first = days[0].date,
        last = days[6].date;
      var sameMonth = first.getMonth() === last.getMonth();
      $scope.week.label = sameMonth
        ? first.getDate() +
          " – " +
          last.getDate() +
          " " +
          MONTHS_LONG[last.getMonth()] +
          " " +
          last.getFullYear()
        : first.getDate() +
          " " +
          MONTHS_LONG[first.getMonth()] +
          " – " +
          last.getDate() +
          " " +
          MONTHS_LONG[last.getMonth()] +
          " " +
          last.getFullYear();
      return days;
    }

    function _applyCountsToWeek() {
      angular.forEach($scope.week.days, function (day) {
        day.count = $scope.week.counts[day.iso] || 0;
      });
    }

    function _loadWeekCounts() {
      if (!$scope.week.days.length) return;
      $scope.week.isLoadingCounts = true;
      var bounds = _weekUTCBounds($scope.week.anchorDate);
      var extra = {};
      if ($scope.filters.doctor_id) extra.doctor_id = $scope.filters.doctor_id;
      if ($scope.filters.patient_id)
        extra.patient_id = $scope.filters.patient_id;
      if ($scope.filters.status) extra.status = $scope.filters.status;
      AppointmentsService.getWeekCounts(bounds.start, bounds.end, extra)
        .then(function (counts) {
          $scope.week.counts = counts;
          _applyCountsToWeek();
        })
        .catch(angular.noop)
        .finally(function () {
          $scope.week.isLoadingCounts = false;
        });
    }

    function _rebuildWeek() {
      $scope.week.days = _buildWeekDays($scope.week.anchorDate);
      _applyCountsToWeek();
      _loadWeekCounts();
    }

    function _applyWeekFilter() {
      var bounds = _weekUTCBounds($scope.week.anchorDate);
      $scope.filters.start_date = bounds.start;
      $scope.filters.end_date = bounds.end;
    }

    $scope.prevWeek = function () {
      $scope.week.anchorDate = _localDate(
        $scope.week.anchorDate.getFullYear(),
        $scope.week.anchorDate.getMonth(),
        $scope.week.anchorDate.getDate() - 7,
      );
      $scope.week.selectedISO = null;
      _applyWeekFilter();
      _rebuildWeek();
      $scope.loadAppointments();
    };

    $scope.nextWeek = function () {
      $scope.week.anchorDate = _localDate(
        $scope.week.anchorDate.getFullYear(),
        $scope.week.anchorDate.getMonth(),
        $scope.week.anchorDate.getDate() + 7,
      );
      $scope.week.selectedISO = null;
      _applyWeekFilter();
      _rebuildWeek();
      $scope.loadAppointments();
    };

    $scope.goToCurrentWeek = function () {
      $scope.week.anchorDate = _getWeekStart(new Date());
      $scope.week.selectedISO = null;
      $scope.week.jumpDate = null;
      _applyWeekFilter();
      _rebuildWeek();
      $scope.loadAppointments();
    };

    $scope.jumpToDate = function () {
      var raw = $scope.week.jumpDate;
      if (!raw) return;
      var target =
        raw instanceof Date
          ? _localDate(raw.getFullYear(), raw.getMonth(), raw.getDate())
          : (function () {
              var p = String(raw).split("-");
              return _localDate(
                parseInt(p[0], 10),
                parseInt(p[1], 10) - 1,
                parseInt(p[2], 10),
              );
            })();
      if (isNaN(target.getTime())) return;
      $scope.week.anchorDate = _getWeekStart(target);
      $scope.week.selectedISO = _toISODate(target);
      _rebuildWeek();
      var bounds = _dayUTCBounds(target);
      $scope.filters.start_date = bounds.start;
      $scope.filters.end_date = bounds.end;
      $scope.applyFilters();
    };

    $scope.selectDay = function (day) {
      if ($scope.week.selectedISO === day.iso) {
        $scope.week.selectedISO = null;
        _applyWeekFilter();
      } else {
        $scope.week.selectedISO = day.iso;
        $scope.filters.start_date = day.utcBounds.start;
        $scope.filters.end_date = day.utcBounds.end;
      }
      $scope.week.days = _buildWeekDays($scope.week.anchorDate);
      $scope.applyFilters();
    };

    $scope.init = function () {
      _applyWeekFilter();
      _rebuildWeek();
      $scope.loadAppointments();
    };

    $scope.applyFilters = function () {
      $scope.filters.page = 1;
      $scope.loadAppointments();
    };

    $scope.clearFilters = function () {
      $scope.filters.page = 1;
      $scope.filters.status = "";
      $scope.filters.patient_id = "";
      $scope.filters.doctor_id = "";
      $scope.typeahead.patient.term = "";
      $scope.typeahead.doctor.term = "";
      $scope.week.jumpDate = null;
      $scope.week.selectedISO = null;
      $scope.week.anchorDate = _getWeekStart(new Date());
      _applyWeekFilter();
      _rebuildWeek();
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
        .finally(function () {
          $scope.typeahead.patient.loading = false;
        });
    };

    $scope.selectPatient = function (patient) {
      $scope.typeahead.patient.term = patient.name;
      $scope.filters.patient_id = patient.id;
      $scope.typeahead.patient.isOpen = false;
      _loadWeekCounts();
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
        .finally(function () {
          $scope.typeahead.doctor.loading = false;
        });
    };

    $scope.selectDoctor = function (doctor) {
      $scope.typeahead.doctor.term = doctor.name;
      $scope.filters.doctor_id = doctor.id;
      $scope.typeahead.doctor.isOpen = false;
      _loadWeekCounts();
      $scope.applyFilters();
    };

    function generatePageNumbers() {
      var pages = [],
        maxPages = 5;
      var startPage = Math.max(1, $scope.filters.page - 2);
      var endPage = Math.min(
        $scope.pagination.totalPages,
        startPage + maxPages - 1,
      );
      startPage = Math.max(1, endPage - maxPages + 1);
      for (var i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      $scope.pageNumbers = pages;
    }

    $scope.loadAppointments = function () {
      $scope.isLoading = true;
      var queryParams = angular.copy($scope.filters);
      if (!queryParams.status) delete queryParams.status;
      if (!queryParams.patient_id) delete queryParams.patient_id;
      if (!queryParams.doctor_id) delete queryParams.doctor_id;
      AppointmentsService.getAppointments(queryParams)
        .then(function (res) {
          $scope.appointments = res.items || res.data || res;
          if (res.meta) {
            $scope.pagination.totalItems =
              res.meta.totalItems || res.meta.total;
            $scope.pagination.totalPages =
              res.meta.totalPages || res.meta.last_page;
          } else {
            $scope.pagination.totalItems = $scope.appointments.length;
            $scope.pagination.totalPages = 1;
          }
          generatePageNumbers();
        })
        .catch(function () {
          ToastService.error("Falha ao carregar a agenda.");
        })
        .finally(function () {
          $scope.isLoading = false;
        });
    };

    $scope.goToPage = function (pageNumber) {
      if (
        pageNumber < 1 ||
        pageNumber > $scope.pagination.totalPages ||
        pageNumber === $scope.filters.page
      )
        return;
      $scope.filters.page = pageNumber;
      $scope.loadAppointments();
    };

    function _changeStatus(appointment, newStatus, successMsg) {
      var originalStatus = appointment.status;
      appointment.status = newStatus;

      var payload = {
        patient_id: appointment.patient
          ? appointment.patient.id
          : appointment.patient_id,
        doctor_id: appointment.doctor
          ? appointment.doctor.id
          : appointment.doctor_id,
        appointment_date: appointment.appointment_date,
        notes: appointment.notes || "",
        status: newStatus,
      };

      AppointmentsService.updateStatus(appointment.id, payload)
        .then(function () {
          ToastService.success(successMsg || "Status atualizado.");
          _loadWeekCounts();
        })
        .catch(function (err) {
          appointment.status = originalStatus; // rollback
          var msg = err.message || err.error || "Falha ao atualizar status.";
          if (angular.isArray(msg)) msg = msg.join("<br>");
          ToastService.error(msg, "Erro");
        });
    }

    $scope.confirmAppointment = function (appt) {
      _changeStatus(appt, "CONFIRMED", "Consulta confirmada.");
    };

    $scope.markAsWaiting = function (appt) {
      _changeStatus(appt, "WAITING", "Paciente registrado na sala de espera.");
    };

    $scope.markAsNoShow = function (appt) {
      if (!confirm("Confirmar falta do paciente " + appt.patient.name + "?"))
        return;
      _changeStatus(
        appt,
        "NO_SHOW",
        "Falta registrada para " + appt.patient.name + ".",
      );
    };

    $scope.deleteAppointment = function (appointment) {
      if (!confirm("Tem certeza que deseja remover este agendamento?")) return;
      AppointmentsService.deleteAppointment(appointment.id)
        .then(function () {
          var idx = $scope.appointments.indexOf(appointment);
          if (idx !== -1) $scope.appointments.splice(idx, 1);
          $scope.pagination.totalItems--;
          _loadWeekCounts();
          ToastService.success("Agendamento removido.");
        })
        .catch(function (err) {
          ToastService.error(err.message || "Erro ao remover.");
        });
    };

    $scope.isRescheduleModalOpen = false;
    $scope.isRescheduling = false;
    $scope.rescheduleForm = { date: null, time: null };
    $scope.appointmentToReschedule = null;

    $scope.openRescheduleModal = function (appt) {
      $scope.appointmentToReschedule = appt;
      $scope.rescheduleForm = { date: null, time: null };
      $scope.isRescheduleModalOpen = true;
    };

    $scope.closeRescheduleModal = function () {
      $scope.isRescheduleModalOpen = false;
      $scope.appointmentToReschedule = null;
    };

    $scope.saveReschedule = function () {
      if (!$scope.rescheduleForm.date || !$scope.rescheduleForm.time) {
        ToastService.warning("Informe a nova data e hora.");
        return;
      }
      $scope.isRescheduling = true;

      var raw = $scope.rescheduleForm.date;
      var baseDate =
        raw instanceof Date
          ? _localDate(raw.getFullYear(), raw.getMonth(), raw.getDate())
          : (function () {
              var p = String(raw).split("-");
              return _localDate(
                parseInt(p[0], 10),
                parseInt(p[1], 10) - 1,
                parseInt(p[2], 10),
              );
            })();

      var timeVal = $scope.rescheduleForm.time;
      if (angular.isString(timeVal)) {
        var parts = timeVal.split(":");
        baseDate.setHours(
          parseInt(parts[0], 10) || 0,
          parseInt(parts[1], 10) || 0,
          0,
          0,
        );
      } else {
        var t = new Date(timeVal);
        baseDate.setHours(t.getHours(), t.getMinutes(), 0, 0);
      }

      AppointmentsService.rescheduleAppointment(
        $scope.appointmentToReschedule.id,
        baseDate.toISOString(),
      )
        .then(function () {
          ToastService.success("Consulta remarcada com sucesso!");
          $scope.closeRescheduleModal();
          _loadWeekCounts();
          $scope.loadAppointments();
        })
        .catch(function (err) {
          var msg = err.message || err.error || "Erro ao remarcar.";
          if (angular.isArray(msg)) msg = msg.join("<br>");
          ToastService.error(msg, "Falha");
        })
        .finally(function () {
          $scope.isRescheduling = false;
        });
    };

    $scope.isSaving = false;
    $scope.isEditMode = false;
    $scope.isModalOpen = false;
    $scope.appointmentForm = {};

    $scope.modalTypeahead = {
      patient: { term: "", results: [], isOpen: false, loading: false },
      doctor: { term: "", results: [], isOpen: false, loading: false },
    };

    var _typeDurationMap = {};
    angular.forEach(APPOINTMENT_TYPES, function (group) {
      angular.forEach(group.types, function (type) {
        _typeDurationMap[type.value] = type.duration;
      });
    });

    $scope.appointmentTypeGroups = APPOINTMENT_TYPES;

    $scope.onAppointmentTypeChange = function () {
      var selectedType = $scope.appointmentForm.appointment_type;
      if (!selectedType) return;

      if (selectedType === "OUTRO") {
        $scope.appointmentForm.duration_minutes = null;
        $scope.isDurationCustom = true;
      } else {
        $scope.appointmentForm.duration_minutes =
          _typeDurationMap[selectedType] || 30;
        $scope.isDurationCustom = false;
      }
    };

    $scope.formatDuration = function (minutes) {
      if (!minutes) return "";
      if (minutes < 60) return minutes + " min";
      var h = Math.floor(minutes / 60);
      var m = minutes % 60;
      return m > 0 ? h + "h " + m + "min" : h + "h";
    };

    $scope.openModal = function (appt) {
      $scope.isSaving = false;
      $scope.isDurationCustom = false;
      $scope.modalTypeahead.patient = {
        term: "",
        results: [],
        isOpen: false,
        loading: false,
      };
      $scope.modalTypeahead.doctor = {
        term: "",
        results: [],
        isOpen: false,
        loading: false,
      };

      if (appt) {
        $scope.isEditMode = true;
        var d = new Date(appt.appointment_date);
        $scope.appointmentForm = {
          id: appt.id,
          patient_id: appt.patient.id,
          doctor_id: appt.doctor ? appt.doctor.id : null,
          date: _localDate(d.getFullYear(), d.getMonth(), d.getDate()),
          time:
            String(d.getHours()).padStart(2, "0") +
            ":" +
            String(d.getMinutes()).padStart(2, "0"),
          notes: appt.notes || "",
          status: appt.status,
          appointment_type: appt.appointment_type || null,
          duration_minutes: appt.duration_minutes || 30,
        };
        $scope.isDurationCustom = appt.appointment_type === "OUTRO";
        $scope.modalTypeahead.patient.term =
          appt.patient.name +
          " | CPF: " +
          $filter("cpfFilter")(appt.patient.cpf);
        if (appt.doctor) {
          $scope.modalTypeahead.doctor.term =
            appt.doctor.name + " | E-mail: " + appt.doctor.email;
        }
      } else {
        $scope.isEditMode = false;
        $scope.appointmentForm = {
          patient_id: null,
          doctor_id: null,
          date: null,
          time: null,
          notes: "",
          status: "SCHEDULED",
          appointment_type: null,
          duration_minutes: null,
        };
        if ($scope.isDoctorUser) {
          $scope.appointmentForm.doctor_id = $scope.currentUser.id;
          $scope.modalTypeahead.doctor.term = $scope.currentUser.name;
          $scope.modalTypeahead.doctor.isSelfLocked = true;
        }
      }
      $scope.isModalOpen = true;
    };

    $scope.closeModal = function () {
      $scope.isModalOpen = false;
    };

    $scope.searchModalPatients = function () {
      $scope.appointmentForm.patient_id = null;
      if (!$scope.modalTypeahead.patient.term) {
        $scope.modalTypeahead.patient.isOpen = false;
        return;
      }
      $scope.modalTypeahead.patient.loading = true;
      PatientsService.getPatients({
        search: $scope.modalTypeahead.patient.term,
      })
        .then(function (res) {
          $scope.modalTypeahead.patient.results = res.items || res.data || res;
          $scope.modalTypeahead.patient.isOpen = true;
        })
        .finally(function () {
          $scope.modalTypeahead.patient.loading = false;
        });
    };

    $scope.selectModalPatient = function (patient) {
      $scope.appointmentForm.patient_id = patient.id;
      $scope.modalTypeahead.patient.term =
        patient.name + " | CPF: " + $filter("cpfFilter")(patient.cpf);
      $scope.modalTypeahead.patient.isOpen = false;
    };

    $scope.searchModalDoctors = function () {
      if ($scope.modalTypeahead.doctor.isSelfLocked) return;
      $scope.appointmentForm.doctor_id = null;
      if (!$scope.modalTypeahead.doctor.term) {
        $scope.modalTypeahead.doctor.isOpen = false;
        return;
      }
      $scope.modalTypeahead.doctor.loading = true;
      AppointmentsService.searchUsers($scope.modalTypeahead.doctor.term)
        .then(function (res) {
          $scope.modalTypeahead.doctor.results = res.items || res.data || res;
          $scope.modalTypeahead.doctor.isOpen = true;
        })
        .finally(function () {
          $scope.modalTypeahead.doctor.loading = false;
        });
    };

    $scope.selectModalDoctor = function (doctor) {
      $scope.appointmentForm.doctor_id = doctor.id;
      $scope.modalTypeahead.doctor.term =
        doctor.name + " | E-mail: " + doctor.email;
      $scope.modalTypeahead.doctor.isOpen = false;
    };

    $scope.saveAppointment = function () {
      if (
        !$scope.appointmentForm.patient_id ||
        !$scope.appointmentForm.doctor_id ||
        !$scope.appointmentForm.date ||
        !$scope.appointmentForm.time
      ) {
        ToastService.warning("Preencha todos os campos obrigatórios (*).");
        return;
      }

      if ($scope.isDurationCustom && !$scope.appointmentForm.duration_minutes) {
        ToastService.warning("Informe a duração para o tipo 'Outro'.");
        return;
      }

      $scope.isSaving = true;

      var raw = $scope.appointmentForm.date;
      var baseDate =
        raw instanceof Date
          ? _localDate(raw.getFullYear(), raw.getMonth(), raw.getDate())
          : (function () {
              var p = String(raw).split("-");
              return _localDate(
                parseInt(p[0], 10),
                parseInt(p[1], 10) - 1,
                parseInt(p[2], 10),
              );
            })();

      var timeVal = $scope.appointmentForm.time;
      if (angular.isString(timeVal)) {
        var parts = timeVal.split(":");
        baseDate.setHours(
          parseInt(parts[0], 10) || 0,
          parseInt(parts[1], 10) || 0,
          0,
          0,
        );
      } else {
        var t = new Date(timeVal);
        baseDate.setHours(t.getHours(), t.getMinutes(), 0, 0);
      }

      var payload = {
        patient_id: $scope.appointmentForm.patient_id,
        doctor_id: $scope.appointmentForm.doctor_id,
        appointment_date: baseDate.toISOString(),
        notes: $scope.appointmentForm.notes || "",
        appointment_type: $scope.appointmentForm.appointment_type || null,
        duration_minutes: $scope.appointmentForm.duration_minutes || 30,
      };
      if ($scope.isEditMode) payload.status = $scope.appointmentForm.status;

      var request = $scope.isEditMode
        ? AppointmentsService.updateAppointment(
            $scope.appointmentForm.id,
            payload,
          )
        : AppointmentsService.createAppointment(payload);

      request
        .then(function () {
          ToastService.success(
            $scope.isEditMode
              ? "Agendamento atualizado!"
              : "Consulta agendada!",
          );
          $scope.closeModal();
          _loadWeekCounts();
          $scope.loadAppointments();
        })
        .catch(function (err) {
          var msg = err.message || err.error || "Erro ao salvar.";
          if (angular.isArray(msg)) msg = msg.join("<br>");
          ToastService.error(msg, "Conflito de Horário");
        })
        .finally(function () {
          $scope.isSaving = false;
        });
    };

    var _typeLabelMap = {};
    angular.forEach(APPOINTMENT_TYPES, function (group) {
      angular.forEach(group.types, function (type) {
        _typeLabelMap[type.value] = type.label;
      });
    });

    $scope.getTypeLabel = function (value) {
      return _typeLabelMap[value] || value;
    };

    $scope.getStatusConfig = function (status) {
      var config = {
        SCHEDULED: {
          class: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
          icon: "schedule",
          text: "Agendado",
        },
        CONFIRMED: {
          class:
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
          icon: "check_circle",
          text: "Confirmado",
        },
        WAITING: {
          class:
            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
          icon: "chair",
          text: "Aguardando",
        },
        IN_PROGRESS: {
          class:
            "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
          icon: "stethoscope",
          text: "Em Atendimento",
        },
        COMPLETED: {
          class:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
          icon: "task_alt",
          text: "Concluído",
        },
        NO_SHOW: {
          class:
            "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
          icon: "person_off",
          text: "Faltou",
        },
        RESCHEDULED: {
          class:
            "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
          icon: "update",
          text: "Remarcado",
        },
        CANCELED: {
          class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          icon: "cancel",
          text: "Cancelado",
        },
      };
      return (
        config[status] || {
          class: "bg-slate-100 text-slate-500",
          icon: "help",
          text: status,
        }
      );
    };

    $scope.isTerminalStatus = function (status) {
      return (
        ["COMPLETED", "NO_SHOW", "RESCHEDULED", "CANCELED"].indexOf(status) !==
        -1
      );
    };

    $scope.init();
  },
]);
