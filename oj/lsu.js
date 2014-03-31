/**
 * Created by xadillax on 3/31/14.
 */
var util = require("util");
var async = require("async");
var qs = require("querystring");
var BaseSubmitter = require("../lib/base");

/**
 * Lishui University Submitter
 * @param ojname
 * @param username
 * @param password
 * @constructor
 */
var LSUSubmitter = function(ojname, username, password) {
    BaseSubmitter.call(this, ojname, username, password);

    this.languages = {
        "C++"       : 0,
        "C"         : 1,
        "PASCAL"    : 2
    };
    this.baseUrl = "http://acms.lsu.edu.cn:81/OnlineJudge/";
};

util.inherits(LSUSubmitter, BaseSubmitter);

/**
 * Fetch a single round.
 * @param pid
 * @param option
 * @param callback
 */
LSUSubmitter.prototype.fetchRound = function(pid, option, callback) {
    var self = this;

    var url = this.baseUrl + "status";
    var queryString = qs.stringify({ problem_id: pid, user_id: self.username });

    async.waterfall([
        /**
         * step 1.
         *     fetch result.
         *
         * @param callback
         */
        function(callback) {
            self.spidex.get(url + "?" + queryString, function(html, status, respHeader) {
                if(status !== 200) {
                    callback(new Error("The server returned a wrong status."));
                    return;
                }

                /**
                 * Eg.
                 *     <tr align=center><td>...</td><td><a href=userstatus?user_id=...>...</a></td><td><a href=showproblem?problem_id=...>...</a></td><td><font color=...><font color=...>...</font></font></td><td>&nbsp;</td><td>&nbsp;</td><td><a href=showsource?solution_id=... target=_blank>...</a></td><td>...</td><td>...</td></tr>
                 *
                 * @type {RegExp}
                 */
                var regex = /<tr align=center><td>(\d*)<\/td><td><a href=.*>.*<\/a><\/td><td><a href=showproblem\?problem_id=\d*>\d*<\/a><\/td><td>.*<font color=.*>(.+)<\/font>.*<\/td><td>(.*)<\/td><td>(.*)<\/td><td><a href=showsource\?solution_id=\d* target=_blank>(.*)<\/a><\/td><td>.*<\/td><td>.*<\/td><\/tr>/;
                var regexResult = regex.exec(html);
                if(regexResult.length !== 6) {
                    callback(new Error("Wrong html."));
                    return;
                }

                var runId = parseInt(regexResult[1]);
                var resultString = regexResult[2].indexOf("Waiting") === 0 ? "Waiting" : regexResult[2];
                var memo = parseInt(regexResult[3]);
                var time = parseInt(regexResult[4]);

                if(isNaN(runId)) {
                    callback(new Error("Can't get run id."));
                    return;
                }
                if(isNaN(memo)) {
                    memo = 0;
                }
                if(isNaN(time)) {
                    time = 0;
                }

                var result = new self.Result(runId, resultString, time, memo);

                callback(null, result);
            }, self.header, "gbk").on("error", function(e) {
                callback(e);
            });
        },

        /**
         * step 2.
         *     if compile error
         *
         * @param result
         * @param callback
         */
        function(result, callback) {
            if("Compile Error" === result.result) {
                var url = self.baseUrl + "showcompileinfo?solution_id=" + result.runId;
                self.spidex.get(url, function(html, status, respHeader) {
                    if(status !== 200) {
                        result.ceInfo = "The virtual judge can't fetch compilation error.";
                    } else {
                        var regex = /<p><font face=Times New Roman size=3>([\s\S]+)<\/font><\/p><\/ul>/;
                        var regexResult = regex.exec(html);

                        if(regexResult.length !== 2) {
                            result.ceInfo = "The virtual judge can't fetch compilation error.";
                        } else {
                            result.ceInfo = regexResult[1];
                        }
                    }

                    callback(null, result);
                }, self.header, "gbk").on("error", function(e) {
                    result.ceInfo = "The virtual judge can't fetch compilation error.";
                    callback(null, result);
                });
            } else {
                callback(null, result);
            }
        }
    ], function(err, result) {
        if(result.result === "Waiting") {
            result.setType(result.RESULT_TYPE.RT_COUNTINUE);
        }

        callback(err, result);
    });
};

/**
 * Submit code.
 * @param pid
 * @param language
 * @param code
 * @param callback
 */
LSUSubmitter.prototype.submit = function(pid, language, code, callback) {
    if(undefined === callback) {
        callback = this.constValue.emptyFunc;
    }

    var self = this;
    async.waterfall([
        /**
         * step 1.
         *     submit code.
         *
         * @param callback
         */
        function(callback) {
            var url = self.baseUrl + "submit";

            /**
             * post data.
             * @type {{problem_id: *, language: *, source: *}}
             */
            var data = {
                problem_id      : pid,
                language        : self.languages[language],
                source          : code
            };

            // default language: C++...
            if(undefined === data.language) {
                data.language = 0;
            }

            self.spidex.post(url, function(html, status, respHeader) {
                if(status === 200) {
                    /**
                     * Eg.
                     *     <font size="4">Error Occurred</font></p>
                     *     <ul>
                     *       <li>Please login first.</li>
                     *     </ul>
                     *
                     * @type {RegExp}
                     */
                    var regex = /<font size="4">Error Occurred<\/font><\/p>[\s]*<ul>[\s]*<li>(.*)<\/li>[\s]*<\/ul>/;
                    var regexResult = regex.exec(html);

                    if(regexResult.length !== 2) {
                        callback(new Error("The server returned a wrong status while submitting."));
                        return;
                    }

                    callback(new Error("An error occurred while submitting: " + regexResult[1]));
                } else if(status !== 302) {
                    callback(new Error("The server returned a wrong status while submitting."));
                } else {
                    if(respHeader.location !== "http://acms.lsu.edu.cn:81/OnlineJudge/status") {
                        callback(new Error("The server returned a wrong header while submitting."));
                        return;
                    }

                    callback(null);
                }
            }, data, self.header, "gbk").on("error", function(e) {
                callback(e);
            });
        }
    ], function(err) {
        callback(err);
    });
};

/**
 * Log in the system.
 * @param [callback]
 */
LSUSubmitter.prototype.login = function(callback) {
    if(undefined === callback) {
        callback = this.constValue.emptyFunc;
    }

    var self = this;
    async.waterfall([
        /**
         * step 1.
         *     post data to server.
         *
         * @param callback
         */
        function(callback) {
            var url = self.baseUrl + "login?action=login";

            /**
             * post data
             * @type {{user_id1: (BaseSubmitter.username|*), password1: (BaseSubmitter.password|*)}}
             */
            var data = {
                user_id1    : self.username,
                password1   : self.password
            };

            delete self.header.cookie;
            self.spidex.post(url, function(html, status, respHeader) {
                if(status !== 302) {
                    callback(new Error("The server returned a wrong status while logging in."));
                } else {
                    // wrong location.
                    if(respHeader["location"] !== "http://acms.lsu.edu.cn:81/OnlineJudge/") {
                        callback(new Error("The server returned a wrong header while logging in."));
                        return;
                    }

                    // set cookie.
                    self.header.cookie = self.spidex.parseCookie(respHeader);

                    callback(null);
                }
            }, data, self.header, "gbk").on("error", function(e) {
                callback(e);
            });
        },

        /**
         * step 2.
         *     is user logged in.
         *
         * @param callback
         */
        function(callback) {
            var url = self.baseUrl;
            self.spidex.get(url, function(html, status, respHeader) {
                /**
                 * Eg:
                 *     <h2>用户登录</h2><table width=200> <tr align=center><td align=center>
                 *     欢迎您!&nbsp;&nbsp;<a href="userstatus?user_id=
                 *     {USERNAME}">
                 *
                 * @type {RegExp}
                 */
                var regex = /<h2>用户登录<\/h2><table width=200> <tr align=center><td align=center>[\s]*欢迎您!&nbsp;&nbsp;<a href="userstatus\?user_id=[\s]*.*">/;

                if(regex.test(html)) {
                    callback(null);
                } else {
                    callback(new Error("Unknown error while logging in. Maybe wrong username or password, maybe server down."));
                }
            }, self.header, "gbk").on("error", function(e) {
                callback(e);
            });
        }
    ], function(err) {
        callback(err);
    });
};

module.exports = LSUSubmitter;
