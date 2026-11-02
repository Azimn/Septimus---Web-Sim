'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const original={
 "results/needs_arithmetic_baseline.json":"0cd681d1fe0b1b11ddba28ff19217cfb603297d1",
 "results/needs_arithmetic_isolated.json":"848d9b69500a9dda6a179001342de2a2f53e5c0f",
 "results/needs_equilibrium_corrected.json":"dc7d691b9fe777aca0a7414c1a6a75cd4a06d3e7",
 "results/winter_pantry_v4.json":"9da9bb8f2bf324a2c42103818941a87ec6336689",
 "results/winter_pantry_v4.md":"88cdcb2890ea678cc4604339ada8037dca81788c",
  "canon/Pretorius_v12_450_Events_Complete.jsonl": "718dcc2d5ba4feccdef1690d447edfcebaa9bfb5",
  "results/folio_experiment_v1.json": "b8d42c074a195ba8fe936d0398b2add04437076a",
  "results/folio_experiment_v1.md": "13dd3b3db8b711a700c13132891c7585e29d8f7c",
  "results/folio_experiment_v2.json": "8c83f3c5abfc8b41754dc435a698d2eaebfbedcf",
  "results/folio_experiment_v2.md": "f53724ba177686e3b140ee1caddd1eede81a4686",
  "results/winter_60_day.json": "7f1decf20da50f0ec614e9906f7f4cd92cb35908",
  "results/winter_60_day.md": "5926f94976c02b946b93b2c9a03ded92c647cffd"
};
function gitBlob(filename){const bytes=fs.readFileSync(path.join(root,filename));return crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex')}
test('frozen canonical history and every prior control-generation artifact remain byte-identical to reviewed head',()=>{
 for(const [file,expected] of Object.entries(original))assert.equal(gitBlob(file),expected,file);
});
test('v3 raw experiment matches its prespecified criterion without rewriting old results',()=>{
 const d=JSON.parse(fs.readFileSync(path.join(root,'results/folio_experiment_v3.json'),'utf8'));
 assert.equal(d.version,3);assert.equal(d.archiveGitBlob,original['canon/Pretorius_v12_450_Events_Complete.jsonl']);
 assert.equal(d.modelCalls,0);assert.equal(d.results.length,72);
 assert.equal(d.summary.reduce((n,x)=>n+Number(x.passes),0),2);
 assert.equal(d.classification,'held_facts_load_bearing');
});
test('v3 winter matrix keeps separate variant labels and never invents a 60-day survivor',()=>{
 const d=JSON.parse(fs.readFileSync(path.join(root,'results/winter_balance_v3.json'),'utf8'));
 assert.equal(d.variants.length,6);assert.deepEqual(d.variants.map(x=>x.id),[
  'september_onramp_ungated','november_autumn_stores_ungated',
  'september_onramp_gated','november_autumn_stores_gated',
  'september_onramp_gated_report_delay_12','november_autumn_stores_gated_report_delay_12'
 ]);
 assert.ok(d.variants.every(x=>x.survived===0));
 assert.equal(d.oneKnobApplied,true);
});
