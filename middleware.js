export default function middleware() {
  return new Response('MIDDLEWARE IS WORKING!', {
    status: 200,
    headers: { 'content-type': 'text/plain' }
  });
}