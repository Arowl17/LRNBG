import type { MessageKey } from './en';

// Turkish UI strings. Must contain exactly the same keys and placeholders as en.ts.
export const tr: Record<MessageKey, string> = {
  'app.name': 'Shtarkel',
  'app.tagline': 'Bulgarcayı kısa derslerle, adım adım öğren.',

  'nav.main': 'Ana menü',
  'nav.path': 'Öğren',
  'nav.practice': 'Tekrar',
  'nav.words': 'Kelimeler',
  'nav.grammar': 'Dil bilgisi',
  'nav.profile': 'Profil',
  'nav.settings': 'Ayarlar',

  'path.title': 'Kursun',
  'path.empty': 'Henüz ünite yok. Kiril alfabesi bölümü bir sonraki aşamada geliyor.',
  'path.loadError': 'Kurs yüklenemedi. Sayfayı yeniden yüklemeyi dene.',
  'path.unitCount': '{count} ünite',

  'practice.title': 'Tekrar',
  'practice.empty': 'Henüz tekrar edilecek bir şey yok. Önce bir ders bitir.',

  'words.title': 'Kelimeler',
  'words.empty': 'Öğrendiğin kelimeler burada görünecek.',

  'grammar.title': 'Dil bilgisi ipuçları',
  'grammar.empty': 'Dil bilgisi ipuçları, kilitlerini açtıkça burada görünecek.',

  'profile.title': 'Profil',
  'profile.xp': 'Toplam XP',
  'profile.streak': 'Günlük seri',
  'profile.since': 'Başlangıç tarihi: {date}',
  'profile.empty': 'Öğrenmeye başladığında istatistiklerin burada görünecek.',

  'settings.title': 'Ayarlar',
  'settings.section.general': 'Genel',
  'settings.section.display': 'Görünüm ve ses',
  'settings.language': 'Dil',
  'settings.language.help': 'Menülerin ve çevirilerin dili.',
  'settings.language.en': 'English',
  'settings.language.tr': 'Türkçe',
  'settings.theme': 'Görünüm',
  'settings.theme.system': 'Cihaza uy',
  'settings.theme.light': 'Açık',
  'settings.theme.dark': 'Koyu',
  'settings.dailyGoal': 'Günlük hedef',
  'settings.dailyGoal.casual': 'Rahat (10 XP)',
  'settings.dailyGoal.regular': 'Düzenli (20 XP)',
  'settings.dailyGoal.serious': 'Ciddi (50 XP)',
  'settings.stress': 'Vurgu işaretlerini göster',
  'settings.stress.always': 'Her zaman',
  'settings.stress.new': 'Sadece yeni kelimelerde',
  'settings.stress.never': 'Asla',
  'settings.sounds': 'Ses efektleri',
  'settings.haptics': 'Titreşim',
  'settings.hearts': 'Kalpler (her hatada bir kalp kaybet)',
  'settings.hearts.help':
    'Varsayılan olarak kapalı: hatalar bunun yerine dersin sonunda tekrar sorulur.',
  'settings.data': 'İlerlemen',
  'settings.data.help':
    'İlerlemen yalnızca bu cihazda saklanır. Kaybetmemek için düzenli olarak yedek al.',
  'settings.export': 'İlerlemeyi dışa aktar',
  'settings.import': 'İlerlemeyi içe aktar',
  'settings.import.confirm':
    'İçe aktarma, bu cihazdaki tüm ilerlemeyi yedektekiyle değiştirir. Devam edilsin mi?',
  'settings.import.success': 'Yedek içe aktarıldı.',
  'settings.import.error': 'Bu dosya geçerli bir Shtarkel yedeği değil.',
  'settings.export.success': 'Yedek {file} olarak kaydedildi.',
  'settings.reset': 'Tüm ilerlemeyi sıfırla',
  'settings.reset.confirm':
    'Bu işlem bu cihazdaki tüm ilerlemeyi kalıcı olarak siler. Emin değilsen önce yedek al. Devam edilsin mi?',
  'settings.reset.success': 'Tüm ilerleme sıfırlandı.',

  'update.available': 'Yeni bir sürüm var.',
  'update.reload': 'Güncelle',
  'update.dismiss': 'Sonra',
  'offline.ready': 'Çevrimdışı kullanıma hazır.',

  'common.on': 'Açık',
  'common.off': 'Kapalı',
  'common.close': 'Kapat',
  'common.loading': 'Yükleniyor…',

  'notFound.title': 'Sayfa bulunamadı',
  'notFound.back': 'Kursa dön',
};
