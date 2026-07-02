"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  ArrowLeft, 
  Upload, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/mock-data";

export default function NouveauArticlePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    prix: "",
    categorie: "",
    stock: "1",
    photos: [] as string[]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = () => {
    // Simulation d'upload
    const randomImg = `https://picsum.photos/seed/${Math.random()}/800/800`;
    setFormData(prev => ({ ...prev, photos: [...prev.photos, randomImg] }));
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulation d'envoi
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => router.push("/vendeur/dashboard"), 2000);
    }, 1500);
  };

  return (
    <DashboardLayout role="vendeur" userName="Aminata" title="Publier un article">
      <div className="max-w-3xl mx-auto">
        
        {/* Header with Back button */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/vendeur/dashboard">
            <Button variant="secondary" className="w-10 h-10 p-0 rounded-full bg-white border border-gray-100 shadow-sm">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Étape {step} sur 2</p>
            <h2 className="text-xl font-bold text-gray-900">{step === 1 ? "Informations de base" : "Photos & Validation"}</h2>
          </div>
        </div>

        {success ? (
          <div className="bg-white p-12 rounded-[40px] border border-teal-100 shadow-xl shadow-teal-500/5 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-500">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Article publié !</h3>
            <p className="text-gray-500 font-medium mb-8">Votre article est maintenant en ligne et visible par les acheteurs du quartier.</p>
            <Link href="/vendeur/dashboard">
              <Button className="w-full h-14 rounded-2xl">Retour au tableau de bord</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {step === 1 ? (
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Nom de l'article</label>
                  <input 
                    type="text" 
                    name="nom"
                    required
                    placeholder="Ex: Tissu Wax 6 yards"
                    value={formData.nom}
                    onChange={handleInputChange}
                    className="w-full h-14 px-5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-500/10 focus:border-coral-500 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Prix (FCFA)</label>
                    <input 
                      type="number" 
                      name="prix"
                      required
                      placeholder="5000"
                      value={formData.prix}
                      onChange={handleInputChange}
                      className="w-full h-14 px-5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-500/10 focus:border-coral-500 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Catégorie</label>
                    <select 
                      name="categorie"
                      required
                      value={formData.categorie}
                      onChange={handleInputChange}
                      className="w-full h-14 px-5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-500/10 focus:border-coral-500 transition-all font-medium"
                    >
                      <option value="">Sélectionner...</option>
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Description</label>
                  <textarea 
                    name="description"
                    required
                    rows={4}
                    placeholder="Décrivez votre article en quelques mots (matière, état, taille...)"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-500/10 focus:border-coral-500 transition-all font-medium resize-none"
                  />
                </div>

                <Button 
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full h-14 rounded-2xl mt-4"
                >
                  Continuer
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                  <h3 className="font-bold text-gray-900">Photos de l'article</h3>
                  <p className="text-sm text-gray-500 font-medium">Ajoutez jusqu'à 5 photos nettes pour mieux vendre.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {formData.photos.map((photo, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group">
                        <img src={photo} alt="Upload" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    
                    {formData.photos.length < 5 && (
                      <button 
                        type="button"
                        onClick={handlePhotoUpload}
                        className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 hover:border-coral-200 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-coral-50 group-hover:text-coral-500 transition-colors">
                          <Upload size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-coral-500">Ajouter</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-500 shrink-0 shadow-xs">
                    <Info size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-800 mb-1">Rappel de sécurité</h4>
                    <p className="text-[12px] text-amber-700/80 leading-relaxed font-medium">Vérifiez bien votre prix. Une fois publié, l'article sera immédiatement disponible à la vente.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="flex-1 h-14 rounded-2xl bg-white border border-gray-200"
                  >
                    Retour
                  </Button>
                  <Button 
                    type="submit"
                    disabled={loading || formData.photos.length === 0}
                    className="flex-[2] h-14 rounded-2xl shadow-xl shadow-coral-500/20"
                  >
                    {loading ? "Publication..." : "Publier maintenant"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
