import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { removeBookmark } from '../store/slices/bookmarksSlice';
import { useQuran } from '../data/QuranProvider';
import { PageHeader, EmptyState } from '../components/ui/common';
import { Icon } from '../components/ui/Icon';
import { Link } from 'react-router-dom';

export default function BookmarksPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const bookmarks = useAppSelector((state) => state.bookmarks.items);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      bookmark.surahName.toLowerCase().includes(searchLower) ||
      bookmark.arabic.toLowerCase().includes(searchLower) ||
      bookmark.translation.toLowerCase().includes(searchLower) ||
      `${bookmark.surah}:${bookmark.ayah}`.includes(searchQuery)
    );
  });

  const handleRemove = (id: string) => {
    dispatch(removeBookmark(id));
  };

  return (
    <div className="page-enter">
      <PageHeader title="My Bookmarks" />
      <div className="mt-4">
        <div className="flex items-center gap-2">
          <Icon name="search" size={16} className="text-mut" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookmarks..."
            className="flex-1 rounded-xl border border-line bg-surface p-2 text-sm text-ink focus:outline-none focus:border-accent focus:text-ink"
            maxLength={100}
          />
        </div>
        {filteredBookmarks.length > 0 ? (
          <div className="space-y-4">
            {filteredBookmarks.map((bookmark) => {
              const key = `${bookmark.surah}:${bookmark.ayah}`;
              return (
                <div
                  key={key}
                  className="rounded-2xl border border-line bg-surface p-4 hover:bg-surface2 transition-colors"
                  onClick={() => navigate(`/surah/${bookmark.surah}?ayah=${bookmark.ayah}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-accent/12 px-2.5 py-1 text-xs font-medium text-accent">
                      {bookmark.surah}
                    </div>
                    <div className="min-w-0 truncate text-sm font-semibold text-ink">
                      {bookmark.surahName}
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-mut">
                    <div className="truncate ArabicText" dir="rtl" style={{ fontFamily: 'Amiri Quran', fontSize: '1rem' }}>
                      {bookmark.arabic}
                    </div>
                    <div className="mt-1 truncate text-[10px] text-mut">
                      {bookmark.translation}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleRemove(bookmark.id)}
                      aria-label="Remove bookmark"
                      className="rounded-full bg-surface/20 px-2.5 py-1 text-[10px] font-medium text-mut hover:bg-surface/30 transition-colors"
                    >
                      Remove
                    </button>
                    <span className="text-[10px] text-mut">• {bookmark.ayah}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="book"
            title="No bookmarks yet"
            message="No bookmarks yet. Tap the bookmark icon next to any verse to save it."
          />
        )}
      </div>
    </div>
  );
}