var app = angular.module('helixcareApp', ['ui.router']);

app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    
    $urlRouterProvider.otherwise('/login');

    $stateProvider
        .state('login', {
            url: '/login',
            template: '<div class="container" style="margin-top: 50px;"><h2>Bem-vindo ao Helixcare (Angular 1.3.7)</h2><p>Página de login em construção...</p></div>',
        })
        .state('dashboard', {
            url: '/dashboard',
            template: '<h1>Dashboard Administrativo</h1>',
        });
}]);