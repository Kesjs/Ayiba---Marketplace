-- Prevent buyers from creating orders for their own products.
-- The live checkout service creates rows in `commandes` (not `orders`).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'commandes_client_different_vendeur'
  ) THEN
    ALTER TABLE public.commandes
    ADD CONSTRAINT commandes_client_different_vendeur CHECK (client_id IS DISTINCT FROM vendeur_id);
  END IF;
END $$;
