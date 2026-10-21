# GitHub Actions APK Build (Final Fix - edgesOut Error Solved)

### Error Fixed (Screenshot 4:23 PM):
Error tha:
`npm error Cannot read properties of null (reading 'edgesOut')`

**Reason:** 
React 19 ke naye version ke sath npm v10 ka dependency tree builder (Arborist) peer dependencies resolve karte waqt crash ho jata hai.

**Fix Applied:**
1. Humne `npm install --legacy-peer-deps` add kar diya hai jisse npm bina kisi peer-dependency conflict ke cleanly install ho jata hai.
2. Ek valid `package-lock.json` bhi project me generate kar di gayi hai.

---

## Push karein aur APK banayein:

```bash
git add .
git commit -m "Fix npm install with legacy peer deps and add package-lock"
git push origin main
```

Push karne ke baad:
1. GitHub par **"Actions"** tab me jayein.
2. **Build Android APK** chalega aur complete hone par **`MarQ-AC-Remote-APK`** artifact download karne ke liye ready hoga!
