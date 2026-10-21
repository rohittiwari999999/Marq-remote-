# GitHub par Android APK Build Karne Ka Guide

Aapke project me GitHub Actions workflow file create kar di gayi hai:
`.github/workflows/build-apk.yml`

---

## Step 1: Code ko GitHub par Push karein
Apne computer/terminal me ye commands chalayein:

```bash
git add .
git commit -m "Add GitHub Actions APK build workflow"
git push origin main
```

---

## Step 2: Automatic APK Build Start hoga
1. Apne GitHub repository ko open karein.
2. Upar menu me **"Actions"** tab par click karein.
3. Wahan **"Build Android APK"** workflow apne aap chalna shuru ho jayega.
4. Ye workflow:
   - Node.js & Vite build karega
   - Android SDK aur Java 17 setup karega
   - Capacitor Android project generate karega
   - Gradle ke zariye `app-debug.apk` create karega

---

## Step 3: APK Download karein
1. Jab build green check (✅) ho jaye (approx 2-3 minutes).
2. Workflow run par click karein.
3. Page ke bottom me **"Artifacts"** section dekhein.
4. **"MarQ-AC-Remote-APK"** par click karein aur zip file download karein.
5. Zip extract karein, uske andar **`app-debug.apk`** milega.
6. Is APK ko apne Android phone me install karein!
