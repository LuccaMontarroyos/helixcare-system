angular.module("helixcare.patients").controller("PatientListController", [
  "$scope",
  "$state",
  "PatientsService",
  "ToastService",
  function ($scope, $state, PatientsService, ToastService) {
    $scope.patients = [];
    $scope.isLoading = true;

    $scope.isModalOpen = false;
    $scope.isSaving = false;
    $scope.patientForm = {};
    $scope.currentStep = 1;

    $scope.init = function () {
      $scope.loadPatients();
    };

    $scope.loadPatients = function () {
      PatientsService.getPatients()
        .then(function (data) {
          $scope.patients = data.items || data;
        })
        .catch(function (err) {
          ToastService.error("Erro ao carregar lista de pacientes.");
        })
        .finally(function () {
          $scope.isLoading = false;
        });
    };

    $scope.openModal = function () {
      $scope.patientForm = {};
      $scope.currentStep = 1;
      $scope.isModalOpen = true;
    };

    $scope.closeModal = function () {
      $scope.isModalOpen = false;
    };

    $scope.nextStep = function () {
      if (
        !$scope.patientForm.name ||
        !$scope.patientForm.cpf ||
        !$scope.patientForm.birth_date
      ) {
        ToastService.warning(
          "Preencha os campos obrigatórios (*) antes de continuar.",
        );
        return;
      }
      $scope.currentStep = 2;
    };

    $scope.prevStep = function () {
      $scope.currentStep = 1;
    };

    function formatDateToISO(dateStringOrObject) {
      if (!dateStringOrObject) return null;
      var d = new Date(dateStringOrObject);
      var month = "" + (d.getMonth() + 1),
        day = "" + d.getDate(),
        year = d.getFullYear();
      if (month.length < 2) month = "0" + month;
      if (day.length < 2) day = "0" + day;
      return [year, month, day].join("-");
    }

    $scope.savePatient = function () {
      $scope.isSaving = true;

      var avatarFile = $scope.patientForm.avatarFile;

      var payloadDto = {
        name: $scope.patientForm.name,
        cpf: $scope.patientForm.cpf
          ? $scope.patientForm.cpf.replace(/\D/g, "")
          : "",
        birth_date: formatDateToISO($scope.patientForm.birth_date),
        gender: $scope.patientForm.gender || null,
        blood_type: $scope.patientForm.blood_type || null,
        allergies: $scope.patientForm.allergies || null,

        contact_info: {
          phone: $scope.patientForm.phone
            ? $scope.patientForm.phone.replace(/\D/g, "")
            : "",
          emergency_contact: $scope.patientForm.emergency_contact,
          emergency_phone: $scope.patientForm.emergency_phone
            ? $scope.patientForm.emergency_phone.replace(/\D/g, "")
            : "",
        },

        address: {
          zip_code: $scope.patientForm.zip_code
            ? $scope.patientForm.zip_code.replace(/\D/g, "")
            : "",
          street: $scope.patientForm.street || "",
          number: $scope.patientForm.number || "",
          city: $scope.patientForm.city || "",
          state: $scope.patientForm.state || "",
        },

        insurance_provider: $scope.patientForm.insurance_provider || null,
        insurance_number: $scope.patientForm.insurance_number || null,
      };
      if (!payloadDto.address.street && !payloadDto.address.zip_code) {
        delete payloadDto.address;
      }

      PatientsService.createPatient(payloadDto)
        .then(function (newPatient) {
          if (avatarFile && newPatient.id) {
            return PatientsService.uploadAvatar(newPatient.id, avatarFile)
              .then(function (updatedPatient) {
                return updatedPatient;
              })
              .catch(function (uploadError) {
                ToastService.warning(
                  "Paciente salvo, mas falha ao subir a foto.",
                  "Aviso",
                );
                return newPatient;
              });
          }
          return newPatient;
        })
        .then(function (finalPatient) {
          $scope.patients.unshift(finalPatient);
          $scope.closeModal();
          ToastService.success("Paciente cadastrado com sucesso!", "Sucesso");
        })
        .catch(function (error) {
          var msg = error.message || "Erro de validação. Verifique os dados.";
          if (angular.isArray(msg)) {
            msg = msg.join("<br>");
          }
          ToastService.error(msg, "Falha");

          if (
            msg.toLowerCase().includes("cpf") ||
            msg.toLowerCase().includes("nome")
          ) {
            $scope.currentStep = 1;
          }
        })
        .finally(function () {
          $scope.isSaving = false;
        });
    };

    $scope.goToPatient = function (patient) {
      ToastService.info(
        "A Visão 360º do paciente " +
          patient.name.split(" ")[0] +
          " será implementada no próximo módulo.",
        "Em breve",
      );
    };

    $scope.init();
  },
]);
