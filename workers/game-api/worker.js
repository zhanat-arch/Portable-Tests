const enc=new TextEncoder();
const json=(data,status=200,origin='*')=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=utf-8','access-control-allow-origin':origin,'access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS','vary':'Origin','cache-control':'no-store'}});
const clean=(value,max)=>String(value||'').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,max);
const token=(bytes=18)=>{const a=crypto.getRandomValues(new Uint8Array(bytes));return btoa(String.fromCharCode(...a)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')};
const hash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const bearer=request=>(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
const allowed=(request,env)=>{const o=request.headers.get('origin');return !o||o===env.ALLOWED_ORIGIN||/^http:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/.test(o)};
const safeInt=(value,min,max,fallback=min)=>{const n=Math.floor(Number(value));return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback};

// Google signs the ID token. PortHub verifies its audience, issuer and expiry, then issues its own opaque session.
async function verifyGoogle(credential,env){
  if(!credential||credential.length>10000)return null;
  const response=await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if(!response.ok)return null;
  const data=await response.json(),issuer=String(data.iss||'');
  if(data.aud!==env.GOOGLE_CLIENT_ID||!['accounts.google.com','https://accounts.google.com'].includes(issuer)||data.email_verified!=='true'||Number(data.exp)*1000<=Date.now())return null;
  return{sub:clean(data.sub,80),email:clean(data.email,200),name:clean(data.name,80)||clean(data.email,80),picture:clean(data.picture,500)};
}
async function sessionAuth(request,env){
  const value=bearer(request);if(!value)return null;
  return env.DB.prepare('SELECT u.id,u.email,u.name,u.picture,s.expires_at AS expiresAt FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(await hash(value),Date.now()).first();
}
async function googleLogin(request,env,origin){
  const identity=await verifyGoogle((await request.json()).credential,env);if(!identity)return json({error:'invalid_google_token'},401,origin);
  const now=Date.now();let user=await env.DB.prepare('SELECT id FROM users WHERE google_sub=?').bind(identity.sub).first();
  if(user)await env.DB.prepare('UPDATE users SET email=?,name=?,picture=?,updated_at=? WHERE id=?').bind(identity.email,identity.name,identity.picture,now,user.id).run();
  else{user={id:token(12)};await env.DB.prepare('INSERT INTO users(id,google_sub,email,name,picture,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(user.id,identity.sub,identity.email,identity.name,identity.picture,now,now).run()}
  const sessionToken=token(32),expiresAt=now+30*86400000;
  await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').bind(await hash(sessionToken),user.id,expiresAt,now).run();
  return json({sessionToken,expiresAt,user:{id:user.id,email:identity.email,name:identity.name,picture:identity.picture}},200,origin);
}
async function authMe(request,env,origin){const user=await sessionAuth(request,env);return user?json({user},200,origin):json({error:'unauthorized'},401,origin)}
async function logout(request,env,origin){const value=bearer(request);if(value)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await hash(value)).run();return json({ok:true},200,origin)}

async function createRoom(request,env,origin){
  const user=await sessionAuth(request,env);if(!user)return json({error:'unauthorized'},401,origin);
  const body=await request.json(),now=Date.now(),roomId=token(8),inviteKey=token(24),name=clean(body.name,40)||'PortHub Friends',displayName=clean(body.displayName,24)||user.name;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO rooms(id,name,invite_hash,owner_user_id,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(roomId,name,await hash(inviteKey),user.id,now,now),
    env.DB.prepare('INSERT INTO room_members(room_id,user_id,display_name,joined_at) VALUES(?,?,?,?)').bind(roomId,user.id,displayName,now)
  ]);
  return json({roomId,inviteKey,name,syncAfter:safeInt(env.SYNC_SECONDS,60,3600,120)},201,origin);
}
async function member(request,env,roomId){const user=await sessionAuth(request,env);if(!user)return null;const row=await env.DB.prepare('SELECT display_name AS displayName FROM room_members WHERE room_id=? AND user_id=?').bind(roomId,user.id).first();return row?{...user,...row}:null}
async function joinRoom(request,env,id,origin){
  const user=await sessionAuth(request,env);if(!user)return json({error:'unauthorized'},401,origin);
  const body=await request.json(),room=await env.DB.prepare('SELECT id,name FROM rooms WHERE id=? AND invite_hash=?').bind(id,await hash(String(body.inviteKey||''))).first();if(!room)return json({error:'invalid_invite'},404,origin);
  const now=Date.now(),displayName=clean(body.displayName,24)||user.name;
  await env.DB.batch([env.DB.prepare('INSERT INTO room_members(room_id,user_id,display_name,joined_at) VALUES(?,?,?,?) ON CONFLICT(room_id,user_id) DO UPDATE SET display_name=excluded.display_name').bind(id,user.id,displayName,now),env.DB.prepare('UPDATE rooms SET updated_at=? WHERE id=?').bind(now,id)]);
  return json({roomId:id,name:room.name,syncAfter:safeInt(env.SYNC_SECONDS,60,3600,120)},201,origin);
}
async function getRoom(request,env,id,origin,url){
  const user=await member(request,env,id);if(!user)return json({error:'not_found'},404,origin);
  const game=clean(url.searchParams.get('game'),32)||'2048',mode=clean(url.searchParams.get('mode'),32)||'classic',room=await env.DB.prepare('SELECT id,name,owner_user_id AS ownerUserId FROM rooms WHERE id=?').bind(id).first(),now=Date.now();
  const rows=await env.DB.prepare(`SELECT id,name,score,maxTile,rows,cols,lives,moves,activeMs,status,updatedAt,review FROM (SELECT gs.user_id AS id,rm.display_name AS name,gs.score,gs.max_tile AS maxTile,gs.board_rows AS rows,gs.board_cols AS cols,gs.lives,gs.moves,gs.active_ms AS activeMs,gs.status,gs.updated_at AS updatedAt,CASE WHEN gs.review_until>? THEN 1 ELSE 0 END AS review,ROW_NUMBER() OVER(PARTITION BY gs.user_id ORDER BY gs.score DESC,gs.updated_at ASC) AS rank FROM game_scores gs JOIN room_members rm ON rm.room_id=gs.room_id AND rm.user_id=gs.user_id WHERE gs.room_id=? AND gs.game=? AND gs.mode=?) WHERE rank=1 ORDER BY score DESC,updatedAt ASC LIMIT 100`).bind(now,id,game,mode).all();
  return json({room,leaderboard:rows.results,syncAfter:safeInt(env.SYNC_SECONDS,60,3600,120)},200,origin);
}
async function updateScore(request,env,id,game,origin){
  const user=await member(request,env,id);if(!user)return json({error:'not_found'},404,origin);
  const body=await request.json(),mode=clean(body.mode,32)||'classic',deviceId=clean(body.deviceId,80)||'unknown',deviceLabel=clean(body.deviceLabel,40)||'Device',platform=clean(body.platform,80),score=safeInt(body.score,0,2147483647),maxTile=safeInt(body.maxTile,0,1073741824),boardTotal=safeInt(body.boardTotal,0,2147483647),rows=safeInt(body.rows,0,20),cols=safeInt(body.cols,0,20),lives=safeInt(body.lives,0,20),usedLives=safeInt(body.usedLives,0,20),moves=safeInt(body.moves,0,2147483647),activeMs=safeInt(body.activeMs,0,2147483647),runId=clean(body.runId,80),status=body.status==='finished'?'finished':'playing',now=Date.now();
  const old=await env.DB.prepare('SELECT * FROM game_scores WHERE room_id=? AND user_id=? AND device_id=? AND game=? AND mode=?').bind(id,user.id,deviceId,game,mode).first();
  let reviewUntil=Number(old?.review_until)||0;
  if(game==='2048'&&(!old||score>old.score)){
    const sameRun=old&&old.run_id===runId,baseScore=sameRun?old.score:0,baseMoves=sameRun?old.moves:0,baseMs=sameRun?old.active_ms:0,deltaMoves=Math.max(0,moves-baseMoves),deltaScore=score-baseScore,deltaMs=Math.max(0,activeMs-baseMs),size=Math.max(rows,cols),expectedSize=mode==='classic'?4:([4,5,5,6][usedLives]||6),maxMerges=size*Math.floor(size/2);
    if((deltaMoves===0&&deltaScore>0)||deltaScore>deltaMoves*maxMerges||(deltaMs>=120000&&deltaMoves/(deltaMs/1000)>safeInt(env.MAX_MOVES_PER_SECOND,8,30,18))||size!==expectedSize||maxTile>boardTotal)reviewUntil=now+86400000;
  }
  await env.DB.prepare('INSERT INTO user_devices(id,user_id,label,platform,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(id,user_id) DO UPDATE SET label=excluded.label,platform=excluded.platform,updated_at=excluded.updated_at').bind(deviceId,user.id,deviceLabel,platform,now).run();
  if(!old||score>=old.score)await env.DB.prepare('INSERT INTO game_scores(room_id,user_id,device_id,game,mode,score,max_tile,board_total,board_rows,board_cols,lives,used_lives,moves,active_ms,run_id,review_until,status,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(room_id,user_id,device_id,game,mode) DO UPDATE SET score=excluded.score,max_tile=excluded.max_tile,board_total=excluded.board_total,board_rows=excluded.board_rows,board_cols=excluded.board_cols,lives=excluded.lives,used_lives=excluded.used_lives,moves=excluded.moves,active_ms=excluded.active_ms,run_id=excluded.run_id,review_until=excluded.review_until,status=excluded.status,updated_at=excluded.updated_at').bind(id,user.id,deviceId,game,mode,score,maxTile,boardTotal,rows,cols,lives,usedLives,moves,activeMs,runId,reviewUntil,status,now).run();
  await env.DB.prepare('UPDATE rooms SET updated_at=? WHERE id=?').bind(now,id).run();
  return json({ok:true,review:reviewUntil>now,syncAfter:safeInt(env.SYNC_SECONDS,60,3600,120)},200,origin);
}

export default{async fetch(request,env){
  const origin=request.headers.get('origin')||env.ALLOWED_ORIGIN;if(!allowed(request,env))return json({error:'origin'},403,'null');if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':origin,'access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS','vary':'Origin'}});
  const url=new URL(request.url),parts=url.pathname.replace(/^\/v1\/?/,'').split('/').filter(Boolean);
  try{
    if(request.method==='POST'&&parts.join('/')==='auth/google')return googleLogin(request,env,origin);
    if(request.method==='GET'&&parts.join('/')==='auth/me')return authMe(request,env,origin);
    if(request.method==='DELETE'&&parts.join('/')==='auth/session')return logout(request,env,origin);
    if(request.method==='POST'&&parts.join('/')==='rooms')return createRoom(request,env,origin);
    if(parts[0]==='rooms'&&parts[1]&&parts[2]==='join'&&request.method==='POST')return joinRoom(request,env,parts[1],origin);
    if(parts[0]==='rooms'&&parts[1]&&parts.length===2&&request.method==='GET')return getRoom(request,env,parts[1],origin,url);
    if(parts[0]==='rooms'&&parts[1]&&parts[2]==='scores'&&parts[3]&&request.method==='PUT')return updateScore(request,env,parts[1],clean(parts[3],32),origin);
    return json({error:'not_found'},404,origin);
  }catch(error){console.error(error);return json({error:'server_error'},500,origin)}
}};
