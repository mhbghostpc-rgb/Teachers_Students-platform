/**
 * سكريبت تشخيص وإصلاح حساب الإدمن
 * تشغيل: node fix-admin-v2.js
 */

const https = require('https');

const SUPABASE_PROJECT = 'ozbukcesxoatpqaenxpj';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96YnVrY2VzeG9hdHBxYWVueHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NTg2MTYsImV4cCI6MjA5OTAzNDYxNn0.YabaH5A-V_X6Y1jTPEtzy8dQXhU5PuzYo1oL2QEgtQs';
const ADMIN_EMAIL = 'mhbghost@gmail.com';
const ADMIN_PASSWORD = '0127558019m';

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: `${SUPABASE_PROJECT}.supabase.co`,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${token || ANON_KEY}`,
      },
    };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${SUPABASE_PROJECT}.supabase.co`,
      path,
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${token || ANON_KEY}`,
      },
    };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('🔍 تشخيص مشكلة تسجيل الدخول...\n');

  // Step 1: Try to sign in
  console.log('1️⃣ محاولة تسجيل الدخول...');
  const signIn = await post('/auth/v1/token?grant_type=password', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  console.log(`   Status: ${signIn.status}`);
  
  if (signIn.status === 200 && signIn.body.access_token) {
    console.log('✅ تسجيل الدخول نجح! كلمة المرور صحيحة.');
    const token = signIn.body.access_token;
    const userId = signIn.body.user?.id;
    console.log(`   User ID: ${userId}`);
    console.log(`   Email confirmed: ${signIn.body.user?.email_confirmed_at ? 'نعم' : 'لا'}\n`);

    // Check public.users
    console.log('2️⃣ التحقق من جدول users في قاعدة البيانات...');
    const userCheck = await get(`/rest/v1/users?select=id,email,role_name&id=eq.${userId}`, token);
    console.log(`   Status: ${userCheck.status}`);
    if (Array.isArray(userCheck.body) && userCheck.body.length > 0) {
      console.log(`   Found in public.users: role = ${userCheck.body[0].role_name}`);
      if (userCheck.body[0].role_name !== 'admin' && userCheck.body[0].role_name !== 'super_admin') {
        console.log('⚠️  الدور ليس admin! جاري التحديث...');
        // Update role to admin
        const update = await new Promise((resolve, reject) => {
          const data = JSON.stringify({ role_name: 'super_admin' });
          const options = {
            hostname: `${SUPABASE_PROJECT}.supabase.co`,
            path: `/rest/v1/users?id=eq.${userId}`,
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(data),
              'apikey': ANON_KEY,
              'Authorization': `Bearer ${token}`,
              'Prefer': 'return=representation',
            },
          };
          const req = https.request(options, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve({ status: res.statusCode, body: d }));
          });
          req.on('error', reject);
          req.write(data);
          req.end();
        });
        console.log(`   Update result: ${update.status}`);
      }
    } else {
      console.log('⚠️  المستخدم غير موجود في public.users! جاري الإضافة...');
      const insert = await post(`/rest/v1/users`, {
        id: userId,
        email: ADMIN_EMAIL,
        role_name: 'super_admin',
      }, token);
      console.log(`   Insert result: ${insert.status} - ${JSON.stringify(insert.body)}`);
    }

    console.log('\n🎉 كل شيء جاهز! سجّل الدخول على: http://localhost:3000/login');
    console.log(`   البريد: ${ADMIN_EMAIL}`);
    console.log(`   كلمة المرور: ${ADMIN_PASSWORD}`);
    return;
  }

  // Login failed - diagnose
  console.log(`   ❌ فشل: ${JSON.stringify(signIn.body)}\n`);
  
  const errCode = signIn.body?.error_code || signIn.body?.error || '';
  
  if (errCode === 'invalid_credentials' || signIn.body?.msg?.includes('Invalid')) {
    console.log('📋 التشخيص: كلمة المرور خاطئة في قاعدة البيانات.');
    console.log('💡 الحل: يجب تحديث كلمة المرور عبر SQL.\n');
    console.log('🔑 انسخ هذا SQL والصقه في: https://supabase.com/dashboard/project/ozbukcesxoatpqaenxpj/sql/new\n');
    console.log('─────────────────────────────────────────────');
    console.log(`UPDATE auth.users 
SET encrypted_password = crypt('${ADMIN_PASSWORD}', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = '${ADMIN_EMAIL}';`);
    console.log('─────────────────────────────────────────────\n');
  } else if (errCode === 'email_not_confirmed' || signIn.body?.msg?.includes('confirm')) {
    console.log('📋 التشخيص: البريد الإلكتروني غير مؤكد.');
    console.log('💡 الحل: انسخ هذا SQL:\n');
    console.log('─────────────────────────────────────────────');
    console.log(`UPDATE auth.users 
SET email_confirmed_at = now(), updated_at = now()
WHERE email = '${ADMIN_EMAIL}';`);
    console.log('─────────────────────────────────────────────\n');
  } else if (signIn.body?.msg?.includes('Database error')) {
    console.log('📋 التشخيص: خطأ في قاعدة البيانات - المستخدم موجود بشكل خاطئ.');
    console.log('💡 الحل: احذف المستخدم من Authentication > Users في Supabase ثم أعد تشغيل هذا السكريبت.\n');
  } else {
    console.log('📋 التشخيص: مشكلة غير معروفة.');
    console.log('   الخطأ الكامل:', JSON.stringify(signIn.body, null, 2));
  }
}

main().catch(console.error);
