angular.module("helixcare.patients").controller("PatientDetailController", [
  "$scope",
  "$stateParams",
  "$state",
  "AuthService",
  "PatientsService",
  "AppointmentsService",
  "BillingService",
  "ToastService",
  function (
    $scope,
    $stateParams,
    $state,
    AuthService,
    PatientsService,
    AppointmentsService,
    BillingService,
    ToastService,
  ) {
    $scope.currentUser = AuthService.getCurrentUser();

    $scope.patient = null;
    $scope.isLoading = true;
    $scope.patientAge = 0;

    $scope.activeTab = "RESUMO";

    $scope.nextAppointment = null;
    $scope.financials = { invoices: [], totalDebt: 0, hasDebt: false };

    $scope.setTab = function (tabName) {
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

    function loadPatientEcosystem(patientId) {
      var todayStr = new Date().toISOString().split("T")[0];

      AppointmentsService.getAppointments({
        patient_id: patientId,
        status: "SCHEDULED",
        start_date: todayStr,
        limit: 1,
      })
        .then(function (res) {
          var appts = res.data || res.items || res;
          if (appts && appts.length > 0) {
            $scope.nextAppointment = appts[0];
          }
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
            if (invs) {
              $scope.financials.invoices = invs;
              angular.forEach(invs, function (inv) {
                if (inv.status === "PENDING") {
                  $scope.financials.totalDebt += parseFloat(inv.amount);
                  if (new Date(inv.due_date) < new Date()) {
                    $scope.financials.hasDebt = true;
                  }
                }
              });
            }
          })
          .catch(function (err) {
            console.warn("Erro ao carregar ecossistema financeiro.", err);
          });
      }
    }

    $scope.init = function () {
      var patientId = $stateParams.id;

      if (!patientId) {
        ToastService.error("ID do paciente não fornecido.");
        $state.go("patients");
        return;
      }

      PatientsService.getPatientById(patientId)
        .then(function (data) {
          $scope.patient = data;
          $scope.patientAge = calculateAge(data.birth_date);
          loadPatientEcosystem(patientId);
        })
        .catch(function (err) {
          console.error("Erro ao buscar paciente:", err);
          ToastService.error("Erro ao carregar dados do paciente.");
          $state.go("patients");
        })
        .finally(function () {
          $scope.isLoading = false;
        });
    };

    $scope.isOverdue = function (invoice) {
      return (
        invoice.status === "PENDING" && new Date(invoice.due_date) < new Date()
      );
    };

    $scope.formatText = function (text) {
      if (!text) return "";
      return text.replace(/_/g, " ");
    };

    $scope.getMethodIcon = function (method) {
      switch (method) {
        case "CREDIT_CARD":
          return "credit_card";
        case "PIX":
          return "qr_code";
        case "HEALTH_INSURANCE":
          return "shield";
        case "CASH":
          return "payments";
        default:
          return "receipt";
      }
    };

    $scope.init();
  },
]);
