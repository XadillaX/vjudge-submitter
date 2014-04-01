/**
 * Created by xadillax on 3/31/14.
 */
var vjsubmitter = require("../");

lsuTest();

/**
 * Lishui University Online Judge System
 */
function lsuTest() {
    var lsu = vjsubmitter.createSubmitter("lsu", "USERNAME", "PASSWORD");
    lsu.judge(1000, "C++", '#include "iostream"\n\
        using namespace std;\
        int main()\
        {\
            int i = 1000000000;\
            while(i--);\
            int a,b;\
            cin >> a >> b;\
            cout << a+b << endl;\
            return 0;\
        }',
        function(err, result) {
            if(err) {
                console.log(err.message);
            } else {
                console.log(result);
            }
        }
    );
}
