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

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
        <Skeleton className="h-[600px] rounded-3xl" />
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center px-4 py-20">
        <div className="lg:col-span-7 space-y-6">
          <Skeleton className="h-4 w-48 rounded-full" />
          <Skeleton className="h-16 w-full max-w-xl" />
          <Skeleton className="h-20 w-full max-w-lg" />
          <div className="flex gap-4">
            <Skeleton className="h-14 w-48 rounded-2xl" />
            <Skeleton className="h-14 w-48 rounded-2xl" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-[400px] w-full rounded-[40px]" />
        </div>
      </div>
      <div className="px-4">
        <div className="flex justify-between mb-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
