# DORMCARE Mobile

โฟลเดอร์นี้เป็นส่วน React Native/Expo ของโปรเจกต์ DORMCARE

## ติดตั้งแพ็กเกจ

ให้เปิด Terminal ที่โฟลเดอร์ `mobile` แล้วรัน:

```bash
npm install firebase @react-native-async-storage/async-storage
```

จากนั้นคัดลอก `.env.example` เป็น `.env` และใส่ค่า Firebase Web App Config จาก Firebase Console ห้าม commit หรืออัปโหลดไฟล์ `.env`

## โครงสร้างข้อมูลและ Context

- `src/contexts/AuthContext.jsx`: Login, Logout, เปลี่ยนรหัสผ่าน และอ่าน role จาก Firestore
- `src/contexts/RoomContext.jsx`: อ่านและจัดการข้อมูลใน Firestore collection `rooms`
- `src/contexts/DormContext.jsx`: จัดการ tenants, contracts, bills และ complaints ใน Firestore
- `src/config/firebase.js`: เชื่อมต่อ Firebase Auth และ Firestore

## หน้าการจัดการที่ทำไว้

- ผู้ดูแล: ภาพรวม, ห้องพัก, ผู้เช่า, สัญญาเช่า, บิล และรายการแจ้งปัญหา
- ผู้เช่า: ดูสัญญาและบิลของตนเอง พร้อมส่งและติดตามรายการแจ้งปัญหา
- การแจ้งเตือนในแอป: สรุปบิลที่ยังไม่ชำระและปัญหาที่ยังไม่เสร็จสำหรับผู้ดูแล

ข้อมูลทุกกลุ่มบันทึกใน Cloud Firestore และแสดงผลแบบเรียลไทม์ บัญชีผู้เช่าใช้อีเมลเดียวกับรายการใน `tenants` เพื่อดูสัญญา บิล และรายการแจ้งปัญหาของตนเอง

ไม่มีหน้าสมัครสมาชิก ผู้ดูแลสร้างบัญชีผู้เช่าพร้อมรหัสผ่านเริ่มต้นจากหน้า "ข้อมูลผู้เช่า" ได้ ส่วนบัญชี admin ตั้งค่าใน Firebase Console ใน Firebase Console

## วิธีใช้ Provider

```jsx
<AuthProvider>
  <DormProvider>
    <RoomProvider>
      <App />
    </RoomProvider>
  </DormProvider>
</AuthProvider>
```

ต้องติดตั้ง Firebase Authentication และสร้างบัญชีทดสอบใน Firebase Console ก่อนทดสอบ Login

