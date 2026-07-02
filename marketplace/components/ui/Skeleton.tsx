export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className || ""}`}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-white border border-gray-100 rounded-lg overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-3 flex flex-col gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-20 mt-2" />
        <Skeleton className="h-9 w-full mt-3" />
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-6">
      <Skeleton className="h-8 w-8 mb-3" />
      <Skeleton className="h-5 w-24" />
    </div>
  );
}
