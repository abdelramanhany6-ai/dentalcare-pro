# DentalCare Pro

تطبيق ويب لإدارة العيادات: المرضى، المواعيد، السجلات السريرية، والفواتير.

## التشغيل محلياً

```bash
npm install
cp .env.example .env.local
# عدّل .env.local وحط VITE_SUPABASE_ANON_KEY (من Supabase > Project Settings > API Keys)
npm run dev
```

## إعداد Supabase

1. الـ schema والـ RLS متطبقين على المشروع `kxaucfqacdscqqpxtety`.
2. لو تأكيد الإيميل مفعّل في Authentication > Providers > Email، أول تسجيل هيحتاج تأكيد البريد.
3. في Authentication > URL Configuration، ضيف رابط الـ deploy بتاعك في Site URL و Redirect URLs.

## رفع المشروع على GitHub

```bash
git init
git add .
git commit -m "Initial DentalCare Pro web app"
git branch -M main
git remote add origin https://github.com/<your-username>/dentalcare-pro.git
git push -u origin main
```

تأكد إن `.env.local` مش بيتضاف (الـ `.gitignore` بيمنعه).

## النشر (Deploy)

أسهل طريقة: Vercel أو Netlify. استورد الـ repo، وضيف متغيرات البيئة `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` في إعدادات المشروع.

## ملاحظات أمنية

- التطبيق بيستخدم الـ anon key بس. الـ service_role key ممنوع في الواجهة.
- الـ RLS بيفصل بيانات كل عيادة عن الباقي.
- مفيش صلاحية حذف للمرضى أو السجلات أو الفواتير من الـ API.

## الحالة الحالية

تم: تسجيل الدخول، إنشاء عيادة، المرضى، المواعيد.
لسه: رفع المرفقات والأشعة، الفواتير والمدفوعات في الواجهة، النسخ الاحتياطي والاستعادة (حسب `docs/BACKUP_AND_RECOVERY.md` المطلوب في الـ spec).
