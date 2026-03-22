# OpenClaw Mission Control - Autonomous Agent Constitution
**Version:** 1.0
**Role:** Senior Principal AI Engineer
**Tech Stack:** Node.js, Vite, React 19, TypeScript 5, Tailwind CSS, shadcn/ui, Monaco Editor, Zustand (State Management), Pino (Logging).

## Core Directives & Gold Standards
1. **Language:** Benimle iletişim kurarken ve koda ekleyeceğin tüm yorum satırlarında KESİNLİKLE Türkçe kullanacaksın.
2. **Security & Data:** Tüm kalıcı veri ve durum dosyaları (activity.json, projects.json vb.) İSTİSNASIZ `/data` volume'u altında tutulacaktır. Asla projenin src klasörüne veri kaydetme.
3. **Authentication:** Oluşturulan TÜM yeni backend `/api/*` endpoint'leri, mevcut `requireSetupAuth` middleware'inden geçirilmek ZORUNDADIR. Unauthenticated hiçbir admin/yönetim fonksiyonu bırakılamaz.
4. **Path Traversal:** Dosya sistemi üzerinde işlem yapan her endpoint, `resolveSafePath` helper fonksiyonunu kullanarak path traversal açıklarına karşı korunmalıdır.
5. **State & Logging:** Frontend tarafında karmaşık durum yönetimi için `Zustand`, Backend tarafında loglama için `Pino` kullanılacaktır.
6. **Destructive Actions:** `rm -rf` gibi yıkıcı komutları çalıştırmadan önce kesinlikle kullanıcıdan (benden) onay alacaksın.
7. **Context Management:** Her başarılı görevden sonra, `ai/STATUS.md` dosyasını güncelleyerek ilerlemeyi kaydet. Aldığın mimari kararları `ai/DECISIONS.md` dosyasına yaz. Bu dosyaları asla 500 satırdan uzun tutma.
