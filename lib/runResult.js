/**
 * Created by xadillax on 3/31/14.
 */

/**
 * Run result.
 * @param id
 * @param result
 * @param time
 * @param memo
 * @param [ceInfo]
 * @constructor
 */
var RunResult = function(id, result, time, memo, ceInfo) {
    this.runId = id;
    this.result = result.titleize();
    this.time = parseInt(time);
    this.memo = parseInt(memo);
    this.ceInfo = ceInfo;

    if(undefined === ceInfo) {
        this.ceInfo = "";
    }

    this.RESULT_TYPE = {
        RT_COUNTINUE    : 0,
        RT_END          : 1
    };

    this.type = this.RESULT_TYPE.RT_END;
};

/**
 * set result type.
 * @param type
 */
RunResult.prototype.setType = function(type) {
    this.type = type;
};

module.exports = RunResult;
