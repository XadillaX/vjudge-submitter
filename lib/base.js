/**
 * Created by xadillax on 3/31/14.
 */
var async = require("async");
var constValue = require("./constValue");
var spidex = require("spidex");

/**
 * Base online judge submitter.
 * @param ojname
 * @param username
 * @param password
 * @constructor
 */
var BaseSubmitter = function(ojname, username, password) {
    this.ojname = ojname;
    this.username = username;
    this.password = password;
    this.spidex = spidex;
    this.constValue = constValue;
    this.maxFetchTime = 10;

    this.Result = require("./runResult");

    this.header = {
        "user-agent"    : constValue.userAgent
    };

    this.languages = {};
    this.busy = false;
};

/**
 * do judge.
 * @param pid
 * @param language
 * @param code
 * @param callback
 */
BaseSubmitter.prototype.judge = function(pid, language, code, callback) {
    if(this.busy) {
        callback(new Error("System is busy."));
        return;
    }

    this.busy = true;
    var self = this;
    async.waterfall([
        /**
         * step 1.
         *     log in.
         *
         * @param callback
         */
        function(callback) {
            self.login(function(err) {
                callback(err);
            })
        },

        /**
         * step 2.
         *     submit code.
         *
         * @param callback
         */
        function(callback) {
            self.submit(pid, language, code, function(err, option) {
                callback(err, option);
            });
        },

        /**
         * step 3.
         *     get result.
         *
         * @param option
         * @param callback
         */
        function(option, callback) {
            self.fetchResult(pid, option, function(err, result) {
                callback(err, result);
            })
        }
    ], function(err, result) {
        self.busy = false;
        callback(err, result);
    });
};

/**
 * Log in the system.
 * @param callback
 */
BaseSubmitter.prototype.login = function(callback) {
    // ...
    callback(new Error("Empty submitter."));
};

/**
 * Submit code.
 * @param pid
 * @param language
 * @param code
 * @param callback
 */
BaseSubmitter.prototype.submit = function(pid, language, code, callback) {
    // ...
    callback(new Error("Empty submitter."));
};

/**
 * Just fetch single round.
 * @param pid
 * @param option
 * @param callback
 */
BaseSubmitter.prototype.fetchRound = function(pid, option, callback) {
    // ...
    callback(new Error("Empty submitter."));
};

/**
 * Fetch running result.
 * @param pid
 * @param [option]
 * @param callback
 */
BaseSubmitter.prototype.fetchResult = function(pid, option, callback) {
    if(undefined === callback) {
        callback = this.constValue.emptyFunc;
    }
    if(typeof option === "function") {
        callback = option;
        option = null;
    }

    var self = this;

    var fetchTimes = 0;
    var fetched = false;
    var preResult = null;
    async.whilst(
        /**
         * tester
         * @returns {boolean}
         */
        function() {
            return !fetched && fetchTimes < self.maxFetchTime;
        },

        /**
         * body
         * @param callback
         */
        function(cb) {
            self.fetchRound(pid, option, function(err, result) {
                fetchTimes++;

                if(err) {
                    // max time...
                    if(fetchTimes >= self.maxFetchTime) {
                        cb(err);
                    } else {
                        cb(null);
                    }

                    return;
                }

                // if to be continued, continue callback, or go to end.
                if(result.type === result.RESULT_TYPE.RT_COUNTINUE) {
                    cb(null);
                } else {
                    fetched = true;
                    preResult = result;
                    delete preResult.type;
                    delete preResult.RESULT_TYPE;

                    cb(null);
                }
            });
        },

        function(err) {
            if(preResult === null && !err) {
                err = new Error("Judging exceeds the max times.")
            }

            //console.log(preResult);
            callback(err, preResult);
        }
    );
};

/**
 * Get online judge name.
 * @returns {String}
 */
BaseSubmitter.prototype.getName = function() {
    return this.ojname;
};

/**
 * Get language array.
 * @returns {{}|*}
 */
BaseSubmitter.prototype.getLanguages = function() {
    return this.languages;
};

module.exports = BaseSubmitter;
