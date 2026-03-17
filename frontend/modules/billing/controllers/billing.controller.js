angular.module("helixcare.billing").controller("BillingController", [
  "$scope",
  "$rootScope",
  "$q",
  "BillingService",
  "PatientsService",
  "AppointmentsService",
  "ExamsService",
  "ToastService",
  function (
    $scope,
    $rootScope,
    $q,
    BillingService,
    PatientsService,
    AppointmentsService,
    ExamsService,
    ToastService,
  ) {
    $rootScope.pageSpecificTitle = "Faturamento e Caixa";

    $scope.invoices = [];
    $scope.isLoading = true;

    $scope.summary = {
      totalRevenue: 0,
      pendingPayments: 0,
      insuranceClaims: 0,
    };

    $scope.filters = {
      page: 1,
      limit: 15,
      status: "",
      payment_method: "",
      search: "",
    };
    $scope.pagination = { totalItems: 0, totalPages: 1 };
    $scope.pageNumbers = [1];

    $scope.isModalOpen = false;
    $scope.newInvoice = {
      patient_id: null,
      amount: "",
      due_date: "",
      payment_method: "CREDIT_CARD",
      notes: "",
    };
    $scope.patientTypeahead = {
      term: "",
      results: [],
      isOpen: false,
      loading: false,
    };

    $scope.init = function () {
      $scope.loadInvoices();
    };

    var statusDict = {
      PENDING: "Pendente",
      PAID: "Pago",
      BILLED_TO_INSURANCE: "Enviado ao Convênio",
      CANCELED: "Cancelado",
    };

    var methodDict = {
      CREDIT_CARD: "Cartão de Crédito",
      PIX: "PIX",
      CASH: "Dinheiro",
      HEALTH_INSURANCE: "Convênio",
    };

    $scope.loadInvoices = function () {
      $scope.isLoading = true;

      var queryParams = angular.copy($scope.filters);
      if (!queryParams.status) delete queryParams.status;
      if (!queryParams.payment_method) delete queryParams.payment_method;
      delete queryParams.search;

      BillingService.getInvoices(queryParams)
        .then(function (res) {
          var fetchedInvoices = res.data || res;

          angular.forEach(fetchedInvoices, function (inv) {
            inv.status_pt = statusDict[inv.status] || inv.status;
            inv.method_pt =
              methodDict[inv.payment_method] || inv.payment_method;
          });

          $scope.invoices = fetchedInvoices;

          $scope.pagination.totalItems = res.total || $scope.invoices.length;
          $scope.pagination.totalPages = res.total_pages || 1;
          $scope.filters.page = res.current_page || $scope.filters.page;

          generatePageNumbers();
          calculateSummary($scope.invoices);
        })
        .catch(function () {
          ToastService.error("Falha ao carregar as faturas.");
        })
        .finally(function () {
          $scope.isLoading = false;
        });
    };

    function calculateSummary(invoicesList) {
      $scope.summary = {
        totalRevenue: 0,
        pendingPayments: 0,
        insuranceClaims: 0,
      };
      angular.forEach(invoicesList, function (inv) {
        var amt = parseFloat(inv.amount);
        if (inv.status === "PAID") $scope.summary.totalRevenue += amt;
        else if (inv.status === "PENDING")
          $scope.summary.pendingPayments += amt;
        else if (inv.status === "BILLED_TO_INSURANCE")
          $scope.summary.insuranceClaims += amt;
      });
    }

    $scope.applyFilters = function () {
      $scope.filters.page = 1;
      $scope.loadInvoices();
    };

    $scope.clearFilters = function () {
      $scope.filters.status = "";
      $scope.filters.payment_method = "";
      $scope.applyFilters();
    };

    function generatePageNumbers() {
      var pages = [];
      var startPage = Math.max(1, $scope.filters.page - 2);
      var endPage = Math.min($scope.pagination.totalPages, startPage + 4);
      startPage = Math.max(1, endPage - 4);
      for (var i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      $scope.pageNumbers = pages;
    }

    $scope.goToPage = function (pageNumber) {
      if (
        pageNumber < 1 ||
        pageNumber > $scope.pagination.totalPages ||
        pageNumber === $scope.filters.page
      )
        return;
      $scope.filters.page = pageNumber;
      $scope.loadInvoices();
    };

    $scope.markAsPaid = function (invoice) {
      if (
        !confirm("Confirmar recebimento do valor de R$ " + invoice.amount + "?")
      )
        return;

      var payload = {
        status: "PAID",
        paid_at: new Date().toISOString(),
        notes:
          invoice.notes +
          "\n[Baixa manual em " +
          new Date().toLocaleDateString() +
          "]",
      };

      BillingService.updateStatus(invoice.id, payload)
        .then(function () {
          ToastService.success("Fatura baixada com sucesso!");
          $scope.loadInvoices();
        })
        .catch(function () {
          ToastService.error("Erro ao dar baixa na fatura.");
        });
    };

    $scope.billToInsurance = function (invoice) {
      var payload = { status: "BILLED_TO_INSURANCE", notes: invoice.notes };
      BillingService.updateStatus(invoice.id, payload)
        .then(function () {
          ToastService.success("Fatura enviada para o convênio!");
          $scope.loadInvoices();
        })
        .catch(function () {
          ToastService.error("Erro ao atualizar fatura.");
        });
    };

    $scope.deleteInvoice = function (invoice) {
      if (!confirm("Cancelar a fatura #" + invoice.id.substring(0, 8) + "?"))
        return;
      BillingService.deleteInvoice(invoice.id)
        .then(function () {
          ToastService.success("Fatura cancelada.");
          $scope.loadInvoices();
        })
        .catch(function () {
          ToastService.error("Erro ao cancelar fatura.");
        });
    };

    $scope.openModal = function () {
      $scope.newInvoice = {
        patient_id: null,
        amount: "",
        due_date: new Date(),
        payment_method: "CREDIT_CARD",
        notes: "",
        link_type: "appointment",
        appointment_id: "",
        exam_id: "",
      };
      $scope.patientTypeahead = {
        term: "",
        results: [],
        isOpen: false,
        loading: false,
      };
      $scope.patientAppointments = [];
      $scope.patientExams = [];
      $scope.isLoadingLinks = false;
      $scope.isModalOpen = true;
    };

    $scope.closeModal = function () {
      $scope.isModalOpen = false;
    };

    $scope.searchPatients = function () {
      $scope.newInvoice.patient_id = null;
      if (!$scope.patientTypeahead.term) {
        $scope.patientTypeahead.isOpen = false;
        return;
      }
      $scope.patientTypeahead.loading = true;
      PatientsService.getPatients({ search: $scope.patientTypeahead.term })
        .then(function (res) {
          $scope.patientTypeahead.results = res.items || res.data || res;
          $scope.patientTypeahead.isOpen = true;
        })
        .finally(function () {
          $scope.patientTypeahead.loading = false;
        });
    };

    $scope.selectPatient = function(p) {
      $scope.newInvoice.patient_id = p.id;
      $scope.patientTypeahead.term = p.name;
      $scope.patientTypeahead.isOpen = false;
      
      $scope.newInvoice.appointment_id = '';
      $scope.newInvoice.exam_id = '';
      $scope.isLoadingLinks = true;

      $q.all([
          AppointmentsService.getAppointments({ patient_id: p.id, limit: 50 }),
          ExamsService.getExams({ patient_id: p.id, limit: 50 })
      ]).then(function(results) {
          $scope.patientAppointments = results[0].data || results[0].items || results[0];
          

          $scope.patientExams = results[1].data || results[1].items || results[1];
      }).catch(function() {
          ToastService.error("Erro ao carregar o histórico clínico do paciente.");
      }).finally(function() {
          $scope.isLoadingLinks = false;
      });
  };

    $scope.submitInvoice = function () {
      if (
        !$scope.newInvoice.patient_id ||
        !$scope.newInvoice.amount ||
        !$scope.newInvoice.due_date
      ) {
        ToastService.warning("Preencha todos os campos obrigatórios.");
        return;
      }

      if (!$scope.newInvoice.appointment_id && !$scope.newInvoice.exam_id) {
        ToastService.warning(
          "A fatura deve ser vinculada a uma Consulta ou a um Exame.",
        );
        return;
      }

      var payload = {
        patient_id: $scope.newInvoice.patient_id,
        amount: $scope.newInvoice.amount,
        due_date: new Date($scope.newInvoice.due_date).toISOString(),
        payment_method: $scope.newInvoice.payment_method,
        notes: $scope.newInvoice.notes,
      };

      if ($scope.newInvoice.link_type === "appointment") {
        payload.appointment_id = $scope.newInvoice.appointment_id;
      } else {
        payload.exam_id = $scope.newInvoice.exam_id;
      }

      $scope.isSaving = true;
      BillingService.createInvoice(payload)
        .then(function () {
          ToastService.success("Cobrança gerada com sucesso!");
          $scope.isModalOpen = false;
          $scope.loadInvoices();
        })
        .catch(function (err) {
          var msg = err.message || err.error || "Erro ao gerar cobrança.";
          if (angular.isArray(msg)) msg = msg.join("<br>");
          ToastService.error(msg);
        })
        .finally(function () {
          $scope.isSaving = false;
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
