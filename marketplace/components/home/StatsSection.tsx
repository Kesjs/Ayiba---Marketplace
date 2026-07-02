interface StatsSectionProps {
  sellersCount: number;
}

export function StatsSection({ sellersCount }: StatsSectionProps) {
  return (
    <section className="py-12 px-4 md:px-8 lg:px-12 lg:py-16">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
          <div className="bg-gray-50 rounded p-5 text-center lg:p-8">
            <i className="ti ti-building-store text-lg text-coral-600 mb-1.5 block lg:text-xl" />
            <p className="text-2xl font-medium text-gray-900 lg:text-3xl">
              {sellersCount}
            </p>
            <p className="text-xs text-gray-600 mt-1 lg:text-sm">
              Vendeurs actifs
            </p>
            <p className="text-xs text-teal-600 mt-1">
              +12% cette semaine
            </p>
          </div>
          <div className="bg-gray-50 rounded p-5 text-center lg:p-8">
            <i className="ti ti-package text-lg text-coral-600 mb-1.5 block lg:text-xl" />
            <p className="text-2xl font-medium text-gray-900 lg:text-3xl">
              1,247
            </p>
            <p className="text-xs text-gray-600 mt-1 lg:text-sm">
              Commandes livrées
            </p>
            <p className="text-xs text-teal-600 mt-1">
              +15% cette semaine
            </p>
          </div>
          <div className="bg-gray-50 rounded p-5 text-center lg:p-8 md:col-span-1 col-span-2">
            <i className="ti ti-star text-lg text-coral-600 mb-1.5 block lg:text-xl" />
            <p className="text-2xl font-medium text-gray-900 lg:text-3xl">
              4.8/5
            </p>
            <p className="text-xs text-gray-600 mt-1 lg:text-sm">
              Note moyenne
            </p>
            <p className="text-xs text-teal-600 mt-1">
              98% satisfaits
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
