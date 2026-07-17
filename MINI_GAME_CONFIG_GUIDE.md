# Mini Oyun Tipleri ve Config Rehberi

Bu belge Content Studio içindeki bütün `journey_mini_games` tiplerini, config alanlarını ve LLM'e verilebilecek örnekleri içerir.

## Desteklenen oyun tipleri

| `game_type` | Oynanış | Kullanım |
| --- | --- | --- |
| `reaction_duel` | Destekleniyor | Aynı telefonda refleks düellosu |
| `couple_quiz` | Destekleniyor | İki oyunculu, sırayla cevaplanan quiz |
| `penalty_picker` | Destekleniyor | İki karttan rastgele ceza seçimi |
| `progressive_penalty` | Destekleniyor | Dengeli ve çok turlu ceza oyunu |
| `tap_sequence` | Destekleniyor | Doğru sırayla dokunma oyunu |
| `memory_match` | Destekleniyor | Kart çiftlerini bulma oyunu |
| `scratch_reveal` | Destekleniyor | Dokunarak kazınan sürpriz alanı |
| `choice` | Koşullu destek | Quiz veya ceza seçiciye yönlendirme |

## Ortak kayıt biçimi

Content Studio JSON import çıktısında üst seviye alan `journey_mini_games` dizisidir.

```json
{
  "journey_mini_games": [
    {
      "scene_slug": "oyunun-baglanacagi-sahne",
      "game_key": "primary",
      "game_type": "memory_match",
      "title": "Anıları Eşleştir",
      "instructions": "Kartları aç ve aynı anıları bul.",
      "config": {},
      "reward_key": null,
      "sort_order": 100,
      "is_active": true
    }
  ]
}
```

### Ortak alanlar

- `scene_slug`: Oyunun bağlanacağı mevcut sahnenin slug değeri.
- `game_key`: Sahne içindeki oyun anahtarı. Standart değer `primary`.
- `game_type`: Bu belgedeki sekiz tipten biri.
- `title`: Oyunun ekranda görünen başlığı.
- `instructions`: Oyuncuya gösterilen kısa oynanış açıklaması.
- `config`: Oyun tipine özgü JSON nesnesi.
- `reward_key`: Tamamlanınca açılacak ödül. Ödül yoksa `null`.
- `sort_order`: Standart değer `100`.
- `is_active`: Oyunun görünmesi için `true`.

Yeni kayıt üretilirken `id`, `created_at` ve `updated_at` oluşturulmaz. Var olan kayıt LLM ile düzenleniyorsa mevcut `id` korunur.

## `reaction_duel`

Telefon iki oyuncunun ortasında durur. Bekleme süresi bittikten sonra ilk geçerli dokunuş kazandırır. Erken dokunan oyuncu kaybeder.

```json
{
  "players": ["Sen", "O"],
  "readyText": "Telefon ortada. Işık yanmadan dokunmayın.",
  "liveText": "Şimdi! İlk dokunan kazanır.",
  "waitMinMs": 1500,
  "waitMaxMs": 3500,
  "penalties": [
    "Kaybeden kazanan hakkında sevdiği üç şeyi söyler.",
    "Kaybeden birlikte yaşadığınız en komik anıyı anlatır.",
    "Kaybeden kazananın seçtiği şarkının nakaratını söyler."
  ],
  "alcoholNote": "Cezalar iki tarafın da rahat hissedeceği görevlerle değiştirilebilir."
}
```

Kurallar:

- `players` tam olarak iki dolu isim içermelidir.
- `waitMinMs` ve `waitMaxMs` milisaniyedir.
- `waitMaxMs`, `waitMinMs` değerinden büyük olmalıdır.
- `penalties` en az bir dolu metin içermelidir.
- `readyText`, `liveText` ve `alcoholNote` boş bırakılırsa uygulama varsayılan metin kullanır.

Kaydedilen temel sonuç alanları: `winner`, `loser`, `penalty`, `reason`, `score`, `completedAt`.

## `couple_quiz`

Her soru iki oyuncu tarafından sırayla cevaplanır. En yüksek skoru alan oyuncu kazanır.

```json
{
  "players": ["Sen", "O"],
  "questions": [
    {
      "prompt": "İlk buluşmamızda en çok dikkatimi çeken şey neydi?",
      "options": ["Gülüşün", "Konuşma şeklin", "Kıyafetin", "Heyecanın"],
      "correctIndex": 0
    },
    {
      "prompt": "Birlikte en çok yapmak istediğimiz şey nedir?",
      "options": ["Seyahate çıkmak", "Yeni bir yemek denemek", "Film maratonu yapmak"],
      "correctIndex": 0
    },
    {
      "prompt": "Moralim bozulduğunda beni en hızlı ne mutlu eder?",
      "options": ["Yalnız kalmak", "Sarılmak", "Müzik dinlemek"],
      "correctIndex": 1
    }
  ],
  "penalties": [
    "Kaybeden kazanana içten bir iltifat eder.",
    "Kaybeden bir sonraki buluşmanın planını yapar."
  ],
  "alcoholNote": "Cezalar güvenli ve iki tarafın da onayladığı görevlerden oluşmalıdır."
}
```

Kurallar:

- `players` tam olarak iki oyuncu içermelidir.
- Her soruda `prompt`, `options` ve `correctIndex` bulunmalıdır.
- Bir soruda 2 ile 4 arasında seçenek kullanılmalıdır.
- `correctIndex` sıfır tabanlıdır. İlk seçenek `0`, ikinci seçenek `1` değerini kullanır.
- `correctIndex`, `options` dizisinin sınırları içinde olmalıdır.
- Eşitlik durumunda ilk oyuncu kazanır.

Kaydedilen temel sonuç alanları: `winner`, `loser`, `penalty`, `scores`, `answers`, `completedAt`.

## `penalty_picker`

Oyuncu iki kapalı karttan birini seçer. Kazanan, kaybeden ve ceza oyun tarafından belirlenir.

```json
{
  "players": ["Sen", "O"],
  "penalties": [
    "Kaybeden kazanana bir içecek hazırlar.",
    "Kaybeden kazanan hakkında sevdiği beş şeyi söyler.",
    "Kaybeden komik bir çocukluk anısını anlatır.",
    "Kaybeden bir sonraki buluşmada tatlıyı ısmarlar."
  ],
  "alcoholNote": "Alkol içeren cezalar yalnızca iki taraf da istiyorsa uygulanmalıdır."
}
```

Kurallar:

- `players` tam olarak iki oyuncu içermelidir.
- `penalties` en az bir dolu metin içermelidir.
- Oyuncu sonucu kaydetmeden önce kartları yeniden karıştırabilir.

Kaydedilen temel sonuç alanları: `selectedCard`, `winner`, `loser`, `penalty`, `completedAt`.

## `progressive_penalty`

Çok turlu ceza oyunudur. Kayıp dağılımı iki oyuncu arasında dengeli hazırlanır. Bu oyun yalnızca `task` tipindeki sahneye bağlanabilir.

```json
{
  "version": 1,
  "players": ["Sen", "O"],
  "rounds": [
    {
      "id": "round-1",
      "title": "Tatlı Başlangıç",
      "kind": "penalty",
      "penalty": "Kaybeden unutamadığı güzel bir anıyı anlatır."
    },
    {
      "id": "round-2",
      "title": "İtiraf Zamanı",
      "kind": "penalty",
      "penalty": "Kaybeden içten bir iltifatta bulunur."
    },
    {
      "id": "round-3",
      "title": "Büyük Final",
      "kind": "penalty",
      "penalty": "Kaybeden bir sonraki özel gün için küçük bir sürpriz planlar."
    }
  ],
  "balanceMode": "strict",
  "allowReroll": false,
  "revealLabel": "Kartları Aç",
  "confirmLabel": "Cezayı Tamamladık",
  "completeLabel": "Oyunu Tamamla",
  "finalText": "Tüm turlar tamamlandı."
}
```

Zorunlu kurallar:

- `version` tam olarak `1` olmalıdır.
- `players` tam olarak iki farklı, dolu isim içermelidir.
- `rounds` en az bir tur içermelidir.
- Her turun `id` değeri dolu ve benzersiz olmalıdır.
- Her turda `title`, `kind` ve `penalty` dolu olmalıdır.
- `balanceMode` tam olarak `strict` olmalıdır.
- `allowReroll` tam olarak `false` olmalıdır.
- `revealLabel`, `confirmLabel`, `completeLabel` ve `finalText` boş bırakılamaz.
- Config geçersizse oyun varsayılan config kullanmaz. Content Studio hata gösterir.

Kaydedilen temel sonuç alanları: `completedRounds`, `rounds`, `lossCounts`, `lastRound`, `winner`, `loser`, `penalty`, `completedAt`.

## `tap_sequence`

Oyuncu butonlara config içindeki sırayla dokunur. Yanlış dokunuş ilerlemeyi sıfırlar.

```json
{
  "sequence": ["rose", "champagne", "deep"],
  "labels": ["Gül", "Işık", "Gece"],
  "successScore": 3
}
```

Kurallar:

- Güvenli kullanım için `sequence` tam olarak üç dolu değer içermelidir.
- `labels` dizisi `sequence` ile aynı sırada eşleşmelidir.
- Mevcut arayüz butonları `sequence` dizisinin ilk üç değerinden üretir.
- `successScore` genellikle `sequence.length` ile aynı olmalıdır.

Kaydedilen temel sonuç alanları: `sequence`, `finishedAt`.

## `memory_match`

Config içinde tanımlanan her çift iki kapalı karta dönüştürülür. Kartlar deterministik biçimde karıştırılır. Oyuncu bütün çiftleri bulduğunda oyun otomatik tamamlanır.

```json
{
  "pairs": [
    { "id": "first-date", "label": "İlk Buluşma" },
    { "id": "our-song", "label": "Bizim Şarkımız" },
    { "id": "best-trip", "label": "En Güzel Yolculuk" },
    { "id": "favorite-photo", "label": "Sevdiğimiz Fotoğraf" }
  ],
  "backLabel": "Kartı aç",
  "matchedLabel": "Eşleşti",
  "completionText": "Bütün anılar eşleşti. Oyunu tamamladınız."
}
```

Kurallar:

- `pairs` 2 ile 8 arasında çift tanımı içermelidir.
- Her çiftte dolu `id` ve `label` alanları bulunmalıdır.
- Bütün `id` değerleri benzersiz olmalıdır.
- Aynı `id` değerinin tekrarları yok sayılır.
- Sekizden fazla çift verilirse ilk sekiz çift kullanılır.
- İkiden az geçerli çift kalırsa uygulama dört çiftlik varsayılan config kullanır.
- `backLabel`, kapalı kartın ekran okuyucu etiketidir.
- `matchedLabel`, bulunan kartın ekran okuyucu durum metnidir.

Kaydedilen sonuç örneği:

```json
{
  "gameType": "memory_match",
  "mode": "same_phone_memory_match",
  "matchedPairs": ["first-date", "our-song", "best-trip", "favorite-photo"],
  "pairCount": 4,
  "moves": 7,
  "completedAt": "2026-07-17T20:30:00.000Z"
}
```

## `scratch_reveal`

Oyuncu parmağı veya işaretçi ile kaplama yüzeyini kazır. Açılan alan belirlenen eşiğe ulaştığında kaplama tamamen kaldırılır ve oyun otomatik tamamlanır. Klavye ve motor erişilebilirliği için tek dokunuşla açma butonu da bulunur.

```json
{
  "revealTitle": "Bu Gece İçin Bir Sürpriz",
  "revealText": "Bir sonraki durağımızı sen seçiyorsun. Bütün plan benden.",
  "imageUrl": null,
  "imageAlt": "Kazıma alanının altındaki sürpriz görsel",
  "coverLabel": "Sürprizi görmek için alanı kazı",
  "revealButtonLabel": "Tek Dokunuşla Aç",
  "completionText": "Sürpriz tamamen açıldı.",
  "successThreshold": 55
}
```

Görselli örnek:

```json
{
  "revealTitle": "Yeni Bir Anı Bizi Bekliyor",
  "revealText": "Bu fotoğrafın çekildiği yere yeniden gidiyoruz.",
  "imageUrl": "https://example.com/our-memory.jpg",
  "imageAlt": "Birlikte çekilmiş bir anı fotoğrafı",
  "coverLabel": "Fotoğrafı ortaya çıkarmak için kazı",
  "revealButtonLabel": "Sürprizi Aç",
  "completionText": "Fotoğraf ve sürpriz açıldı.",
  "successThreshold": 60
}
```

Kurallar:

- `revealTitle` ve `revealText` sürprizin görünen içeriğidir.
- `imageUrl` isteğe bağlıdır. Görsel kullanılmayacaksa `null` olmalıdır.
- Görsel kullanılırsa açıklayıcı `imageAlt` yazılmalıdır.
- `successThreshold` yüzde değeridir ve 20 ile 90 arasına sınırlandırılır.
- Önerilen eşik 50 ile 65 arasındadır.
- `coverLabel`, kaplama üstündeki yönlendirme metnidir.
- `revealButtonLabel`, kazıma yapamayan kullanıcılar için alternatif buton metnidir.

Kaydedilen sonuç örneği:

```json
{
  "gameType": "scratch_reveal",
  "mode": "same_phone_scratch_reveal",
  "revealMethod": "scratch",
  "revealPercent": 57,
  "revealTitle": "Bu Gece İçin Bir Sürpriz",
  "completedAt": "2026-07-17T20:30:00.000Z"
}
```

`revealMethod`, kullanıcı kazıdıysa `scratch`, alternatif butonu kullandıysa `button` olur.

## `choice`

`choice` bağımsız bir oynanış değildir. Yalnızca mevcut iki oyuna uyumluluk yönlendirmesi yapar.

Quiz yönlendirmesi:

```json
{
  "mode": "couple_quiz",
  "players": ["Sen", "O"],
  "questions": [
    {
      "prompt": "Birlikte en çok yapmak istediğimiz şey nedir?",
      "options": ["Seyahate çıkmak", "Film izlemek", "Yeni bir yemek denemek"],
      "correctIndex": 0
    }
  ],
  "penalties": ["Kaybeden bir sonraki buluşmayı planlar."]
}
```

Ceza seçici yönlendirmesi:

```json
{
  "mode": "penalty_picker",
  "players": ["Sen", "O"],
  "penalties": [
    "Kaybeden kazanana bir iltifat eder.",
    "Kaybeden bir sonraki içeceği hazırlar."
  ]
}
```

Kurallar:

- `mode` yalnızca `couple_quiz` veya `penalty_picker` olabilir.
- Başka bir `mode` değeri etkileşimli oyun oluşturmaz.
- Yeni içerikte `choice` yerine doğrudan `couple_quiz` veya `penalty_picker` kullanılması önerilir.

## LLM'e verilecek hazır talimat

```text
Verilen tema, kişiler ve sahne slug değerlerine göre journey_mini_games içerikleri üret.

Kurallar:
- Yalnızca parse edilebilir JSON döndür. Markdown veya açıklama yazma.
- Üst seviye çıktı biçimi {"journey_mini_games":[...]} olmalı.
- Yalnızca şu game_type değerlerini kullan:
  reaction_duel, couple_quiz, penalty_picker, progressive_penalty,
  tap_sequence, memory_match, scratch_reveal, choice.
- Yeni oyunlarda choice yerine doğrudan couple_quiz veya penalty_picker tercih et.
- Her satırda scene_slug, game_key, game_type, title, instructions,
  config, reward_key, sort_order ve is_active alanlarını üret.
- game_key için "primary", sort_order için 100, is_active için true kullan.
- reward_key bilinmiyorsa null kullan.
- Var olan kayıt düzenleniyorsa verilen id değerini aynen koru.
- couple_quiz correctIndex değerlerini sıfır tabanlı ve seçenek sınırları içinde üret.
- progressive_penalty yalnızca task sahnesine bağlansın ve bütün zorunlu alanları içersin.
- tap_sequence için üç buton değeri ve bunlarla eşleşen üç label üret.
- memory_match için 2 ile 8 arasında benzersiz id değerine sahip çift üret.
- scratch_reveal successThreshold değerini 50 ile 65 arasında üret.
- Cezaları güvenli, rızaya dayalı, küçük ve eğlenceli görevlerden oluştur.
- Başlıkları kısa, instructions metinlerini tek paragraf ve anlaşılır yaz.
```

## Tam örnek çıktı

```json
{
  "journey_mini_games": [
    {
      "scene_slug": "anilari-eslestir",
      "game_key": "primary",
      "game_type": "memory_match",
      "title": "Anıları Eşleştir",
      "instructions": "Kartları aç ve aynı anıları bul.",
      "config": {
        "pairs": [
          { "id": "first-date", "label": "İlk Buluşma" },
          { "id": "our-song", "label": "Bizim Şarkımız" },
          { "id": "best-trip", "label": "En Güzel Yolculuk" },
          { "id": "favorite-photo", "label": "Sevdiğimiz Fotoğraf" }
        ],
        "backLabel": "Kartı aç",
        "matchedLabel": "Eşleşti",
        "completionText": "Bütün anılar eşleşti. Oyunu tamamladınız."
      },
      "reward_key": null,
      "sort_order": 100,
      "is_active": true
    },
    {
      "scene_slug": "gizli-surpriz",
      "game_key": "primary",
      "game_type": "scratch_reveal",
      "title": "Gizli Sürpriz",
      "instructions": "Alanı parmağınla kazı ve mesajı ortaya çıkar.",
      "config": {
        "revealTitle": "Bu Gece İçin Bir Sürpriz",
        "revealText": "Bir sonraki durağımızı sen seçiyorsun. Bütün plan benden.",
        "imageUrl": null,
        "imageAlt": "Kazıma alanının altındaki sürpriz görsel",
        "coverLabel": "Sürprizi görmek için alanı kazı",
        "revealButtonLabel": "Tek Dokunuşla Aç",
        "completionText": "Sürpriz tamamen açıldı.",
        "successThreshold": 55
      },
      "reward_key": null,
      "sort_order": 100,
      "is_active": true
    }
  ]
}
```
