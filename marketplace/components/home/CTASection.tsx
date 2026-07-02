import { Button } from "@/components/ui/Button";

export function CTASection() {
  return (
    <section className="py-12 px-4 text-center bg-coral-50 md:px-8 lg:px-12 lg:py-20">
      <div className="max-w-2xl mx-auto">
        <h2
          className="text-lg text-coral-900 mb-4 md:text-xl lg:text-2xl"
          style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
        >
          Prêt à vendre, livrer ou commander ?
        </h2>
        <p className="text-sm text-coral-800 mb-6 lg:text-base">
          Rejoins les 500 premiers utilisateurs — Première commande gratuite
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:justify-center">
          <Button
            variant="primary"
            onClick={() => (window.location.href = "/auth/inscription")}
            className="w-full md:w-auto"
          >
            Commander
          </Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/auth/inscription?role=vendeur")}
            className="w-full md:w-auto"
          >
            Vendre
          </Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/auth/inscription?role=livreur")}
            className="w-full md:w-auto"
          >
            Livrer
          </Button>
        </div>
      </div>
    </section>
  );
}
