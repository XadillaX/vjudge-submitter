/**
 * Created by xadillax on 3/31/14.
 */
require("sugar/release/sugar-full.development");
var generator = require("./lib/generator");

/**
 * Create a new submitter.
 * @param ojname
 * @param username
 * @param password
 * @returns {Submitter}
 */
exports.createSubmitter = function(ojname, username, password) {
    var submitter = generator.generate(ojname, username, password);
    return submitter;
};
