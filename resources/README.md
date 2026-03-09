# App Icon & Splash Screen Resources

Place the following files in this directory before running `npx @capacitor/assets generate`:

## icon.png
- **Size:** 1024 x 1024 px
- **Source:** Upscale `assets/logos/logo-monogram-512.svg` to 1024px
- **Format:** PNG with transparency
- Capacitor Assets will auto-generate all Android/iOS icon sizes from this single file

## splash.png
- **Size:** 2732 x 2732 px
- **Background:** #f3ebe2 (Pie Lab cream)
- **Content:** Centered logo (from `assets/logos/logo-stacked.svg`)
- Capacitor Assets will generate all splash screen sizes from this

## How to generate platform resources

```bash
npm install -D @capacitor/assets
npx @capacitor/assets generate
```

This reads `icon.png` and `splash.png` from this directory and outputs
all required sizes into `android/` and `ios/` resource folders.
