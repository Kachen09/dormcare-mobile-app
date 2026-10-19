# DORMCARE Mobile

แอปมือถือ DORMCARE พัฒนาด้วย React Native และ Expo

## ติดตั้งแพ็กเกจ

เปิด Terminal ในโฟลเดอร์โปรเจกต์แล้วรัน:

```bash
npm install
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

ไม่มีหน้าสมัครสมาชิก ผู้ดูแลสร้างบัญชีผู้เช่าจากหน้า "ข้อมูลผู้เช่า" ส่วนบัญชีผู้ดูแลและ Firebase Authentication ต้องตั้งค่าใน Firebase Console ก่อนทดสอบ Login

## ดาวน์โหลดแอปเพื่อทดลอง

สแกน QR Code หรือ [ดาวน์โหลด DORMCARE.apk](https://github.com/Kachen09/dormcare-mobile-app/raw/refs/heads/main/downloads/DORMCARE.apk) บนโทรศัพท์ Android:

[![QR Code สำหรับดาวน์โหลด DORMCARE](downloads/DORMCARE-QR.png)](https://github.com/Kachen09/dormcare-mobile-app/raw/refs/heads/main/downloads/DORMCARE.apk)

ต้องอนุญาตให้ติดตั้งแอปจากแหล่งนี้บน Android ก่อนติดตั้ง APK

