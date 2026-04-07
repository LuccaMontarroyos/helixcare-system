angular.module("helixcare.patients").controller("PatientDetailController", [
  "$scope",
  "$stateParams",
  "$state",
  "$q",
  "AuthService",
  "PatientsService",
  "AppointmentsService",
  "BillingService",
  "MedicalRecordsService",
  "ToastService",
  function (
    $scope,
    $stateParams,
    $state,
    $q,
    AuthService,
    PatientsService,
    AppointmentsService,
    BillingService,
    MedicalRecordsService,
    ToastService,
  ) {
    $scope.currentUser = AuthService.getCurrentUser();
    $scope.patient     = null;
    $scope.isLoading   = true;
    $scope.activeTab   = "RESUMO";

    $scope.patientAge      = 0;
    $scope.nextAppointment = null;
    $scope.financials      = { invoices: [], totalDebt: 0, hasDebt: false };

    $scope.history         = [];
    $scope.isLoadingRecords = false;
    $scope.isSaving        = false;
    var recordsLoaded      = false;

    $scope.editor = _freshEditor();

    function _freshEditor() {
      return {
        isNew: true,
        id: null,
        anamnesis: "",
        diagnosis: "",
        prescription: "",
        social_history: { is_smoker: false, consumes_alcohol: false, notes: "" },
        attachments: [],
        isLockedByOther: false,
        lockedBy: null,
      };
    }

    $scope.isAppointmentModalOpen  = false;
    $scope.isSavingAppointment     = false;
    $scope.newAppointmentForm      = { date: null, time: null, doctor_id: null, notes: "" };
    $scope.doctorTypeahead         = { term: "", results: [], isOpen: false, loading: false };

    $scope.setTab = function (tabName) {
      $scope.activeTab = tabName;

      if (tabName === "CONSULTAS" && !recordsLoaded && $scope.patient) {
        _loadHistory($scope.patient.id);
      }
    };

    $scope.init = function () {
      var patientId = $stateParams.id;

      if (!patientId) {
        ToastService.error("ID do paciente não fornecido.");
        $state.go("patients");
        return;
      }

      PatientsService.getPatientById(patientId)
        .then(function (data) {
          $scope.patient  = data;
          $scope.patientAge = _calculateAge(data.birth_date);
          _loadPatientEcosystem(patientId);
        })
        .catch(function () {
          ToastService.error("Erro ao carregar dados do paciente.");
          $state.go("patients");
        })
        .finally(function () {
          $scope.isLoading = false;
        });
    };

    function _calculateAge(birthDateString) {
      if (!birthDateString) return 0;
      var today     = new Date();
      var birthDate = new Date(birthDateString);
      var age       = today.getFullYear() - birthDate.getFullYear();
      var m         = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return age;
    }

    function _loadPatientEcosystem(patientId) {
      var todayStr = new Date().toISOString().split("T")[0];

      AppointmentsService.getAppointments({
        patient_id: patientId,
        status: "SCHEDULED",
        start_date: todayStr,
        limit: 1,
      })
        .then(function (res) {
          var appts = res.data || res.items || res;
          if (appts && appts.length > 0) $scope.nextAppointment = appts[0];
        })
        .catch(function (err) {
          console.warn("Erro ao buscar próxima consulta.", err);
        });

      if (
        $scope.currentUser.role === "ADMIN" ||
        $scope.currentUser.role === "RECEPTIONIST"
      ) {
        BillingService.getInvoices({ patient_id: patientId, limit: 100 })
          .then(function (res) {
            var invs = res.data || res.items || res;
            if (!invs) return;
            $scope.financials.invoices = invs;
            angular.forEach(invs, function (inv) {
              if (inv.status === "PENDING") {
                $scope.financials.totalDebt += parseFloat(inv.amount);
                if (new Date(inv.due_date) < new Date()) {
                  $scope.financials.hasDebt = true;
                }
              }
            });
          })
          .catch(function (err) {
            console.warn("Erro ao carregar financeiro.", err);
          });
      }
    }

    function _loadHistory(patientId) {
      $scope.isLoadingRecords = true;
      MedicalRecordsService.getPatientHistory(patientId)
        .then(function (res) {
          $scope.history = res.items || res.data || res;
          recordsLoaded  = true;
        })
        .catch(function () {
          ToastService.error("Falha ao carregar histórico clínico.");
        })
        .finally(function () {
          $scope.isLoadingRecords = false;
        });
    }

    $scope.startNewEvolution = function (showToast) {
      $scope.releaseLock();
      $scope.editor = _freshEditor();
      if (showToast) ToastService.info("Rascunho descartado. Prancheta limpa.");
    };

    $scope.viewRecord = function (record) {
      $scope.releaseLock();

      $scope.editor = {
        isNew: false,
        id: record.id,
        anamnesis: record.anamnesis || record.notes,
        diagnosis: record.diagnosis,
        prescription: record.prescription,
        social_history: record.social_history || {
          is_smoker: false,
          consumes_alcohol: false,
          notes: "",
        },
        attachments: record.attachments || [],
        isLockedByOther: false,
        lockedBy: null,
      };

      MedicalRecordsService.getLockStatus(record.id)
        .then(function (status) {
          var isLockedByAnother =
            status.isLocked &&
            status.lockedBy !== $scope.currentUser.id &&
            status.lockedBy !== $scope.currentUser.name;

          if (isLockedByAnother) {
            $scope.editor.isLockedByOther = true;
            $scope.editor.lockedBy        = status.lockedBy || "Outro profissional";
            ToastService.warning(
              "Atenção: Este prontuário está sendo editado por " + $scope.editor.lockedBy,
            );
          } else {
            MedicalRecordsService.lockRecord(record.id)
              .then(function () {
                $scope.editor.isLockedByOther = false;
                $scope.editor.lockedBy        = $scope.currentUser.name;
              })
              .catch(function (err) {
                $scope.editor.isLockedByOther = true;
                $scope.editor.lockedBy        = err.lockedBy || "Outro profissional";
                ToastService.warning(
                  "O registro acabou de ser travado por " + $scope.editor.lockedBy,
                );
              });
          }
        })
        .catch(function (err) {
          console.error("Erro ao verificar trava:", err);
        });
    };

    $scope.releaseLock = function () {
      if (!$scope.editor.isNew && $scope.editor.id && !$scope.editor.isLockedByOther) {
        MedicalRecordsService.unlockRecord($scope.editor.id).catch(angular.noop);
      }
    };

    $scope.addAttachment = function (element) {
      $scope.$apply(function () {
        for (var i = 0; i < element.files.length; i++) {
          $scope.editor.attachments.push(element.files[i]);
        }
        element.value = "";
      });
    };

    $scope.removeAttachment = function (index) {
      $scope.editor.attachments.splice(index, 1);
    };

    $scope.saveEvolution = function () {
      if (!$scope.editor.anamnesis) {
        ToastService.warning("A Anamnese é obrigatória.");
        return;
      }

      $scope.isSaving = true;

      var payload = {
        patient_id:     $scope.patient.id,
        anamnesis:      $scope.editor.anamnesis,
        diagnosis:      $scope.editor.diagnosis || null,
        prescription:   $scope.editor.prescription || null,
        social_history: $scope.editor.social_history,
      };

      var request = $scope.editor.isNew
        ? MedicalRecordsService.createRecord(payload)
        : MedicalRecordsService.updateRecord($scope.editor.id, payload);

      request
        .then(function (res) {
          var recordId = res.id || (res.data && res.data.id) || $scope.editor.id;
          var newFiles = $scope.editor.attachments.filter(function (a) { return !a.url; });

          if (newFiles.length > 0) {
            var uploads = newFiles.map(function (file) {
              return MedicalRecordsService.uploadAttachment(recordId, file);
            });
            return $q.all(uploads).then(function () { return res; });
          }
          return res;
        })
        .then(function () {
          ToastService.success("Evolução salva com sucesso!");
          recordsLoaded = false;
          _loadHistory($scope.patient.id);
          $scope.startNewEvolution();
        })
        .catch(function (err) {
          var msg = err.message || err.error || "Falha ao salvar o prontuário.";
          if (angular.isArray(msg)) msg = msg.join("<br>");
          ToastService.error(msg, "Erro de Validação");
        })
        .finally(function () {
          $scope.isSaving = false;
        });
    };

    $scope.$on("$destroy", function () {
      $scope.releaseLock();
    });

    $scope.openAppointmentModal = function () {
      $scope.newAppointmentForm = { date: null, time: null, doctor_id: null, notes: "" };
      $scope.doctorTypeahead    = { term: "", results: [], isOpen: false, loading: false };
      $scope.isAppointmentModalOpen = true;
    };

    $scope.closeAppointmentModal = function () {
      $scope.isAppointmentModalOpen = false;
    };

    $scope.searchDoctors = function () {
      if (!$scope.doctorTypeahead.term) {
        $scope.doctorTypeahead.isOpen    = false;
        $scope.newAppointmentForm.doctor_id = null;
        return;
      }
      $scope.doctorTypeahead.loading = true;
      AppointmentsService.searchUsers($scope.doctorTypeahead.term)
        .then(function (res) {
          $scope.doctorTypeahead.results = res.items || res.data || res;
          $scope.doctorTypeahead.isOpen  = true;
        })
        .finally(function () { $scope.doctorTypeahead.loading = false; });
    };

    $scope.selectDoctor = function (doctor) {
      $scope.newAppointmentForm.doctor_id = doctor.id;
      $scope.doctorTypeahead.term         = doctor.name;
      $scope.doctorTypeahead.isOpen       = false;
    };

    $scope.saveNewAppointment = function () {
      if (
        !$scope.newAppointmentForm.doctor_id ||
        !$scope.newAppointmentForm.date ||
        !$scope.newAppointmentForm.time
      ) {
        ToastService.warning("Preencha médico, data e hora (*).");
        return;
      }

      $scope.isSavingAppointment = true;

      var finalDate = new Date($scope.newAppointmentForm.date);
      var timeVal   = $scope.newAppointmentForm.time;

      if (angular.isString(timeVal)) {
        var parts = timeVal.split(":");
        finalDate.setHours(parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0, 0, 0);
      } else {
        var timeObj = new Date(timeVal);
        finalDate.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);
      }

      AppointmentsService.createAppointment({
        patient_id:       $scope.patient.id,
        doctor_id:        $scope.newAppointmentForm.doctor_id,
        appointment_date: finalDate.toISOString(),
        notes:            $scope.newAppointmentForm.notes || "",
        status:           "SCHEDULED",
      })
        .then(function () {
          ToastService.success("Consulta agendada com sucesso!");
          $scope.closeAppointmentModal();
          _loadPatientEcosystem($scope.patient.id);
        })
        .catch(function (err) {
          var msg = err.message || err.error || "Erro ao agendar consulta.";
          if (angular.isArray(msg)) msg = msg.join("<br>");
          ToastService.error(msg, "Falha");
        })
        .finally(function () { $scope.isSavingAppointment = false; });
    };

    $scope.isOverdue = function (invoice) {
      return invoice.status === "PENDING" && new Date(invoice.due_date) < new Date();
    };

    $scope.formatText = function (text) {
      if (!text) return "";
      return text.replace(/_/g, " ");
    };

    $scope.getMethodIcon = function (method) {
      var icons = {
        CREDIT_CARD:       "credit_card",
        PIX:               "qr_code",
        HEALTH_INSURANCE:  "shield",
        CASH:              "payments",
      };
      return icons[method] || "receipt";
    };

    $scope.init();
  },
]);