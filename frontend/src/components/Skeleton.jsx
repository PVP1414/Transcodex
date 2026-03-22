export function Skeleton({ className = '', variant = 'text' }) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-12 w-12 rounded-full',
    thumbnail: 'aspect-square w-full rounded-lg',
    card: 'h-48 w-full rounded-xl',
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`} />
  );
}

export function MediaCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      <div className="aspect-square bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 flex-1 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-9 flex-1 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function MediaGallerySkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
