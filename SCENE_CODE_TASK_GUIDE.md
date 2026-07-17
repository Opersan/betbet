# Dokuz Sahnelik Kod Avı Rehberi

Bu belge, Content Studio JSON import alanında kullanılabilecek dokuz sahnelik basit bir kod avı şablonudur. Dosyadaki veri hiçbir yere otomatik olarak uygulanmaz.

## Nasıl çalışır?

Bir `task` sahnesinde `block_type` değeri `prompt`, `metadata.mode` değeri `scene_code` olan blok bulunduğunda kod giriş kartı gösterilir. Kod tarayıcıda doğrulanır. Doğru cevap mevcut sahne tamamlama akışını çağırır; dependency ve unlock rule zinciri sonraki sahneyi açar.

Karşılaştırma sırasında baştaki ve sondaki boşluklar, kelime içindeki boşluklar ve büyük/küçük harf farkı yok sayılır. Türkçe karakterler ASCII karşılıklarıyla eşleşir. Örneğin `ŞİFRE 1`, `sifre1` ve ` SİFRE 1 ` aynı kod kabul edilir.

## Config alanları

- `mode`: Bu görev için tam olarak `scene_code` olmalıdır.
- `answer`: Doğru kod. Boş veya eksik olursa sahne tamamlanmaz ve yapılandırma hatası görünür.
- `hints`: İlk açılışta gizli olan ipuçları. Butona her basıldığında sıradaki ipucu açılır.
- `inputLabel`: Input alanının etiketi.
- `placeholder`: Input içindeki örnek metin.
- `submitLabel`: Doğrulama butonunun metni.
- `successText`: Doğru koddan sonra kısa süre gösterilen onay metni.

Kodlar, bu kullanım için bilinçli olarak client payload içinde bulunur; gizli veya güvenlik amaçlı parola olarak kullanılmamalıdır.

## Kullanmadan önce

1. `CODE_1` ile `CODE_9` değerlerini gerçek kodlarla değiştirin.
2. Sahne başlıklarını, açıklamalarını ve bütün ipuçlarını fiziksel yerleşiminize göre düzenleyin.
3. Slug veya sıra değerleri mevcut içerikle çakışıyorsa değiştirin.
4. JSON'u Content Studio import önizlemesinde kontrol edin; ardından değişiklikleri siz uygulayın.

## Hazır JSON şablonu

```json
{
  "journey_scenes": [
    {
      "slug": "chapter-7-hunt-01",
      "type": "task",
      "title": "Kod Avı 1",
      "subtitle": "İlk ipucunu bul",
      "content": "Fiziksel ipucunu bul ve üzerindeki kodu gir.",
      "image_url": null,
      "video_url": null,
      "date_label": null,
      "sort_order": 710,
      "background_variant": "deep",
      "is_locked": false,
      "unlock_condition": null,
      "primary_action_label": null,
      "is_active": true
    },
    {
      "slug": "chapter-7-hunt-02",
      "type": "task",
      "title": "Kod Avı 2",
      "subtitle": "İkinci durağa geç",
      "content": "Yeni ipucunu bul ve kodu gir.",
      "image_url": null,
      "video_url": null,
      "date_label": null,
      "sort_order": 720,
      "background_variant": "deep",
      "is_locked": true,
      "unlock_condition": "Önceki kod doğru girildiğinde açılır.",
      "primary_action_label": null,
      "is_active": true
    },
    {
      "slug": "chapter-7-hunt-03",
      "type": "task",
      "title": "Kod Avı 3",
      "subtitle": "Üçüncü durağı bul",
      "content": "Yeni ipucunu bul ve kodu gir.",
      "image_url": null,
      "video_url": null,
      "date_label": null,
      "sort_order": 730,
      "background_variant": "deep",
      "is_locked": true,
      "unlock_condition": "Önceki kod doğru girildiğinde açılır.",
      "primary_action_label": null,
      "is_active": true
    },
    {
      "slug": "chapter-7-hunt-04",
      "type": "task",
      "title": "Kod Avı 4",
      "subtitle": "Dördüncü durağa ilerle",
      "content": "Yeni ipucunu bul ve kodu gir.",
      "image_url": null,
      "video_url": null,
      "date_label": null,
      "sort_order": 740,
      "background_variant": "deep",
      "is_locked": true,
      "unlock_condition": "Önceki kod doğru girildiğinde açılır.",
      "primary_action_label": null,
      "is_active": true
    },
    {
      "slug": "chapter-7-hunt-05",
      "type": "task",
      "title": "Kod Avı 5",
      "subtitle": "Yolun yarısı",
      "content": "Yeni ipucunu bul ve kodu gir.",
      "image_url": null,
      "video_url": null,
      "date_label": null,
      "sort_order": 750,
      "background_variant": "deep",
      "is_locked": true,
      "unlock_condition": "Önceki kod doğru girildiğinde açılır.",
      "primary_action_label": null,
      "is_active": true
    },
    {
      "slug": "chapter-7-hunt-06",
      "type": "task",
      "title": "Kod Avı 6",
      "subtitle": "Altıncı durağı keşfet",
      "content": "Yeni ipucunu bul ve kodu gir.",
      "image_url": null,
      "video_url": null,
      "date_label": null,
      "sort_order": 760,
      "background_variant": "deep",
      "is_locked": true,
      "unlock_condition": "Önceki kod doğru girildiğinde açılır.",
      "primary_action_label": null,
      "is_active": true
    },
    {
      "slug": "chapter-7-hunt-07",
      "type": "task",
      "title": "Kod Avı 7",
      "subtitle": "Yedinci ipucunu çöz",
      "content": "Yeni ipucunu bul ve kodu gir.",
      "image_url": null,
      "video_url": null,
      "date_label": null,
      "sort_order": 770,
      "background_variant": "deep",
      "is_locked": true,
      "unlock_condition": "Önceki kod doğru girildiğinde açılır.",
      "primary_action_label": null,
      "is_active": true
    },
    {
      "slug": "chapter-7-hunt-08",
      "type": "task",
      "title": "Kod Avı 8",
      "subtitle": "Finalden önceki durak",
      "content": "Yeni ipucunu bul ve kodu gir.",
      "image_url": null,
      "video_url": null,
      "date_label": null,
      "sort_order": 780,
      "background_variant": "deep",
      "is_locked": true,
      "unlock_condition": "Önceki kod doğru girildiğinde açılır.",
      "primary_action_label": null,
      "is_active": true
    },
    {
      "slug": "chapter-7-hunt-09",
      "type": "task",
      "title": "Kod Avı 9",
      "subtitle": "Son kod",
      "content": "Son ipucunu bul ve kodu gir.",
      "image_url": null,
      "video_url": null,
      "date_label": null,
      "sort_order": 790,
      "background_variant": "deep",
      "is_locked": true,
      "unlock_condition": "Önceki kod doğru girildiğinde açılır.",
      "primary_action_label": null,
      "is_active": true
    }
  ],
  "journey_scene_content_blocks": [
    {
      "scene_slug": "chapter-7-hunt-01",
      "block_type": "prompt",
      "title": "Birinci kodu bul",
      "body": "Fiziksel ipucunu bul. Üzerindeki kodu aşağıya yaz.",
      "media_url": null,
      "media_path": null,
      "alt_text": null,
      "metadata": {
        "mode": "scene_code",
        "answer": "CODE_1",
        "hints": ["İlk ipucu metni", "Biraz daha açık ikinci ipucu", "Son ve güçlü ipucu"],
        "inputLabel": "Bulduğun kod",
        "placeholder": "Kodu yaz",
        "submitLabel": "Kodu Doğrula",
        "successText": "Doğru kod. İkinci durağa geçiyoruz."
      },
      "sort_order": 10,
      "is_active": true
    },
    {
      "scene_slug": "chapter-7-hunt-02",
      "block_type": "prompt",
      "title": "İkinci kodu bul",
      "body": "İkinci fiziksel ipucundaki kodu aşağıya yaz.",
      "media_url": null,
      "media_path": null,
      "alt_text": null,
      "metadata": {
        "mode": "scene_code",
        "answer": "CODE_2",
        "hints": ["İlk ipucu metni", "Biraz daha açık ikinci ipucu", "Son ve güçlü ipucu"],
        "inputLabel": "Bulduğun kod",
        "placeholder": "Kodu yaz",
        "submitLabel": "Kodu Doğrula",
        "successText": "Doğru kod. Üçüncü durağa geçiyoruz."
      },
      "sort_order": 10,
      "is_active": true
    },
    {
      "scene_slug": "chapter-7-hunt-03",
      "block_type": "prompt",
      "title": "Üçüncü kodu bul",
      "body": "Üçüncü fiziksel ipucundaki kodu aşağıya yaz.",
      "media_url": null,
      "media_path": null,
      "alt_text": null,
      "metadata": {
        "mode": "scene_code",
        "answer": "CODE_3",
        "hints": ["İlk ipucu metni", "Biraz daha açık ikinci ipucu", "Son ve güçlü ipucu"],
        "inputLabel": "Bulduğun kod",
        "placeholder": "Kodu yaz",
        "submitLabel": "Kodu Doğrula",
        "successText": "Doğru kod. Dördüncü durağa geçiyoruz."
      },
      "sort_order": 10,
      "is_active": true
    },
    {
      "scene_slug": "chapter-7-hunt-04",
      "block_type": "prompt",
      "title": "Dördüncü kodu bul",
      "body": "Dördüncü fiziksel ipucundaki kodu aşağıya yaz.",
      "media_url": null,
      "media_path": null,
      "alt_text": null,
      "metadata": {
        "mode": "scene_code",
        "answer": "CODE_4",
        "hints": ["İlk ipucu metni", "Biraz daha açık ikinci ipucu", "Son ve güçlü ipucu"],
        "inputLabel": "Bulduğun kod",
        "placeholder": "Kodu yaz",
        "submitLabel": "Kodu Doğrula",
        "successText": "Doğru kod. Beşinci durağa geçiyoruz."
      },
      "sort_order": 10,
      "is_active": true
    },
    {
      "scene_slug": "chapter-7-hunt-05",
      "block_type": "prompt",
      "title": "Beşinci kodu bul",
      "body": "Beşinci fiziksel ipucundaki kodu aşağıya yaz.",
      "media_url": null,
      "media_path": null,
      "alt_text": null,
      "metadata": {
        "mode": "scene_code",
        "answer": "CODE_5",
        "hints": ["İlk ipucu metni", "Biraz daha açık ikinci ipucu", "Son ve güçlü ipucu"],
        "inputLabel": "Bulduğun kod",
        "placeholder": "Kodu yaz",
        "submitLabel": "Kodu Doğrula",
        "successText": "Doğru kod. Altıncı durağa geçiyoruz."
      },
      "sort_order": 10,
      "is_active": true
    },
    {
      "scene_slug": "chapter-7-hunt-06",
      "block_type": "prompt",
      "title": "Altıncı kodu bul",
      "body": "Altıncı fiziksel ipucundaki kodu aşağıya yaz.",
      "media_url": null,
      "media_path": null,
      "alt_text": null,
      "metadata": {
        "mode": "scene_code",
        "answer": "CODE_6",
        "hints": ["İlk ipucu metni", "Biraz daha açık ikinci ipucu", "Son ve güçlü ipucu"],
        "inputLabel": "Bulduğun kod",
        "placeholder": "Kodu yaz",
        "submitLabel": "Kodu Doğrula",
        "successText": "Doğru kod. Yedinci durağa geçiyoruz."
      },
      "sort_order": 10,
      "is_active": true
    },
    {
      "scene_slug": "chapter-7-hunt-07",
      "block_type": "prompt",
      "title": "Yedinci kodu bul",
      "body": "Yedinci fiziksel ipucundaki kodu aşağıya yaz.",
      "media_url": null,
      "media_path": null,
      "alt_text": null,
      "metadata": {
        "mode": "scene_code",
        "answer": "CODE_7",
        "hints": ["İlk ipucu metni", "Biraz daha açık ikinci ipucu", "Son ve güçlü ipucu"],
        "inputLabel": "Bulduğun kod",
        "placeholder": "Kodu yaz",
        "submitLabel": "Kodu Doğrula",
        "successText": "Doğru kod. Sekizinci durağa geçiyoruz."
      },
      "sort_order": 10,
      "is_active": true
    },
    {
      "scene_slug": "chapter-7-hunt-08",
      "block_type": "prompt",
      "title": "Sekizinci kodu bul",
      "body": "Sekizinci fiziksel ipucundaki kodu aşağıya yaz.",
      "media_url": null,
      "media_path": null,
      "alt_text": null,
      "metadata": {
        "mode": "scene_code",
        "answer": "CODE_8",
        "hints": ["İlk ipucu metni", "Biraz daha açık ikinci ipucu", "Son ve güçlü ipucu"],
        "inputLabel": "Bulduğun kod",
        "placeholder": "Kodu yaz",
        "submitLabel": "Kodu Doğrula",
        "successText": "Doğru kod. Son durağa geçiyoruz."
      },
      "sort_order": 10,
      "is_active": true
    },
    {
      "scene_slug": "chapter-7-hunt-09",
      "block_type": "prompt",
      "title": "Son kodu bul",
      "body": "Son fiziksel ipucundaki kodu aşağıya yaz.",
      "media_url": null,
      "media_path": null,
      "alt_text": null,
      "metadata": {
        "mode": "scene_code",
        "answer": "CODE_9",
        "hints": ["İlk ipucu metni", "Biraz daha açık ikinci ipucu", "Son ve güçlü ipucu"],
        "inputLabel": "Bulduğun kod",
        "placeholder": "Kodu yaz",
        "submitLabel": "Kodu Doğrula",
        "successText": "Doğru kod. Kod avını tamamladın."
      },
      "sort_order": 10,
      "is_active": true
    }
  ],
  "journey_scene_dependencies": [
    { "trigger_scene_slug": "chapter-7-hunt-01", "target_scene_slug": "chapter-7-hunt-02" },
    { "trigger_scene_slug": "chapter-7-hunt-02", "target_scene_slug": "chapter-7-hunt-03" },
    { "trigger_scene_slug": "chapter-7-hunt-03", "target_scene_slug": "chapter-7-hunt-04" },
    { "trigger_scene_slug": "chapter-7-hunt-04", "target_scene_slug": "chapter-7-hunt-05" },
    { "trigger_scene_slug": "chapter-7-hunt-05", "target_scene_slug": "chapter-7-hunt-06" },
    { "trigger_scene_slug": "chapter-7-hunt-06", "target_scene_slug": "chapter-7-hunt-07" },
    { "trigger_scene_slug": "chapter-7-hunt-07", "target_scene_slug": "chapter-7-hunt-08" },
    { "trigger_scene_slug": "chapter-7-hunt-08", "target_scene_slug": "chapter-7-hunt-09" }
  ],
  "journey_scene_unlock_rules": [
    {
      "target_scene_slug": "chapter-7-hunt-02",
      "unlock_mode": "all_completed",
      "unlock_at": null,
      "required_scene_slugs": ["chapter-7-hunt-01"],
      "description": "Birinci kod tamamlanınca açılır."
    },
    {
      "target_scene_slug": "chapter-7-hunt-03",
      "unlock_mode": "all_completed",
      "unlock_at": null,
      "required_scene_slugs": ["chapter-7-hunt-02"],
      "description": "İkinci kod tamamlanınca açılır."
    },
    {
      "target_scene_slug": "chapter-7-hunt-04",
      "unlock_mode": "all_completed",
      "unlock_at": null,
      "required_scene_slugs": ["chapter-7-hunt-03"],
      "description": "Üçüncü kod tamamlanınca açılır."
    },
    {
      "target_scene_slug": "chapter-7-hunt-05",
      "unlock_mode": "all_completed",
      "unlock_at": null,
      "required_scene_slugs": ["chapter-7-hunt-04"],
      "description": "Dördüncü kod tamamlanınca açılır."
    },
    {
      "target_scene_slug": "chapter-7-hunt-06",
      "unlock_mode": "all_completed",
      "unlock_at": null,
      "required_scene_slugs": ["chapter-7-hunt-05"],
      "description": "Beşinci kod tamamlanınca açılır."
    },
    {
      "target_scene_slug": "chapter-7-hunt-07",
      "unlock_mode": "all_completed",
      "unlock_at": null,
      "required_scene_slugs": ["chapter-7-hunt-06"],
      "description": "Altıncı kod tamamlanınca açılır."
    },
    {
      "target_scene_slug": "chapter-7-hunt-08",
      "unlock_mode": "all_completed",
      "unlock_at": null,
      "required_scene_slugs": ["chapter-7-hunt-07"],
      "description": "Yedinci kod tamamlanınca açılır."
    },
    {
      "target_scene_slug": "chapter-7-hunt-09",
      "unlock_mode": "all_completed",
      "unlock_at": null,
      "required_scene_slugs": ["chapter-7-hunt-08"],
      "description": "Sekizinci kod tamamlanınca açılır."
    }
  ]
}
```

## İlerleme kaydı notu

Uygulama journey açılırken mevcut `initialize_journey_progress` akışını çağırır. Bu geliştirme herhangi bir Supabase insert, update, migration veya RPC değişikliği yapmaz. Dokuz sahneyi Content Studio ile ekledikten sonra her erişim kodu için eksik progress satırlarının oluştuğunu normal journey ekranından doğrulayın.
