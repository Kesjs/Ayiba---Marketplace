"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { getRedirectPathForRole, isValidRole, type UserRole } from "@/lib/auth-utils";

const supabase = createClient();

export default function ChoixRolePage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roleParam, setRoleParam] = useState("");

  useEffect(() => {
    // Get role from URL parameter for pre-selection
    const searchParams = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    );
    const role = searchParams.get("role") || "";
    setRoleParam(role);
    if (role && isValidRole(role)) setSelectedRole(role);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!selectedRole) {
        throw new Error("Veuillez sélectionner un rôle");
      }

      // DEV MODE: Bypass Supabase auth for testing
      if (process.env.NODE_ENV === "development") {
        // Simulate successful role selection and redirect
        const redirectPath = getRedirectPathForRole(
          isValidRole(selectedRole) ? selectedRole : null
        );
        window.location.href = redirectPath;
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Utilisateur non connecté");
      }

      console.log("User ID:", user.id);
      console.log("User phone:", user.phone);
      console.log("Selected role:", selectedRole);

      // Check if user already exists in database
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("Existing user:", existingUser);

      let dbError;
      if (existingUser) {
        // Update existing user
        const result = await supabase
          .from("users")
          .update({ role: selectedRole })
          .eq("id", user.id);
        dbError = result.error;
      } else {
        // Create new user
        const result = await supabase.from("users").insert({
          id: user.id,
          phone: user.phone || "",
          full_name: "Utilisateur",
          role: selectedRole,
        });
        dbError = result.error;
      }

      if (dbError) {
        console.error("Database error:", dbError);
        throw dbError;
      }

      console.log("Role saved successfully");

      // Redirect based on selected role
      const redirectPath = getRedirectPathForRole(
        isValidRole(selectedRole) ? (selectedRole as UserRole) : null
      );
      console.log("Redirecting to:", redirectPath);
      window.location.href = redirectPath;
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 h-14 bg-white border-b border-gray-100 md:h-16">
        <div className="flex items-center justify-between h-full px-4 md:px-6">
          <a href="/" className="text-lg font-medium text-gray-900">
            Ayiba
          </a>
          <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Annuler
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-xl font-medium text-gray-900 text-center mb-2 md:text-2xl">
            Choisis ton rôle
          </h1>
          <p className="text-sm text-gray-600 text-center mb-8">
            Sélectionne comment tu veux utiliser Ayiba
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setSelectedRole("client")}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedRole === "client"
                  ? "border-coral-400 bg-coral-50"
                  : "border-gray-100 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <i className="ti ti-user text-2xl text-gray-600" />
                <div>
                  <h3 className="text-base font-medium text-gray-900">
                    Client
                  </h3>
                  <p className="text-sm text-gray-600">
                    Achète des produits près de chez toi
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("vendeur")}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedRole === "vendeur"
                  ? "border-coral-400 bg-coral-50"
                  : "border-gray-100 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <i className="ti ti-building-store text-2xl text-gray-600" />
                <div>
                  <h3 className="text-base font-medium text-gray-900">
                    Vendeur
                  </h3>
                  <p className="text-sm text-gray-600">
                    Vends tes produits au quartier
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("livreur")}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedRole === "livreur"
                  ? "border-coral-400 bg-coral-50"
                  : "border-gray-100 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <i className="ti ti-motorbike text-2xl text-gray-600" />
                <div>
                  <h3 className="text-base font-medium text-gray-900">
                    Livreur
                  </h3>
                  <p className="text-sm text-gray-600">
                    Livre des commandes et gagne de l'argent
                  </p>
                </div>
              </div>
            </button>

            {error && (
              <p className="text-sm text-red-800 text-center">{error}</p>
            )}

            <Button
              variant="primary"
              className="w-full bg-coral-400 hover:bg-coral-600"
              disabled={loading}
            >
              {loading ? "Création..." : "Continuer"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
