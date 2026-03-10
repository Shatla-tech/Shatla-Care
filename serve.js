// Dev server for Shatla Care — serves static files + mocks /api/portal
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3457;

const MOCK = {
  deal: {
    id: 'mock-deal-id',
    name: 'Nestle Factory',
    pipeline: 'Subscription',
    stage: 'Active',
    phone: '+20 100 000 0000',
    address: 'مدينة نصر، القاهرة',
    region: 'مدينة نصر',
    email: 'contact@nestle.com'
  },
  visits: [
    {
      id: 'v1',
      title: 'زيارة صيانة شهرية — Nestle Factory',
      status: 'Report Submitted',
      submissionDate: '2026-03-08T14:30:00',
      startTime: '2026-03-08T09:00:00',
      endTime: '2026-03-08T11:30:00',
      spentTime: '2:30',
      bags: 5,
      photoCount: 8,
      photos: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
        'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400',
        'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400'
      ],
      aiReport: `Technical Notes:
تم اكتشاف بعض مشاكل الري في المنطقة الشمالية، حيث يوجد تسرب بسيط في نقطة التوزيع الرئيسية. الأشجار في حالة جيدة بشكل عام مع ملاحظة بعض الاصفرار في أوراق النخيل.

Tasks Done:
- قص وتشكيل الأسيجة بالكامل
- تسميد الحديقة الأمامية
- رش مبيدات وقائية على النباتات
- تنظيف وجمع المخلفات (5 شياكر)
- فحص شبكة الري — تحديد موضع التسرب

Recommendations or Special Instructions:
- إصلاح تسرب الري في نقطة التوزيع الشمالية خلال أسبوع
- إضافة سماد حديد للنخيل لمعالجة الاصفرار
- جدولة زيارة إضافية لمتابعة حالة الري`,
      reportedStatus: ['Irrigation Issue', 'Has Recommendations'],
      tags: ['Maintenance']
    },
    {
      id: 'v2',
      title: 'زيارة صيانة شهرية — Nestle Factory',
      status: 'Approved',
      submissionDate: '2026-02-07T13:00:00',
      startTime: '2026-02-07T09:00:00',
      endTime: '2026-02-07T11:00:00',
      spentTime: '2:00',
      bags: 3,
      photoCount: 5,
      photos: [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
        'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400',
        'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?w=400'
      ],
      aiReport: `Technical Notes:
الحالة العامة للحديقة ممتازة. لا توجد مشاكل تقنية ملحوظة هذا الشهر. درجات الحرارة المنخفضة أثّرت على معدل النمو بشكل طبيعي.

Tasks Done:
- قص الأعشاب في جميع المناطق
- تقليم الأشجار والشجيرات
- تنظيف الممرات وإزالة الأوراق المتساقطة
- فحص نظام الري — يعمل بكفاءة

Recommendations or Special Instructions:
- البدء في تسميد الربيع الشهر القادم
- مراقبة نمو نبات السرو في المدخل الرئيسي`,
      reportedStatus: ['Has Recommendations'],
      tags: ['Maintenance']
    }
  ],
  totalVisits: 2,
  lastVisit: '2026-03-08T14:30:00'
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

http.createServer((req, res) => {
  // Mock API
  if (req.url.startsWith('/api/portal')) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(MOCK));
    return;
  }

  // Static files
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  if (!ext) filePath += '.html';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(302, { Location: '/' });
      res.end();
      return;
    }
    res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'text/plain');
    res.end(data);
  });
}).listen(PORT, () => console.log('Shatla Care dev server: http://localhost:' + PORT));
