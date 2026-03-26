angular
  .module("helixcare.medicalRecords")
  .controller("MedicalRecordsController", [
    "$scope",
    "$rootScope",
    "$stateParams",
    "$q",
    "MedicalRecordsService",
    "PatientsService",
    "AppointmentsService",
    "AuthService",
    "ToastService",
    function (
      $scope,
      $rootScope,
      $stateParams,
      $q,
      MedicalRecordsService,
      PatientsService,
      AppointmentsService,
      AuthService,
      ToastService,
    ) {

      $scope.currentUser = AuthService.getCurrentUser();
      $scope.patient = null;
      $scope.history = [];
      $scope.isLoading = true;

      $scope.editor = {
        isNew: true,
        id: null,
        anamnesis: "",
        diagnosis: "",
        prescription: "",
        social_history: {
          is_smoker: false,
          consumes_alcohol: false,
          notes: "",
        },
        attachments: [],
        isLockedByOther: false,
        lockedBy: null,
      };

      $scope.init = function () {
        var patientId = $stateParams.patientId;
        $q.all([
          PatientsService.getPatientById(patientId),
          MedicalRecordsService.getPatientHistory(patientId),
        ])
          .then(function (results) {
            $scope.patient = results[0];
            $scope.history = results[1].items || results[1].data || results[1];
            $rootScope.pageSpecificTitle = $scope.patient.name;
          })
          .catch(function () {
            ToastService.error("Falha ao carregar o prontuário.");
          })
          .finally(function () {
            $scope.isLoading = false;
          });
      };

      $scope.startNewEvolution = function (showToast) {
        $scope.releaseLock();
        $scope.editor = {
          isNew: true,
          id: null,
          anamnesis: "",
          diagnosis: "",
          prescription: "",
          social_history: {
            is_smoker: false,
            consumes_alcohol: false,
            notes: "",
          },
          attachments: [],
          isLockedByOther: false,
          lockedBy: null,
        };

        if (showToast) {
          ToastService.info("Rascunho descartado. Prancheta limpa.");
        }
      };

      $scope.viewRecord = function (record) {
        $scope.releaseLock();

        $scope.editor = {
          isNew: false,
          id: record.id,
          anamnesis: record.anamnesis || record.notes,
          diagnosis: record.diagnosis,
          prescription: record.prescription,
          social_history: record.social_history || { is_smoker: false, consumes_alcohol: false, notes: "" },
          attachments: record.attachments || [],
          isLockedByOther: false,
          lockedBy: null,
        };

        MedicalRecordsService.getLockStatus(record.id)
          .then(function (status) {
            var isLocked = status.isLocked;
            var lockedBy = status.lockedBy;

            if (isLocked && lockedBy !== $scope.currentUser.id && lockedBy !== $scope.currentUser.name) {
              $scope.editor.isLockedByOther = true;
              $scope.editor.lockedBy = lockedBy || "Outro profissional";
              ToastService.warning("Atenção: Este prontuário está sendo editado por " + $scope.editor.lockedBy);
            } else {
              MedicalRecordsService.lockRecord(record.id)
                .then(function () {
                  $scope.editor.isLockedByOther = false;
                  $scope.editor.lockedBy = $scope.currentUser.name;
                })
                .catch(function (err) {
                  $scope.editor.isLockedByOther = true;
                  $scope.editor.lockedBy = err.lockedBy || "Outro profissional";
                  ToastService.warning("O registro acabou de ser travado por " + $scope.editor.lockedBy);
                });
            }
          })
          .catch(function (err) {
            console.error("Erro ao verificar status da trava:", err);
          });
      };

      $scope.releaseLock = function () {

        if (!$scope.editor.isNew && $scope.editor.id && !$scope.editor.isLockedByOther) {
          MedicalRecordsService.unlockRecord($scope.editor.id).catch(angular.noop);
        }
      };

      $scope.$on("$destroy", function () {
        $scope.releaseLock();
      });

      $scope.$on("$destroy", function () {
        $scope.releaseLock();
      });

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
          patient_id: $scope.patient.id,
          anamnesis: $scope.editor.anamnesis,
          diagnosis: $scope.editor.diagnosis || null,
          prescription: $scope.editor.prescription || null,
          social_history: $scope.editor.social_history,
        };

        var request = $scope.editor.isNew
          ? MedicalRecordsService.createRecord(payload)
          : MedicalRecordsService.updateRecord($scope.editor.id, payload);

        request
          .then(function (res) {
            var recordId =
              res.id || (res.data && res.data.id) || $scope.editor.id;
            var newFiles = $scope.editor.attachments.filter(function (a) {
              return !a.url;
            });

            if (newFiles.length > 0) {
              var uploadPromises = newFiles.map(function (file) {
                return MedicalRecordsService.uploadAttachment(recordId, file);
              });

              return $q.all(uploadPromises).then(function () {
                return res;
              });
            }
            return res;
          })
          .then(function (res) {
            var isNewEvolution = $scope.editor.isNew;
            var sourceAppointmentId = $stateParams.appointmentId;

            if (isNewEvolution && sourceAppointmentId) {
              AppointmentsService.getAppointmentById(sourceAppointmentId)
                .then(function (appt) {
                  if (appt.status === "CONFIRMED") {
                    var payload = {
                      patient_id: appt.patient
                        ? appt.patient.id
                        : appt.patient_id || null,
                      doctor_id: appt.doctor
                        ? appt.doctor.id
                        : appt.doctor_id || null,
                      appointment_date: appt.appointment_date,
                      notes: appt.notes || "",
                      status: "COMPLETED",
                    };

                    return AppointmentsService.updateAppointment(
                      appt.id,
                      payload,
                    );
                  } else {
                    console.warn(
                      "[ALERTA] A consulta não está CONFIRMED. Status atual:",
                      appt.status,
                    );
                    return $q.reject("Status_Invalido");
                  }
                })
                .then(function () {
                  ToastService.info(
                    "A consulta na agenda foi marcada como concluída.",
                  );
                })
                .catch(function (err) {
                  if (err !== "Status_Invalido") {
                    console.error(
                      "[ERRO FATAL NA AUTOMAÇÃO] Falha ao atualizar agenda:",
                      err,
                    );
                  }
                });
            }
            ToastService.success("Evolução salva com sucesso!");
            $scope.init();
            $scope.startNewEvolution();
          })
          .catch(function (err) {
            var msg =
              err.message || err.error || "Falha ao salvar o prontuário.";
            if (angular.isArray(msg)) msg = msg.join("<br>");
            ToastService.error(msg, "Erro de Validação");
          })
          .finally(function () {
            $scope.isSaving = false;
          });
      };

      $scope.init();
    },
  ]);
