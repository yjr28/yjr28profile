import assert from "node:assert/strict";
import {generateTask,scoreTask} from "../projects/axon/engine.js";
for(const family of ["processing_speed","spatial_rotation","relational"]){
 const config={family,level:3,trials:10,seed:49217,responseWindowMs:5000};
 const trials=generateTask(config);
 assert.deepEqual(trials,generateTask(config));assert.equal(trials.length,10);
 const perfect=scoreTask(config,trials.map(t=>({trial:t.index,answer:t.answer,rtMs:500})));
 assert.equal(perfect.score,1000);assert.equal(perfect.accuracy,1);assert.equal(perfect.meanRtMs,500);
 const empty=scoreTask(config,[]);assert.equal(empty.score,0);assert.equal(empty.responseCount,0);assert.equal(empty.lapseRate,1);
 const invalid=scoreTask(config,[{trial:0,answer:trials[0].answer,rtMs:5}]);assert.equal(invalid.invalidResponses,1);assert.equal(invalid.score,0);
}
console.log("AXON deterministic task and scoring tests passed.");