export function ChatSection() {
  return (
    <section className="py-8 px-4 bg-coral-50 md:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <i className="ti ti-message text-xl text-coral-600" />
          </div>
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-1">
              Discute directement avec les vendeurs
            </h3>
            <p className="text-sm text-gray-600">
              Pose tes questions, négocie, et organise la livraison en temps réel via notre messagerie intégrée
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
