import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDailyQhdReminder } from '../../../../Mishkah/src/domain/dailyQhdReminder';
import { useQuran } from '../../data/QuranProvider';
import { getSurah } from '../../lib/dataClient';
import { useAppDispatch, useAppSelector } from '../../store';
import { isDuaLiked, isHadithLiked, toggleLikedDua, toggleLikedHadith } from '../../store/slices/likesSlice';
import { LikeButton } from '../../components/ui/LikeButton';
import { Icon } from '../../components/ui/Icon';
import type { AyahData } from '../../types';

export function QhdReminderCard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const likes = useAppSelector((state) => state.likes);
  const { surahs } = useQuran();
  const [dateKey, setDateKey] = useState(() => new Date().toISOString().slice(0, 10));
  const [verse, setVerse] = useState<AyahData | null>(null);
  const [verseError, setVerseError] = useState('');
  const [retry, setRetry] = useState(0);
  const reminder = useMemo(
    () => getDailyQhdReminder(new Date(`${dateKey}T12:00:00.000Z`)),
    [dateKey],
  );
  const surahName = surahs?.find((surah) => surah.number === reminder.theme.surah)?.englishName
    ?? `Surah ${reminder.theme.surah}`;

  useEffect(() => {
    const refreshDate = () => setDateKey(new Date().toISOString().slice(0, 10));
    const interval = window.setInterval(refreshDate, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    setVerse(null);
    setVerseError('');
    void getSurah(reminder.theme.surah)
      .then((data) => {
        const dailyVerse = data.ayahs[reminder.theme.ayah - 1];
        if (!dailyVerse) throw new Error('The selected verse is not available.');
        if (active) setVerse(dailyVerse);
      })
      .catch((error: unknown) => {
        if (active) {
          setVerseError(error instanceof Error ? error.message : 'Could not load today’s Quran verse.');
        }
      });
    return () => { active = false; };
  }, [reminder.theme.ayah, reminder.theme.surah, retry]);

  return (
    <article className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#0d302f] via-[#14544d] to-[#173c50] text-white shadow-card">
      <div className="p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100">Quran · Hadith · Dua</p>
            <h2 className="mt-1 text-sm font-semibold">Today’s QHD reminder</h2>
          </div>
          <Icon name="sparkle" size={18} className="shrink-0 text-emerald-100" />
        </div>
        {verse ? (
          <button
            type="button"
            onClick={() => navigate(`/surah/${reminder.theme.surah}?ayah=${reminder.theme.ayah}`)}
            className="block w-full rounded-2xl bg-black/20 p-3 text-left transition hover:bg-black/30 sm:p-4"
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-emerald-100">
              Verse of the day · {reminder.theme.title}
            </p>
            <p dir="rtl" lang="ar" className="ar-uthmani mt-2 text-right text-xl leading-[1.9] sm:text-2xl">
              {verse.ar}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/90">{verse.tr}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-100">
              {surahName} · {reminder.theme.surah}:{reminder.theme.ayah}
              <Icon name="forward" size={13} />
            </span>
          </button>
        ) : (
          <div className="rounded-2xl bg-black/20 p-4" role={verseError ? 'alert' : 'status'}>
            <p className="text-sm text-white/85">
              {verseError || 'Loading today’s Quran verse…'}
            </p>
            {verseError ? (
              <button
                type="button"
                onClick={() => setRetry((value) => value + 1)}
                className="mt-2 text-xs font-semibold text-emerald-100 underline"
              >
                Try again
              </button>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 border-t border-white/20 bg-black/10">
        <section className="min-w-0 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-emerald-100">Hadith</p>
            <LikeButton
              liked={isHadithLiked(likes, reminder.hadith.id)}
              label="Like this Hadith"
              onToggle={() => dispatch(toggleLikedHadith(reminder.hadith.id))}
            />
          </div>
          <h3 className="mt-2 text-sm font-semibold leading-snug">{reminder.hadith.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/80">{reminder.hadith.summary}</p>
          <p className="mt-2 text-[10px] text-white/65">{reminder.hadith.reference}</p>
        </section>
        <section className="min-w-0 border-l border-white/20 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-emerald-100">Dua</p>
            <LikeButton
              liked={isDuaLiked(likes, reminder.dua.id)}
              label="Like this dua"
              onToggle={() => dispatch(toggleLikedDua(reminder.dua.id))}
            />
          </div>
          <h3 className="mt-2 text-sm font-semibold leading-snug">{reminder.dua.title}</h3>
          <p dir="rtl" lang="ar" className="ar-uthmani mt-1 text-right text-base leading-relaxed">{reminder.dua.arabic}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/80">{reminder.dua.meaning}</p>
          <p className="mt-2 text-[10px] text-white/65">{reminder.dua.reference}</p>
        </section>
      </div>
    </article>
  );
}
