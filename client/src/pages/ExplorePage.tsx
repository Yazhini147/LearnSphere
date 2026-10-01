import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicNavbar } from '../components/ui/PublicNavbar';
import { CourseCard } from '../components/courses/CourseCard';
import { courseApi, type CourseListItem, type TagWithCount } from '../services/course.service';
import type { PaginationMeta } from '../types';

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentTag = searchParams.get('tag') || '';
  const currentLevel = searchParams.get('level') || '';
  const currentSortBy = searchParams.get('sortBy') || 'createdAt';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tags once
  useEffect(() => {
    courseApi.getTags().then(setTags).catch(() => {});
  }, []);

  // Fetch courses on filter changes
  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await courseApi.getCourses({
        page: currentPage,
        pageSize: 12,
        search: currentSearch || undefined,
        tag: currentTag || undefined,
        level: currentLevel || undefined,
        sortBy: currentSortBy,
        sortOrder: 'desc',
      });
      setCourses(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message || 'Failed to load courses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentSearch, currentTag, currentLevel, currentSortBy]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  function updateQuery(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '') {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });
    // Reset to page 1 on filter change
    if (!('page' in updates)) {
      next.delete('page');
    }
    setSearchParams(next);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateQuery({ search: searchInput.trim() || null });
  }

  function handleClearFilters() {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />

      <main className="flex-1 page-container py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-text-deep tracking-tight mb-2">
            Explore Courses
          </h1>
          <p className="text-text-muted text-base max-w-2xl">
            Advance your skills with real production architectures, typed exercises, and structured knowledge assessments.
          </p>
        </div>

        {/* Search & Sort Controls Bar */}
        <div className="bg-surface p-4 rounded-xl border border-border mb-6 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                🔍
              </span>
              <input
                type="text"
                className="input pl-10"
                placeholder="Search topics, courses, frameworks..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateQuery({ search: null });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text-deep px-1.5 py-0.5 rounded"
                >
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="btn-md btn-primary shrink-0">
              Search
            </button>
          </form>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="sort" className="text-sm font-medium text-text-muted whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="sort"
              className="input text-sm py-2 px-3 w-auto bg-surface"
              value={currentSortBy}
              onChange={(e) => updateQuery({ sortBy: e.target.value })}
            >
              <option value="createdAt">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="estimatedMinutes">Duration</option>
              <option value="title">Course Name</option>
            </select>
          </div>
        </div>

        {/* Level Filters & Tag Pills */}
        <div className="space-y-3 mb-8">
          {/* Level Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider mr-1">
              Level:
            </span>
            {['', 'beginner', 'intermediate', 'advanced'].map((lvl) => {
              const isActive = currentLevel === lvl;
              const label = lvl === '' ? 'All Levels' : lvl.charAt(0).toUpperCase() + lvl.slice(1);
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => updateQuery({ level: lvl || null })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm font-semibold'
                      : 'bg-surface border border-border text-text-deep hover:bg-soft'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tag Pills */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider mr-1">
                Topic:
              </span>
              <button
                type="button"
                onClick={() => updateQuery({ tag: null })}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                  currentTag === ''
                    ? 'bg-primary text-white font-semibold'
                    : 'bg-surface border border-border text-text-muted hover:text-text-deep hover:bg-soft'
                }`}
              >
                All Topics
              </button>
              {tags.map((t) => {
                const isActive = currentTag === t.slug;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => updateQuery({ tag: isActive ? null : t.slug })}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                      isActive
                        ? 'bg-primary text-white font-semibold'
                        : 'bg-surface border border-border text-text-muted hover:text-text-deep hover:bg-soft'
                    }`}
                  >
                    {t.name}
                    {t.courseCount > 0 && (
                      <span className={`ml-1 text-[10px] ${isActive ? 'text-white/80' : 'text-text-muted'}`}>
                        ({t.courseCount})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Results Info Bar */}
        <div className="flex items-center justify-between mb-6 text-sm text-text-muted">
          <p>
            Showing <span className="font-semibold text-text-deep">{courses.length}</span> of{' '}
            <span className="font-semibold text-text-deep">{meta.total}</span> courses
            {(currentSearch || currentTag || currentLevel) && (
              <button
                onClick={handleClearFilters}
                className="ml-3 text-primary hover:underline text-xs font-medium"
              >
                Clear all filters
              </button>
            )}
          </p>
        </div>

        {/* Course Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-surface rounded-xl border border-border h-80 animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="bg-soft h-40 rounded-lg mb-4" />
                <div className="space-y-2">
                  <div className="bg-soft h-4 w-3/4 rounded" />
                  <div className="bg-soft h-3 w-1/2 rounded" />
                </div>
                <div className="bg-soft h-6 w-1/3 rounded mt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-error-soft border border-error/30 rounded-xl">
            <p className="text-error font-medium mb-3">{error}</p>
            <button onClick={fetchCourses} className="btn-sm btn-primary">
              Try again
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="p-12 text-center bg-surface border border-border rounded-xl">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-lg font-bold text-text-deep mb-2">No courses found</h3>
            <p className="text-text-muted text-sm mb-6 max-w-sm mx-auto">
              We couldn't find any courses matching your selected filters or search terms.
            </p>
            <button onClick={handleClearFilters} className="btn-md btn-primary">
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-2">
            <button
              onClick={() => updateQuery({ page: String(meta.page - 1) })}
              disabled={!meta.hasPrev}
              className="btn-sm bg-surface border border-border text-text-deep hover:bg-soft disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-text-muted px-3">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              onClick={() => updateQuery({ page: String(meta.page + 1) })}
              disabled={!meta.hasNext}
              className="btn-sm bg-surface border border-border text-text-deep hover:bg-soft disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8 text-center text-xs text-text-muted">
        <p>© 2026 LearnSphere Platform. Built for real learning with verifiable depth.</p>
      </footer>
    </div>
  );
}
