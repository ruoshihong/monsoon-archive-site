import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdmin, passwordsMatch, publicItem, sessionCookie } from '../api/_lib.js';

process.env.ADMIN_PASSWORD='rose-test-password';

test('admin session accepts its signed cookie and rejects a fake',()=>{
  assert.equal(passwordsMatch('rose-test-password'),true);
  assert.equal(passwordsMatch('wrong'),false);
  const cookie=sessionCookie().split(';')[0];
  assert.equal(isAdmin(new Request('https://example.test',{headers:{cookie}})),true);
  assert.equal(isAdmin(new Request('https://example.test',{headers:{cookie:'rain_admin=1.fake'}})),false);
});

test('public photo exposes only the protected media route',()=>{
  const item=publicItem({id:'abc',type:'photo',name:'Rose',place:'Guangzhou',body:'Rain',createdAt:'2026-01-01',photoPath:'private/file.jpg'});
  assert.equal(item.photoUrl,'/api/media?id=abc');
  assert.equal('photoPath' in item,false);
});
