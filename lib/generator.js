/**
 * Created by xadillax on 3/31/14.
 */
var BaseSubmitter = require("./base");

/**
 * Submitter generator
 * @constructor
 */
var SubmitterGenerator = function() {
    this._generateMap = { /** ... the lazy loader... */ };
};

/**
 * Generate a new submitter.
 *                     -- generating with lazy loader.
 *
 * @param ojname
 * @param username
 * @param password
 * @returns {Submitter}
 */
SubmitterGenerator.prototype.generate = function(ojname, username, password) {
    ojname = ojname.toLowerCase();

    var Submitter = null;
    if(this._generateMap[ojname]) {
        Submitter = this._generateMap[ojname];
    } else {
        try {
            Submitter = require("../oj/" + ojname);
        } catch(e) {
            // empty submitter
            Submitter = BaseSubmitter;
        }

        this._generateMap[ojname] = Submitter;
    }

    return new Submitter(ojname, username, password);
};

module.exports = new SubmitterGenerator();
