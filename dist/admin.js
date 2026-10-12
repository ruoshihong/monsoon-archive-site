const $=selector=>document.querySelector(selector);
let items=[],filter='pending';

async function api(url,options={}){
  const response=await fetch(url,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'操作失败');
  return data;
}

function esc(value){return String(value||'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
function date(value){return new Intl.DateTimeFormat('zh-CN',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))}

function render(){
  $('#pending-count').textContent=items.filter(item=>item.status==='pending').length;
  $('#approved-count').textContent=items.filter(item=>item.status==='approved').length;
  const visible=items.filter(item=>item.status===filter);$('#empty').hidden=visible.length>0;
  $('#items').innerHTML=visible.map(item=>`<article class="item">
    <div class="meta"><span>${item.type==='story'?'雨天故事':'眼中的雨'}</span><time>${date(item.createdAt)}</time></div>
    ${item.type==='photo'?`<img src="/api/media?id=${encodeURIComponent(item.id)}" alt="投稿照片">`:''}
    <h3>${esc(item.name)}${item.age?` · ${esc(item.age)}岁`:''}</h3><p class="place">${esc(item.place)}</p><p class="body">${esc(item.body)}</p>
    <div class="actions">${item.status==='pending'?`<button class="approve" data-action="approve" data-id="${item.id}">批准发布</button>`:''}<button class="delete" data-action="delete" data-id="${item.id}">${item.status==='pending'?'拒绝并删除':'删除文章'}</button></div>
  </article>`).join('');
}

async function load(){const data=await api('/api/admin/submissions');items=data.items;render()}
async function showDashboard(){ $('#login').hidden=true;$('#dashboard').hidden=false;$('#logout').hidden=false;await load() }

$('#login form').onsubmit=async event=>{event.preventDefault();const status=$('#login .status');status.textContent='登录中…';try{await api('/api/admin/login',{method:'POST',body:JSON.stringify({password:new FormData(event.currentTarget).get('password')})});status.textContent='';await showDashboard()}catch(error){status.textContent=error.message}};
$('#refresh').onclick=load;
$('#logout').onclick=async()=>{await api('/api/admin/login',{method:'DELETE'});location.reload()};
document.querySelectorAll('.tab').forEach(button=>button.onclick=()=>{document.querySelector('.tab.active').classList.remove('active');button.classList.add('active');filter=button.dataset.filter;render()});
$('#items').onclick=async event=>{const button=event.target.closest('[data-action]');if(!button)return;const item=items.find(value=>value.id===button.dataset.id);if(!item)return;const deleting=button.dataset.action==='delete';if(deleting&&!confirm(`确定${item.status==='pending'?'拒绝并删除':'删除'}这条投稿吗？`))return;button.disabled=true;try{if(deleting)await api(`/api/admin/submissions?id=${encodeURIComponent(item.id)}`,{method:'DELETE'});else await api('/api/admin/submissions',{method:'PATCH',body:JSON.stringify({id:item.id,status:'approved'})});await load()}catch(error){alert(error.message);button.disabled=false}};

api('/api/admin/login').then(data=>data.authenticated&&showDashboard()).catch(()=>{});
