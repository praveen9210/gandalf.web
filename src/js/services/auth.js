'use strict';

angular.module('app').run(function ($rootScope, $state, $log) {

  function isAuthRequired (state) {
    return state.self.auth || state.parent && isAuthRequired(state.parent) || false;
  }

  $rootScope.$on('$stateChangeStart', function (e, toState, toStateParams, fromState, fromStateParams) {
    $state.nextState = toState.$$state();
    $state.nextState.isAuthRequired = isAuthRequired($state.nextState);
  });
  $rootScope.$on('$stateChangeError', function (e, toState, toStateParams, fromState, fromStateParams, error) {
    if (error.message == "LoginRequired") {
      $rootScope.$broadcast('login:required');
    }
  })

}).service('AuthService', function ($gandalf, $localStorage, $rootScope, $cacheFactory) {

  var storage = $localStorage.$default({
    auth: {}
  });
  var $httpCache = $cacheFactory.get('$http');

  $gandalf.setToken(storage.auth);

  this.signIn = function (username, password) {
    return $gandalf.setAuthorization(username, password).then(function (user) {
      storage.auth = user;
      return user;
    });
  };
  this.signUp = function (username, password, email) {
    return $gandalf.admin.createUser({
      username: username,
      password: password,
      email: email
    });
  };
  this.signInFromStorage = function () {
    return $gandalf.admin.checkToken(storage.auth).then(function (resp) {
      $gandalf.setToken(storage.auth);
      return resp;
    });
  };

  this.logout = function () {
    storage.auth = {};
    $rootScope.$broadcast('userDidLogout');
    $gandalf.resetAuthorization();
    //$httpCache.removeAll();
  };

  // local testing of authentication
  this.isAuthenticated = function () {
    return !!storage.auth.access_token;
  };

});
