export interface FastingGuidance {
  title: string;
  type: 'Obligatory' | 'Voluntary';
  detail: string;
  source: string;
  url: string;
}

export const FASTING_GUIDANCE: readonly FastingGuidance[] = [
  {
    title: 'Ramadan',
    type: 'Obligatory',
    detail: 'Fasting is obligatory for eligible Muslims. Exemptions and make-up fasts depend on personal circumstances.',
    source: 'Qur’an 2:183–185',
    url: 'https://quran.com/2/183-185',
  },
  {
    title: 'Make-up (qaḍā’) fasts',
    type: 'Obligatory',
    detail: 'When a Ramadan fast was missed for a reason that requires making it up, complete the due fasts later. Individual exemptions and alternatives require trusted guidance.',
    source: 'Qur’an 2:184–185',
    url: 'https://quran.com/2/184-185',
  },
  {
    title: 'Mondays and Thursdays',
    type: 'Voluntary',
    detail: 'The Prophet ﷺ regularly fasted on these weekdays. This is a voluntary practice, not an obligation.',
    source: 'Sahih Muslim 1162 · Jami‘ at-Tirmidhi 747',
    url: 'https://sunnah.com/tirmidhi:747',
  },
  {
    title: 'The white days · 13th–15th',
    type: 'Voluntary',
    detail: 'These are the 13th, 14th, and 15th days of each Hijri month—not a person’s birthday. Do not fast the 13th of Dhul-Hijjah, which is a day of Tashreeq.',
    source: 'Sunan Abi Dawud 2449',
    url: 'https://sunnah.com/abudawud:2449',
  },
  {
    title: 'Six days of Shawwal',
    type: 'Voluntary',
    detail: 'Fast six days during Shawwal after Ramadan; do not fast on Eid al-Fitr.',
    source: 'Sahih Muslim 1164',
    url: 'https://sunnah.com/muslim:1164',
  },
  {
    title: 'Day of Arafah · 9 Dhul-Hijjah',
    type: 'Voluntary',
    detail: 'A recommended fast for those not performing Hajj. Pilgrims should follow the guidance for their Hajj rites.',
    source: 'Sahih Muslim 1162',
    url: 'https://sunnah.com/muslim:1162',
  },
  {
    title: 'Ashura · 10 Muharram',
    type: 'Voluntary',
    detail: 'A voluntary fast. Some scholars recommend also fasting the 9th or 11th; follow trusted scholarly guidance.',
    source: 'Sahih al-Bukhari 2004 · Sahih Muslim 1134',
    url: 'https://sunnah.com/bukhari:2004',
  },
  {
    title: 'Fasting in Sha‘ban',
    type: 'Voluntary',
    detail: 'The Prophet ﷺ fasted more in Sha‘ban than in other months besides Ramadan. This does not make fasting the whole month obligatory.',
    source: 'Sahih al-Bukhari 1969',
    url: 'https://sunnah.com/bukhari:1969',
  },
  {
    title: 'Every other day · the fast of Dawud',
    type: 'Voluntary',
    detail: 'An optional pattern described as the best voluntary fast for one able to sustain it. Do not let voluntary fasting harm health or obligations.',
    source: 'Sahih al-Bukhari 1976 · Sahih Muslim 1159',
    url: 'https://sunnah.com/bukhari:1976',
  },
];
