import { SignJWT } from 'jose';

async function measureLiveOpsBaseline() {
  const secretStr = '3f392c8968c1e51aa22fa02f66797990962f520556faf92d07f96aaf509b2124';
  const secret = new TextEncoder().encode(secretStr);

  const token = await new SignJWT({
    sub: 'cmsvpw95c0000cgid9jf8tdc8',
    role: 'SUPER_ADMIN'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  const headers = { Cookie: `mubryx_admin_token=${token}` };

  console.log('=== BASELINE MEASUREMENT: /live-ops (/api/bookings?tab=active&limit=50) ===');

  const t0 = performance.now();
  const res = await fetch('http://localhost:3002/api/bookings?tab=active&limit=50', { headers });
  const text = await res.text();
  const duration = performance.now() - t0;

  console.log(`Status: ${res.status}`);
  console.log(`Transferred Payload: ${text.length} bytes (${(text.length / 1024).toFixed(2)} KB)`);
  console.log(`Response Time: ${duration.toFixed(1)} ms`);

  const json = JSON.parse(text);
  const items = Array.isArray(json) ? json : json.items || [];
  console.log(`Active Items Returned: ${items.length}`);
  if (items.length > 0) {
    console.log(`Sample item keys: ${Object.keys(items[0]).join(', ')}`);
  }
}

measureLiveOpsBaseline().catch(console.error);
