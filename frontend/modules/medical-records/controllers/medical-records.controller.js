angular.module('helixcare.medicalRecords')
.controller('MedicalRecordsController', [
    '$scope', '$rootScope', '$stateParams', '$q', 'MedicalRecordsService', 'PatientsService', 'ToastService',
    function($scope, $rootScope, $stateParams, $q, MedicalRecordsService, PatientsService, ToastService) {
        
        $scope.patient = null;
        $scope.history = [];
        $scope.isLoading = true;
        
        $scope.editor = {
            isNew: true,
            id: null,
            title: 'Evolução Clínica',
            notes: '',
            attachments: [],
            isLocked: false,
            lockedBy: null
        };

        $scope.init = function() {
            var patientId = $stateParams.patientId;
            
            $q.all([
                PatientsService.getPatientById(patientId),
                MedicalRecordsService.getPatientHistory(patientId)
            ])
            .then(function(results) {
                $scope.patient = results[0];
                $scope.history = results[1].items || results[1].data || results[1];
                
                $rootScope.pageSpecificTitle = $scope.patient.name;
            })
            .catch(function() {
                ToastService.error("Falha ao carregar o prontuário.");
            })
            .finally(function() {
                $scope.isLoading = false;
            });
        };
        
        $scope.startNewEvolution = function() {
            $scope.releaseLock();
            $scope.editor = { isNew: true, id: null, title: 'Nova Evolução', notes: '', attachments: [], isLocked: false, lockedBy: null };
        };

        $scope.viewRecord = function(record) {
            $scope.releaseLock();
            
            $scope.editor = {
                isNew: false,
                id: record.id,
                title: record.title || 'Evolução Registrada',
                notes: record.notes,
                attachments: record.attachments || [],
                isLocked: false,
                lockedBy: null
            };

            MedicalRecordsService.lockRecord(record.id)
                .catch(function(err) {
                    $scope.editor.isLocked = true;
                    $scope.editor.lockedBy = err.lockedBy || 'Outro profissional';
                    ToastService.warning("Este registro está sendo editado por " + $scope.editor.lockedBy);
                });
        };

        $scope.releaseLock = function() {
            if (!$scope.editor.isNew && $scope.editor.id && !$scope.editor.isLocked) {
                MedicalRecordsService.unlockRecord($scope.editor.id);
            }
        };

        $scope.$on('$destroy', function() {
            $scope.releaseLock();
        });

        $scope.addAttachment = function(element) {
            $scope.$apply(function() {
                for (var i = 0; i < element.files.length; i++) {
                    $scope.editor.attachments.push(element.files[i]);
                }
                element.value = '';
            });
        };

        $scope.removeAttachment = function(index) {
            $scope.editor.attachments.splice(index, 1);
        };

        $scope.saveEvolution = function() {
            if (!$scope.editor.notes) {
                ToastService.warning("A evolução não pode estar vazia.");
                return;
            }

            $scope.isSaving = true;
            var payload = {
                patient_id: $scope.patient.id,
                notes: $scope.editor.notes,
                title: $scope.editor.title
            };

            var request = $scope.editor.isNew 
                ? MedicalRecordsService.createRecord(payload)
                : MedicalRecordsService.updateRecord($scope.editor.id, payload);

            request.then(function(savedRecord) {
                var recordId = savedRecord.id || $scope.editor.id;

                var newFiles = $scope.editor.attachments.filter(function(a) { return !a.id; });
                
                if (newFiles.length > 0) {
                    var uploadPromises = newFiles.map(function(file) {
                        return MedicalRecordsService.uploadAttachment(recordId, file);
                    });

                    return $q.all(uploadPromises).then(function() {
                        return savedRecord;
                    });
                }
                return savedRecord;
            })
            .then(function() {
                ToastService.success("Evolução salva com sucesso!");
                $scope.init();
                $scope.startNewEvolution();
            })
            .catch(function(err) {
                ToastService.error("Falha ao salvar o prontuário.");
            })
            .finally(function() {
                $scope.isSaving = false;
            });
        };

        $scope.init();
    }
]);