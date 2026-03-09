angular
  .module("helixcare")

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

        responseError: function (rejection) {
          if (rejection.status === 401) {
            $window.localStorage.removeItem("hc_token");
            $window.localStorage.removeItem("hc_user");

            var $state = $injector.get("$state");
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
              "DOCTOR",
              "RECEPTIONIST",
              "NURSE",
              "LAB_TECHNICIAN",
            ],
          },
        })
        .state('billing', {
            url: '/billing',
            templateUrl: 'modules/billing/views/billing.html',
            controller: 'BillingController',
            data: { 
                requireAuth: true,
                allowedRoles: ['ADMIN', 'RECEPTIONIST'] 
            }
        })
        .state('exams-laboratory', {
            url: '/exams/lab',
            templateUrl: 'modules/exams/views/lab-board.html',
            controller: 'LabController',
            data: { 
                requireAuth: true,
                allowedRoles: ['ADMIN', 'LAB_TECHNICIAN'] 
            }
        })
        .state('patients', {
          url: '/patients',
          templateUrl: 'modules/patients/views/list.html',
          controller: 'PatientListController',
          data: { 
              requireAuth: true,
              allowedRoles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'] 
          }
      });
    },
  ]);
