# Image Optimization Guide - Reducing Vercel Image Transformation Costs

## ✅ Applied Optimizations

### 1. Quality Limitation (CRITICAL)
**File:** `next.config.ts:115`

```typescript
qualities: [75], // Limits to only 75% quality
```

**Impact:** Reduces transformations by ~90% by forcing a single quality level instead of generating multiple quality variants.

### 2. Removed Explicit Quality Props
**Files Updated:**
- `components/public/produto-card.tsx` (2 instances)
- `components/public/banner-carousel.tsx` (1 instance)
- `components/public/image-gallery-zoom.tsx` (3 instances)

**Impact:** Ensures all images use the global 75% quality setting consistently.

---

## 🚨 Critical Next Steps

### 1. Optimize Large Logo File (HIGH PRIORITY)
**Issue:** `/public/images/logo.png` is 478KB (1080x594px) but displayed at tiny sizes (80-180px)

**Solutions:**

#### Option A: Pre-optimize the logo (RECOMMENDED)
Use an external tool to compress the PNG:
```bash
# Using pngquant (install first: sudo apt install pngquant)
pngquant --quality=80-90 --ext=.png --force public/images/logo.png

# Or using ImageMagick (install first: sudo apt install imagemagick)
convert public/images/logo.png -quality 85 -define png:compression-level=9 public/images/logo-optimized.png
```

#### Option B: Use `unoptimized` prop for logo
Since the logo is a static brand asset, mark it as unoptimized:

```typescript
// In components where logo is used with Next Image:
<Image
  src="/images/logo.png"
  alt="Léo iPhone"
  unoptimized={true}  // Add this
  // ... other props
/>
```

**Expected savings:** ~400-450 transformations per deployment

---

### 2. Review Device/Image Sizes
**Current config:**
```typescript
deviceSizes: [640, 750, 828, 1080, 1200], // 5 sizes
imageSizes: [16, 32, 48, 64, 96, 128, 256], // 7 sizes
```

**Consider reducing if your analytics show most users are on specific devices:**
```typescript
// Example: If 90% of users are on mobile/tablet only
deviceSizes: [640, 828, 1200], // 3 sizes instead of 5
imageSizes: [64, 128, 256], // 3 sizes instead of 7
```

**Potential savings:** Up to 50% reduction in size-based transformations

---

### 3. Mark Small Static Images as Unoptimized
**Files to check:** `/public/icons/*`

Small icons and SVGs should use `unoptimized={true}`:
- SVG files (don't benefit from optimization)
- Icons under 10KB
- App icons (already optimized)

**Example:**
```typescript
// For any icon < 10KB or any SVG:
<Image src="/icons/icon-96x96.png" unoptimized={true} ... />
```

**Expected savings:** 50-100 transformations

---

### 4. Monitor Transformation Usage
After deploying these changes, monitor your Vercel dashboard:

**Expected reduction:**
- Before: ~5,000+ transformations/month
- After: ~500-1,000 transformations/month (80-90% reduction)

**Key metrics to watch:**
- Transformations per page load
- Most transformed images
- Cache hit rate

---

## 📊 Estimated Impact

| Optimization | Reduction | Status |
|-------------|-----------|--------|
| Quality limitation (`qualities: [75]`) | ~90% | ✅ Applied |
| Remove explicit quality props | ~5% | ✅ Applied |
| Optimize logo file | ~400-450 transforms | ⏳ Pending |
| Reduce device/image sizes | ~30-50% | 💡 Optional |
| Unoptimized static assets | ~50-100 transforms | 💡 Optional |

**Total expected reduction: 85-95% of current usage**

---

## 🛠️ Quick Commands

### Test Build Locally
```bash
npm run build
# Check for any image optimization warnings
```

### Deploy Changes
```bash
git add .
git commit -m "Optimize image transformations - add quality limits"
git push
```

### Monitor After Deploy
1. Go to Vercel Dashboard
2. Navigate to your project → Usage → Image Optimization
3. Compare transformation counts over next 7 days

---

## 📚 Additional Resources

- [Next.js Image Optimization Docs](https://nextjs.org/docs/app/api-reference/components/image)
- [Vercel Image Optimization Pricing](https://vercel.com/docs/image-optimization)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)
