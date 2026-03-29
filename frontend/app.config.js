angular
  .module("helixcare")
  .constant("BRAZILIAN_STATES", [
    { id: "AC", name: "Acre" },
    { id: "AL", name: "Alagoas" },
    { id: "AP", name: "Amapá" },
    { id: "AM", name: "Amazonas" },
    { id: "BA", name: "Bahia" },
    { id: "CE", name: "Ceará" },
    { id: "DF", name: "Distrito Federal" },
    { id: "ES", name: "Espírito Santo" },
    { id: "GO", name: "Goiás" },
    { id: "MA", name: "Maranhão" },
    { id: "MT", name: "Mato Grosso" },
    { id: "MS", name: "Mato Grosso do Sul" },
    { id: "MG", name: "Minas Gerais" },
    { id: "PA", name: "Pará" },
    { id: "PB", name: "Paraíba" },
    { id: "PR", name: "Paraná" },
    { id: "PE", name: "Pernambuco" },
    { id: "PI", name: "Piauí" },
    { id: "RJ", name: "Rio de Janeiro" },
    { id: "RN", name: "Rio Grande do Norte" },
    { id: "RS", name: "Rio Grande do Sul" },
    { id: "RO", name: "Rondônia" },
    { id: "RR", name: "Roraima" },
    { id: "SC", name: "Santa Catarina" },
    { id: "SP", name: "São Paulo" },
    { id: "SE", name: "Sergipe" },
    { id: "TO", name: "Tocantins" },
  ])
  .factory("JwtInterceptor", [
    "$window",
    "$q",
    "$injector",
    function ($window, $q, $injector) {
      return {
        request: function (config) {
          config.headers = config.headers || {};
          var token = $window.localStorage.getItem("hc_token");
          if (token) {
            config.headers.Authorization = "Bearer " + token;
          }
          return config;
        },
        response: function (response) {
          var $rootScope = $injector.get("$rootScope");
          if (!$rootScope.isAppReady) {
              $rootScope.isAppReady = true;
          }
          return response;
      },

        responseError: function (rejection) {
          if (rejection.status === 401) {
            $window.localStorage.removeItem("hc_token");
            $window.localStorage.removeItem("hc_user");

            var $rootScope = $injector.get("$rootScope");
            var $state = $injector.get("$state");

            $rootScope.isAppReady = true;
            $state.go("login");
          }
          return $q.reject(rejection);
        },
      };
    },
  ])

  .config([
    "$stateProvider",
    "$urlRouterProvider",
    "$httpProvider",
    function ($stateProvider, $urlRouterProvider, $httpProvider) {
      $httpProvider.interceptors.push("JwtInterceptor");

      $urlRouterProvider.otherwise("/login");

      $stateProvider
        .state("login", {
          url: "/login",
          templateUrl: "modules/auth/views/login.html",
          controller: "LoginController",
          data: { requireAuth: false },
        })
        .state("dashboard", {
          url: "/dashboard",
          templateUrl: "modules/analytics/views/dashboard.html",
          controller: "DashboardController",
          data: {
            requireAuth: true,
            allowedRoles: [
              "ADMIN",
            ],
          },
        })
        .state("billing", {
          url: "/billing",
          templateUrl: "modules/billing/views/billing.html",
          controller: "BillingController",
          data: {
            requireAuth: true,
            allowedRoles: ["ADMIN", "RECEPTIONIST"],
          },
        })
        .state("exams-laboratory", {
          url: "/exams/lab",
          templateUrl: "modules/exams/views/lab-board.html",
          controller: "LabController",
          data: {
            requireAuth: true,
            allowedRoles: ["ADMIN", "LAB_TECHNICIAN"],
          },
        })
        .state("patients", {
          url: "/patients",
          templateUrl: "modules/patients/views/list.html",
          controller: "PatientListController",
          data: {
            requireAuth: true,
            allowedRoles: ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE"],
          },
        })
        .state("patient-detail", {
          url: "/patients/:id",
          templateUrl: "modules/patients/views/detail.html",
          controller: "PatientDetailController",
          data: {
            requireAuth: true,
            allowedRoles: [
              "ADMIN",
              "RECEPTIONIST",
              "DOCTOR",
              "NURSE",
              "LAB_TECHNICIAN",
            ],
          },
        })
        .state("appointments", {
          url: "/appointments",
          templateUrl: "modules/appointments/views/list.html",
          controller: "AppointmentsController",
          data: {
            requireAuth: true,
            allowedRoles: [
              "ADMIN",
              "RECEPTIONIST",
              "DOCTOR",
              "NURSE",
              "LAB_TECHNICIAN",
            ],
          },
        })
        .state("patient-medical-records", {
          url: "/patients/:patientId/medical-records?appointmentId",
          templateUrl: "modules/medical-records/views/board.html",
          controller: "MedicalRecordsController",
          data: {
            requireAuth: true,
            allowedRoles: ["ADMIN", "DOCTOR", "NURSE"],
          },
        })
        .state("medical-records-hub", {
          url: "/medical-records",
          templateUrl: "modules/medical-records/views/hub.html",
          controller: "MedicalRecordsHubController",
          data: {
            requireAuth: true,
            allowedRoles: ["ADMIN", "DOCTOR", "NURSE"],
          },
        });
    },
  ]);
