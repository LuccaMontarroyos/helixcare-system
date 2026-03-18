angular.module('helixcare')
.factory('ToastService', ['$timeout', function($timeout) {
    var toasts = [];

    function addToast(type, title, message) {
        var toast = { 
            type: type, 
            title: title, 
            message: message, 
            id: Date.now() + Math.random() 
        };
        
        toasts.push(toast);
        $timeout(function() {
            removeToast(toast.id);
        }, 4000);
    }

    function removeToast(id) {
        for (var i = 0; i < toasts.length; i++) {
            if (toasts[i].id === id) {
                toasts.splice(i, 1);
                break;
            }
        }
    }

    return {
        getToasts: function() { return toasts; },
        remove: removeToast,
        success: function(message, title) { addToast('success', title || 'Sucesso', message); },
        error: function(message, title) { addToast('error', title || 'Erro', message); },
        warning: function(message, title) { addToast('warning', title || 'Atenção', message); },
        info: function(message, title) { addToast('info', title || 'Informação', message); }
    };
}]);