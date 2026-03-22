# OpenClaw Mission Control - Phase 0 Implementation Plan

Bu belge, "phase0-spec.md" dosyasındaki hedefleri gerçekleştirmek için izlenecek teknik adımları açıklamaktadır.

## Backend Geliştirmeleri
1. **Pino Loglama Kurulumu:**
   - Projeye `pino` ve (geliştirme ortamı için) `pino-pretty` paketleri eklenecek.
   - `src/server.js` ve diğer backend modüllerindeki varsayılan `console.log` çağrıları `pino` ile değiştirilecek.

2. **Boot Initializer (Veri Dosyaları Başlatıcısı):**
   - `src/server.js` (veya `src/helpers/bootInitializer.js`) adında bir modül/fonksiyon oluşturulacak.
   - Sunucu ayağa kalkarken `/data` klasörü yoksa oluşturulacak. Ardından `activity.json` (içeriği `[]`) ve `projects.json` (içeriği `{ "projects": [], "pipelines": [], "tasks": [] }`) dosyaları, eğer yoklarsa yazılacak. Bu işlem idempotent olacak (önceden varsa dosyalara dokunulmayacak).

3. **Güvenli Path Resolver (`resolveSafePath`):**
   - Ortak bir helper fonksiyon oluşturulacak: `resolveSafePath(relativePath)`.
   - Bu modül, `/data` kök dizinini baz alarak alınan path'i `path.resolve` ile çözümleyecek. Çıkan sonuç `/data` (veya belirlenen ana dizin) ile başlamıyorsa `Path Traversal Error` fırlatacak.
   - İlgili tüm dosya okuma/yazma endpoint'lerinde zorunlu kılınacak.

4. **Auth Standardı:**
   - Temel bir `requireSetupAuth` middleware'i yazılacak ve `/api/*` endpoint'lerinin hepsinde kullanılacak (unauthenticated admin erişimlerini engellemek için).

## Frontend SPA Geliştirmeleri (Vite + React)
1. **Frontend Stack Kurulumu:**
   - `src/frontend` dizininde Vite (React + TypeScript) şablonu kullanılarak yapı iskeleti oluşturulacak.
   - Gereken paketler: `tailwindcss`, `postcss`, `autoprefixer`, `shadcn/ui` core bileşenleri (`lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`), `@monaco-editor/react`, ve state yönetimi için `zustand`.

2. **Dizin ve Mimari Yapısı (`src/frontend/`):**
   - `components/layout/`: `Sidebar.tsx`, `Topbar.tsx`, `MainShell.tsx` bileşenlerini barındıracak.
   - `modules/`: Uygulamanın domain spesifik sayfaları (örneğin Dashboard, Logs, Editor) burada yer alacak.
   - `store/`: Zustand state tanımları bulunacak (ör. `useAppThemeStore.ts`, `useSidebarStore.ts`).

3. **Zustand Entegrasyonu:**
   - Global UI state'i (Sidebar'ın mobilde açık/kapalı olması vb.) Zustand üzerinden merkezi olarak yönetilecek.

4. **Global UI ve Responsive Tasarım:**
   - TailwindCSS ve shadcn ile dark/light tema destekli modern UI (Premium Aesthetics) uygulanacak.
   - Masaüstünde Sidebar sabit (`fixed w-64` vb.) olurken, içeriğin kalan genişliği kaplaması sağlanacak. 768px altındaki ekranlarda sidebar gizlenecek, hamburger ikonuna tıklayınca drawer (çekmece) menü olarak açılacak. Tüm içerik alanı (MainShell) dikeyde scrollable olacak.

5. **`setup.html` ve SPA Yönlendirmesi:**
   - `src/public/setup.html`, Vite projesinden üretilen JS ve CSS dosyalarını yükleyen minimal bir "shell" dosyası haline getirilecek. Express sunucusu tüm bilinmeyen frontend rotalarını gerekirse bu HTML veya ayrı bir `index.html` dosyasına yönlendirecek.

## Doğrulama Planı (Verification Plan)
### Otomatik Modüller / Testler:
- Sunucu başlatıldığında (`node src/server.js`) console çıktılarında `pino` formatıyla "Sunucu başlatıldı" loglarının görünmesi.
- Başlangıç sonrasında uygulamanın yerel sistemde veya `/data` mount dizininde `/data/activity.json` ve `/data/projects.json` dosyalarının beklenen içerikle otomatik oluşturulduğunun teyit edilmesi.

### Manuel Doğrulama Adımları (Kullanıcı Tarafından):
1. `resolveSafePath` güvenilirliğinin testi: Bir endpoint'e (örn. dosya okuma/yazma) `../../etc/passwd` gibi bir yol göndererek sistem üzerinden hatanın dönüp dönmediği test edilecek.
2. Frontend SPA derlemesinin (`npm run build` veya `dev` server'da Vite'in) hatasız çalışması ve Zustand store'un başarılı şekilde state'i yönetmesi.
3. Tarayıcıda mobil ve masaüstü görünümleri test edilerek Sidebar'ın drawer olarak davranışının doğrulanması.

---

Bu taslak plan "Phase 0 – Başlangıç & Altyapı" şartlarına birebir uyum sağlayarak, kodlamaya (EXECUTION) geçiş için oluşturulmuştur.
