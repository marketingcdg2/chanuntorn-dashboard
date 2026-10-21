# Chanuntorn Advertising Dashboard

แดชบอร์ด React สำหรับ Motto Scape, Mono และ Mews ใช้ Meta API เดิม พร้อมรายงานรายวันและฐานข้อมูลผลลัพธ์ที่กรอกเอง

## การใช้งาน

- เลือกโครงการ แพลตฟอร์ม และช่วงวันที่ (วันนี้ / 7 / 14 / 30 วัน / เดือนนี้ / กำหนดเอง)
- เลือกเมตริกการ์ดทั้ง 4 ใบ และเส้นกราฟ 2 เส้น แยกแกนให้เมตริกต่างหน่วย
- สรุป Awareness และ Inbox ตาม objective ของ Meta; objective อื่นแสดงแยกและยังอยู่ในยอดรวม
- ตารางรวมชื่อเดียวกันในโครงการเดียวกัน พร้อมค้นหา เรียงลำดับ และเลือกคอลัมน์
- Qulify, Non-Qulify, Click Line เป็นคอลัมน์ถาวร กดตัวเลขเพื่อกรอกหรือแก้ไขยอดรายวัน
- การบันทึกเป็นยอดรวมของวันนั้น การบันทึกซ้ำจะปรับยอดเดิม ไม่บวกซ้ำ
- Ad Group กับ Ad Creative เป็นบันทึกแยกกัน ไม่รวมสองระดับเข้าด้วยกัน
- รูป Creative โหลดจาก Cloudinary เดิมและคลิกขยายได้
- การ์ด/คอลัมน์เก็บการตั้งค่าในเบราว์เซอร์; ผลรายวันเก็บบนเซิร์ฟเวอร์ SQLite
- Google Ads ยังไม่เชื่อมต่อ จึงไม่แสดงข้อมูลจำลองหรือยอดศูนย์ที่ชวนให้เข้าใจผิด

## พัฒนาในเครื่อง

ต้องใช้ Node.js 24 ขึ้นไป (รองรับ `node:sqlite`)

```sh
npm ci
cp .env.example .env
# กำหนด FB_TOKEN และค่า Cloudinary ของ backend เดิมใน .env
# กำหนด DASHBOARD_WRITE_TOKEN เป็นรหัสยาวที่ผู้ดูแลใช้กรอกผล
# สำหรับ local ให้ลบ/เว้นว่าง VITE_API_URL เพื่อใช้ Vite proxy
npm start
# terminal อีกหน้าต่าง
npm run dev
```

API เริ่มที่ port 3000 และ Vite ที่ port 5173. ข้อมูลเก็บที่ `data/results.sqlite` โดยค่าเริ่มต้น และไม่ถูกนำเข้า Git

## นำขึ้นระบบเดิม

ระบบนี้ยังใช้ Vercel สำหรับ frontend และ Render สำหรับ backend ตามโครงสร้างเดิม ต้องอัปเดตทั้งสองส่วน **โดยขึ้น backend ก่อน**:

1. ใช้ branch `codex/dashboard-redesign` ตรวจ diff และสำรองข้อมูล/การตั้งค่า deployment เดิม
2. ที่ Render ชี้ source มายังโค้ดชุดนี้ ใช้ Node 24, build `npm ci`, start `npm start`
3. คงค่า `FB_TOKEN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `FRONTEND_URL` เดิม
4. ตั้ง `DASHBOARD_WRITE_TOKEN` ฝั่ง backend เท่านั้น เป็นรหัสที่ผู้ดูแลใช้ยืนยันการบันทึก ห้ามใส่ในตัวแปร `VITE_*`
5. ผูก persistent disk ให้ backend และตั้ง `DATA_DIR` เป็น mount path เช่น `/var/data/chanuntorn` เพื่อให้ SQLite อยู่หลัง deploy/restart; อย่าใช้ filesystem ชั่วคราวสำหรับข้อมูลจริง ให้รัน backend instance เดียวที่ใช้ disk นี้
6. ตั้ง `META_API_VERSION` ให้เป็นเวอร์ชันที่ app Meta รองรับ (ค่าเริ่มต้น `v25.0`)
7. ทดสอบ `/api/health`, `/api/report?project=motto&since=YYYY-MM-DD&until=YYYY-MM-DD` และ `/api/manual-results?project=motto`
8. ที่ Vercel ใช้ `npm run build`, output `dist`, คง `VITE_API_URL` เป็น URL backend จริง แล้ว deploy frontend
9. ตรวจบันทึกผลรายวันและ reload หน้า ยืนยันผลยังอยู่ ก่อนใช้งานจริง

SQLite ต้องสำรองด้วย SQLite backup tooling หรือหยุด server ก่อนสำเนาไฟล์ รวมไฟล์ WAL เมื่อเกี่ยวข้อง การนำขึ้น production ต้องมี persistent disk พร้อมอยู่แล้ว; โค้ดไม่ได้ซื้อหรือ provision แผน hosting ให้

รหัสเขียนตรวจฝั่งเซิร์ฟเวอร์ ไม่บันทึกลง localStorage และไม่ส่งไป Meta/Cloudinary. การอ่านรายงานยังเป็นสาธารณะตามระบบเดิม หากต้องการจำกัดผู้ดู ต้องเพิ่มระบบสมาชิกแยกต่างหาก

## การทดสอบ

```sh
npm test
npm run build
```

ทดสอบ aggregation/อัตราส่วน, การกรองวัน/ระดับ, ข้อมูลที่มีเฉพาะผลกรอกเอง, SQLite persistence, optimistic concurrency, validation, สิทธิ์เขียน, HTTP API และ Meta pagination ด้วย fixture. การเรียก Meta จริงต้องใช้ FB_TOKEN ที่ยังมีสิทธิ์; test suite ไม่ใช้บัญชีโฆษณาจริง

การตรวจเบราว์เซอร์ในงานนี้ใช้ข้อมูลทดสอบแยกจาก production: เลือกเมตริก, ซ่อน/ล็อกคอลัมน์, บันทึกผลรายวัน, เปิดรูป, ค้นหา และจอมือถือ ภาพตัวอย่างจึงไม่ใช่ยอดโฆษณาจริง
