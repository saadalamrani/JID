-- Forward-only reconciliation for Arabic Catalog feature-flag metadata that was
-- encoding-corrupted in the remotely applied historical migrations.
UPDATE public.feature_flags
SET
  label_ar = 'إدخال مرشحي الدليل — المرحلة الأولى',
  description_ar = 'بوابة إدخال مرشحي الدليل للمراجعة البشرية فقط. معطلة افتراضياً.'
WHERE key = 'catalog.phase1_ingestion'
  AND label_ar = 'Ø¥Ø¯Ø®Ø§Ù„ Ù…Ø±Ø´Ø­ÙŠ Ø§Ù„Ø¯Ù„ÙŠÙ„ â€” Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰'
  AND description_ar = 'Ø¨ÙˆØ§Ø¨Ø© Ø¥Ø¯Ø®Ø§Ù„ Ù…Ø±Ø´Ø­ÙŠ Ø§Ù„Ø¯Ù„ÙŠÙ„ Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¨Ø´Ø±ÙŠØ© ÙÙ‚Ø·. Ù…Ø¹Ø·Ù„Ø© Ø§ÙØªØ±Ø§Ø¶ÙŠØ§Ù‹.';

UPDATE public.feature_flags
SET
  label_ar = 'موصل GLEIF',
  description_ar = 'مفتاح إيقاف استرجاع بيانات GLEIF. معطل افتراضياً.'
WHERE key = 'catalog.gleif_connector_enabled'
  AND label_ar = 'Ù…ÙˆØµÙ„ GLEIF'
  AND description_ar = 'Ù…ÙØªØ§Ø­ Ø¥ÙŠÙ‚Ø§Ù Ø§Ø³ØªØ±Ø¬Ø§Ø¹ Ø¨ÙŠØ§Ù†Ø§Øª GLEIF. Ù…Ø¹Ø·Ù„ Ø§ÙØªØ±Ø§Ø¶ÙŠØ§Ù‹.';