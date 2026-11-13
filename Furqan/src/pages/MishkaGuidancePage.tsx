import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DEFAULT_CITY_ID, getCity } from '../../../Mishkah/src/domain/cities';
import { FASTING_GUIDANCE } from '../../../Mishkah/src/domain/fasting';
import {
  EVERYDAY_MOMENTS,
  LESSER_KNOWN_DUAS,
  PRACTICAL_GUIDANCE,
  type GuidanceSource,
  type MomentGuidance,
  type PracticalGuidance,
} from '../../../Mishkah/src/domain/guidance';
import {
  getIslamicDate,
  getUpcomingIslamicEvents,
  HIJRI_MONTHS,
  ISLAMIC_EVENTS,
} from '../../../Mishkah/src/domain/islamicCalendar';
import { getQiblaBearing, normalizeHeading, relativeQiblaHeading } from '../../../Mishkah/src/domain/qibla';
import { MORNING_ADHKAR } from '../../../Mishkah/src/domain/adhkar';
import { PageHeader } from '../components/ui/common';
import { Icon } from '../components/ui/Icon';
import { useSectionSwitcher } from '../shared/SectionSwitcher';

type GuidanceSection = 'daily' | 'tibb' | 'qibla' | 'duas' | 'fasting';
type PracticeFilter = 'all' | 'tibb' | 'movement' | 'adab';
type Coordinates = { latitude: number; longitude: number };
type DeviceOrientationWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<string>;
};

const CITY = getCity(DEFAULT_CITY_ID);
const AYAT_AL_KURSI = MORNING_ADHKAR.find((item) => item.id === 'morning-ayat-kursi');
const TIBB_IDS = new Set([
  'fruit-and-black-seed',
  'talbinah',
  'ajwa-dates',
  'cupping-and-care',
  'lawful-food',
  'care-for-teeth',
]);
const MOVEMENT_IDS = new Set(['beneficial-movement', 'rest-and-sleep']);
const SECTIONS: Array<{ id: GuidanceSection; label: string }> = [
  { id: 'daily', label: 'Daily life' },
  { id: 'tibb', label: 'At-Tibb & Adab' },
  { id: 'qibla', label: 'Qibla' },
  { id: 'duas', label: 'Du’as & moments' },
  { id: 'fasting', label: 'Fasting & events' },
];
const ISLAMIC_EVENT_DETAILS: Record<string, { detail: string; sources: readonly GuidanceSource[] }> = {
  'islamic-new-year': {
    detail: '1 Muharram begins a Hijri year. The calendar era is counted from the Hijrah, but this date is not the exact anniversary of the migration.',
    sources: [],
  },
  ashura: {
    detail: '10 Muharram. A voluntary fast is reported; some scholars recommend also fasting the 9th or 11th.',
    sources: [{ label: 'Sahih al-Bukhari 2004', url: 'https://sunnah.com/bukhari:2004' }],
  },
  ramadan: {
    detail: 'Ramadan begins at sunset before 1 Ramadan. Fasting is obligatory for eligible Muslims; dates depend on local sighting.',
    sources: [{ label: 'Qur’an 2:183–185', url: 'https://quran.com/2/183-185' }],
  },
  'eid-al-fitr': {
    detail: '1 Shawwal marks Eid al-Fitr. Fasting is not observed on Eid al-Fitr.',
    sources: [{ label: 'Qur’an 2:185', url: 'https://quran.com/2/185' }],
  },
  'first-ten-dhul-hijjah': {
    detail: 'The first ten days of Dhul-Hijjah are a season for increased good deeds.',
    sources: [{ label: 'Sahih al-Bukhari 969', url: 'https://sunnah.com/bukhari:969' }],
  },
  'hajj-rites-begin': {
    detail: 'The main Hajj rites take place across 8–13 Dhul-Hijjah. Pilgrims should follow their Hajj group and qualified local guidance.',
    sources: [
      { label: 'Qur’an 3:97', url: 'https://quran.com/3/97' },
      { label: 'Qur’an 2:197', url: 'https://quran.com/2/197' },
    ],
  },
  'day-of-arafah': {
    detail: '9 Dhul-Hijjah, during Hajj. The voluntary fast is for those not performing Hajj.',
    sources: [{ label: 'Sahih Muslim 1162', url: 'https://sunnah.com/muslim:1162' }],
  },
  'eid-al-adha': {
    detail: '10 Dhul-Hijjah marks Eid al-Adha. Its date may differ by local moon sighting.',
    sources: [{ label: 'Qur’an 22:28–37', url: 'https://quran.com/22/28-37' }],
  },
  'tashreeq-begins': {
    detail: 'The Days of Tashreeq run from 11–13 Dhul-Hijjah. Fasting is generally not observed on these days; ask a qualified scholar about the specific Hajj concession.',
    sources: [{ label: 'Sahih Muslim 1141', url: 'https://sunnah.com/muslim:1141' }],
  },
};
const ISLAMIC_JOURNEYS = [
  {
    title: 'The Hijrah · Makkah to Madinah',
    detail: 'The Prophet ﷺ and the early Muslims migrated to Madinah. The Hijri era is counted from this migration; 1 Muharram is the start of the calendar year, not the exact date the journey took place.',
    sources: [
      { label: 'Qur’an 9:40', url: 'https://quran.com/9/40' },
      { label: 'Qur’an 8:72', url: 'https://quran.com/8/72' },
    ],
    to: '/mishka/stories?story=muhammad',
    link: 'Read the Prophet’s story',
  },
  {
    title: 'Hajj · pilgrimage to Makkah',
    detail: 'Hajj is obligatory once for those able. The main rites occur in Dhu al-Hijjah; exact dates and practical steps should be confirmed with the pilgrim’s Hajj group and qualified local guidance.',
    sources: [
      { label: 'Qur’an 3:97', url: 'https://quran.com/3/97' },
      { label: 'Qur’an 2:197', url: 'https://quran.com/2/197' },
    ],
    to: '/mishka/archives',
    link: 'Explore Mishka archives',
  },
] as const;
const PRACTICE_FILTERS: Array<{ id: PracticeFilter; label: string }> = [
  { id: 'all', label: 'All guidance' },
  { id: 'tibb', label: 'At-Tibb & food' },
  { id: 'movement', label: 'Movement & rest' },
  { id: 'adab', label: 'Adab & conduct' },
];

function practiceGroup(id: string): Exclude<PracticeFilter, 'all'> {
  if (TIBB_IDS.has(id)) return 'tibb';
  if (MOVEMENT_IDS.has(id)) return 'movement';
  return 'adab';
}

function SourceLinks({ sources }: { sources: readonly GuidanceSource[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
      {sources.map((source) => (
        <a
          key={source.url}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-accent/8 px-3 py-1.5 text-[11px] font-semibold text-accent hover:bg-accent/15"
        >
          {source.label} ↗
        </a>
      ))}
    </div>
  );
}

function PracticeCard({ item }: { item: PracticalGuidance }) {
  const group = practiceGroup(item.id);
  const label = group === 'tibb' ? 'At-Tibb & food' : group === 'movement' ? 'Movement & rest' : 'Adab';
  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">{label}</p>
      <h3 className="mt-1 text-sm font-semibold text-ink">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink2">{item.summary}</p>
      <p className="mt-3 rounded-xl bg-surface2 p-3 text-xs leading-relaxed text-ink2">{item.practice}</p>
      <SourceLinks sources={item.sources} />
    </article>
  );
}

function MomentCard({ item }: { item: MomentGuidance }) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="text-sm font-semibold text-ink">{item.moment}</h3>
      {item.arabic ? (
        <p lang="ar" dir="rtl" className="ar-uthmani mt-3 text-right text-xl leading-[2.1] text-ink">{item.arabic}</p>
      ) : null}
      {item.transliteration ? <p className="mt-2 text-xs italic leading-relaxed text-mut">{item.transliteration}</p> : null}
      <p className="mt-2 text-sm leading-relaxed text-ink2">{item.meaning}</p>
      {item.practice ? <p className="mt-3 rounded-xl bg-surface2 p-3 text-xs leading-relaxed text-ink2">{item.practice}</p> : null}
      <SourceLinks sources={item.sources} />
    </article>
  );
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function formatGregorianDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`));
}

export default function MishkaGuidancePage() {
  const [searchParams] = useSearchParams();
  const { requestSwitch } = useSectionSwitcher();
  const showingAyat = searchParams.get('topic') === 'ayat-al-kursi';
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [section, setSection] = useState<GuidanceSection>('daily');
  const [practiceFilter, setPracticeFilter] = useState<PracticeFilter>('all');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(
    CITY ? { latitude: CITY.latitude, longitude: CITY.longitude } : null,
  );
  const [locationLabel, setLocationLabel] = useState(CITY ? `Using ${CITY.name} city centre` : 'Location unavailable');
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [heading, setHeading] = useState<number | null>(null);
  const [compassEnabled, setCompassEnabled] = useState(false);
  const [compassError, setCompassError] = useState('');

  const bearing = coordinates
    ? getQiblaBearing(coordinates.latitude, coordinates.longitude)
    : null;
  const pointerRotation = bearing === null
    ? 0
    : heading === null
      ? bearing
      : relativeQiblaHeading(bearing, heading);
  const visiblePractices = PRACTICAL_GUIDANCE.filter(
    (item) => practiceFilter === 'all' || practiceGroup(item.id) === practiceFilter,
  );
  const calendar = useMemo(() => {
    try {
      return {
        currentDate: getIslamicDate(localDate),
        upcomingEvents: getUpcomingIslamicEvents(localDate, ISLAMIC_EVENTS.length),
        error: '',
      };
    } catch (error) {
      return {
        currentDate: null,
        upcomingEvents: [],
        error: errorMessage(error, 'Islamic calendar dates are unavailable.'),
      };
    }
  }, [localDate]);

  useEffect(() => {
    if (!compassEnabled) return;
    let receivedAbsoluteHeading = false;
    const timeout = window.setTimeout(() => {
      if (!receivedAbsoluteHeading) {
        setCompassError('No absolute compass reading is available. The bearing from north remains shown.');
      }
    }, 5000);
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (typeof event.alpha !== 'number' || !event.absolute) {
        setCompassError('This browser is not providing an absolute compass heading. The bearing from north remains shown.');
        return;
      }
      receivedAbsoluteHeading = true;
      window.clearTimeout(timeout);
      setHeading(normalizeHeading(360 - event.alpha));
      setCompassError('');
    };
    window.addEventListener('deviceorientation', onOrientation);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('deviceorientation', onOrientation);
    };
  }, [compassEnabled]);

  const useCurrentLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('This browser does not provide location access. The selected city centre is still used.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: result }) => {
        setCoordinates({ latitude: result.latitude, longitude: result.longitude });
        setLocationLabel('Using your current location');
        setIsLocating(false);
      },
      (error) => {
        const messages: Record<number, string> = {
          1: 'Location permission was not granted. The selected city centre is still used.',
          2: 'Your location could not be determined. The selected city centre is still used.',
          3: 'The location request timed out. The selected city centre is still used.',
        };
        setLocationError(messages[error.code] ?? 'Your location could not be read. The selected city centre is still used.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const enableCompass = async () => {
    setCompassError('');
    if (!('DeviceOrientationEvent' in window)) {
      setCompassError('This browser does not provide a compass sensor. The bearing from north remains shown.');
      return;
    }
    try {
      const orientationEvent = DeviceOrientationEvent as DeviceOrientationWithPermission;
      const permission = await orientationEvent.requestPermission?.();
      if (permission && permission !== 'granted') {
        setCompassError('Compass permission was not granted. The bearing from north remains shown.');
        return;
      }
      setHeading(null);
      setCompassEnabled(true);
    } catch (error) {
      setCompassError(errorMessage(error, 'The compass could not be started. The bearing from north remains shown.'));
    }
  };

  const toggleCompass = () => {
    if (compassEnabled) {
      setCompassEnabled(false);
      setHeading(null);
      setCompassError('');
    } else {
      void enableCompass();
    }
  };

  return (
    <div className="page-enter">
      <PageHeader title="Guidance" subtitle="Qibla, source-linked Prophetic practice, wellness, and everyday supplications." />

      {showingAyat && AYAT_AL_KURSI ? (
        <section className="mb-4 rounded-3xl border border-accent/25 bg-accent/8 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Connected remembrance · Qur’an 2:255</p>
          <h2 className="mt-2 text-lg font-semibold text-ink">{AYAT_AL_KURSI.title}</h2>
          <p lang="ar" dir="rtl" className="ar-uthmani mt-4 text-right text-xl leading-[2.2] text-ink">{AYAT_AL_KURSI.arabic}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink2">{AYAT_AL_KURSI.meaning}</p>
          <p className="mt-2 text-xs text-mut">Reference: {AYAT_AL_KURSI.reference}</p>
          <button
            type="button"
            onClick={() => requestSwitch(
              'furqan',
              '/surah/2?ayah=255',
              'Do you want to switch to Furqan to read Ayat al-Kursi?',
            )}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-onaccent"
          >
            Read in Furqan<Icon name="forward" size={15} />
          </button>
        </section>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1 sm:grid-cols-5" role="tablist" aria-label="Mishka guidance sections">
        {SECTIONS.map((item) => {
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSection(item.id)}
              className={`min-h-11 rounded-xl px-2 py-2 text-xs font-semibold transition-colors ${active ? 'bg-accent text-onaccent' : 'text-mut hover:bg-surface2 hover:text-ink'}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {section === 'daily' ? (
        <section role="tabpanel" aria-label="Daily life">
          <div className="mb-4 rounded-2xl border border-accent/20 bg-accent/5 p-4">
            <h2 className="font-semibold text-ink">Guidance for everyday moments</h2>
            <p className="mt-1 text-sm leading-relaxed text-mut">Read the cited wording and its context; open the source for the full narration.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setSection('tibb')} className="rounded-full bg-accent px-3 py-2 text-xs font-semibold text-onaccent">
                At-Tibb, movement & Adab
              </button>
              <Link to="/mishka/stories" className="rounded-full border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink">
                Prophets & stories
              </Link>
              <Link to="/mishka/archives" className="rounded-full border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink">
                Mishka archives
              </Link>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {EVERYDAY_MOMENTS.map((item) => <MomentCard key={item.id} item={item} />)}
          </div>
        </section>
      ) : null}

      {section === 'tibb' ? (
        <section role="tabpanel" aria-label="At-Tibb and Adab">
          <div className="mb-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
            <h2 className="font-semibold text-ink">At-Tibb, movement & Adab</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink2">
              These are source-linked religious and historical reminders, not medical advice. Narrations about foods or treatments are not a diagnosis or a universal prescription. Do not stop prescribed care; discuss treatment with a qualified health professional.
            </p>
          </div>
          <div className="thin-scroll -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter guidance topics">
            {PRACTICE_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={practiceFilter === item.id}
                onClick={() => setPracticeFilter(item.id)}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${practiceFilter === item.id ? 'bg-accent text-onaccent' : 'bg-surface text-mut hover:text-ink'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {visiblePractices.map((item) => <PracticeCard key={item.id} item={item} />)}
          </div>
        </section>
      ) : null}

      {section === 'qibla' ? (
        <section role="tabpanel" aria-label="Qibla direction" className="rounded-3xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Direction to the Kaaba</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">Qibla pointer</h2>
              <p className="mt-1 text-xs text-mut">{locationLabel}</p>
              {coordinates ? (
                <p className="mt-1 text-[11px] text-mut">
                  {coordinates.latitude.toFixed(4)}°, {coordinates.longitude.toFixed(4)}°
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={isLocating}
                className="min-h-10 rounded-full border border-line px-3 py-2 text-xs font-semibold text-ink disabled:opacity-60"
              >
                {isLocating ? 'Finding location…' : 'Use current location'}
              </button>
              <button
                type="button"
                onClick={toggleCompass}
                className="min-h-10 rounded-full bg-accent px-3 py-2 text-xs font-semibold text-onaccent"
              >
                {compassEnabled ? 'Stop compass' : 'Enable compass'}
              </button>
            </div>
          </div>

          <div className="mx-auto mt-5 w-full max-w-[280px]">
            <svg viewBox="0 0 220 220" role="img" aria-label="Compass showing the Qibla direction" className="w-full">
              <circle cx="110" cy="110" r="101" fill="currentColor" className="text-surface2" />
              <circle cx="110" cy="110" r="91" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-line" />
              <text x="110" y="34" textAnchor="middle" className="fill-current text-xs font-bold text-ink">N</text>
              <text x="110" y="205" textAnchor="middle" className="fill-current text-[9px] text-mut">S</text>
              <text x="24" y="114" textAnchor="middle" className="fill-current text-[9px] text-mut">W</text>
              <text x="196" y="114" textAnchor="middle" className="fill-current text-[9px] text-mut">E</text>
              <g transform={`rotate(${pointerRotation} 110 110)`}>
                <path d="M110 45 L123 116 L110 105 L97 116 Z" fill="currentColor" className="text-accent" />
                <path d="M110 175 L123 104 L110 115 L97 104 Z" fill="currentColor" className="text-mut" />
              </g>
              <circle cx="110" cy="110" r="7" fill="currentColor" className="text-ink" />
            </svg>
          </div>

          <p className="mt-2 text-center text-lg font-semibold text-ink">
            {bearing === null ? 'Qibla bearing unavailable' : `${bearing.toFixed(1)}° from north`}
          </p>
          <p className="mx-auto mt-2 max-w-lg text-center text-xs leading-relaxed text-mut">
            {heading === null
              ? 'Without a compass sensor, the pointer shows the bearing clockwise from north. Align north separately before using it to orient yourself.'
              : 'The pointer is relative to your device heading. Keep the phone level and away from magnets or metal for a steadier reading.'}
          </p>
          <p className="mt-3 text-center text-[11px] text-mut">Location is used on this device to calculate the bearing and is not sent to Manāra.</p>
          {locationError ? <p role="status" className="mt-3 text-center text-xs text-danger">{locationError}</p> : null}
          {compassError ? <p role="status" className="mt-2 text-center text-xs text-danger">{compassError}</p> : null}
        </section>
      ) : null}

      {section === 'duas' ? (
        <section role="tabpanel" aria-label="Du’as and moments">
          <h2 className="mb-3 text-sm font-semibold text-ink">Supplications from the Qur’an and sound reports</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {LESSER_KNOWN_DUAS.map((item) => <MomentCard key={item.id} item={item} />)}
          </div>
        </section>
      ) : null}

      {section === 'fasting' ? (
        <section role="tabpanel" aria-label="Fasting and Islamic events">
          <div className="mb-4 rounded-2xl border border-accent/20 bg-accent/5 p-4">
            <h2 className="font-semibold text-ink">Fasting through the year</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink2">
              Ramadan and make-up fasts that are due are obligatory; the other days below are voluntary. Personal exemptions and rulings vary, so ask a trusted scholar or health professional when needed.
            </p>
            {calendar.currentDate ? (
              <p className="mt-2 text-xs font-medium text-accent">
                Today’s estimated date: {calendar.currentDate.day} {HIJRI_MONTHS[calendar.currentDate.month - 1]} {calendar.currentDate.year} AH
              </p>
            ) : null}
          </div>
          <div className="mb-5 grid gap-3 md:grid-cols-2">
            {FASTING_GUIDANCE.map((item) => (
              <article key={item.title} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${item.type === 'Obligatory' ? 'bg-accent/10 text-accent' : 'bg-surface2 text-mut'}`}>
                    {item.type}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink2">{item.detail}</p>
                <SourceLinks sources={[{ label: item.source, url: item.url }]} />
              </article>
            ))}
          </div>
          <p className="mb-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs leading-relaxed text-ink2">
            Do not fast on Eid al-Fitr or Eid al-Adha. The Days of Tashreeq are also days of eating and remembrance; ask a qualified scholar about the specific Hajj concession. Hijri dates can differ with local moon sighting. (Sahih Muslim 1141)
          </p>

          <div className="mb-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Upcoming Islamic dates</h2>
            <p className="mb-3 text-xs leading-relaxed text-mut">Gregorian dates are calendar estimates; confirm observances with your local mosque or moon-sighting authority.</p>
            {calendar.error ? <p role="status" className="mb-3 text-xs text-danger">{calendar.error}</p> : null}
            <div className="grid gap-3 md:grid-cols-2">
              {calendar.upcomingEvents.map((event) => {
                const details = ISLAMIC_EVENT_DETAILS[event.id];
                return (
                  <article key={`${event.id}:${event.hijriYear}`} className="rounded-2xl border border-line bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-ink">{event.title}</h3>
                        <p className="mt-1 text-[11px] text-mut">
                          {event.hijriDay} {HIJRI_MONTHS[event.hijriMonth - 1]} {event.hijriYear} AH · {formatGregorianDate(event.date)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-accent/8 px-2.5 py-1 text-[10px] font-semibold text-accent">
                        {event.daysUntil === 0 ? 'Today' : `In ${event.daysUntil} days`}
                      </span>
                    </div>
                    {details ? <p className="mt-2 text-xs leading-relaxed text-ink2">{details.detail}</p> : null}
                    {details ? <SourceLinks sources={details.sources} /> : null}
                  </article>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink">Journeys and milestones</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {ISLAMIC_JOURNEYS.map((journey) => (
                <article key={journey.title} className="rounded-2xl border border-line bg-surface p-4">
                  <h3 className="text-sm font-semibold text-ink">{journey.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink2">{journey.detail}</p>
                  <SourceLinks sources={journey.sources} />
                  <Link to={journey.to} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent">
                    {journey.link}<Icon name="chevronRight" size={14} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
