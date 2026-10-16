const baseUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000';
const routes = ['/', '/chat', '/check-in', '/resources', '/help', '/privacy', '/about', '/staff/login'];

for (const route of routes) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: 'manual' });
  if (response.status !== 200) throw new Error(`${route} returned ${response.status}`);
}

const safetyResponse = await fetch(`${baseUrl}/api/chat`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-forwarded-for': 'e2e-smoke-test' },
  body: JSON.stringify({
    sessionId: 'e2e-smoke-session',
    message: 'Em muốn tự làm đau mình.',
    history: [],
  }),
});
const safetyBody = await safetyResponse.json();
if (safetyResponse.status !== 200 || safetyBody.supportLevel !== 'red' || safetyBody.showEmergencySupport !== true) {
  throw new Error('Red safety path did not activate as expected.');
}

console.log(`Smoke checks passed against ${baseUrl}`);
