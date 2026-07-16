# 20 Temmuz Mobil Hikaye Deneyimi

## Teknik ve Fonksiyonel Proje Dokümantasyonu

> Belge güncelleme tarihi: 14 Temmuz 2026, Europe/Istanbul  
> Kapsam: repository kaynak kodu, kurulu paketler, bağlı Supabase içerik özeti ve fonksiyonel altyapı  
> Ana uygulama erişim kodu: `20TEMMUZ`

Bu belge projenin mevcut hâlini anlatır. Yalnızca hedeflenen tasarımı değil, kodun bugün gerçekten nasıl davrandığını, hangi özelliklerin tamamlandığını, hangi alanların yalnızca veri modelinde bulunduğunu ve bilinen riskleri de içerir.

---

## 1. Projenin amacı

Bu proje, QR kod veya doğrudan bağlantı ile açılması planlanan, mobil öncelikli, romantik bir doğum günü ve yıl dönümü hikâye deneyimidir. İçerik 17-20 Temmuz 2026 arasındaki dört günlük bir akış olarak tasarlanmıştır.

Kullanıcı açısından deneyim şu yapıdadır:

1. Açılış sayfası deneyimin temasını tanıtır.
2. Kullanıcı özel erişim kodunu girer.
3. Kod Supabase RPC üzerinden doğrulanır.
4. Yolculuk sahneleri Supabase'den alınır.
5. Kullanıcı hikâye, anı, görev, sinematik bölüm jeneriği, kilitli açılım ve final sahneleri arasında ilerler.
6. Görev sonuçları, fotoğraflar ve ödül açılımları Supabase'de kalıcı tutulur.
7. Zamanı gelmeyen veya ön koşulu tamamlanmayan sahnelerin gerçek içeriği backend tarafından gizli tutulur.

Uygulama klasik bir blog veya çok sayfalı içerik sitesi değildir. Temel birim “sayfa” değil, sıralı bir `JourneyScene` yani yolculuk sahnesidir.

---

## 2. Hızlı başlangıç

### Gereksinimler

- Node.js
- npm
- Supabase proje URL'si
- Supabase publishable key veya eski projeler için anon key

### Kurulum ve çalıştırma

```bash
npm install
npm run dev
```

Yerel adres:

```text
http://localhost:3000
```

### Ortam değişkenleri

`.env.local.example` dosyası temel şablondur:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
# Eski projeler için alternatif:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Production preview rotasını koruyan server-side token
JOURNEY_PREVIEW_TOKEN=...

# Geçici masaüstü içerik editörünü açar
NEXT_PUBLIC_CONTENT_STUDIO_ENABLED=false
```

Önemli noktalar:

- `NEXT_PUBLIC_` ile başlayan değerler browser bundle'ına girer ve gizli değildir.
- Projede `service_role` anahtarı kullanılmaz ve frontend'e kesinlikle eklenmemelidir.
- `JOURNEY_PREVIEW_TOKEN` public prefix taşımadığı için sunucu tarafında kalır.
- `NEXT_PUBLIC_CONTENT_STUDIO_ENABLED` build anında sabitlenir. Değiştirdikten sonra production yeniden build edilmelidir.
- `.env.local` Git tarafından ignore edilir; `.env.local.example` repoda tutulur.

---

## 3. Tech stack

Kurulu sürümler aşağıdadır. `package.json` içindeki aralık yerine doğrulama anındaki gerçek kurulu sürümler verilmiştir.

| Teknoloji | Sürüm | Projedeki görevi |
|---|---:|---|
| Next.js | 16.2.10 | App Router, route oluşturma, server/client component sınırı, font ve metadata, production build |
| React | 19.2.4 | Bileşen modeli, state, effect, memoization ve kullanıcı etkileşimleri |
| React DOM | 19.2.4 | Browser render katmanı |
| TypeScript | 5.9.3 | Katı tip kontrolü; sahne, blok, oyun, ödül ve Studio veri sözleşmeleri |
| Tailwind CSS | 4.3.2 | Utility-first görsel tasarım ve responsive davranış |
| `@tailwindcss/postcss` | 4.3.2 | Tailwind 4 PostCSS entegrasyonu |
| Framer Motion | 12.42.2 | Sayfa geçişleri, reveal animasyonları, loading, yıldızlar ve oyun mikro animasyonları |
| Supabase JS | 2.109.0 | RPC çağrıları, Storage upload, public URL ve signed URL üretimi |
| Lucide React | 1.23.0 | Arayüz ikonları |
| clsx | 2.1.1 | Koşullu class birleştirme |
| tailwind-merge | 3.6.0 | Çakışan Tailwind class'larını güvenli birleştirme |
| ESLint | 9.39.4 | Statik kod kalitesi |
| eslint-config-next | 16.2.10 | Next.js Core Web Vitals ve TypeScript lint kuralları |
| Geist / Geist Mono | Next.js font paketi | Ana sans ve monospace fontlar |
| Web Audio API | Browser native | Dosyasız, kodla sentezlenen duygusal arka plan müziği |

### Yüklü fakat aktif kullanılmayan paket

`class-variance-authority@0.7.1` bağımlılıklarda bulunur ancak kaynak kodda import edilmez. Kaldırılabilir veya ileride varyant tabanlı component tasarımında kullanılabilir.

### Bilinçli olarak kullanılmayan altyapılar

Mevcut projede şunlar yoktur:

- Kullanıcı hesabı veya Supabase Auth oturumu
- Middleware/proxy tabanlı route koruması
- Next.js Route Handler/API endpoint'i
- Realtime subscription
- Server Action
- Global state kütüphanesi
- Analytics, error tracking veya monitoring
- PWA, service worker veya offline cache
- i18n altyapısı
- ORM veya repository içi SQL migration yapısı

---

## 4. Üst seviye mimari

```mermaid
flowchart TD
    U[Kullanıcı / QR] --> H[/ Ana sayfa]
    H --> X[/unlock]
    X -->|validate_journey_access_code| S[(Supabase)]
    X -->|kod localStorage'a yazılır| J[/journey]
    J -->|initialize_journey_progress| S
    J -->|get_journey_scenes| S
    S -->|sıralı ve kilitleri uygulanmış sahneler| J
    J --> T[Hikâye / Anı / Görev / Final UI]
    T -->|complete_journey_scene| S
    T -->|save_journey_task_response| S
    T -->|claim_journey_reward| S
    T -->|fotoğraf upload| P[(Private Storage)]
    CS[/content-studio] -->|get_content_studio_data| S
    CS -->|content_studio_mutation| S
    CS -->|medya upload| C[(Public Storage)]
    PR[/journey/preview] -->|get_journey_preview_scenes| S
```

### Temel mimari prensipler

- Supabase ana içerik kaynağıdır.
- Frontend `journey_scenes` tablosunu doğrudan okumaz; ana akış RPC ile gelir.
- Kilit hesapları frontend'de yapılmaz. Frontend RPC'nin verdiği `is_locked` sonucuna güvenir.
- Sıra `sort_order` ile belirlenir.
- Görevler, ödüller ve açılma kuralları sahne slug'ı üzerinden bağlanır.
- Kullanıcının kalıcı ilerlemesi access code ve scene ilişkisine göre backend'de saklanır.
- `localStorage`, backend progress yerine geçmez; yalnızca access code, son görüntülenen sahne ve son yükleme zamanını tutar.

---

## 5. Dizin ve dosya yapısı

```text
app/
  layout.tsx                      Global HTML, font, metadata ve body teması
  globals.css                     Tailwind importu, global ve Content Studio stilleri
  page.tsx                        / açılış rotası
  unlock/page.tsx                 /unlock erişim kodu ekranı
  journey/page.tsx                /journey gerçek kullanıcı yolculuğu
  journey/preview/page.tsx        Preview server gate
  journey/preview/JourneyPreviewClient.tsx
  content-studio/page.tsx         Content Studio feature flag gate

components/
  background/                     Gradient ve hareketli yıldız arka planı
  layout/MobileSceneLayout.tsx    Tüm public ekranların mobil frame'i
  scene/                          Geçiş, ilerleme ve navigasyon bileşenleri
  ui/                             Sahne kartları, görevler, oyunlar ve ödüller
  content-studio/                 Masaüstü içerik yönetim arayüzü

hooks/
  useJourneyScenes.ts             Gerçek yolculuğun state ve mutation orkestrasyonu

lib/
  journey/                        Tipler, RPC sorguları, ilerleme seçimi ve mock veri
  supabase/                       Browser ve server Supabase client factory'leri
  content-studio/                 Studio veri tipi, RPC, upload ve JSON import/export
  audio/                          Web Audio tabanlı soundtrack
  utils.ts                        clsx + tailwind-merge tabanlı cn() helper'ı

public/                           create-next-app varsayılan SVG dosyaları
```

### Dikkat edilmesi gereken yapısal durumlar

- `lib/supabase/server.ts` mevcut ancak uygulama içinde kullanılmıyor.
- `lib/journey/mockScenes.ts` dolu bir fallback veri seti içeriyor ancak gerçek yolculuk hook'una bağlı değil.
- `lib/content-studio/content-blocks.ts`, `dependencies.ts`, `mini-games.ts`, `progress.ts`, `rewards.ts` ve `unlock-rules.ts` yalnızca aynı mutation fonksiyonunu yeniden export eder.
- Repository içinde tam Supabase schema, seed veya migration SQL seti yoktur. `chapter` type check değişikliği bağlı remote projede `20260714113308_add_chapter_scene_type` migration'ı olarak kayıtlıdır; tüm backend'i sıfırdan kuracak yerel migration zinciri hâlâ mevcut değildir.

---

## 6. Next.js render ve route yapısı

Proje Next.js App Router kullanır. `app` klasöründeki her `page.tsx` bir route oluşturur.

Route yapısı:

| Route | Render tipi | Açıklama |
|---|---|---|
| `/` | Static | Açılış sayfası |
| `/unlock` | Static | Client-side kod doğrulama ekranı |
| `/journey` | Static shell + client data | Journey state ve Supabase çağrıları browser'da çalışır |
| `/journey/preview` | Dynamic server render | Server-side preview token kontrolü ve client preview |
| `/content-studio` | Dynamic server render | Server-side feature flag kontrolü, ardından client Studio |
| `/_not-found` | Static | Next.js varsayılan 404 |

### Server component'ler

- `app/layout.tsx`
- `app/page.tsx`
- `app/journey/preview/page.tsx`
- `app/content-studio/page.tsx`

### Client component'ler

Etkileşim, browser Storage, Web Audio veya Framer Motion kullanan ana bileşenlerde `"use client"` vardır. Özellikle:

- `/unlock`
- `/journey`
- `JourneyPreviewClient`
- `ContentStudio`
- `MobileSceneLayout` ve hareketli alt bileşenleri
- Görev, fotoğraf, mini oyun ve ödül kartları

---

## 7. Route'ların fonksiyonel davranışı

### 7.1 `/` — açılış

- “20 Temmuz” etiketli romantik tanıtım kartı gösterir.
- `MobileSceneLayout` ile 430 px maksimum genişlikte mobil deneyim sunar.
- İlerleme göstergesi bu giriş akışında `1 / 3` olarak sabittir.
- “Yolculuğa Başla” bağlantısı `/unlock` rotasına gider.
- Bu sayfada Supabase çağrısı yapılmaz.

### 7.2 `/unlock` — erişim kodu

- Input ilk açıldığında `20TEMMUZ` değeriyle doludur.
- Boş değer engellenir.
- Submit sırasında soundtrack başlatılır.
- `validate_journey_access_code` RPC çağrılır.
- Başarılıysa kod `localStorage` içine yazılır ve `router.push('/journey')` çalışır.
- Başarısızsa romantik tonlu hata mesajı gösterilir.
- Form `one-time-code` autocomplete kullanır.

RPC'nin aktiflik ve expiry kontrolünü doğru yapması beklenir. Frontend dönen satır varsa ayrıca `isActive` veya `expiresAt` kontrolü yapmadan kabul eder.

### 7.3 `/journey` — ana deneyim

İlk açılışta:

1. Access code localStorage'dan okunur; yoksa otomatik olarak `20TEMMUZ` kullanılır.
2. `initialize_journey_progress` çağrılır.
3. `get_journey_scenes` çağrılır.
4. Sahneler `sortOrder` ile sıralanır.
5. Son ziyaret edilen açık sahne varsa oradan devam edilir.

Ekranın dört ana state'i vardır:

- Loading: kayan bir progress ışığı
- Error: hata metni ve “Tekrar Dene” butonu
- Empty: aktif sahne yok mesajı
- Loaded: sahne tipine göre içerik

### 7.4 `/journey/preview`

Amaç, gerçek progress'i değiştirmeden bütün aktif sahneleri ve oyunları test etmektir.

Davranış:

- Route `force-dynamic` çalışır.
- Production'da `JOURNEY_PREVIEW_TOKEN` tanımlı değilse kapalıdır.
- Token tanımlıysa `?token=...` eşleşmesi gerekir.
- Development ortamında token tanımlı değilse otomatik açıktır.
- Opsiyonel `?code=...` ile başka access code denenebilir.
- RPC preview token frontend'e `${code}-PREVIEW` olarak geçirilir.
- Tüm sahneler client tarafında açık kabul edilir.
- Tamamlanma, fotoğraf ve oyun sonuçları yalnızca React state'inde tutulur.
- Fotoğraf için `URL.createObjectURL` kullanılır; Storage upload yapılmaz.
- Refresh tüm yerel preview ilerlemesini sıfırlar.
- İlk açılışta sıralamadaki ilk sahne seçilir.
- Preview bilgi panelindeki seçim alanıyla istenen sahneye hızlı geçilebilir.

Preview bir içerik hazırlama ve görsel kontrol aracıdır. Production ile aynı `JourneySceneRenderer` kullanıldığı için final dahil normal sahne gövdesi gerçek journey ile aynıdır. Preview banner'ı ve hızlı seçim alanı yalnızca önizleme aracına aittir.

### 7.5 `/content-studio`

- `NEXT_PUBLIC_CONTENT_STUDIO_ENABLED === "true"` değilse `notFound()` çağrılır.
- En az 1280 px ekran bekler; daha dar ekranlarda yalnızca masaüstü uyarısı gösterir.
- Ana görünüm üç sütundur: sahne listesi, editör, 390 px canlı mobil önizleme.
- Public yolculuktan bu route'a link yoktur.

Feature flag bir yetkilendirme mekanizması değildir. Güvenlik tamamen RPC grant/RLS/policy tasarımına bağlıdır. Ayrıntılar güvenlik bölümündedir.

---

## 8. Journey state, progress ve navigasyon

### localStorage anahtarları

| Anahtar | İçerik |
|---|---|
| `romanticJourney.accessCode` | Son kullanılan access code |
| `romanticJourney.lastSceneSlug` | Son görüntülenen sahne slug'ı |
| `romanticJourney.lastLoadedAt` | Son başarılı yükleme/refresh ISO zamanı |

### İlk sahne seçme sırası

`resolveInitialSceneIndex` şu önceliği kullanır:

1. Kaydedilmiş slug varsa ve sahne açıksa o sahne
2. İlk açık sahne
3. Hiçbiri yoksa indeks `0`

Frontend için “açık” olma kontrolü yalnızca `!scene.isLocked` koşuludur. `progressIsUnlocked` alanı seçim kararında ayrıca kullanılmaz.

### İleri/geri davranışı

- `goNext`, mevcut sahne ileri navigasyona uygunsa indeks değerini bir artırır.
- `goPrevious` bir azaltır.
- Yön `forward` veya `backward` olarak animasyona aktarılır.
- Son sahne slug'ı her değişimde localStorage'a yazılır.
- Task tamamlanınca veri yeniden alınır ve yalnızca hemen sonraki sahneye geçilir. Sonraki sahne kilitliyse atlanmaz; kilit görünümü açılır.
- Fotoğraf ve mini oyun tamamlandığında kullanıcı aynı sahnede kalır; güncel reward ve response tekrar yüklenir.
- Açık bir `chapter` sahnesi 4,2 saniyelik jeneriğini oynatır ve completion mutation oluşturmadan sıradaki sahneye `forward` yönüyle geçer.
- Chapter'dan sonraki sahne kilitliyse indeks normal biçimde ilerler; kilit bypass edilmez ve mevcut kapalı sahne UI'ı gösterilir.

### Task atlama kuralı

Tamamlanmamış task için ana CTA ve ileri navigasyon birlikte kapatılır. Alt navigasyon, yan ok ve hook içindeki `goNext` aynı `canNavigateForward` kuralını kullanır. Preview hızlı sahne seçimi içerik yöneticisine ait bilinçli bir önizleme aracıdır ve production navigasyon kuralı değildir.

### Locked sahne navigasyonu

- Mobilde kilitli sahne ana butonu disabled olur; alt sırada ileri butonu gösterilmez.
- Geri butonu kullanılabilir.
- `sm` ve üzeri ekranlarda ileri yan oku kilitli sahnede gösterilmez.
- Kilitli sahnenin gerçek içeriğinin RPC tarafından gönderilmemesi güvenlik açısından zorunludur.

---

## 9. Sahne veri modeli

Ana frontend tipi `lib/journey/types.ts` içindeki `JourneyScene`'dir.

| Alan | Amaç |
|---|---|
| `id` | Veritabanı kimliği |
| `slug` | İlişki kuran ve kalıcı navigation kimliği |
| `type` | Render türü |
| `title` | Ana başlık |
| `subtitle` | İkincil açıklama |
| `content` | Sahnenin ana metni |
| `imageUrl` | Özellikle memory sahnesinin ana görseli |
| `videoUrl` | Normal sahne gövdesinde controls ve `playsInline` ile gösterilen video |
| `dateLabel` | Görsel tarih/saat etiketi |
| `sortOrder` | Journey sırası |
| `backgroundVariant` | Arka plan paleti |
| `isLocked` | O an gerçek içerik gösterilebilir mi |
| `unlockCondition` | Kullanıcıya gösterilen kilit açıklaması |
| `primaryActionLabel` | İleri CTA metni |
| `isActive` | RPC'nin dahil edeceği aktiflik durumu |
| `progressIsCompleted` | Sahne tamamlandı mı |
| `progressIsUnlocked` | Progress kaydındaki açık olma durumu |
| `completedAt` | Tamamlanma zamanı |
| `contentBlocks` | Modüler alt içerikler |
| `taskResponse` | Fotoğraf/oyun/metin görevi sonucu |
| `rewards` | Sahneye bağlı ödüller |
| `miniGame` | Aktif mini oyun konfigürasyonu |

### Sahne tipleri ve render davranışı

| Tip | Gerçek `/journey` davranışı |
|---|---|
| `welcome` | Sparkles ikonlu standart metin kartı |
| `story` | Standart içerik kartı; slug `anniversary` içerirse Heart, aksi hâlde Gift ikonu |
| `task` | Öncelik sırasıyla mini oyun, fotoğraf görevi veya standart “Tamamladım” kartı |
| `memory` | 4:5 görsel kartı, tarih, başlık, metin ve ek content block'lar |
| `locked` | `isLocked=true` ise kapalı kart; açık ise reveal animasyonlu içerik |
| `final` | Özel büyük tipografi, satır bazlı final metni ve gerçek hayata bağlanan kapanış kartı |
| `chapter` | Kart ve standart layout kullanmadan gerçek siyah tam ekran üzerinde otomatik numaralı sinematik bölüm jeneriği |

`type` ile `isLocked` ayrı kavramlardır. Örneğin `type="locked"` bir sahne, `isLocked=false` olduğunda açılmış reveal sahnesi olarak gösterilir.

### Background variant'ları

- `night`: lacivert/gece, rose ve mor ışık
- `rose`: koyu bordo/rose
- `champagne`: sıcak krem/rose
- `deep`: çok koyu lacivert/mor

Her varyant birden fazla radial gradient ile ana linear gradient'i birleştirir. Tüm varyantların üzerinde hafif grid texture ve vignette bulunur.

---

## 10. Content block sistemi

Block'lar `scene_slug` üzerinden sahneye bağlanır ve `sort_order` ile sıralanır.

### Ortak alanlar

| Alan | Açıklama |
|---|---|
| `id` | Blok kimliği |
| `scene_slug` | Hedef sahne |
| `block_type` | İçerik türü |
| `title` | Opsiyonel başlık/etiket |
| `body` | Metin veya açıklama |
| `media_url` | Public medya URL'si |
| `media_path` | Storage path; public renderer doğrudan kullanmaz |
| `alt_text` | Görsel alt metni |
| `metadata` | Türe özel JSON konfigürasyonu |
| `sort_order` | Sahne içi sıra |
| `is_active` | Görünürlük |

### Destek matrisi

| Block tipi | Veri modelinde | Content Studio'da | Public render'da gerçek durum |
|---|---:|---:|---|
| `text` | Evet | Evet | Kart içinde title + body |
| `quote` | Evet | Evet | Quote ikonlu vurgu kartı |
| `image` | Evet | Evet | 4:5 görsel, title ve body |
| `video` | Evet | Evet | Controls ve `playsInline` video |
| `audio` | Evet | Evet | Native audio controls, başlık ve açıklama |
| `divider` | Evet | Evet | Kısa yatay çizgi |
| `prompt` | Evet | Evet | Text block ile aynı kart |
| `reward` | Evet | Evet | Bağımsız reward yerine ilişki kontrolü isteyen görünür uyarı; gerçek reward ayrı tabloda olmalı |
| `game` | Evet | Evet | Bağımsız oyun yerine ilişki kontrolü isteyen görünür uyarı; gerçek mini game ayrı tabloda olmalı |
| `photo_task` | Evet | Evet | Doğrudan block kartı değildir; task sahnesini `PhotoTaskCard` moduna geçirir |

### Önemli içerik kuralı

Bir `game` block eklemek tek başına oynanabilir oyun üretmez. Aynı sahne için aktif `journey_mini_games` kaydı gerekir. Benzer şekilde `reward` block yerine `journey_rewards`, `photo_task` için ise block metadata kullanılmalıdır.

### Photo task metadata

Önerilen yapı:

```json
{
  "response_key": "primary",
  "capture": "camera_or_upload",
  "reward_key": "photo-memory"
}
```

Frontend şu an yalnızca `reward_key` veya camelCase `rewardKey` değerini okur. `response_key` ve `capture` veri hazırlığı açısından anlamlıdır fakat mevcut UI davranışını değiştirmez.

---

## 11. Görev sistemi

### 11.1 Standart görev

Koşul:

- Sahne `type="task"`
- Aktif mini game yok
- `photo_task` block yok
- Kaydedilmiş response tipi photo değil

Davranış:

- Sahne `content` metni görev başlığı olarak gösterilir.
- “Tamamladım” butonu `complete_journey_scene` RPC çağırır.
- Tamamlanınca yeni sahne listesi alınır ve hemen sonraki sahneye geçilir; kilitli sahne atlanmaz.

### 11.2 Fotoğraf görevi

Koşul:

- `photo_task` block bulunması veya mevcut `taskResponse.type === "photo"`

Akış:

1. Kullanıcı gizli file input üzerinden fotoğraf seçer/çeker.
2. Input `accept="image/*"` ve `capture="environment"` kullanır.
3. Local `objectURL` ile önizleme gösterilir.
4. Dosya `journey-task-uploads` private bucket'ına yüklenir.
5. Path şu formdadır:

   ```text
   {sanitize(code)}/{sanitize(sceneSlug)}/{randomUUID}.{extension}
   ```

6. `save_journey_task_response` photo response kaydını ve scene completion'ı yazar.
7. Reward key varsa ilgili ödül açılabilir.
8. Sahne yeniden yüklenir.
9. Daha sonraki görüntülemede 1 saatlik signed URL oluşturulur.

Kart ve hook seviyesindeki eşzamanlı işlem kilitleri, aynı dosyanın hızlı çift dokunmayla iki kez upload edilmesini engeller.

Frontend'de dosya boyutu, piksel ölçüsü veya MIME doğrulaması yoktur. Bu sınırlar Storage policy veya RPC dışında ayrıca uygulanmıyorsa büyük/uygunsuz dosyalar sorun yaratabilir.

### 11.3 Mini oyun görevi

- Sonuç `response_type="mini_game"` ile kaydedilir.
- `response_key`, oyun `gameKey` değeridir.
- Score ve payload oyun tipine göre saklanır.
- `completeScene=true` olduğu için oyun sonucu sahneyi de tamamlar.
- Kaydedilmiş winner/loser/penalty payload'ı tekrar ziyarette sonuç paneline döner.

---

## 12. Mini oyunlar

### Gerçek UI desteği

| Tip | Destek düzeyi | Davranış |
|---|---|---|
| `reaction_duel` | Tam | Aynı telefonda iki oyunculu refleks düellosu |
| `couple_quiz` | Tam | Telefonu sırayla verme mantığında iki kişilik quiz |
| `penalty_picker` | Tam | İki kapalı karttan ceza sahibi seçme |
| `progressive_penalty` | Tam | Aynı telefonda, dengeli ceza planlı ve çok turlu iki oyunculu kart oyunu |
| `tap_sequence` | Tam | Belirlenen ışık sırasını doğru tıklama |
| `choice` | Koşullu | `config.mode` couple quiz veya penalty picker ise ilgili UI; diğer modlarda açık destek uyarısı |
| `memory_match` | Hazır değil | Başka oyuna düşmez; görünür destek uyarısı verir |
| `scratch_reveal` | Hazır değil | Başka oyuna düşmez; görünür destek uyarısı verir |

Content Studio bütün tipleri seçtirdiği için `memory_match` veya `scratch_reveal` seçmek özel bir eşleştirme/kazıma deneyimi sağlamaz. Bu tipler sessizce `tap_sequence` oyununa dönüşmez ve tamamlanmış özellik olarak değerlendirilmemelidir.

### 12.1 Reaction duel

Örnek config:

```json
{
  "players": ["Sen", "Ben"],
  "readyText": "Işık yanmadan dokunmak yok.",
  "liveText": "Şimdi! İlk dokunan kazanır.",
  "waitMinMs": 1200,
  "waitMaxMs": 3200,
  "penalties": ["Kaybeden küçük bir görev yapar."],
  "alcoholNote": "Alkol opsiyoneldir."
}
```

Mekanik:

- Başlatma sonrası 1200-3200 ms arası rastgele bekler.
- Işıktan önce dokunan faul yapar ve diğer oyuncu kazanır.
- Işık sonrası ilk pointer/keyboard input kazanır.
- Reaction süresi `performance.now()` ile ms olarak ölçülür.
- Ceza listeden rastgele seçilir.
- Sonuç kaydedilmeden tekrar oynanabilir.

### 12.2 Couple quiz

Örnek config:

```json
{
  "players": ["Sen", "Ben"],
  "questions": [
    {
      "prompt": "Birlikte en güzel plan hangisi?",
      "options": ["Gece yürüyüşü", "Erken uyumak"],
      "correctIndex": 0
    }
  ],
  "penalties": ["Kaybeden bir iltifat eder."],
  "alcoholNote": "Alternatif ceza kullanılabilir."
}
```

Mekanik:

- Her soru önce birinci, sonra ikinci oyuncuya sorulur.
- Doğru cevap skoru artırır.
- Eşitlikte birinci oyuncu kazanmış kabul edilir (`score[0] >= score[1]`).
- Oyun bitince rastgele ceza seçilir ve kullanıcı sonucu ayrıca kaydeder.

### 12.3 Penalty picker

- İki kart vardır.
- Her round'da kartlardan biri rastgele “armed” seçilir.
- Seçilen kart armed ise birinci, değilse ikinci oyuncu kaybeder.
- Kullanıcı sonucu kaydedebilir veya kaydetmeden kartları yenileyebilir.

### 12.4 Progressive penalty

Bu oyun yeni bir sahne tipi oluşturmaz; yalnızca `task` sahnesine bağlı normal bir `journey_mini_games` kaydıdır. Config sözleşmesi sürüm 1'dir:

```json
{
  "version": 1,
  "players": ["Sen", "Ben"],
  "rounds": [
    { "id": "round-1", "title": "İlk Tur", "kind": "penalty", "penalty": "Kaybeden güzel bir anısını anlatır." },
    { "id": "round-2", "title": "İkinci Tur", "kind": "penalty", "penalty": "Kaybeden bir iltifat eder." }
  ],
  "balanceMode": "strict",
  "allowReroll": false,
  "revealLabel": "Kartları Aç",
  "confirmLabel": "Cezayı Tamamladık",
  "completeLabel": "Oyunu Tamamla",
  "finalText": "Tüm turlar tamamlandı."
}
```

Mekanik ve doğrulama:

- `players` tam iki, boş olmayan ve farklı oyuncu adı içermelidir.
- En az bir tur olmalı; her turda benzersiz `id`, dolu `title`, `kind` ve `penalty` bulunmalıdır.
- `balanceMode="strict"` ve `allowReroll=false` zorunludur.
- Çift tur sayısında kayıp sayıları eşit, tek tur sayısında fark en fazla birdir.
- Rastgele kaybeden planı oyun ilk açıldığında bir kez üretilir; rerender ve sayfa yenilemede localStorage'dan korunur. Anahtar erişim kodu/preview kapsamı, scene, game key ve config parmak izini içerir.
- Her turda iki kart birlikte açılır. Ceza onaylanmadan sonraki tura geçilemez; atlama ve yeniden seçim yoktur.
- Son tur yalnızca bir kez `save_journey_task_response` akışına gönderilir. Payload bütün tur sonuçlarını, kayıp toplamlarını ve son tur özetini taşır.
- Backend tamamlanmış response'u yerel ara durumdan önceliklidir. Yeniden ziyarette uzun oyun yerine kısa tamamlanma özeti gösterilir.
- Geçersiz JSON/shape/config için fallback uygulanmaz; Journey ve preview görünür hata kartı, Studio ise alan bazlı hata listesi gösterir.
- Studio ve Journey preview sonuçları yereldir. Studio'daki animasyon yenileme yeni bir plan üretir ve Supabase mutation yapmaz.

Final response payload'ı mevcut `mini_game` callback/RPC akışında şu yapıyı korur:

```json
{
  "gameType": "progressive_penalty",
  "mode": "same_phone_progressive_penalty",
  "version": 1,
  "status": "completed",
  "players": ["Sen", "Ben"],
  "completedRounds": 2,
  "rounds": [
    { "id": "round-1", "title": "İlk Tur", "kind": "penalty", "winner": "Ben", "loser": "Sen", "penalty": "Kaybeden güzel bir anısını anlatır." },
    { "id": "round-2", "title": "İkinci Tur", "kind": "penalty", "winner": "Sen", "loser": "Ben", "penalty": "Kaybeden bir iltifat eder." }
  ],
  "lossCounts": { "Sen": 1, "Ben": 1 },
  "lastRound": { "id": "round-2", "title": "İkinci Tur", "kind": "penalty", "winner": "Sen", "loser": "Ben", "penalty": "Kaybeden bir iltifat eder." },
  "winner": "Sen",
  "loser": "Ben",
  "penalty": "Kaybeden bir iltifat eder.",
  "completedAt": "ISO-8601"
}
```

Bilinen sınırlamalar:

- Kısmi tur ilerlemesi backend'e yazılmaz; aynı browser ve access-code kapsamındaki localStorage'a bağlıdır. Browser verisi silinirse tamamlanmamış oyun geri getirilemez.
- Farklı cihazlar arasında tamamlanmamış tur senkronizasyonu yoktur. Final response backend'e yazıldıktan sonra backend sonucu otoritatiftir.
- localStorage kullanılamıyor veya kayıt bozuksa yeni dağılıma sessizce geçilmez; görünür hata gösterilir.
- Bu geliştirme şema, migration veya hazır 7. Bölüm içeriği eklemez; oyun kaydı ayrı içerik adımında oluşturulmalıdır.
- Mevcut remote `journey_mini_games` CHECK constraint'i henüz `progressive_penalty` değerini içermiyor. İçerik insert'inden önce, ayrı ve açıkça yetkilendirilmiş bir şema adımında constraint genişletilmelidir.

### 12.5 Tap sequence

Örnek config:

```json
{
  "labels": ["Gül", "Işık", "Gece"],
  "sequence": ["rose", "champagne", "deep", "rose"],
  "successScore": 4
}
```

Mekanik:

- İlk üç benzersiz sequence değeri butonları oluşturur.
- Sequence aynı değerleri tekrar içerebilir.
- Yanlış seçim ilerlemeyi sıfırlar.
- Son doğru seçimde sonuç otomatik kaydedilir.
- Sonrasında gösterilen “Ödülü Aç” butonu completed state nedeniyle tekrar kaydetmez.

### Fallback değerler

Eksik config durumunda:

- Oyuncular: `Sen`, `Ben`
- Tap labels: `Gül`, `Işık`, `Gece`
- Tap sequence: `rose`, `champagne`, `deep`
- Quiz: iki örnek soru
- Ceza: su, iltifat veya küçük görev içeren üç alkolsüz seçenek

Bu eski oyun fallback'leri `progressive_penalty` için geçerli değildir. Progressive Penalty config'i eksik veya geçersizse oyun başlamaz ve açık doğrulama hatası gösterilir.

---

## 13. Reward sistemi

Reward'lar `scene_slug` ve benzersiz bir `reward_key` ile göreve bağlanır.

Alanlar:

- Başlık
- Subtitle
- Body
- Opsiyonel image URL
- Opsiyonel video URL
- Metadata JSON
- Sort order
- Active state

Davranış:

- Kilitliyken başlık ve subtitle görülebilir.
- “Ödülü Aç” butonu `claim_journey_reward` çağırır.
- Açılmış reward claim backend'de kalıcıdır.
- Açık reward reveal animasyonu ile gösterilir.
- Görsel ve video 4:5 alan içinde render edilir.
- Reward listesi birden fazla ödülü aynı sahnede destekler.

Görev response içindeki `rewardKey` ile reward tablosundaki `reward_key` aynı olmalıdır.

---

## 14. Kilit, zaman ve dependency sistemi

Frontend kilit kuralı hesaplamaz. `get_journey_scenes` RPC'sinin dönmüş olduğu `is_locked` değerini ve maskelenmiş içeriği kullanır.

Content Studio'da desteklenen rule modları:

| Mod | Anlamı |
|---|---|
| `always` | Studio kavramı; rule kaydı silinir |
| `manual` | Manuel kilit/açma |
| `time` | `unlock_at` zamanı geldiğinde açılma |
| `all_completed` | Gereken bütün sahneler tamamlanınca açılma |
| `time_and_all_completed` | Hem zaman hem bütün dependencies tamamlanmalı |

İlişkili veri yapıları:

- `journey_scene_unlock_rules`: birleştirilmiş kural
- `journey_scene_unlock_schedule`: zaman çizelgesi
- `journey_scene_dependencies`: trigger sahne → target sahne
- `journey_progress`: access code bazlı fiili unlocked/completed state

Timezone içerik editöründe `Europe/Istanbul` olarak gösterilir. `datetime-local` değeri kaydederken browser'ın local timezone'u üzerinden ISO'ya çevrilir; Studio'nun İstanbul dışındaki bir bilgisayarda kullanılması zaman kaymasına yol açabilir.

### İçerik gizliliği

Proje rehberine göre kilitli sahneler için RPC şu alanları gizlemelidir:

- `content_blocks`
- `mini_game`
- `task_response`
- reward içeriği

Frontend'in kapalı kart göstermesi tek başına güvenlik değildir. Gizli romantik içerik browser'a gönderilmiş ama CSS ile kapatılmış olmamalıdır.

---

## 15. Supabase entegrasyonu

### Client yapılandırması

Browser client singleton'dır:

- `persistSession: false`
- `autoRefreshToken: false`
- Auth session kullanılmaz
- Publishable/anon key kullanılır

Server client factory aynı public key ile yeni client üretir fakat mevcut rotalarda kullanılmaz.

### Beklenen tablolar

Bağlı projede ve mevcut frontend sözleşmesinde aşağıdaki tablolar bulunur:

| Tablo | Görevi |
|---|---|
| `journey_scenes` | Ana sahne kayıtları |
| `journey_access_codes` | Kodlar, aktiflik ve expiry |
| `journey_progress` | Access code × scene progress |
| `journey_scene_content_blocks` | Modüler içerikler |
| `journey_scene_unlock_rules` | Birleştirilmiş açılma kuralları |
| `journey_scene_unlock_schedule` | Zamana bağlı açılımlar |
| `journey_scene_dependencies` | Görev/sahne ön koşulları |
| `journey_media_requirements` | İçerik hazırlama medya checklist'i |
| `journey_task_responses` | Fotoğraf, oyun ve diğer görev sonuçları |
| `journey_mini_games` | Oyun konfigürasyonları |
| `journey_rewards` | Ödül içerikleri |
| `journey_reward_claims` | Kalıcı ödül açılımları |

`journey_scenes.type` alanındaki `journey_scenes_type_check` constraint'i şu değerleri kabul eder:

```text
welcome, story, task, memory, locked, final, chapter
```

Chapter desteği yeni tablo açmadan mevcut sahne satırını kullanır. Constraint değişikliği bağlı projede `20260714113308_add_chapter_scene_type` migration'ı olarak uygulanmış ve `pg_get_constraintdef` ile tekrar doğrulanmıştır.

### RPC sözleşmeleri

| RPC | Kullanıldığı yer | Amaç |
|---|---|---|
| `validate_journey_access_code` | `/unlock` | Kodu doğrulama |
| `initialize_journey_progress` | `/journey` ilk açılış | Tüm sahneler için progress hazırlama |
| `get_journey_scenes` | Ana journey | Kilitleri uygulanmış ve ilişkileri gömülü sahne listesi |
| `get_journey_preview_scenes` | Preview | Aktif sahnelerin mutation oluşturmayan önizleme görünümü |
| `complete_journey_scene` | Standart task | Scene completion ve bağlı unlock işlemleri |
| `save_journey_task_response` | Fotoğraf ve oyun | Response, score, payload, completion ve reward bağlantısı |
| `claim_journey_reward` | Reward kartı | Reward claim oluşturma/açma |
| `get_content_studio_data` | Content Studio | İlgili tabloları tek payload içinde alma |
| `content_studio_mutation` | Content Studio | Whitelist edilmiş tablo/action mutation'ları |

### RPC → frontend map işlemi

`lib/journey/queries.ts` snake_case satırları camelCase frontend tiplerine dönüştürür. Desteklenen enum değerleri açık allowlist ile doğrulanır:

- Bilinmeyen scene, block, task response, task status veya mini game tipi açık hata üretir; başka bir tipe sessizce dönüştürülmez.
- Eksik sort order → `100`

Bu yaklaşım yanlış backend verisinin destekleniyormuş gibi görünmesini engeller.

### Storage bucket'ları

| Bucket | Görünürlük | Kullanım |
|---|---|---|
| `journey-content` | Public | Sahne, block ve reward görsel/video/audio dosyaları |
| `journey-task-uploads` | Private | Kullanıcının fotoğraf görevleri |

`journey-content` dosyaları şu formda yüklenir:

```text
scenes/{sceneSlug}/{timestamp}-{safeFileName}
```

Public URL veritabanına yazılır. Content Studio upload sırasında dosya türü kısıtlamaz.

Task fotoğraflarında:

- Public URL kullanılmaz.
- Ana journey 1 saatlik signed URL üretir.
- Content Studio sonuç görüntüleyici 10 dakikalık signed URL üretir.

---

## 16. Content Studio kullanım kılavuzu

### Açma ve kapatma

Yerelde:

```dotenv
NEXT_PUBLIC_CONTENT_STUDIO_ENABLED=true
```

Sonra:

```text
http://localhost:3000/content-studio
```

İş bittiğinde flag tekrar `false` yapılmalıdır.

### Genel arayüz

Masaüstü çalışma alanı viewport yüksekliğine sabitlenir. Sol sahne listesi, orta editör ve sağ canlı önizleme birbirinden bağımsız kayar; sahne seçimi tarayıcı sayfasını yeniden yukarı taşımayı gerektirmez.

Üst toolbar:

- Access code seçimi
- JSON yedek indirme
- Remote veriyi yenileme
- Mutation başarı/hata bildirimi

Sol sütun:

- Başlık veya slug arama
- Scene type filtresi
- Locked/open filtresi
- Çoklu seçim
- Toplu kilitle/aç
- Toplu background değiştir
- Yeni sahne
- Varsayılanları hazırlanmış yeni bölüm oluşturma
- Chapter yayın hazırlık hata ve uyarıları
- Drag/drop veya oklarla sıra
- Duplicate
- Delete ve bağlı kayıt sayısı uyarısı
- Eksik zorunlu medya uyarısı

Orta editör sekmeleri:

1. Sahne
2. İçerik Blokları
3. Kilit ve Zaman
4. Mini Oyun
5. Ödül
6. Progress ve Sonuçlar
7. JSON / ChatGPT
8. Timeline

Sağ sütun:

- 390 x 844 px mobil simülasyon
- Önizlemenin tamamını çalışma alanına ölçekleyen varsayılan **Sığdır** modu
- Piksel boyutunu koruyan ve yalnızca önizleme alanında kaydırma açan **%100** modu
- Normal, locked, unlocked, task pending ve task done modları
- Animasyonu yeniden oynatma
- Chapter seçiliyken gerçek `ChapterRevealScene` ile “Bölüm Jeneriğini Oynat” kontrolü
- Production ile ortak `JourneySceneRenderer` üzerinden fotoğraf, mini oyun, reward ve final için yerel state önizlemesi

Chapter seçildiğinde orta editör yalnızca **Sahne** ile **Kilit ve Zaman** sekmelerini gösterir. Medya, content block, mini game, reward, progress ve standart task completion alanları jeneriğin parçası değildir.

### Yeni sahne ekleme — önerilen prosedür

1. Önce Content Studio'dan JSON yedeği indir.
2. “Yeni sahne” butonuna bas.
3. Otomatik oluşan `new-scene-{timestamp}` slug'ını anlamlı, kalıcı ve küçük harfli bir slug ile değiştir.
4. Scene type seç.
5. Title, subtitle ve content gir.
6. Gerekliyse scene image/video yükle.
7. `date_label`, `sort_order` ve background seç.
8. `is_active` değerini kontrol et.
9. Kilitli olacaksa base `is_locked`, kullanıcıya görünen `unlock_condition` ve Kilit/Zaman sekmesindeki rule'u birlikte düzenle.
10. Ek içerikleri block olarak ekle.
11. Task ise mini game veya photo task bağlantısını yap.
12. Reward varsa aynı sahne slug'ı ve eşleşen reward key ile ekle.
13. Canlı önizlemenin farklı modlarını kontrol et.
14. `/journey/preview` içinde gerçek component akışını görsel olarak kontrol et.

### Yeni chapter ekleme

1. Sol sütundaki **Bölüm** butonuna bas.
2. Yeni kayıt `type=chapter`, `title="Yeni Bölüm"`, `subtitle=null`, `background_variant=night`, `primary_action_label=null`, `is_locked=false` ve `is_active=true` varsayılanlarıyla oluşturulur.
3. **Bölüm başlığı** alanına jenerikte görünecek metni yaz. `1. BÖLÜM` gibi sıra bilgisini title'a ekleme.
4. İstenirse kısa sinematik alt cümleyi gir.
5. `sort_order` değerini jeneriğin başlaması gereken noktaya yerleştir. Aynı sıra değerini başka sahneyle paylaşma.
6. Zamanı gelmeden açılmaması gerekiyorsa base locked durumunu ve **Kilit ve Zaman** sekmesindeki rule/schedule ayarını birlikte düzenle.
7. **Bölüm Jeneriğini Oynat** ile gerçek component'i baştan oynat.
8. Sol sütundaki **Yayına Hazırlık Kontrolü** hata ve uyarılarını kapat.
9. Chapter'ın hemen arkasına en az bir aktif normal sahne koy.

Chapter için slug sistem kimliği olarak görünür fakat özel formda değiştirilmez. Yeni kayıt `chapter-{timestamp}` biçiminde benzersiz bir slug alır. Chapter'a daha önce bağlanmış task/reward verileri tür değişikliği sırasında otomatik silinmez; ilgili sekmeler gizlenir ve readiness sistemi bağlantıyı uyarı olarak bildirir.

### Slug kuralları

- Slug sonradan değiştirilmemesi gereken ilişki anahtarıdır.
- Öneri: `fri-`, `sat-`, `sun-`, `mon-` gün prefix'lerini koru.
- Task için `*-task-*`, açılım için `*-unlock-*`, final için `*-final-*` düzenini sürdür.
- Türkçe karakter ve boşluk kullanma.
- Slug değiştirilirse block, game, reward, unlock rule, schedule ve dependency kayıtları da uyarlanmalıdır. Studio'nun sahne update işleminin bütün ilişkileri otomatik taşıdığı koddan garanti edilemez.

### Sort order kuralları

- Mevcut sahneler 10'ar artar.
- Araya hızlı ekleme için boşluk bırakmak uygundur.
- Drag/drop tüm sıraları yeniden `(index + 1) * 10` olarak normalize eder.
- Block'lar için de aynı 10'luk düzen kullanılır.

### Sahne duplicate davranışı

Duplicate yalnızca `journey_scenes` satırını kopyalar. Bağlı block, rule, schedule, dependency, mini game ve reward kayıtlarını kopyalamaz. Kopya sahnenin ilişkileri ayrıca oluşturulmalıdır.

### Content block ekleme

- Yeni block varsayılan olarak `text`, aktif ve son sırada oluşur.
- Tip, başlık, body, medya, alt text, metadata ve order düzenlenebilir.
- Block'lar sürükle-bırak, oklar veya duplicate ile yönetilebilir.
- Audio dosyası native controls ile gösterilir; mobil browser codec desteğine uygun bir dosya kullanılmalıdır.

### Mini game ekleme

1. Sahne type'ını `task` yap.
2. Mini Oyun sekmesinde desteklenen gerçek UI tiplerinden birini seç.
3. `game_key` için çoğunlukla `primary` kullan.
4. Title/instructions gir.
5. Reward varsa `reward_key` yaz.
6. Config JSON'u geçerli object olarak gir.
7. Aktifliği kontrol et ve kaydet.

### Reward ekleme

1. Ödül sekmesinde yeni reward oluştur.
2. Kararlı ve sahne içinde benzersiz `reward_key` belirle.
3. Aynı key'i mini game `reward_key` veya photo task metadata'sında kullan.
4. Title, subtitle, body ve opsiyonel medya ekle.
5. Preview task done modunda reward görünümünü kontrol et.

### Kilit ve dependency ekleme

- Time kuralında tarih/saat gir.
- Task completion kuralında dependency olarak trigger sahneleri ekle.
- `all_completed` bütün seçili trigger'ları bekler.
- Rule, schedule ve dependencies ayrı kayıtlar olduğundan hepsini Timeline üzerinden son kez kontrol et.

### Progress ve sonuç yönetimi

Studio şunları yapabilir:

- Tek sahneyi açık/kilitli/tamamlanmış yapma
- Completion sıfırlama
- **Test Durumunu Sıfırla** ile seçili access code'un bütün progress'ini kullanıcı onayıyla resetleme
- Seçili access code'a ait task response kayıtlarını temizleme
- Tek response silme
- Private Storage dosyasını signed URL ile açma
- Reward claim silme
- Seçili access code'a ait reward claim kayıtlarını topluca temizleme
- Görev fotoğraflarının Storage path listesini gösterme ve ayrı kullanıcı onayıyla dosyaları silme
- Journey konumunu sıfırlamak için `romanticJourney.*` localStorage anahtarlarına yönelik yönlendirme gösterme

Bu işlemler production kullanıcı durumunu doğrudan değiştirir ve geri alma mekanizması yoktur. `20TEMMUZ` dahil hiçbir access code sayfa açılışında otomatik sıfırlanmaz; işlem iki aşamalı kullanıcı onayı gerektirir. Önce yedek alınmalıdır.

### JSON / ChatGPT iş akışı

Export scope'ları:

- `selected_scene`
- `selected_scene_full`
- `all_journey`
- `scene_texts`
- `locks_only`
- `content_blocks_only`

Üretilen prompt tablo isimlerini ve korunması gereken ID kurallarını içerir. ChatGPT'den yalnızca parse edilebilir JSON istenir.

Import:

1. JSON yapıştırılır.
2. Parse edilir.
3. Desteklenmeyen tablo, enum türü, self-dependency ve array olmayan değerler uyarı üretip ilgili satırı atlar.
4. Mevcut ID varsa update, yoksa insert planlanır.
5. Kullanıcı değişiklikleri görür ve onaylar.
6. Değişiklikler sırayla uygulanır.

Import delete üretmez. Ayrıca bütün değişiklikler tek transaction değildir; her mutation sonrasında refresh yapılır. Uzun import yarıda hata verirse kısmi uygulanmış veri kalabilir.

### Backup

“Yedek İndir” butonu Studio'nun yüklediği bütün `ContentStudioData` payload'ını timestamp'li JSON dosyası olarak indirir. Bu dosya task response ve claim gibi kullanıcı durumlarını da içerebilir; özel veri gibi saklanmalıdır.

---

## 17. Canlı içerik envanteri

Bu bölüm 14 Temmuz 2026 tarihinde bağlı Supabase projesinden salt-okunur alınan anlık özettir. İçerik editlendikçe sayılar değişebilir.

### Genel sayılar

| Veri | Adet |
|---|---:|
| Toplam aktif sahne | 64 |
| `welcome` | 2 |
| `story` | 12 |
| `task` | 16 |
| `memory` | 9 |
| `locked` type | 20 |
| `final` | 5 |
| Şu an DB'de `is_locked=true` | 46 |
| Content block | 3 |
| Mini game | 4 |
| Reward | 5 |
| Unlock rule | 46 |
| Time rule | 28 |
| All-completed rule | 18 |
| Dependency | 23 |
| Unlock schedule | 28 |
| Media requirement | 23 |

Tek access code aktiftir: `20TEMMUZ`. Expiry tanımlı değildir.

### Dört günlük içerik dağılımı

- 17 Temmuz Cuma: sıra 10-180, 18 sahne, başlangıçta açık
- 18 Temmuz Cumartesi: sıra 190-320, 14 sahne
- 19 Temmuz Pazar: sıra 330-440, 12 sahne
- 20 Temmuz Pazartesi: sıra 450-640, 20 sahne

Önemli yayın notu: doğrulama tarihi 14 Temmuz olmasına rağmen 17 Temmuz Cuma'ya ait 18 sahnenin tamamı `is_locked=false` durumundadır ve bu sahneler için time rule/schedule yoktur. Dolayısıyla uygulama production'da erişilebiliyorsa Cuma içeriği 17 Temmuz'dan önce de görüntülenebilir. Bu kasıtlı değilse Cuma başlangıcı için ayrıca zaman kuralı veya deployment zamanı kontrolü gerekir.

Zaman schedule aralığı:

- İlk: 18 Temmuz 2026 10:30 +03:00
- Son: 20 Temmuz 2026 23:25 +03:00

### Tam sahne listesi

`Kilit` sütunu veritabanının snapshot anındaki base/hesaplanmış Studio kaydını gösterir.

| Order | Slug | Tip | Başlık | Planlanan zaman | Kilit |
|---:|---|---|---|---|:---:|
| 10 | `fri-01-welcome` | welcome | Bu Gece Başlıyor | 17 Tem 22:10 | Hayır |
| 20 | `fri-02-private` | story | Sadece Sana Ait | 17 Tem 22:12 | Hayır |
| 30 | `fri-03-four-days` | story | Neden Dört Gün? | 17 Tem 22:14 | Hayır |
| 40 | `fri-04-memory-night` | story | Bu Gece Anılar | 17 Tem 22:16 | Hayır |
| 50 | `fri-05-memory-museum` | memory | Anılarımız Müzesi | 17 Tem 22:18 | Hayır |
| 60 | `fri-06-first-trace` | memory | İlk İz | 17 Tem 22:20 | Hayır |
| 70 | `fri-07-smile-place` | memory | Gülüşünün Olduğu Yer | 17 Tem 22:23 | Hayır |
| 80 | `fri-08-ordinary` | memory | Sıradan Gibi | 17 Tem 22:26 | Hayır |
| 90 | `fri-09-our-place` | memory | Burası Bizim İçin | 17 Tem 22:29 | Hayır |
| 100 | `fri-10-my-eyes` | memory | Benim Gözümden Sen | 17 Tem 22:32 | Hayır |
| 110 | `fri-11-we-are-good` | memory | Beraber Güzeliz | 17 Tem 22:35 | Hayır |
| 120 | `fri-12-small-details` | memory | Küçük Detaylar | 17 Tem 22:38 | Hayır |
| 130 | `fri-13-favorite-versions` | memory | En Sevdiğim Hâllerin | 17 Tem 22:41 | Hayır |
| 140 | `fri-14-archive-opened` | story | Tüm Anılar Açıldı | 17 Tem 22:44 | Hayır |
| 150 | `fri-15-tonight-is-memory` | story | Bugün De Anı Oldu | 17 Tem 22:47 | Hayır |
| 160 | `fri-task-01-heart-stamp` | task | Anıları Kalbine Kaydet | 17 Tem 22:50 | Hayır |
| 170 | `fri-16-tomorrow-starts` | locked | Yarın Başlıyor | 17 Tem 22:53 | Hayır |
| 180 | `fri-17-close` | story | Şimdilik Burada Duralım | 17 Tem 22:55 | Hayır |
| 190 | `sat-01-intro` | story | Bugün Küçük Bir Oyun | 18 Tem 10:30 | Evet |
| 200 | `sat-task-01-morning-proof` | task | Günaydın Kanıtı | 18 Tem 11:00 | Evet |
| 210 | `sat-unlock-01-first-tick` | locked | İlk Tik Geldi | 18 Tem 11:05 | Evet |
| 220 | `sat-task-02-remember` | task | Bunu Hatırlıyor Musun? | 18 Tem 12:30 | Evet |
| 230 | `sat-unlock-02-my-answer` | locked | Benim Cevabım | 18 Tem 13:00 | Evet |
| 240 | `sat-task-03-song-break` | task | Bizim Şarkı Molası | 18 Tem 15:00 | Evet |
| 250 | `sat-unlock-03-song-note` | locked | Bir Şarkılık Biz | 18 Tem 15:10 | Evet |
| 260 | `sat-task-04-photo-hunt` | task | Fotoğraf Avı | 18 Tem 17:30 | Evet |
| 270 | `sat-unlock-04-new-memory` | locked | Bugünün Yeni Anısı | 18 Tem 18:00 | Evet |
| 280 | `sat-task-05-sweet-choice` | task | Tatlı Seçimi | 18 Tem 20:30 | Evet |
| 290 | `sat-unlock-05-small-celebration` | locked | Kutlama Küçük de Olur | 18 Tem 21:00 | Evet |
| 300 | `sat-task-06-ten-minutes-us` | task | 10 Dakika Biz | 18 Tem 22:30 | Evet |
| 310 | `sat-unlock-06-best-tick` | locked | Bugünün En Güzel Tik’i | 18 Tem 22:40 | Evet |
| 320 | `sat-close-completed` | locked | Cumartesi Tamamlandı | 18 Tem 22:45 | Evet |
| 330 | `sun-01-intro` | story | Bugün Biraz Daha Yavaş | 19 Tem 11:00 | Evet |
| 340 | `sun-task-01-todays-feeling` | task | Bugünün Hissi | 19 Tem 11:30 | Evet |
| 350 | `sun-unlock-01-feeling-note` | locked | Seçtiğin His | 19 Tem 11:35 | Evet |
| 360 | `sun-task-02-three-answers` | task | Üç Küçük Cevap | 19 Tem 13:00 | Evet |
| 370 | `sun-unlock-02-my-three-answers` | locked | Benim Üç Cevabım | 19 Tem 13:30 | Evet |
| 380 | `sun-task-03-ten-things` | task | Sende Sevdiğim 10 Şey | 19 Tem 15:30 | Evet |
| 390 | `sun-unlock-03-ten-things-list` | locked | Sende Sevdiğim 10 Şey | 19 Tem 15:35 | Evet |
| 400 | `sun-task-04-future-drawer` | task | Gelecek Çekmecesi | 19 Tem 17:30 | Evet |
| 410 | `sun-unlock-04-future-note` | locked | Seçtiklerini Sakladım | 19 Tem 18:00 | Evet |
| 420 | `sun-task-05-key-of-20` | task | 20’nin Anahtarı | 19 Tem 21:30 | Evet |
| 430 | `sun-unlock-05-sunday-letter` | locked | Pazar Mektubu | 19 Tem 21:35 | Evet |
| 440 | `sun-close-tomorrow-ours` | locked | Yarın Bizim Günümüz | 19 Tem 22:45 | Evet |
| 450 | `mon-am-01-birthday` | welcome | İyi Ki Doğdun | 20 Tem 08:30 | Evet |
| 460 | `mon-am-02-not-cake` | story | Bugün Biraz Farklı | 20 Tem 08:35 | Evet |
| 470 | `mon-task-01-make-a-wish` | task | Dilek Tut | 20 Tem 08:40 | Evet |
| 480 | `mon-unlock-01-wish-note` | locked | Dileğin Saklı Kalsın | 20 Tem 08:45 | Evet |
| 490 | `mon-am-03-20-iyi-ki` | locked | 20 Küçük İyi Ki | 20 Tem 09:00 | Evet |
| 500 | `mon-noon-01-our-day` | story | Bugün Bir De Bizim Günümüz | 20 Tem 12:30 | Evet |
| 510 | `mon-noon-02-being-us` | story | Biz Olmak | 20 Tem 12:40 | Evet |
| 520 | `mon-task-02-sentence-of-year` | task | Bu Senenin Cümlesi | 20 Tem 13:00 | Evet |
| 530 | `mon-unlock-02-year-sentence` | locked | Bu Cümle Bizde Kalsın | 20 Tem 13:10 | Evet |
| 540 | `mon-noon-03-evening-preview` | locked | Akşama Saklı | 20 Tem 14:00 | Evet |
| 550 | `mon-eve-01-evening-starts` | story | Akşam Başladı | 20 Tem 19:00 | Evet |
| 560 | `mon-task-03-photo-of-day` | task | Bugünün Fotoğrafı | 20 Tem 19:15 | Evet |
| 570 | `mon-unlock-03-day-saved` | locked | Bugün Kaydedildi | 20 Tem 19:30 | Evet |
| 580 | `mon-task-04-small-toast` | task | Küçük Söz | 20 Tem 20:30 | Evet |
| 590 | `mon-unlock-04-final-key` | locked | Final Anahtarı Açıldı | 20 Tem 21:00 | Evet |
| 600 | `mon-final-01-gate` | final | Final Kapısı | 20 Tem 23:00 | Evet |
| 610 | `mon-final-02-letter` | final | Sana Son Değil, Devam | 20 Tem 23:05 | Evet |
| 620 | `mon-final-03-promises` | final | Benim Sana Sözüm | 20 Tem 23:15 | Evet |
| 630 | `mon-final-04-continues` | final | Devamında Biz Varız | 20 Tem 23:20 | Evet |
| 640 | `mon-final-05-end` | final | İyi Ki Sen. İyi Ki Biz. | 20 Tem 23:25 | Evet |

### Mevcut content block'lar

| Sahne | Tip | Başlık | Not |
|---|---|---|---|
| `fri-01-welcome` | text | Modüler içerik hazır | `tone=guide`, editable |
| `fri-task-01-heart-stamp` | photo_task | Fotoğraf görevi | Reward: `photo-memory` |
| `sat-task-01-morning-proof` | game | Mini oyun görevi | Reward: `morning-proof-reward` |

### Mevcut mini game'ler

| Sahne | Tip | Başlık | Reward |
|---|---|---|---|
| `sat-task-01-morning-proof` | reaction_duel | Refleks Düellosu | `morning-proof-reward` |
| `sat-task-02-remember` | couple_quiz | Kim Daha İyi Tanıyor? | `couple-quiz-reward` |
| `sat-task-03-song-break` | penalty_picker | Ceza Kartları | `penalty-card-reward` |
| `sat-task-05-sweet-choice` | tap_sequence | Işık Sırası | `light-sequence-reward` |

Diğer task sahneleri şu an mini game kaydı yoksa standart “Tamamladım” kartına düşer. `sat-task-04-photo-hunt` adı fotoğraf görevi olsa da snapshot'ta ona bağlı `photo_task` block bulunmamaktadır; bu nedenle mevcut frontend'de standart task olarak render edilir.

### Mevcut reward'lar

| Sahne | Reward key | Başlık |
|---|---|---|
| `fri-task-01-heart-stamp` | `photo-memory` | Küçük An Kaydedildi |
| `sat-task-01-morning-proof` | `morning-proof-reward` | Düello Kazanıldı |
| `sat-task-02-remember` | `couple-quiz-reward` | Bizi İyi Tanıyan Kazandı |
| `sat-task-03-song-break` | `penalty-card-reward` | Kart Açıldı |
| `sat-task-05-sweet-choice` | `light-sequence-reward` | Işık Sırası Tamamlandı |

Bu beş reward'ın snapshot anında image/video medyası yoktur; metin tabanlı reveal olarak çalışırlar.

### Eksik zorunlu medya

23 medya requirement kaydının 15 zorunlu öğesi snapshot anında eksiktir:

| Öncelik | Sahne | Beklenen tip | Path önerisi |
|---:|---|---|---|
| 10 | `fri-01-welcome` | background | `journey/backgrounds/fri-welcome-night.jpg` |
| 30 | `fri-06-first-trace` | image | `journey/memories/first-trace.jpg` |
| 40 | `fri-07-smile-place` | image | `journey/memories/her-smile.jpg` |
| 50 | `fri-08-ordinary` | image | `journey/memories/ordinary-day.jpg` |
| 60 | `fri-09-our-place` | image | `journey/memories/our-place.jpg` |
| 70 | `fri-10-my-eyes` | image | `journey/memories/my-eyes-her.jpg` |
| 80 | `fri-11-we-are-good` | image | `journey/memories/we-are-good.jpg` |
| 100 | `fri-13-favorite-versions` | image | `journey/memories/her-versions.jpg` |
| 120 | `sat-task-02-remember` | image | `journey/tasks/sat-remember.jpg` |
| 160 | `sun-task-03-ten-things` | image | `journey/tasks/her-ten-things.jpg` |
| 180 | `mon-am-01-birthday` | image | `journey/final/birthday-hero.jpg` |
| 190 | `mon-noon-01-our-day` | image | `journey/final/our-day.jpg` |
| 210 | `mon-final-01-gate` | background | `journey/final/final-gate-bg.jpg` |
| 220 | `mon-final-02-letter` | image | `journey/final/final-letter.jpg` |
| 230 | `mon-final-05-end` | image | `journey/final/end-screen.jpg` |

`fri-05-memory-museum` için zorunlu kapak görseli yüklenmiştir. Background requirement'ları için mevcut UI yalnızca scene `image_url` alanını kontrol eder; ayrı gerçek background image renderer'ı yoktur. Bu görseller yüklense bile background'a otomatik uygulanmaz, yalnızca requirement uyarısı kapanır. Gerçek fotoğraflı arka plan isteniyorsa `SoftGradientBackground` genişletilmelidir.

---

## 18. Görsel tasarım sistemi

### Genel stil

- Mobil-first, koyu gece teması
- Rose gold: `#d9a7a0`
- Champagne: `#f4dcc0`
- Soft pink: `#f0b7c6`
- Ana arka plan: `#070814`
- Ana foreground: `#fffaf2`
- Glassmorphism kartlar
- 8 px kart ve medya radius'u
- Tam yuvarlak CTA butonları
- İnce beyaz/champagne border'lar
- Büyük ama mobilde clamp ile sınırlanan başlıklar

### MobileSceneLayout

- `100dvh` minimum yükseklik
- Maksimum genişlik 430 px
- Ortalanmış tek kolon
- `safe-area-inset-top` ve `safe-area-inset-bottom` desteği
- Header, scroll edilebilir orta içerik ve sabit akış içindeki footer
- Orta içerik scrollbar'ı gizli
- `overscroll-contain`
- Tüm public rotalarda aynı görsel çerçeve

### Desktop davranışı

Public deneyim desktop'ta büyüyüp dashboard'a dönüşmez; 430 px mobil frame merkezde kalır. Yan oklar `sm` breakpoint'inden itibaren görünür.

Content Studio tam tersine yalnızca `xl` breakpoint ve en az 1280 px için tasarlanmıştır.

### Görseller

- `next/image` kullanılmaz.
- Remote görseller düz `<img>` ile render edilir.
- Bu nedenle `next.config.ts` içinde remote image domain tanımı gerekmez.
- Next image optimization, responsive `srcset` ve otomatik boyut optimizasyonu yoktur.
- Memory görseli hata verirse kamera placeholder'ına döner.
- Block ve reward görsellerinde aynı hata fallback'i yoktur.

---

## 19. Animasyonlar ve geçişler

### Sahne geçişi

`AnimatedPageTransition` Framer Motion `AnimatePresence mode="wait"` kullanır.

Giriş:

- Opacity `0 → 1`
- X: ileri için `24 → 0`, geri için `-24 → 0`
- Y `10 → 0`
- Scale `0.985 → 1`
- Blur `14px → 0`
- Süre `0.78s`
- Easing `[0.16, 1, 0.3, 1]`

Çıkış:

- Opacity `1 → 0`
- Y `0 → -6`
- Scale `1 → 0.992`
- Blur `0 → 8px`
- Yöne ters hafif X hareketi
- Süre `0.34s`

Transition key, progress current ve title birleşimidir.

### Reveal animasyonu

- Opacity, Y, scale ve blur reveal
- Süre `0.96s`
- Üzerinden geçen champagne/rose ışık çizgisi
- Reward ve açılmış locked içerikte kullanılır

### Final animasyonu

- Opacity, Y `24`, scale `0.972`, blur `12px`
- Süre `1.02s`

### Loading animasyonu

- Progress bar içinde yatay hareket eden rose parça
- `1.2s`, sonsuz tekrar

### Floating particles

- Deterministik olarak üretilmiş 54 yıldız
- Farklı boyut, opacity, drift, süre ve negatif delay
- X yönünde kayan, hafif Y ve scale değişen parçacıklar
- 8.5 saniyeden başlayan değişken süreler
- Ek geniş ışık katmanı 11 saniyelik yatay sweep yapar

### Oyun mikro animasyonları

- Reaction duel live durumunda pulse
- Tap sequence aktif ışığında scale pulse
- Completion ikonlarında scale/rotate reveal
- Kaydedilen fotoğrafta blur/scale reveal
- Tamamlanma mesajında hafif Y/scale girişi

### Reduced motion

Framer Motion kullanan temel bileşenler `useReducedMotion()` kontrol eder ve büyük giriş/hareket animasyonlarını kapatır. Global CSS de `prefers-reduced-motion` durumunda scroll behavior'ı kapatır. CSS transition'larının tamamı global olarak sıfırlanmaz.

---

## 20. Ses sistemi

Uygulama harici MP3/stream kullanmaz. `lib/audio/emotionalSoundtrack.ts` Web Audio API ile chord ve melody sentezler.

Teknik davranış:

- `AudioContext` veya Safari için `webkitAudioContext`
- Sine ve triangle oscillator'lar
- Low-pass filter: 1050 Hz
- Ana gain yaklaşık 1.8 saniyede `0.11` seviyesine çıkar
- Dört chord'luk progression
- Altı melody note
- Her 4.2 saniyede yeni chord schedule edilir
- Global state `window.__emotionalSoundtrack` üzerinde tutulur
- İkinci çağrı yeni soundtrack başlatmaz, context'i resume eder
- Journey sahnelerinde safe-area uyumlu ses düğmesi görünür
- İlk dokunuş müziği başlatır; sonraki dokunuşlar gain'i yumuşak ramp ile mute/unmute eder
- Ses durumu küçük bir browser event aboneliğiyle düğmeye yansır

Başlatıldığı anlar:

- `/unlock` formu submit edildiğinde, kod doğrulanmadan önce
- Journey'de ileri geçişte
- Preview'da ileri geçişte

Mevcut kısıtlar:

- Ayrı pause ve kademeli volume slider yoktur; kontrol başlatma ve mute/unmute düzeyindedir.
- Interval'i durduran public bir fonksiyon yoktur.
- Kod yanlış olsa bile submit kullanıcı gesture'ı soundtrack'i başlatabilir.
- Browser Web Audio desteklemiyorsa sessizce hiçbir şey yapmaz.

---

## 21. Hata yönetimi ve fallback'ler

### Journey

- Supabase client env eksikse açıklayıcı error throw edilir.
- RPC error message doğrudan state'e aktarılır.
- UI “Tekrar Dene” sunar.
- Boş array için “Henüz sahne yok” görünür.
- Bilinmeyen scene, block, task response veya mini game enum değeri başka bir türe çevrilmez; açık hata üretir.

### Mock data gerçeği

`lib/journey/mockScenes.ts` içinde 7 sahnelik mock akış vardır. Ancak `useJourneyScenes` bu dosyayı import etmez. Dolayısıyla Supabase bağlantısı veya env yoksa mock fallback çalışmaz; error ekranı gelir.

README ve eski checklist'teki “Supabase data yoksa mock fallback” beklentisi mevcut kodla uyumlu değildir.

### Fotoğraf

- Signed URL üretilemezse kaydedilen fotoğraf yerine hata metni görünür.
- Local object URL component unmount/değişiminde revoke edilir.

### Content Studio

- Mutation hatası toolbar'da gösterilir.
- Her başarılı mutation sonrasında bütün veri yeniden yüklenir.
- Optimistic update yoktur.
- Otomatik retry veya rollback yoktur.

---

## 22. Güvenlik modeli ve dikkat edilmesi gerekenler

### Doğru yapılanlar

- Service role key browser'a konmamıştır.
- Access code direct table read yerine RPC ile doğrulanır.
- Kullanıcı fotoğrafları private bucket'tadır.
- Fotoğraflar signed URL ile açılır.
- `.env.local` Git ignore kapsamındadır.
- Proje rehberine göre yeni public tablolarda RLS etkinleştirilmiştir.

### Erişim kodu gerçek auth değildir

Bu projede kullanıcı hesabı, JWT session veya cookie tabanlı auth yoktur. Access code deneyim kapısıdır; güçlü kimlik doğrulama değildir.

Üstelik:

- Varsayılan kod frontend source içinde sabittir.
- `/unlock` input'u kodla önceden doludur.
- `.env.local.example` Supabase URL ve publishable key içerir; publishable key'in public olması normaldir.

Bu kullanım romantik tek-kullanıcılı deneyim için bilinçli olabilir, fakat özel içeriği saldırgana karşı koruyan bir auth modeli sayılmamalıdır.

### `/journey` doğrudan erişim durumu

README checklist'i “access olmadan redirect” bekliyor. Mevcut kodda `/journey` localStorage'da kod yoksa `20TEMMUZ` varsayılanını kullanır ve redirect yapmaz. Bu nedenle kullanıcı `/unlock` sayfasını atlayarak `/journey` açabilir.

Gerçek bir gate isteniyorsa middleware/server cookie veya en azından client-side doğrulama/redirect eklenmelidir. Yine de gizli içerik güvenliği RPC tarafında korunmalıdır.

### Content Studio riski

`NEXT_PUBLIC_CONTENT_STUDIO_ENABLED` yalnızca görünür route feature flag'idir:

- Secret değildir.
- Kullanıcı auth'u istemez.
- Studio browser'dan publishable key ile mutation RPC çağırır.
- Route kapalı olsa bile Supabase RPC'sine doğrudan erişim, database grant/policy izin veriyorsa mümkün olabilir.

Bu nedenle production için kontrol edilmesi gerekenler:

1. `content_studio_mutation` fonksiyonunun kimler tarafından execute edilebildiği
2. Fonksiyon `SECURITY DEFINER` ise iç authorization kontrolü ve güvenli schema/search_path
3. Anon/authenticated grant'leri
4. Tüm public tabloların RLS durumu
5. Storage upload policy'leri
6. Content Studio işi bittikten sonra RPC ve upload yetkisinin kapatılması veya gerçek admin auth eklenmesi

Repository'de SQL/migration olmadığı için bu kontroller kaynak koddan doğrulanamaz.

### Preview riski

- URL gate token server-side'dır.
- RPC preview token `${code}-PREVIEW` şeklinde türetilir ve gerçek bir secret değildir.
- Preview RPC anon publishable client'tan çağrıldığı için RPC'nin kendi authorization tasarımı ayrıca incelenmelidir.

### RLS ve backend audit eksikliği

Remote objelerin oluşturulduğu belirtilmiş olsa da repository şunları içermez:

- Policy SQL'leri
- Function body'leri
- Grant/revoke ifadeleri
- Storage policy SQL'leri
- Migration geçmişi

Bu nedenle deployment'ın tekrar üretilebilirliği ve tam güvenlik denetimi repository tek başına yapılarak tamamlanamaz.

---

## 23. Deployment

### Vercel

Proje Vercel uyumlu standart Next.js yapısındadır. Özel `vercel.json` gerekmez.

Production öncesi:

1. Env değerlerini Vercel Project Settings'e ekle.
2. Content Studio feature flag kararını ortam bazında uygula.
3. Deploy et.
4. QR hedef URL'sini sabitle.

### Diğer platformlar

`package.json` içinde standart script'ler vardır:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

Bu nedenle Node.js destekleyen platformlarda `npm run build && npm run start` ile çalışabilir. Static export ayarı yoktur; preview ve Content Studio dynamic server davranışları nedeniyle tam static host hedeflenmemiştir.

### Node.js 20 notu

Supabase JS sürüm güncellemelerinde Node.js runtime desteği ayrıca takip edilmelidir. Repo dışı Node script yazılacaksa güncel Supabase runtime gereksinimine uygun Node sürümü veya önerilen WebSocket transport çözümü kullanılmalıdır.

---

## 24. Fonksiyonel Altyapı Durumu

| Özellik | Durum | Yapılan geliştirme | Bilinen sınırlama |
|---|---|---|---|
| İlk sahne seçimi | Hazır | Kayıtlı ve açık son sahne varsa korunur; ilk ziyarette sıralamadaki ilk açık sahne seçilir. Tamamlanmamış task'a otomatik atlama kaldırılmıştır. | localStorage'da geçerli bir son sahne varsa kullanıcı bilinçli olarak oradan devam eder. |
| Navigasyon | Hazır | Pending task ve locked sahne için ileri CTA, alt kontrol, yan ok ve hook geçişi aynı merkezi kuralla kapatılır. Tamamlanan sahne yalnızca hemen sonraki indekse gider. | Preview hızlı seçim alanı içerik yöneticisinin bilinçli olarak kuralları aşabilen yerel aracıdır. |
| Task completion | Hazır | Standart task ve mini oyun mutation'larında işlem anahtarı bazlı eşzamanlı çağrı kilidi bulunur. | Çok adımlı Supabase işlemleri tek transaction değildir. |
| Kilit ve dependency sistemi | Kısmen Hazır | Backend kilit sonucu korunur; locked sahne atlanmaz. Readiness self-reference, eksik hedef/gereksinim ve circular dependency bulur. | Rule, schedule ve dependency kayıtları ayrı mutation'larla yazılır. |
| Fotoğraf yükleme | Kısmen Hazır | Private Storage upload, signed URL, kart ve hook seviyesinde double-submit koruması, preview object URL akışı vardır. | Frontend dosya boyutu, piksel ölçüsü ve kapsamlı MIME sınırı uygulamaz. |
| Video/audio gösterimi | Hazır | Sahne videosu ve content block video/audio production ile ortak renderer'da native controls ile gösterilir. | Oynatılabilir codec ve autoplay davranışı mobil browser desteğine bağlıdır. |
| Mini oyunlar | Kısmen Hazır | Reaction duel, couple quiz, penalty picker ve tap sequence gerçek etkileşimli UI kullanır; desteklenmeyen modlar sessiz fallback yapmaz. | `memory_match`, `scratch_reveal` ve genel `choice` modu için özel oyun UI'ı yoktur. |
| Reward sistemi | Hazır | Reward key eşleşmesi, kalıcı claim, görsel/video reveal ve preview yerel unlock akışı ortak renderer'dadır. | Çoklu reward mutation'ları tek transaction değildir. |
| Preview | Hazır | Production ile ortak renderer, aynı final görünümü, yerel fotoğraf/oyun/reward/chapter state'i ve hızlı sahne seçimi vardır. | Preview banner'ı ve hızlı seçim kontrolü production görünümünün parçası değildir. |
| Content Studio doğrulayıcısı | Hazır | Chapter kuralları yanında duplicate slug, orphan ilişki, bozuk reward bağı, self-reference, eksik sahne ve circular dependency raporlanır. | Editoryal validator veritabanı constraint'i yerine geçmez. |
| JSON import | Kısmen Hazır | Desteklenmeyen tablo ve enum değerleri, bozuk satır biçimi ve self-dependency açık uyarıyla atlanır. | Delete planlamaz, atomic değildir ve satırlar sırayla uygulanır. |
| Progress ve test verisi sıfırlama | Hazır | Seçili access code için progress, task response ve reward claim kullanıcı onayıyla temizlenir; görev fotoğrafları listelenip ayrı onayla silinir; localStorage temizleme yönlendirmesi gösterilir. | İşlem için rollback yoktur; Storage dosyası silme tercihi kullanıcıya bırakılır. |
| Ses kontrolü | Kısmen Hazır | Journey içinde Web Audio müziğini başlatan ve yumuşak gain ramp ile mute/unmute yapan safe-area uyumlu kontrol vardır. | Pause, parça seçimi ve kademeli volume slider yoktur. |
| Mobil layout | Hazır | Journey `100dvh`, safe-area, 430 px frame, dikey içerik scroll'u, reduced motion ve clamp başlıklar kullanır. | Content Studio bilinçli olarak en az 1280 px masaüstü arayüzüdür. |

---

## 25. Bilinen eksikler, tutarsızlıklar ve teknik borç

### Yüksek öncelik

1. **Repository'de tam Supabase schema/migration zinciri yok.** Chapter constraint remote migration geçmişinde kayıtlı olsa da backend bütünü repository'den tekrar üretilemez ve güvenlik review eksik kalır.
2. **Content Studio auth'suz bir mutation UI'dır.** Feature flag gerçek güvenlik değildir.
3. **`/journey` access gate'i bypass edilebilir.** Default code ile doğrudan yüklenir.
4. **15 zorunlu medya eksik.** Final ve memory deneyimi büyük ölçüde placeholder gösterebilir.
5. **Mock fallback bağlı değil.** Supabase kesintisinde uygulama çalışmaz.

### Orta öncelik

1. `reward` ve `game` content block'ları bağımsız deneyim üretmez; ayrı ilişki kaydı gerekir.
2. `memory_match` ve `scratch_reveal` özel oyun UI'ı yok; görünür destek uyarısı verir.
3. Background media requirement gerçek background görseline uygulanmıyor.
4. Next Image optimization kullanılmıyor.
5. Upload için boyut/tür sınırı görünmüyor.
6. Content Studio multi-mutation işlemleri transactional değil.
7. ChatGPT import delete desteklemiyor ve her satırda full refresh yapıyor.
8. “Always” rule seçimi yalnızca unlock rule'u siler; base `is_locked` veya eski schedule'ı otomatik temizlediği garanti değildir.
9. Access code selector yalnızca loaded data içinde seçim yapar; veri fetch'i sabit `20TEMMUZ` ile yapılır. Çoklu kod senaryosu tam destekli değildir.

### Düşük öncelik

1. Ses kontrolünde pause ve volume slider yok; başlatma ile mute/unmute desteklenir.
2. `class-variance-authority` kullanılmıyor.
3. `lib/supabase/server.ts` kullanılmıyor.
4. Varsayılan `public/*.svg` dosyaları uygulamada kullanılmıyor.
5. Özel `not-found`, `error` veya `loading` route dosyaları yok.
6. Open Graph/Twitter image, sitemap ve robots yapılandırması yok.
7. Analytics ve production error monitoring yok.

---

## 26. Yeni özellik ekleme rehberi

### Yeni bir scene type eklemek

En az şu katmanlar birlikte güncellenmelidir:

1. `lib/journey/types.ts` — `SceneType`
2. `lib/content-studio/types.ts` — Studio `SceneType`
3. `components/content-studio/ContentStudio.tsx` — `sceneTypes`
4. `components/scene/JourneySceneRenderer.tsx` — production ve preview ortak renderer
5. `app/journey/page.tsx` ile `JourneyPreviewClient.tsx` — scene type'a özel akış davranışı
6. Content Studio type seçeneği, form görünürlüğü ve readiness kuralları
7. Backend constraint/RPC mapping
8. Dokümantasyon

### Yeni bir content block eklemek

1. Her iki type dosyasındaki union
2. Query normalizer allowed list
3. Studio `blockTypes`
4. Studio form alanları
5. `JourneyContentBlocks` renderer
6. Backend constraint/RPC JSON üretimi
7. Locked payload masking

### Yeni bir mini game eklemek

1. Journey ve Studio type union'ları
2. Query `normalizeMiniGameType`
3. Studio `gameTypes`
4. `MiniGameCard` route branch'i
5. Game component state ve accessibility
6. Config validator/fallback
7. Save payload ve score sözleşmesi
8. Preview local completion
9. Backend constraint ve RPC
10. Reward key entegrasyonu

### Gerçek auth eklemek

Önerilen yüksek seviye yaklaşım:

- Supabase Auth veya server-side imzalı kısa ömürlü journey session
- Access code doğrulamasından sonra HttpOnly cookie
- `/journey`, preview ve Content Studio için server/middleware gate
- Content Studio için ayrı admin identity/role
- RLS policy'lerinde access code string yerine güvenilir session identity
- Mutation RPC'lerinde açık authorization check

Access code yine kullanıcı deneyiminin parçası olabilir; fakat güvenlik kararı yalnızca browser localStorage değerine bırakılmamalıdır.

---

## 27. Kaynak dosya referansları

| Konu | Ana dosya |
|---|---|
| Root metadata/font | `app/layout.tsx` |
| Global tema | `app/globals.css` |
| Açılış | `app/page.tsx` |
| Kod doğrulama | `app/unlock/page.tsx` |
| Ana journey | `app/journey/page.tsx` |
| Preview gate | `app/journey/preview/page.tsx` |
| Preview davranışı | `app/journey/preview/JourneyPreviewClient.tsx` |
| Journey state | `hooks/useJourneyScenes.ts` |
| RPC ve Storage | `lib/journey/queries.ts` |
| Ortak sahne renderer | `components/scene/JourneySceneRenderer.tsx` |
| Journey tipleri | `lib/journey/types.ts` |
| İlk sahne seçimi | `lib/journey/progress.ts` |
| Mobil layout | `components/layout/MobileSceneLayout.tsx` |
| Sayfa animasyonu | `components/scene/AnimatedPageTransition.tsx` |
| Mini oyunlar | `components/ui/MiniGameCard.tsx` |
| Fotoğraf görevi | `components/ui/PhotoTaskCard.tsx` |
| Reward UI | `components/ui/RewardRevealStack.tsx` |
| Content block UI | `components/ui/JourneyContentBlocks.tsx` |
| Soundtrack | `lib/audio/emotionalSoundtrack.ts` |
| Ses kontrolü | `components/audio/SoundControlButton.tsx` |
| Studio ana UI | `components/content-studio/ContentStudio.tsx` |
| Studio RPC/upload | `lib/content-studio/scenes.ts` |
| Studio tipleri | `lib/content-studio/types.ts` |
| ChatGPT export | `lib/content-studio/chatgpt-export.ts` |
| ChatGPT import | `lib/content-studio/chatgpt-import.ts` |
| Deployment notları | `DEPLOYMENT.md` |
| Kısa içerik rehberi | `CONTENT_GUIDE.md` |

---

## 28. Sinematik Bölüm Jeneriği (`chapter`)

### Özelliğin amacı

`chapter`, normal içerik kartı olmayan bir interstitial sahne tipidir. Journey içinde yeni bir anlatı bölümüne gelindiğinde aşağıdaki yapıda tam ekran film jeneriği gösterir:

```text
1. BÖLÜM

BİR YILIN İÇİNDEN

Opsiyonel kısa alt cümle
```

Jenerik yaklaşık 4,2 saniye sürer ve ardından sıradaki sahneye otomatik geçer. Normal `MobileSceneLayout` render edilmediği için bu süre boyunca `SoftGradientBackground`, `FloatingParticles`, kart, progress, alt navigasyon ve yan oklar DOM akışında bulunmaz. Chapter ekranı `#020203` gerçek siyah taban, çok hafif CSS grain, kırık beyaz ana metin ve champagne vurgu kullanır.

### Veri modeli ve kullanılan alanlar

Yeni tablo yoktur. `journey_scenes` üzerindeki mevcut alanlar kullanılır:

| Alan | Chapter anlamı |
|---|---|
| `type` | Sabit olarak `chapter` |
| `title` | İçerik yöneticisinin belirlediği ana bölüm başlığı |
| `subtitle` | Opsiyonel kısa sinematik alt cümle |
| `sort_order` | Journey içindeki bölüm başlangıç noktası ve otomatik numara sırası |
| `is_active` | Chapter'ın yayın akışında bulunup bulunmayacağı |
| `is_locked` | Base locked durumu; zamanı gelmeyen chapter için kullanılabilir |
| `unlock_condition` | Kilitli görünümde kullanıcıya açıklama |
| unlock rule/schedule/dependency | Mevcut kilit altyapısıyla zaman veya ön koşul yönetimi |
| `background_variant` | Varsayılan `night`; açık jenerikte standart gradient layout kullanılmadığından görsel sonucu etkilemez |
| `primary_action_label` | Chapter'da kullanılmaz ve yeni kayıtta `null` olur |

Chapter'a `image_url`, `video_url`, content block, mini game, reward veya photo task bağlanmamalıdır. Veri kaybını önlemek için Studio tür değişiminde eski bağlantıları otomatik silmez; editör alanları gizler ve readiness warning üretir.

### Bölüm numarasının hesaplanması

Numara `title` içine kaydedilmez. `lib/journey/chapters.ts` iki ortak fonksiyon sağlar:

```ts
getChapterNumber(scenes, currentChapterId)
getChapterLabel(number)
```

Algoritma:

1. Yalnızca `type === "chapter"` ve `isActive === true` sahneleri alır.
2. Önce `sortOrder`, eşitlik hâlinde kararlı sonuç için `id` ile sıralar.
3. Geçerli chapter'ın sıfır tabanlı indeksine bir ekler.
4. Etiketi `${number}. BÖLÜM` biçiminde üretir.

Bu nedenle bir chapter pasif yapıldığında, sırası değiştiğinde veya araya yeni aktif chapter eklendiğinde sonraki bütün numaralar otomatik güncellenir. Production journey, `/journey/preview` ve Content Studio aynı yardımcıyı kullanır.

### `ChapterRevealScene` component sözleşmesi

Ana dosya `components/scene/ChapterRevealScene.tsx`'tir ve şu props'ları alır:

| Prop | Amaç |
|---|---|
| `chapterNumber` | Otomatik hesaplanan 1 tabanlı sıra |
| `title` | Büyük jenerik başlığı |
| `subtitle` | Opsiyonel alt cümle |
| `onComplete` | Sequence sonunda bir kez çağrılan callback |
| `direction` | `forward` veya `backward`; başlığın çok hafif giriş yönünü belirler |
| `allowSkip` | Dokunma ve klavye ile geçiş izni |
| `previewMode` | Preview'da skip'i ilk andan açar |

Component client leaf'tir. `AnimatePresence`, `motion.div` ve `useReducedMotion` kullanır. Ana easing `[0.16, 1, 0.3, 1]` değeridir. Başlığın karakter uzunluğuna göre üç ayrı `clamp()` ölçeği seçilir; `overflow-wrap:anywhere`, sınırlı genişlik, sıkı line-height ve viewport-relative font boyu sayesinde 360 px ekranda uzun başlık korunur. Üst ve alt padding `env(safe-area-inset-top/bottom)` ile iPhone safe-area değerlerini hesaba katar.

### Normal motion zaman çizelgesi

| Zaman | Olay |
|---:|---|
| 0,0-0,5 sn | Gerçek siyah açılış perdesi |
| 0,5-1,2 sn | Bölüm numarası opacity ve blur reveal |
| 0,9-1,5 sn | Champagne çizginin `scaleX` ile açılması |
| 1,1-2,3 sn | Ana başlığın opacity, blur, y ve çok hafif scale reveal'i |
| 1,8-2,8 sn | Subtitle fade ve y yerleşimi |
| 2,9-3,6 sn | Metin grubunun yavaş opacity/y çıkışı |
| 3,6-4,2 sn | Üst siyah veil'in çözülmesi ve `onComplete` |

Neon, sert glow, bounce veya kart benzeri yüzey kullanılmaz. Grain pointer event almaz. Sonraki sahne yoksa callback navigasyon yapmaz; component'in kalıcı `#020203` tabanı ekranda kalır.

### Skip, klavye ve reduced motion

- Production'da skip ilk `900 ms` kilitlidir.
- Kilit açılınca siyah ekranın herhangi bir yerine pointer/touch bırakmak kısa bir `380 ms` fade ile sequence'i tamamlar.
- Sert, anlık scene swap yapılmaz.
- Sürekli bir “Atla” butonu yoktur; yalnızca çok düşük kontrastlı `dokunarak geç` ipucu belirir.
- `Enter` ve `Space` aynı skip davranışını çalıştırır.
- Preview mode skip'i ilk andan kabul eder.
- `prefers-reduced-motion` durumunda blur, scale ve çizgi hareketi sadeleşir; sequence `1050 ms` içinde fade ile tamamlanır.
- Bütün timeout kimlikleri unmount cleanup'ında temizlenir.
- `completedRef` guard'ı nedeniyle `onComplete` aynı mount içinde en fazla bir kez çağrılır; React Strict Mode effect setup/cleanup tekrarı çift navigasyon üretmez.

### Production journey davranışı

`app/journey/page.tsx`, açık chapter'ı `MobileSceneLayout` dışında doğrudan render eder. Bunun sonuçları:

- Normal arka plan, particle, progress ve navigation component'leri jenerik sırasında oluşturulmaz.
- Swipe veya özel klavye scene navigasyonu yoktur; chapter sadece kendi Enter/Space skip kontrolünü dinler.
- `completeScene`, `saveJourneyTaskResponse` veya başka progress mutation çağrılmaz.
- Sequence bitince `goNext()` yalnızca gerçekten sonraki indeks varsa çağrılır.
- Yön `forward` olur.
- Sonraki sahnenin `isLocked` değeri değiştirilmez; kilitli sahne normal locked renderer'a gider.
- Kullanıcı sonraki sahneden geri dönerse chapter component yeniden mount olur ve jenerik baştan oynar.
- Base locked chapter açık jenerik yerine mevcut `LockedRevealCard` davranışını kullanır; mevcut kilit kuralları korunur.

### Progress davranışı

Mevcut progress component'i ve nokta tasarımı değiştirilmemiştir. Yalnızca hesap girdisi filtrelenir:

```ts
const progressScenes = scenes.filter((scene) => scene.type !== "chapter");
```

Sonuç olarak:

- Chapter interstitial'ları normal içerik toplamına dahil olmaz.
- Açık chapter jeneriği sırasında progress hiç render edilmez.
- Jenerik sonrası ilk normal sahne, chapter yokmuş gibi doğru içerik indeksini gösterir.
- Var olan completed/locked/unlocked nokta görünümü aynen korunur.

### Content Studio davranışı

- Scene type listesine `chapter` eklenmiştir.
- Sol sütunda **Bölüm** butonu özel varsayılanlarla yeni kayıt açar.
- Chapter editörü title, subtitle, sort order, active, base locked ve unlock condition alanlarını gösterir.
- Ayrıntılı rule, schedule ve dependency ayarı **Kilit ve Zaman** sekmesindedir.
- Medya, content block, mini game, reward, progress/completion ve JSON/timeline sekmeleri chapter seçiliyken gizlidir.
- 390 px preview gerçek `ChapterRevealScene` component'ini kullanır.
- **Bölüm Jeneriğini Oynat** her basışta preview key'ini yeniler ve sequence'i sıfırdan mount eder.
- Studio preview `onComplete` callback'i seçili sahneyi değiştirmez ve Supabase mutation yapmaz.

### Journey preview davranışı

`app/journey/preview/JourneyPreviewClient.tsx`, production ile aynı `ChapterRevealScene` dosyasını kullanır. Chapter sırasında normal preview kartı, bilgi paneli, progress ve navigation gizlidir. Sequence tamamlanınca sıradaki local preview indeksine geçer; Supabase progress yazımı yoktur. Jenerik üzerindeki küçük **Yeniden oynat** kontrolü component'i aynı sahnede yeniden mount eder. Sonraki normal sahnedeki hızlı seçim veya geri navigasyonu da chapter'a dönüp jeneriği yeniden başlatabilir.

### Yayına Hazırlık Kontrolü

`lib/content-studio/readiness.ts` aşağıdaki chapter kurallarını üretir ve sol sütundaki panelde hata/uyarı sayılarıyla gösterir:

| Kural | Seviye |
|---|---|
| Chapter başlığı boş | Hata |
| Aktif chapter sonrasında aktif normal sahne yok | Hata |
| Chapter sort order başka aktif sahneyle çakışıyor | Hata |
| Ardışık iki aktif chapter arasında normal sahne yok | Uyarı |
| Chapter'a photo task, mini game veya reward bağlı | Uyarı |
| Kilitli chapter'ın hemen arkasındaki aktif sahne açık | Uyarı |
| Duplicate slug veya eksik sahne ilişkisi | Hata |
| Self-reference veya circular dependency | Hata |
| Mini game ve photo task için bozuk reward bağı | Hata |
| Task olmayan sahneye task ilişkisi | Uyarı |
| Progressive Penalty geçersiz config | Hata |
| Progressive Penalty'nin task olmayan sahneye bağlanması | Hata |

Her issue satırına tıklamak ilgili sahneyi editörde seçer. Bu kontroller veri tabanı constraint'i değildir; yayın öncesi editoryal doğrulamadır.

### Eklenen ve güncellenen ana dosyalar

| Dosya | Değişiklik |
|---|---|
| `lib/journey/types.ts` | Journey `SceneType` union'ına `chapter` |
| `lib/content-studio/types.ts` | Studio `SceneType` union'ına `chapter` |
| `lib/journey/queries.ts` | Runtime allowed type listesine `chapter` |
| `lib/journey/chapters.ts` | Otomatik numara ve Türkçe label yardımcısı |
| `components/scene/ChapterRevealScene.tsx` | Ortak sinematik reveal component'i |
| `app/journey/page.tsx` | Production chapter ve progress entegrasyonu |
| `app/journey/preview/JourneyPreviewClient.tsx` | Mutation'sız gerçek component preview akışı |
| `components/content-studio/ContentStudio.tsx` | Ekleme, alan görünürlüğü, replay ve readiness UI |
| `lib/content-studio/readiness.ts` | Chapter, dependency ve ilişki yayın hazırlık kuralları |
| Supabase remote migration | `journey_scenes_type_check` içine `chapter` |

---

## 29. Sonuç

Proje, görsel olarak tutarlı ve gerçek bir dört günlük hikâye akışını taşıyabilecek güçlü bir frontend omurgasına sahiptir. Sahne/RPC yapısı, zaman ve görev bazlı kilitler, fotoğraf upload'ı, kalıcı reward claim'leri, aynı telefonda oynanan mini oyunlar, preview ve Content Studio birlikte düşünülmüştür.

Production öncesinde en kritik işler şunlardır:

1. Eksik zorunlu medyaları tamamlamak.
2. Remote Supabase schema, function, grants, RLS ve Storage policy'lerini migration olarak repoya almak.
3. Content Studio mutation güvenliğini denetlemek ve yayın öncesi kapatmak veya admin auth eklemek.
4. `/journey` doğrudan erişim davranışının istenen ürün kararı olup olmadığını netleştirmek.
5. Bütün zaman/dependency kombinasyonlarını gerçek `Europe/Istanbul` saatinde gözden geçirmek.
6. Gerçek iPhone ve Android cihazlarda QR, ses, safe area, fotoğraf ve final akışını uçtan uca kontrol etmek.
