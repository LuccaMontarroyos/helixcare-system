    angular.module('helixcare')
.directive('hcHasRole', ['AuthService', function(AuthService) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var allowedRoles = scope.$eval(attrs.hcHasRole);
            
            if (!AuthService.hasAnyRole(allowedRoles)) {
                element.remove(); 
            }
        }
    };
}]);