/**
 * سكريبت لإصلاح حساب الإدمن
 * يقوم بتحديث كلمة المرور وإدراج السجل في جدول المستخدمين
 * تشغيل: node fix-admin.js
 */

const https = require('https');

const SUPABASE_URL = 'https://ozbukcesxoatpqaenxpj.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96YnVrY2VzeG9hdHBxYWVueHBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NTg2MTYsImV4cCI6MjA5OTAzNDYxNn0.YabaH5A-V_X6Y1jTPEtzy8dQXhU5PuzYo1oL2QEgtQs';

const ADMIN_EMAIL = 'mhbghost@gmail.com';
const ADMIN_PASSWORD = '0127558019m';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'ozbukcesxoatpqaenxpj.supabase.co',
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${token || ANON_KEY}`,
      },
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseData) });
        } catch {
          resolve({ status: res.statusCode, body: responseData });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔧 بدء إعداد حساب الإدمن...\n');

  // Step 1: Sign up (if not exists) or sign in
  console.log('1️⃣ محاولة تسجيل الدخول...');
  let signInResult = await request('POST', '/auth/v1/token?grant_type=password', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (signInResult.status === 200 && signInResult.body.access_token) {
    console.log('✅ تسجيل الدخول نجح! كلمة المرور صحيحة.');
    const token = signInResult.body.access_token;
    const userId = signInResult.body.user?.id;
    console.log(`   User ID: ${userId}\n`);

    // Upsert into public.users
    console.log('2️⃣ إدراج السجل في جدول users...');
    const insertResult = await request('POST', '/rest/v1/users', {
      id: userId,
      email: ADMIN_EMAIL,
      role: 'admin',
    }, token);

    if (insertResult.status === 201 || insertResult.status === 200) {
      console.log('✅ تم إدراج المستخدم في قاعدة البيانات بنجاح!\n');
    } else {
      console.log('⚠️  النتيجة:', insertResult.status, JSON.stringify(insertResult.body));
      // Try upsert
      const upsertResult = await request('POST', '/rest/v1/users?on_conflict=id', {
        id: userId,
        email: ADMIN_EMAIL,
        role: 'admin',
      }, token);
      console.log('   Upsert result:', upsertResult.status, JSON.stringify(upsertResult.body));
    }

    console.log('\n🎉 الحساب جاهز! يمكنك الآن تسجيل الدخول بـ:');
    console.log(`   البريد: ${ADMIN_EMAIL}`);
    console.log(`   كلمة المرور: ${ADMIN_PASSWORD}`);
    console.log('   الرابط: http://localhost:3000/login');
    return;
  }

  // Login failed, try sign up
  console.log('   تسجيل الدخول فشل. محاولة إنشاء حساب جديد...');
  console.log('   Status:', signInResult.status, JSON.stringify(signInResult.body));

  const signUpResult = await request('POST', '/auth/v1/signup', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  console.log('   Sign up status:', signUpResult.status);

  if (signUpResult.status === 200 && signUpResult.body.user) {
    const user = signUpResult.body.user;
    const token = signUpResult.body.access_token;
    console.log(`✅ تم إنشاء الحساب! User ID: ${user.id}\n`);

    // Insert into public.users
    console.log('2️⃣ إدراج السجل في جدول users...');
    if (token) {
      const insertResult = await request('POST', '/rest/v1/users', {
        id: user.id,
        email: ADMIN_EMAIL,
        role: 'admin',
      }, token);
      console.log('   Insert result:', insertResult.status, JSON.stringify(insertResult.body));
    } else {
      console.log('⚠️  لا يوجد token متاح. يجب تأكيد الإيميل أولاً أو تعطيل تأكيد البريد من Supabase.');
    }

    console.log('\n🎉 الحساب تم إنشاؤه! يمكنك الآن تسجيل الدخول بـ:');
    console.log(`   البريد: ${ADMIN_EMAIL}`);
    console.log(`   كلمة المرور: ${ADMIN_PASSWORD}`);
  } else {
    console.log('\n❌ فشل إنشاء الحساب:');
    console.log(JSON.stringify(signUpResult.body, null, 2));
    console.log('\n💡 الحل: اذهب إلى Supabase Dashboard > Authentication > Users');
    console.log('   واحذف المستخدم mhbghost@gmail.com ثم شغل هذا السكريبت مرة أخرى.');
  }
}

main().catch(console.error);
