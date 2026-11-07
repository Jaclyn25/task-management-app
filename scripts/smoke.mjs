import assert from 'node:assert/strict'
const base = process.env.SMOKE_URL || 'http://127.0.0.1:18084'
const health = await fetch(`${base}/api/health`); assert.equal(health.status,200)
assert.equal((await health.json()).product,'Daymark')
const front = await fetch(base); assert.equal(front.status,200); assert.match(await front.text(),/Daymark/)
assert.ok(front.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"))
for (const route of ['/api/tasks','/api/categories','/api/dashboard','/api/account/profile']) assert.equal((await fetch(base+route)).status,401)
assert.equal((await fetch(base+'/api/account/login',{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).status,400)
console.log(JSON.stringify({base,health:'pass',frontend:'pass',securityHeaders:'pass',privateRoutes:'401',csrf:'400',verifiedAt:new Date().toISOString()},null,2))
