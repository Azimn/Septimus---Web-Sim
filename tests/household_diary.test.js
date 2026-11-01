'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const Diary=require('../src/diary'),{createOrganism}=require('../src/organism'),World=require('../src/world');
const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'septimus-evenings-'));
test('evening pages require a verified writing receipt and bind objective-specific quantities',()=>{
 const source={id:'EV-1',kind:'catalog_order',room:'porch',details:{goods:{coal:7},supplierId:'rosa_brandl',price:12}},write={id:'EV-2',kind:'journal_write',day:4,details:{sourceEventId:'EV-1'}};
 const page=Diary.makePage(write,source,Diary.sha(source));assert.match(page.text,/7/);assert.match(page.text,/12/);assert.match(page.text,/Rosa Brandl/);assert.equal(page.authorshipMode,'deterministic_first_person_draft');
 assert.doesNotMatch(page.text,/@\d{3}|\b(?:engine tick|mechanical timestamp)\b/i);
 assert.throws(()=>Diary.makePage({...write,kind:'walk'},source,Diary.sha(source)),/physical writing/);
});
test('reading old folio may invite present response, not assert freshly lived old memories',()=>{
 const source={id:'EV-1',kind:'journal_read',room:'library',details:{folioIndex:0}},write={id:'EV-2',kind:'journal_write',day:5,details:{sourceEventId:'EV-1'}};
 const page=Diary.makePage(write,source,Diary.sha(source),[],{title:'The Coal Woman’s Measure',sourceEventId:'E22-001'});
 assert.equal(page.responseFolioId,'E22-001');assert.match(page.text,/I have also read in my old journal/);
 assert.match(page.text,/not an occurrence of today/);
});
test('a seeded week has no near-duplicate evening pages or clock leakage',()=>{
 const dir=temp();try{
  const u=createOrganism({dir});
  for(let i=0;i<1050;i++){if(!u.view().world.alive)break;u.tick();}
  const pages=u.exportData().privateJournal.pages;
  assert.ok(pages.length>=2,'at least two evening diary pages should be physically written');
  const seen=new Set();for(const p of pages){
   assert.ok(!seen.has(p.writingDay),'one evening page per day');seen.add(p.writingDay);
   assert.doesNotMatch(p.text,/@\d{3}|\b(?:tick|beats|engine time|\d{2}:\d{2}:\d{2})\b/i);
   assert.ok(p.sourceEventIds?.length>=1);
  }
  const normalized=pages.map(p=>p.text.toLowerCase().replace(/\s+/g,' ').trim());
  for(let i=0;i<normalized.length;i++)for(let j=0;j<i;j++){
   const grams=t=>{const w=t.split(/\W+/).filter(Boolean),out=new Set();for(let k=0;k<w.length-2;k++)out.add(w.slice(k,k+3).join(' '));return out;};
   const a=grams(normalized[i]),b=grams(normalized[j]);
   const similarity=[...a].filter(x=>b.has(x)).length/Math.max(a.size,b.size);
   assert.ok(similarity<.88,'different-day diary pages too similar: '+similarity.toFixed(3));
  }
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
