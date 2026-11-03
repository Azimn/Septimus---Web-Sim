'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {initialState,ensureHooks}=require('./world');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
function save(file,state){fs.mkdirSync(path.dirname(file),{recursive:true});const data=JSON.stringify(state);const payload=JSON.stringify({format:'simple-tower-save-v1',hash:digest(data),state},null,2);const temp=file+'.tmp-'+process.pid;fs.writeFileSync(temp,payload);fs.renameSync(temp,file);}
function load(file,identity,archive){if(!fs.existsSync(file))return initialState(identity.sha,archive.sha);const value=JSON.parse(fs.readFileSync(file,'utf8'));
 if(value.format!=='simple-tower-save-v1'||digest(JSON.stringify(value.state))!==value.hash)throw Error('Save integrity failure');
 if(value.state.identitySha!==identity.sha||value.state.archiveSha!==archive.sha)throw Error('Identity or canon mismatch');
 if(value.state.schema!==1)throw Error('Unsupported tower schema');return ensureHooks(value.state);}
module.exports={save,load};
