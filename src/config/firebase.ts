// ============================================================
// config/firebase.ts — Firebase configuration for push notifications
// ============================================================

// 🔥 قم بتعيين قيم Firebase الخاصة بك هنا
// للحصول على هذه القيم، اذهب إلى https://console.firebase.google.com/
// وأنشئ مشروعاً جديداً، ثم أضف تطبيق ويب، وانسخ بيانات التهيئة.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// ملاحظة: هذه الدالة افتراضية، ستحتاج إلى تهيئة Firebase في main.tsx
// وإضافة Service Worker لتلقي الإشعارات.

export async function sendPushNotification(token: string, title: string, body: string, data?: any) {
  // هذه دالة مثال لإرسال إشعار عبر Firebase Cloud Messaging
  // تحتاج إلى خادم وسيط (Node.js) لاستخدام FCM بشكل آمن،
  // أو يمكنك استخدام REST API مع مفتاح الخادم.

  // هذا مثال لاستخدام REST API:
  // https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send
  // تحتاج إلى OAuth2 token أو مفتاح API.

  console.warn('⚠️ Firebase not configured. Push notifications will not be sent.');
  console.log('📤 Would send push notification:', { token, title, body, data });
}

export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== 'YOUR_API_KEY';
};