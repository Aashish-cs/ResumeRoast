// Run inside the disposable API container. Never seeds accounts in production.
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const {performance} = require('node:perf_hooks');
const config = require('../src/config/env');
const User = require('../src/models/User');
const {signAuthToken} = require('../src/middleware/auth');
if (config.env !== 'test' || !config.mongoUri.includes('/resumeroast_e2e?')) throw new Error('Only the disposable container test database is allowed');
const total = Number(process.env.LOAD_REQUESTS || 100);
const concurrency = Number(process.env.LOAD_CONCURRENCY || 10);
if (!Number.isInteger(total) || total < 1 || total > 1000 || !Number.isInteger(concurrency) || concurrency < 1 || concurrency > 50) throw new Error('Invalid bounded load configuration');
async function main() {
 await mongoose.connect(config.mongoUri);
 const doc = new PDFDocument(); const chunks = [];
 const ready = new Promise(resolve => {doc.on('data', c=>chunks.push(c));doc.on('end',resolve);});
 doc.text('SYNTHETIC LOAD TEST RESUME. Software engineer with JavaScript, Node.js, MongoDB, React, Docker, testing, and background processing experience. Built reliable applications and integration tests. Education: Bachelor of Computer Science.');doc.end();await ready;
 const batch = new mongoose.Types.ObjectId().toString();
 const users = await User.insertMany(Array.from({length:total},(_,i)=>({name:'Load test',email:`load-${batch}-${i}@example.test`,passwordHash:'disabled-for-test',securityQuestion:'Disabled',securityAnswerHash:'disabled-for-test'})));
 const results=[];let cursor=0;
 const started=performance.now();
 await Promise.all(Array.from({length:concurrency},async()=>{
  while(cursor<total){
   const user=users[cursor++];const start=performance.now();
   const form=new FormData();form.append('resume',new Blob(chunks,{type:'application/pdf'}),'synthetic.pdf');
   try {
    const response=await fetch('http://localhost:5001/api/analyses',{method:'POST',headers:{Origin:config.clientUrl,Cookie:`rr_session=${signAuthToken(user)}`},body:form,signal:AbortSignal.timeout(5000)});
    await response.arrayBuffer();results.push({status:response.status,ms:performance.now()-start});
   }catch(error){results.push({status:0,timeout:error.name==='TimeoutError',error:error.name,ms:performance.now()-start});}
  }
 }));
 const times=results.map(x=>x.ms).sort((a,b)=>a-b);
 const report={scenario:'container API admission',storage:'S3 emulator using AWS SDK',workers:'stopped',requests:total,concurrency,deadlineMs:5000,accepted:results.filter(x=>x.status===202).length,timeouts:results.filter(x=>x.timeout).length,errors:results.filter(x=>x.status!==202).length,p95Ms:Math.round(times[Math.ceil(times.length*.95)-1]),maxMs:Math.round(times.at(-1)),durationMs:Math.round(performance.now()-started)};
 console.log(JSON.stringify(report));
 assert.equal(report.errors,0,'Every admission must return 202');
 await mongoose.disconnect();
}
main().catch(async error=>{console.error(error.message);await mongoose.disconnect();process.exitCode=1;});
