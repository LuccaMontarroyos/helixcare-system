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
    "ToastService",
    function (
      $scope,
      $rootScope,
      $stateParams,
      $q,
      MedicalRecordsService,
      PatientsService,
      AppointmentsService,
      ToastService,
    ) {
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
        isLocked: false,
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
          isLocked: false,
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
          social_history: record.social_history || {
            is_smoker: false,
            consumes_alcohol: false,
            notes: "",
          },
          attachments: record.attachments || [],
          isLocked: false,
          lockedBy: null,
        };

        MedicalRecordsService.lockRecord(record.id).catch(function (err) {
          $scope.editor.isLocked = true;
          $scope.editor.lockedBy = err.lockedBy || "Outro profissional";
          ToastService.warning(
            "Este registro está sendo editado por " + $scope.editor.lockedBy,
          );
        });
      };

      $scope.releaseLock = function () {
        if (
          !$scope.editor.isNew &&
          $scope.editor.id &&
          !$scope.editor.isLocked
        ) {
          MedicalRecordsService.unlockRecord($scope.editor.id);
        }
      };

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
          .then(function () {
            ToastService.success("Evolução salva com sucesso!");
            $scope.init();
            $scope.startNewEvolution();

            if ($scope.editor.isNew) {
              var today = new Date();
              var dateString =
                today.getFullYear() +
                "-" +
                String(today.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(today.getDate()).padStart(2, "0");

              AppointmentsService.getAppointments({
                patient_id: $scope.patient.id,
                date: dateString,
                status: "CONFIRMED",
              }).then(function (res) {
                var appointments = res.items || res.data || res;
                if (appointments && appointments.length > 0) {
                  AppointmentsService.updateAppointment(appointments[0].id, {
                    patient_id: $scope.patient.id,
                    appointment_date: appointments[0].appointment_date,
                    status: "COMPLETED",
                  }).then(function () {
                    console.log(
                      "Automação: Consulta do paciente baixada para COMPLETED automaticamente.",
                    );
                  });
                }
              });
            }
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
