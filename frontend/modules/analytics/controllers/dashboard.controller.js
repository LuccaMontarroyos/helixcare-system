angular.module('helixcare.analytics')
.controller('DashboardController', [
    '$scope', '$rootScope', '$q', 'AnalyticsService', 'ToastService',
    function($scope, $rootScope, $q, AnalyticsService, ToastService) {
        
        $rootScope.pageSpecificTitle = 'Dashboard Gerencial';
        
        $scope.isLoading = true;
        
        $scope.finance = { paid: 0, pending: 0, ticket: 0, paidPercentage: 0 };
        $scope.clinical = { total: 0, byStatus: {}, chartBars: [] };
        $scope.lab = { requested: 0, in_progress: 0, completed: 0, total: 0 };

        var today = new Date();
        $scope.currentMonthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        $scope.dateFilter = {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: new Date(today.getFullYear(), today.getMonth() + 1, 0)
        };

        $scope.init = function() {
            $scope.loadDashboards();
        };

        $scope.applyCustomDate = function() {
            if (!$scope.dateFilter.start || !$scope.dateFilter.end) {
                ToastService.warning("Selecione data inicial e final.");
                return;
            }

            $scope.currentMonthName = $scope.dateFilter.start.toLocaleString('default', { month: 'short' }) + " - " + $scope.dateFilter.end.toLocaleString('default', { month: 'short', year: 'numeric' });
            $scope.loadDashboards();
        };

        $scope.loadDashboards = function() {
            $scope.isLoading = true;
            
            var sDate = $scope.dateFilter.start.toISOString().split('T')[0];
            var eDate = $scope.dateFilter.end.toISOString().split('T')[0];

            $q.all([
                AnalyticsService.getFinanceData(sDate, eDate),
                AnalyticsService.getClinicalData(sDate, eDate),
                AnalyticsService.getExamsData(sDate, eDate)
            ])
            .then(function(results) {
                processFinanceData(results[0]);
                processClinicalData(results[1]);
                processLabData(results[2]);
            })
            .catch(function(err) {
                ToastService.error("Falha ao carregar métricas do servidor.");
            })
            .finally(function() {
                $scope.isLoading = false;
            });
        };

        function processFinanceData(data) {
            $scope.finance.paid = data.revenue_paid || 0;
            $scope.finance.pending = data.revenue_pending || 0;
            $scope.finance.ticket = data.average_ticket || 0;
            
            var totalExpected = $scope.finance.paid + $scope.finance.pending;
            $scope.finance.paidPercentage = totalExpected > 0 ? Math.round(($scope.finance.paid / totalExpected) * 100) : 0;
        }

        function processClinicalData(data) {
            var rawStatus = data.appointments_by_status || [];
            $scope.clinical.total = 0;
            $scope.clinical.byStatus = { 'COMPLETED': 0, 'SCHEDULED': 0, 'CONFIRMED': 0, 'CANCELED': 0 };
            
            angular.forEach(rawStatus, function(item) {
                var count = parseInt(item.count, 10);
                $scope.clinical.byStatus[item.status] = count;
                $scope.clinical.total += count;
            });

            var baseMax = $scope.clinical.total || 10;
            $scope.clinical.chartBars = [];
            for (var i = 0; i < 12; i++) {
                var randomHeight = Math.floor(Math.random() * 60) + 30;
                $scope.clinical.chartBars.push(randomHeight);
            }
        }

        function processLabData(data) {
            var rawExams = data.exams_by_status || [];
            $scope.lab = { requested: 0, in_progress: 0, completed: 0, total: 0 };
            
            angular.forEach(rawExams, function(item) {
                var count = parseInt(item.count, 10);
                if (item.status === 'REQUESTED') $scope.lab.requested = count;
                if (item.status === 'IN_PROGRESS') $scope.lab.in_progress = count;
                if (item.status === 'COMPLETED') $scope.lab.completed = count;
                $scope.lab.total += count;
            });
        }

        $scope.getPercentage = function(part, total) {
            if (total === 0) return 0;
            return Math.round((part / total) * 100);
        };

        $scope.init();
    }
]);