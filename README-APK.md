# MarQ 1.5 Ton AC Remote & Hardware Troubleshooting Guide

## 1. Physical AC Not Responding? (Kyu nahi chal raha?)

Agar aapne phone ko AC ke samne point kiya aur AC beep nahi kiya ya on nahi hua, to iske **2 main technical reasons** hain:

### Reason 1: Phone me "IR Blaster" (Infrared LED) ka hona zaroori hai
- AC ka receiver **Invisible Infrared (IR) Light (940nm)** se chalta hai.
- Phone ki screen, flashlight, Bluetooth ya Wi-Fi se AC control **nahi ho sakta**.
- Phone ke top frame par ek chhota sa black glass diode (IR Blaster) hona zaroori hai.

#### Kaunse phones me IR Blaster hota hai?
- **Hota hai (Supported):** Xiaomi, Redmi (Note 7/8/9/10/11/12/13/14), Poco (X, F, M series), Mi series.
- **Nahi hota (Not Supported without Dongle):** OnePlus, Samsung Galaxy, Realme, Oppo, Vivo, Motorola, iPhone.

#### Phone ka IR Blaster kaise test karein? (Camera Test)
1. Kisi doosre phone ka **Front (Selfie) Camera** kholen.
2. Apne remote phone ke top edge ko us camera ke samne rakhein.
3. Is app me yellow **START/STOP** button dabayein.
4. Agar phone me IR blaster hai, to camera screen par **Purple / Blue flashing light** dikhegi!

---

### Reason 2: MarQ AC ke alag-alag Motherboard Protocols
Flipkart ne MarQ AC alag-alag factories se banwaye hain:
- **Profile 1: Upix 231M / AUX OEM (Recommended)** -> 90% MarQ 1.5T Fixed Speed ACs me yehi lagta hai.
- **Profile 2: TCL OEM (56-Bit)** -> Kuch MarQ batches me TCL controller hota hai.
- **Profile 3: Midea OEM (48-Bit)** -> Inverted byte checksum protocol.

App me **"AC Not Working? Fix Here"** button par click karke aap **Profile 1, Profile 2, aur Profile 3** teeno ka "Test Beep" test kar sakte hain!

---

## 2. Agar Phone me IR Blaster nahi hai to kya karein? (3 Solutions)

1. **₹99 ka 3.5mm ya Type-C IR Dongle (Amazon/Flipkart):**
   - Ye chhota sa dongle phone ke headphone jack ya charging port me lagta hai.
   - Phone ka volume 100% full karein. Hamara app 38kHz modulated wave audio jack se throw karta hai jo dongle ko fire karta hai!
2. **Smart Wi-Fi IR Hub (Tuya / Smart Life / Broadlink RM4 Mini - ₹600-800):**
   - Is app ke "IR Signals" me jaakar 1-click **Broadlink HEX** copy karke Smart Life app me paste kar sakte hain.
3. **Physical Upix 231M Remote (₹150 - ₹200 on Flipkart):**
   - Upix No. 231M original physical remote Flipkart/Amazon par direct available hai.

---

## 3. GitHub Actions APK Build with Native IR

Humne GitHub Actions workflow me **Android ConsumerIrManager native bridge** integrate kar diya hai:
- Android permission `android.permission.TRANSMIT_IR` auto-inject hoti hai.
- Redmi / Poco / Xiaomi phones par physical IR LED direct trigger hota hai!

### GitHub par Push karne ka command:
```bash
git add .
git commit -m "Add native ConsumerIR support, multi-protocol switcher and AC diagnostic tools"
git push origin main
```
Build khatam hone par **Actions tab > Build Android APK > Artifacts** me **MarQ-AC-Remote-APK** download karne ke liye mil jayegi!
