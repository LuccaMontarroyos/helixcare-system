angular.module('helixcare')
.controller('MainController', [
    '$scope',
    '$rootScope',
    '$state', 
    'AuthService', 
    'GlobalSearchService', 
    function($scope, $rootScope, $state, AuthService, GlobalSearchService) {
        var vm = this;

        $rootScope.isAppReady = false;

        vm.showSplash = function() {
            return AuthService.isAuthenticated() && !$rootScope.isAppReady && $state.current.name !== 'login';
        };

        vm.showLayout = function() {
            if (!$state.current || !$state.current.name || $state.current.name === 'login') return false;
            return AuthService.isAuthenticated();
        };

        vm.isLoggedIn = function() { return AuthService.isAuthenticated(); };

        vm.showLayout = function() {
            if (!$state.current || !$state.current.name) return false;
            
            if ($state.current.name === 'login') return false;
            
            return AuthService.isAuthenticated();
        };
        
        vm.currentUser = function() { 
            return AuthService.getCurrentUser(); 
        };
        
        vm.logout = function() {
            AuthService.logout();
            $state.go('login');
        };

        vm.isStateActive = function(menuItem) {
            if (menuItem === 'patients') {
                return $state.current.name === 'patients' || $state.current.name === 'patient-detail';
            }
            return $state.current.name === menuItem;
        };
        
        vm.search = {
            term: '',
            results: null,
            isOpen: false,
            isLoading: false,
            isEmpty: false
        };

        vm.doSearch = function() {
            if (!vm.search.term || vm.search.term.length < 2) {
                vm.search.isOpen = false;
                vm.search.results = null;
                return;
            }

            vm.search.isLoading = true;
            vm.search.isOpen = true;

            GlobalSearchService.search(vm.search.term)
                .then(function(data) {
                    vm.search.results = data;
                    vm.search.isEmpty = (data.patients.length === 0 && data.doctors.length === 0 && data.appointments.length === 0);
                })
                .catch(function(err) {
                    console.error("Erro na busca global", err);
                })
                .finally(function() {
                    vm.search.isLoading = false;
                });
        };

        vm.selectResult = function(item) {
            vm.closeSearch();

            if (item.type === 'PATIENT') {
                $state.go('patient-detail', { id: item.id });
            } else if (item.type === 'APPOINTMENT' || item.type === 'DOCTOR') {
                $state.go('appointments'); 
            }
        };

        vm.closeSearch = function() {
            vm.search.isOpen = false;
            vm.search.term = '';
        };

        $scope.$state = $state;
}]);