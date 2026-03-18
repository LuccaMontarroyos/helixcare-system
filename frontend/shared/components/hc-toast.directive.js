angular.module('helixcare')
.directive('hcToast', ['ToastService', function(ToastService) {
    return {
        restrict: 'E',
        replace: true,
        template: `
            <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
                <div ng-repeat="toast in toasts track by toast.id" 
                     class="pointer-events-auto flex items-start gap-3 p-4 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border-l-4 transition-all duration-300 transform translate-x-0"
                     ng-class="{
                         'border-emerald-500': toast.type === 'success',
                         'border-red-500': toast.type === 'error',
                         'border-amber-500': toast.type === 'warning',
                         'border-blue-500': toast.type === 'info'
                     }">
                     
                    <span ng-if="toast.type === 'success'" class="material-symbols-outlined text-emerald-500">check_circle</span>
                    <span ng-if="toast.type === 'error'" class="material-symbols-outlined text-red-500">error</span>
                    <span ng-if="toast.type === 'warning'" class="material-symbols-outlined text-amber-500">warning</span>
                    <span ng-if="toast.type === 'info'" class="material-symbols-outlined text-blue-500">info</span>
                    
                    <div class="flex-1">
                        <h4 class="text-sm font-bold text-slate-900 dark:text-white">{{ toast.title }}</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ toast.message }}</p>
                    </div>
                    
                    <button ng-click="removeToast(toast.id)" class="text-slate-400 hover:text-slate-600">
                        <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            </div>
        `,
        link: function(scope) {
            scope.toasts = ToastService.getToasts();
            scope.removeToast = function(id) {
                ToastService.remove(id);
            };
        }
    };
}]);