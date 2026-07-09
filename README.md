# 20 Temmuz Mobil Hikaye Deneyimi

QR kod ile açılması hedeflenen, mobil-first romantik hikaye web uygulaması.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase MCP ile hazırlanmış Database ve RPC katmanı
- Vercel uyumlu env yapısı

## Local Run

```bash
npm run dev
```

Varsayılan yerel adres: `http://localhost:3000`

## Supabase

`.env.local` içinde yalnızca publishable key bulunur. Service role key kullanılmaz.

MCP ile hazırlanan public tablolar:

- `journey_scenes`
- `journey_access_codes`
- `journey_progress`

Access code doğrulaması direct table read ile değil, `validate_journey_access_code` RPC ile yapılır.

İlk MVP erişim kodu Supabase tarafında `20TEMMUZ` olarak oluşturuldu.

## Manual Checklist

- iPhone viewport
- Android Chrome viewport
- Desktop mobil frame merkezleme
- `/journey` access olmadan redirect
- Geçerli ve hatalı access code
- Supabase data yoksa mock fallback
- İleri ve geri animasyon yönleri
- Task completion state
- Locked reveal
- Final surprise
- Safe-area çakışması
- Görsel olan ve olmayan sahnelerde layout stabilitesi
