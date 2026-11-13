import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_CITY_IDS,
  DEFAULT_CITY_ID,
  getCity,
  MAX_PINNED_CITIES,
  normalizePinnedCityIds,
  pinCity,
  searchCities,
  unpinCity,
  type City,
} from '../../../Mishkah/src/domain/cities';
import {
  CALCULATION_METHODS,
  dateInTimeZone,
  formatPrayerTime,
  getPrayerTimes,
  nextPrayerAt,
  type CalculationMethod,
  type PrayerName,
} from '../../../Mishkah/src/domain/prayer';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/common';

const STORAGE_KEY = 'manara:mishka:prayer-places:v1';
const PRAYER_ORDER: readonly PrayerName[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

type SavedPrayerPreferences = {
  cityIds: string[];
  calculationMethod: CalculationMethod;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCalculationMethod(value: unknown): value is CalculationMethod {
  return CALCULATION_METHODS.some((method) => method === value);
}

function PrayerTimesCard({
  city,
  now,
  calculationMethod,
  onRemove,
}: {
  city: City;
  now: Date;
  calculationMethod: CalculationMethod;
  onRemove: () => void;
}) {
  const localDate = dateInTimeZone(now, city.timeZone);
  const times = getPrayerTimes(city, now, calculationMethod);
  const nextPrayer = nextPrayerAt(times, now, city.timeZone);

  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-ink">{city.name}</h2>
          <p className="truncate text-xs text-mut">{city.country} · {city.timeZone}</p>
        </div>
        {city.id === DEFAULT_CITY_ID ? (
          <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-semibold text-accent">Home</span>
        ) : (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${city.name} from global places`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mut hover:bg-surface2 hover:text-ink"
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>
      <p className="mt-3 rounded-xl bg-accent/8 px-3 py-2 text-xs font-medium text-ink">
        Next: {nextPrayer.name} in {nextPrayer.minutesUntil} min
      </p>
      <dl className="mt-3 grid grid-cols-3 gap-x-2 gap-y-3">
        {PRAYER_ORDER.map((prayerName) => (
          <div key={prayerName} className="min-w-0">
            <dt className="text-[10px] text-mut">{prayerName}</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-ink">
              {formatPrayerTime(times[prayerName], city, localDate)}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export default function MishkaPrayerPage() {
  const [cityIds, setCityIds] = useState<string[]>([...DEFAULT_CITY_IDS]);
  const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>('MWL');
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (!isRecord(parsed)) throw new Error('Saved prayer preferences are invalid.');
        const savedIds = Array.isArray(parsed.cityIds)
          ? parsed.cityIds.filter((id): id is string => typeof id === 'string')
          : [...DEFAULT_CITY_IDS];
        setCityIds(normalizePinnedCityIds(savedIds));
        if (isCalculationMethod(parsed.calculationMethod)) {
          setCalculationMethod(parsed.calculationMethod);
        }
      }
    } catch (error) {
      setNotice(error instanceof Error
        ? `Saved prayer preferences could not be loaded: ${error.message}`
        : 'Saved prayer preferences could not be loaded.');
    } finally {
      setPreferencesReady(true);
    }
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    try {
      const preferences: SavedPrayerPreferences = { cityIds, calculationMethod };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      setNotice(error instanceof Error
        ? `Prayer preferences could not be saved: ${error.message}`
        : 'Prayer preferences could not be saved.');
    }
  }, [calculationMethod, cityIds, preferencesReady]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const cities = useMemo(
    () => cityIds.map((id) => getCity(id)).filter((city): city is City => city !== undefined),
    [cityIds],
  );
  const pinnedIds = useMemo(() => new Set(cityIds), [cityIds]);
  const results = useMemo(
    () => searchCities(query).filter((city) => !pinnedIds.has(city.id)),
    [pinnedIds, query],
  );

  const addCity = (city: City) => {
    const result = pinCity(cityIds, city.id);
    setCityIds(result.cityIds);
    if (result.status === 'capacity-reached') {
      setNotice(`You can save up to ${MAX_PINNED_CITIES} places, including your home city.`);
    } else {
      setNotice('');
      setQuery('');
    }
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="Prayer times & places"
        subtitle="Prayer schedules in your home city and places around the world."
      />

      <section className="mb-4 rounded-2xl border border-line bg-surface p-4">
        <label htmlFor="prayer-calculation-method" className="text-sm font-semibold text-ink">
          Calculation method
        </label>
        <p className="mt-1 text-xs text-mut">Prayer times are calculated locally for each city’s time zone.</p>
        <select
          id="prayer-calculation-method"
          value={calculationMethod}
          onChange={(event) => setCalculationMethod(event.target.value as CalculationMethod)}
          className="mt-3 w-full rounded-xl border border-line bg-surface2 px-3 py-2.5 text-sm text-ink"
        >
          {CALCULATION_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
        </select>
      </section>

      <section className="mb-4 rounded-2xl border border-line bg-surface p-4">
        <label htmlFor="global-place-search" className="text-sm font-semibold text-ink">
          Add a global place
        </label>
        <div className="relative mt-2">
          <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
          <input
            id="global-place-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search city or country"
            className="w-full rounded-xl border border-line bg-surface2 py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-mut"
          />
        </div>
        {query.trim() ? (
          <div className="mt-2 divide-y divide-line">
            {results.length ? results.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => addCity(city)}
                className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left text-sm text-ink hover:text-accent"
              >
                <span>{city.name}, {city.country}</span>
                <Icon name="plus" size={16} />
              </button>
            )) : (
              <p className="py-3 text-xs text-mut">No matching cities to add.</p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-mut">
            {cities.length} of {MAX_PINNED_CITIES} places saved. Your home city stays pinned.
          </p>
        )}
      </section>

      {notice ? (
        <p className="mb-3 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">
          {notice}
        </p>
      ) : null}

      <div className="space-y-3">
        {cities.map((city) => (
          <PrayerTimesCard
            key={city.id}
            city={city}
            now={now}
            calculationMethod={calculationMethod}
            onRemove={() => setCityIds((current) => unpinCity(current, city.id))}
          />
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-mut">
        Times are estimates from the selected calculation method. Local mosque timetables may differ; follow your community’s guidance where applicable.
      </p>
    </div>
  );
}
