# MrAstronaut dastxati

Loyiha pastiga qöyiladigan ixçam **Crafted by MrAstronaut ↗** dastxati. Bosilganda **https://mrastronaut.uz/** yangi oynada oçiladi.

## Örnatiş

1. `signature` papkasini loyihangizning statik fayllar ildiziga nusxalang. Masalan, Vite yoki Next.js loyihasida `public/signature/` böladi. `index.html`, `preview.css` va `preview.js` faqat namuna sahifasi uçun; işlayotgan dastxatga kerak emas.
2. Sahifaning `<head>` qismiga uslubni ulang:

   ```html
   <link rel="stylesheet" href="/signature/signature.css" />
   ```

3. `signature.html` içidagi `<a>…</a>` kodini loyihangizning `<footer>` qismiga joylang.

Dastxat atrofidagi matn rangini meros qilib oladi: oç va töq fon uçun alohida variant şart emas. Asosiy komponent JavaScript, taşqi şrift yoki rasm xizmatiga boğliq emas. Logo va şrift `assets/` içida.

Saytingiz `/my-project/` kabi içki manzilda joylaşgan bölsa, HTML içidagi `/signature/` yöllarini `/my-project/signature/` qilib özgartiring. CSS içidagi şrift yöli nisbiy bölib qoladi.

## Oddiy matn varianti

Rasm va uslubsiz işlatiş uçun:

```html
<a href="https://mrastronaut.uz/" target="_blank" rel="noopener noreferrer">
  Crafted by MrAstronaut ↗
</a>
```

## Namuna

Loyihani odatiy statik serverda işga tuşiring va `/signature/` manzilini oçing. Namuna sahifasidagi tugma uslub havolasi va dastxat HTML kodini birga nusxalaydi.

Boşqa loyihaga dastxat qöşiş uçun tayyor topşiriq [PROMPT.md](./PROMPT.md) faylida.
