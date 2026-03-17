angular.module("helixcare.exams").service("ExamsService", [
  "$http",
  "$q",
  function ($http, $q) {
    var API_URL = "http://localhost:3000/api/v1/exams";

    this.getExams = function (filters) {
      var deferred = $q.defer();
      $http
        .get(API_URL, { params: filters })
        .then(function (res) {
          deferred.resolve(res.data);
        })
        .catch(function (err) {
          deferred.reject(err.data || err);
        });
      return deferred.promise;
    };

    this.getExamById = function (id) {
      var deferred = $q.defer();
      $http
        .get(API_URL + "/" + id)
        .then(function (res) {
          deferred.resolve(res.data);
        })
        .catch(function (err) {
          deferred.reject(err.data || err);
        });
      return deferred.promise;
    };

    this.requestExam = function (payload) {
      var deferred = $q.defer();
      $http
        .post(API_URL, payload)
        .then(function (res) {
          deferred.resolve(res.data);
        })
        .catch(function (err) {
          deferred.reject(err.data || err);
        });
      return deferred.promise;
    };

    this.cancelExam = function (id) {
      var deferred = $q.defer();
      $http
        .delete(API_URL + "/" + id)
        .then(function (res) {
          deferred.resolve(res.data);
        })
        .catch(function (err) {
          deferred.reject(err.data || err);
        });
      return deferred.promise;
    };

    this.updateResult = function (id, payload) {
      var deferred = $q.defer();
      $http
        .put(API_URL + "/" + id + "/result", payload)
        .then(function (res) {
          deferred.resolve(res.data);
        })
        .catch(function (err) {
          deferred.reject(err.data || err);
        });
      return deferred.promise;
    };

    this.uploadReport = function (id, file) {
      var deferred = $q.defer();
      var formData = new FormData();
      formData.append("file", file);

      $http
        .post(API_URL + "/" + id + "/upload", formData, {
          transformRequest: angular.identity,
          headers: { "Content-Type": undefined },
        })
        .then(function (res) {
          deferred.resolve(res.data);
        })
        .catch(function (err) {
          deferred.reject(err.data || err);
        });
      return deferred.promise;
    };
  },
]);
