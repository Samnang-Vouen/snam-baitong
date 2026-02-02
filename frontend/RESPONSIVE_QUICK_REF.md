# Quick Responsive Design Reference

## 🎯 Quick Breakpoints

| Device | Width | Example |
|--------|-------|---------|
| 📱 Extra Small | < 380px | Very small phones |
| 📱 Small | 380px - 575px | Standard phones |
| 📱 Medium | 576px - 767px | Large phones |
| 📱 Tablet | 768px - 991px | Tablets |
| 💻 Desktop | 992px+ | Desktop screens |

## 🚀 Quick Usage

### 1. Responsive Text
```jsx
import { useLanguage } from '../components/LanguageToggle';

function MyComponent() {
  const { t } = useLanguage();
  return <h1>{t('welcome')}</h1>;
}
```

### 2. Responsive Utilities
```jsx
import { 
  isMobileDevice, 
  getDeviceType,
  formatResponsiveText 
} from '../utils/responsive';

const isMobile = isMobileDevice(); // true/false
const device = getDeviceType(); // 'mobile', 'tablet', or 'desktop'
const text = formatResponsiveText(longText, { truncate: true });
```

### 3. Responsive CSS Classes
```jsx
{/* Hide on mobile, show on desktop */}
<div className="d-none d-md-block">Desktop only</div>

{/* Show on mobile, hide on desktop */}
<div className="d-block d-md-none">Mobile only</div>

{/* Responsive columns */}
<div className="col-12 col-md-6 col-lg-4">Content</div>
```

## 📐 Responsive Grid Examples

### Auto-fit Grid
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}
```

### Mobile-First Flex
```css
.flex {
  display: flex;
  flex-direction: column; /* Mobile */
}

@media (min-width: 768px) {
  .flex {
    flex-direction: row; /* Tablet and up */
  }
}
```

## 🎨 Responsive Typography

```css
/* Fluid typography */
h1 {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
}

/* Responsive font classes */
.text-responsive {
  font-size: 14px; /* Mobile */
}

@media (min-width: 768px) {
  .text-responsive {
    font-size: 16px; /* Tablet */
  }
}

@media (min-width: 992px) {
  .text-responsive {
    font-size: 18px; /* Desktop */
  }
}
```

## 📏 Touch Target Sizes

Minimum sizes for touch-friendly UI:
- Buttons: **44x44px minimum**
- Input fields: **44px height minimum**
- Icons: **24x24px minimum**
- Spacing between targets: **8px minimum**

## ✅ Testing Checklist

- [ ] Test on Chrome DevTools (F12 → Toggle Device)
- [ ] Test portrait and landscape
- [ ] Check text doesn't overflow
- [ ] Verify buttons are touchable (44px+)
- [ ] Test with actual devices
- [ ] Check translations in both languages

## 🔧 Common Fixes

### Text Overflow
```css
.container {
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}
```

### Horizontal Scroll
```css
body {
  overflow-x: hidden;
}

.container {
  max-width: 100%;
}
```

### Full Width Buttons on Mobile
```css
@media (max-width: 575px) {
  .btn {
    width: 100%;
    display: block;
  }
}
```

## 📱 Device Testing URLs

Test your changes on:
- Chrome DevTools: `F12` → Device Toolbar
- Firefox: `Ctrl+Shift+M` → Responsive Design Mode
- Safari: `Develop` → `Enter Responsive Design Mode`

## 🌐 Translations Coverage

All UI text in both languages:
- ✅ English (`en`)
- ✅ Khmer (`km`)

New translations auto-handled by responsive utilities!

## 💡 Pro Tips

1. **Always test on real devices** when possible
2. **Use Bootstrap responsive classes** (d-none, d-md-block, col-12, col-md-6)
3. **Mobile-first CSS** - start with mobile, enhance for desktop
4. **Use relative units** (rem, em, %) instead of pixels when possible
5. **Test both orientations** (portrait and landscape)

## 🆘 Need Help?

1. Check `RESPONSIVE_DESIGN.md` for detailed documentation
2. Review `utils/responsive.js` for utility functions
3. Inspect `index.css` for global responsive styles
4. Look at existing components for examples

---
**Quick Reference Version**: 1.0
