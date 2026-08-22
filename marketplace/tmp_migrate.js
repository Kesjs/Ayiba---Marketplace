const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const newParents = [
  { slug: 'femmes', nom: 'Femmes', icone: 'shirt', active: true, ordre: 1 },
  { slug: 'hommes', nom: 'Hommes', icone: 'shirt', active: true, ordre: 2 },
  { slug: 'enfants-bebes', nom: 'Enfants & Bébés', icone: 'baby', active: true, ordre: 3 },
  { slug: 'maison-deco', nom: 'Maison & Déco', icone: 'home', active: true, ordre: 4 },
  { slug: 'high-tech', nom: 'High-Tech', icone: 'smartphone', active: true, ordre: 5 },
];

const newSubCategories = {
  'femmes': [
    { slug: 'femmes-vetements', nom: 'Vêtements', icone: 'shirt', active: true },
    { slug: 'femmes-chaussures', nom: 'Chaussures Femme', icone: 'tag', active: true },
    { slug: 'femmes-sacs-accessoires', nom: 'Sacs & Accessoires', icone: 'gem', active: true },
    { slug: 'femmes-beaute', nom: 'Beauté & Maquillage', icone: 'sparkles', active: true }
  ],
  'hommes': [
    { slug: 'hommes-vetements', nom: 'Vêtements Homme', icone: 'shirt', active: true },
    { slug: 'hommes-chaussures', nom: 'Chaussures Homme', icone: 'tag', active: true },
    { slug: 'hommes-accessoires', nom: 'Accessoires Homme', icone: 'watch', active: true }
  ],
  'enfants-bebes': [
    { slug: 'enfants-vetements', nom: 'Vêtements Enfant', icone: 'shirt', active: true },
    { slug: 'enfants-chaussures', nom: 'Chaussures Enfant', icone: 'tag', active: true },
    { slug: 'enfants-jouets', nom: 'Jouets & Équipement', icone: 'baby', active: true }
  ],
  'maison-deco': [
    { slug: 'maison-mobilier', nom: 'Mobilier & Rangement', icone: 'sofa', active: true },
    { slug: 'maison-cuisine', nom: 'Cuisine', icone: 'utensils', active: true },
    { slug: 'maison-electromenager', nom: 'Électroménager', icone: 'washing-machine', active: true },
    { slug: 'maison-decor', nom: 'Décoration & Éclairage', icone: 'home', active: true }
  ],
  'high-tech': [
    { slug: 'high-tech-telephones', nom: 'Téléphones & Tablettes', icone: 'smartphone', active: true },
    { slug: 'high-tech-ordinateurs', nom: 'Ordinateurs & Accessoires', icone: 'laptop', active: true },
    { slug: 'high-tech-tv', nom: 'TV, Audio & Vidéo', icone: 'camera', active: true }
  ]
};

const mapping = {
  'mode-vetements-femme': 'femmes-vetements',
  'mode-chaussures': 'femmes-chaussures',
  'mode-sacs-accessoires': 'femmes-sacs-accessoires',
  'beaute-maquillage': 'femmes-beaute',
  'beaute-soins-visage-corps': 'femmes-beaute',
  'beaute-parfums': 'femmes-beaute',
  'beaute-cheveux': 'femmes-beaute',
  'mode-vetements-homme': 'hommes-vetements',
  'mode-vetements-enfant': 'enfants-vetements',
  'bebe-vetements': 'enfants-vetements',
  'bebe-jouets': 'enfants-jouets',
  'bebe-poussettes-sieges': 'enfants-jouets',
  'bebe-soins-hygiene': 'enfants-jouets',
  'mobilier-rangement': 'maison-mobilier',
  'maison-cuisine': 'maison-cuisine',
  'electromenager-nettoyage': 'maison-electromenager',
  'eclairage': 'maison-decor',
  'accessoires-divers': 'maison-decor',
  'electronique-telephones-tablettes': 'high-tech-telephones',
  'electronique-ordinateurs': 'high-tech-ordinateurs',
  'electronique-accessoires': 'high-tech-ordinateurs',
  'electronique-tv-audio': 'high-tech-tv'
};

const oldParentsToDelete = ['mode', 'maison', 'tech', 'beaute', 'bebe', 'electronique'];

async function run() {
  console.log("Fetching old categories...");
  const { data: oldCats, error: oldErr } = await supabase.from('categories').select('*');
  if (oldErr) throw oldErr;
  
  console.log(`Found ${oldCats.length} old categories`);
  
  const oldCatsMap = new Map();
  oldCats.forEach(c => oldCatsMap.set(c.slug, c.id));

  console.log("Renaming old categories to avoid unique constraint violations...");
  for (const c of oldCats) {
     if (c.slug.startsWith('z_old_')) continue;
     await supabase.from('categories').update({ nom: 'Z_OLD_' + c.nom.substring(0, 30) + Math.random().toString(36).substring(7), slug: 'z_old_' + c.slug }).eq('id', c.id);
  }

  // Refetch old cats after rename to get new slugs? No, we mapped by old slug, but wait!
  // If we rename slug to z_old_slug, oldCatsMap will have the old slugs. That's fine because oldCatsMap is in memory!
  // But wait, the DB update changes the slug. So `oldCatsMap` has the original slugs. That's perfect.

  // 1. Create Parents
  console.log("Creating new parents...");
  const newParentsMap = new Map();
  for (const parent of newParents) {
    if (oldCatsMap.has(parent.slug)) {
      console.log(`Parent ${parent.slug} already exists, skipping insertion`);
      newParentsMap.set(parent.slug, oldCatsMap.get(parent.slug));
      continue;
    }
    const { data, error } = await supabase.from('categories').insert([parent]).select().single();
    if (error) {
       console.error("Error creating parent", parent, error);
       throw error;
    }
    newParentsMap.set(parent.slug, data.id);
  }

  // 2. Create SubCategories
  console.log("Creating new subcategories...");
  const newSubCatsMap = new Map();
  for (const [parentSlug, subCats] of Object.entries(newSubCategories)) {
    const parentId = newParentsMap.get(parentSlug);
    for (const sub of subCats) {
      if (oldCatsMap.has(sub.slug)) {
         console.log(`Subcategory ${sub.slug} already exists, skipping insertion`);
         newSubCatsMap.set(sub.slug, oldCatsMap.get(sub.slug));
         continue;
      }
      sub.parent_id = parentId;
      const { data, error } = await supabase.from('categories').insert([sub]).select().single();
      if (error) {
         console.error("Error creating subcat", sub, error);
         throw error;
      }
      newSubCatsMap.set(sub.slug, data.id);
    }
  }
  
  // 3. Remap articles
  console.log("Remapping articles...");
  for (const [oldSlug, newSlug] of Object.entries(mapping)) {
    const oldId = oldCatsMap.get(oldSlug);
    const newId = newSubCatsMap.get(newSlug);
    
    if (oldId && newId) {
      const { data, error, count } = await supabase
        .from('articles')
        .update({ categorie_id: newId })
        .eq('categorie_id', oldId)
        .select('*');
      if (error) {
        console.error(`Error mapping ${oldSlug} -> ${newSlug}`, error);
      } else {
        console.log(`Updated ${data.length} articles from ${oldSlug} to ${newSlug}`);
      }
      
      // Also delete the old category now that it's unused
      await supabase.from('categories').delete().eq('id', oldId);
      console.log(`Deleted old category: ${oldSlug}`);
    }
  }

  // 4. Delete old parents
  console.log("Deleting old parents...");
  for (const pSlug of oldParentsToDelete) {
     const id = oldCatsMap.get(pSlug);
     if (id) {
        await supabase.from('categories').delete().eq('id', id);
        console.log(`Deleted old parent: ${pSlug}`);
     }
  }

  console.log("Done!");
}

run().catch(console.error);
