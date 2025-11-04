import fetch from 'node-fetch'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

await fetch(`${SUPABASE_URL}/storage/v1/admin/cors`, {
  method: 'POST',
  headers: {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    allowed_origins: ['*'],
    allowed_methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowed_headers: ['authorization', 'content-type'],
    expose_headers: ['content-length'],
    max_age: 3600,
  }),
})
