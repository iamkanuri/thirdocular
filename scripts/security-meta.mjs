// GitHub Pages cannot set response headers. Protect the three maintained pages
// with a CSP meta policy; frame-ancestors must still be set at the CDN edge.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
for(const file of ['dist/index.html','dist/labs/index.html','dist/labs/lifeos/index.html']){
 let html=readFileSync(file,'utf8');
 const hashes=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter(m=>!m[1].includes('src='))
  .map(m=>"'sha256-"+createHash('sha256').update(m[2]).digest('base64')+"'");
 const policy=`default-src 'self'; script-src 'self' ${hashes.join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; upgrade-insecure-requests`;
 html=html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+policy+'"><meta name="referrer" content="strict-origin-when-cross-origin">');
 writeFileSync(file,html);
}
console.log('CSP added to the three maintained pages; inline scripts use hashes.');
