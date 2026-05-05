const fs = require('fs');
const path = require('path');
const dotenv = fs.readFileSync('.env.local', 'utf8');
const url = dotenv.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const key = dotenv.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];

fetch(`${url}/rest/v1/mentors?select=user_id,full_name,company,job_role,experience_years,rating,total_reviews,hourly_rate,profiles!inner(avatar_url)`, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
}).then(r => r.json()).then(console.log).catch(console.error);
