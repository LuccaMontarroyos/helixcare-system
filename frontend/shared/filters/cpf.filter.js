angular.module('helixcare')
.filter('cpfFilter', function() {
    return function(input) {
        if (!input) return '';
        
        var str = input.toString().replace(/\D/g, ''); 
        
        if (str.length !== 11) return input; 
        
        return str.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    };
});