# Phase 0 – Başlangıç & Altyapı (Base Setup) Specification

## Hedef
Mevcut OpenClaw Railway template'inin üstüne, Mission Control için sağlam bir temel inşa etmek. Hedef, veri kalıcılığını sağlamak ve modern SPA altyapısını kurmaktır.

## Backend Gereksinimleri
1. **Data Dosyaları ve Init:**
   - `/data/activity.json` dosyası başlatılmalı (başlangıç: `[]`).
   - `/data/projects.json` dosyası başlatılmalı (başlangıç: `{ "projects": [], "pipelines": [], "tasks": [] }`).
   - `src/server.js` içinde bir "boot initializer" yazılarak sunucu başlarken bu dosyalar yoksa otomatik oluşturulması sağlanmalıdır. Bu işlem idempotent olmalı, veriyi bozmamalıdır.
2. **Güvenli Path Resolver:**
   - Ortak bir helper fonksiyon yazılmalıdır: `resolveSafePath(relativePath: string): string`.
   - Bu fonksiyon `path.resolve('/data', '.' + relativePath)` ile gerçek path'i hesaplamalı, sonuç `/data/` ile başlamıyorsa hata fırlatmalıdır.
3. **Auth Standardı:**
   - Tüm yeni `/api/*` uç noktaları `requireSetupAuth` middleware'ini kullanmalıdır.

## Frontend SPA ve Stack Gereksinimleri
1. **SPA Altyapısı:** 
   - `src/public/setup.html` dosyası, Mission Control SPA için temel bir "shell" (kabuk) olacak şekilde düzenlenmelidir (Tek JS bundle örneğin `/static/mission-control.js` ve CSS yüklemesi).
2. **Frontend Stack Kurulumu:**
   - Vite + React + TypeScript + Tailwind + shadcn/ui + @monaco-editor/react projenin `src/frontend/` dizini altına kurulmalıdır.
3. **Dizin Yapısı:**
   - `src/frontend/app.tsx` (Root component)
   - `src/frontend/components/layout/` (Sidebar, Topbar, MainShell)
   - `src/frontend/modules/`
4. **Global UI Standardı:**
   - Tailwind ve shadcn ile dark/light tema desteği eklenmelidir.
   - Mobil uyumlu layout yapılmalıdır: Masaüstünde sidebar "fixed", 768px altı mobil ekranlarda "drawer" davranışında olmalıdır. İçerik alanı full height ve scrollable olmalıdır.
