angular.module("helixcare.exams").controller("LabController", [
  "$scope",
  "$rootScope",
  "$q",
  "ExamsService",
  "PatientsService",
  "AuthService",
  "ToastService",
  function (
    $scope,
    $rootScope,
    $q,
    ExamsService,
    PatientsService,
    AuthService,
    ToastService,
  ) {
    $rootScope.pageSpecificTitle = "Laboratório Clínico";

    $scope.currentUser = AuthService.getCurrentUser();
    $scope.exams = [];
    $scope.isLoading = true;

    $scope.filters = {
      page: 1,
      limit: 10,
      status: "",
      exam_type: "",
    };

    $scope.pagination = { totalItems: 0, totalPages: 1 };
    $scope.pageNumbers = [1];

    $scope.isRequestModalOpen = false;
    $scope.newExam = { patient_id: null, exam_type: "", observations: "" };
    $scope.patientTypeahead = {
      term: "",
      results: [],
      isOpen: false,
      loading: false,
    };

    $scope.resultModal = {
      isOpen: false,
      exam: null,
      result_text: "",
      file: null,
      isSaving: false,
    };

    $scope.viewReportModal = {
      isOpen: false,
      exam: null,
    };

    $scope.openViewReportModal = function (exam) {
      $scope.viewReportModal = {
        isOpen: true,
        exam: exam,
      };
    };

    $scope.init = function () {
      $scope.loadExams();
    };

    $scope.applyFilters = function () {
      $scope.filters.page = 1;
      $scope.loadExams();
    };

    $scope.clearFilters = function () {
      $scope.filters.status = "";
      $scope.filters.exam_type = "";
      $scope.applyFilters();
    };

    function generatePageNumbers() {
      var pages = [];
      var maxPagesToShow = 5;
      var startPage = Math.max(1, $scope.filters.page - 2);
      var endPage = Math.min(
        $scope.pagination.totalPages,
        startPage + maxPagesToShow - 1,
      );
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
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
      $scope.loadExams();
    };

    $scope.loadExams = function () {
      $scope.isLoading = true;

      var queryParams = angular.copy($scope.filters);
      if (!queryParams.status) delete queryParams.status;
      if (!queryParams.exam_type) delete queryParams.exam_type;

      ExamsService.getExams(queryParams)
        .then(function (res) {
          $scope.exams = res.data || res;

          $scope.pagination.totalItems = res.total || $scope.exams.length;
          $scope.pagination.totalPages = res.total_pages || 1;
          $scope.filters.page = res.current_page || $scope.filters.page;

          generatePageNumbers();
        })
        .catch(function () {
          ToastService.error("Falha ao carregar exames.");
        })
        .finally(function () {
          $scope.isLoading = false;
        });
    };

    $scope.openRequestModal = function () {
      $scope.newExam = { patient_id: null, exam_type: "", observations: "" };
      $scope.patientTypeahead.term = "";
      $scope.isRequestModalOpen = true;
    };

    $scope.searchPatients = function () {
      $scope.newExam.patient_id = null;
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

    $scope.selectPatient = function (p) {
      $scope.newExam.patient_id = p.id;
      $scope.patientTypeahead.term = p.name;
      $scope.patientTypeahead.isOpen = false;
    };

    $scope.submitExamRequest = function () {
      if (!$scope.newExam.patient_id || !$scope.newExam.exam_type) {
        ToastService.warning("Preencha os campos obrigatórios.");
        return;
      }
      $scope.isSaving = true;
      ExamsService.requestExam($scope.newExam)
        .then(function () {
          ToastService.success("Exame solicitado com sucesso!");
          $scope.isRequestModalOpen = false;
          $scope.loadExams();
        })
        .catch(function () {
          ToastService.error("Erro ao solicitar exame.");
        })
        .finally(function () {
          $scope.isSaving = false;
        });
    };

    $scope.cancelExam = function (exam) {
      if (
        !confirm(
          "Deseja cancelar a solicitação do exame: " + exam.exam_type + "?",
        )
      )
        return;
      ExamsService.cancelExam(exam.id)
        .then(function () {
          ToastService.success("Exame cancelado.");
          $scope.loadExams();
        })
        .catch(function () {
          ToastService.error("Erro ao cancelar.");
        });
    };

    $scope.startAnalysis = function (exam) {
      ExamsService.updateResult(exam.id, { status: "IN_PROGRESS" })
        .then(function () {
          ToastService.info("Análise iniciada.");
          $scope.loadExams();
        })
        .catch(function () {
          ToastService.error("Erro ao iniciar análise.");
        });
    };

    $scope.openResultModal = function (exam) {
      $scope.resultModal = {
        isOpen: true,
        exam: exam,
        result_text: "",
        file: null,
        isSaving: false,
      };
    };

    $scope.setResultFile = function (element) {
      $scope.$apply(function () {
        $scope.resultModal.file = element.files[0];
      });
    };

    $scope.submitResult = function () {
      $scope.resultModal.isSaving = true;

      var payload = {
        status: "COMPLETED",
        result_text: $scope.resultModal.result_text || "Laudo anexado.",
      };

      ExamsService.updateResult($scope.resultModal.exam.id, payload)
        .then(function () {
          if ($scope.resultModal.file) {
            return ExamsService.uploadReport(
              $scope.resultModal.exam.id,
              $scope.resultModal.file,
            );
          }
          return $q.resolve();
        })
        .then(function () {
          ToastService.success("Laudo finalizado com sucesso!");
          $scope.resultModal.isOpen = false;
          $scope.loadExams();
        })
        .catch(function () {
          ToastService.error("Falha ao enviar o laudo.");
        })
        .finally(function () {
          $scope.resultModal.isSaving = false;
        });
    };

    $scope.init();
  },
]);
