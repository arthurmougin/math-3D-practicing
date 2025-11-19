/**
 * Dictionary of technical mathematical terms with Wikipedia links
 * 
 * This mapping is used to automatically enrich method descriptions with
 * educational links to Wikipedia articles.
 * 
 * Format: { "term": "wikipedia_url" }
 * - Terms are case-insensitive
 * - Match only full words (not substrings)
 * - Support both English and French terms
 */

export interface TechnicalTermDictionary {
  [term: string]: {
    en: string;
    fr: string;
  };
}

/**
 * Technical terms dictionary with bilingual Wikipedia links
 */
export const TECHNICAL_TERMS: TechnicalTermDictionary = {
  // Basic math concepts
  scalar: {
    en: "https://en.wikipedia.org/wiki/Scalar_(mathematics)",
    fr: "https://fr.wikipedia.org/wiki/Scalaire_(math%C3%A9matiques)",
  },
  component: {
    en: "https://en.wikipedia.org/wiki/Euclidean_vector#Representations",
    fr: "https://fr.wikipedia.org/wiki/Vecteur#Composantes_d'un_vecteur",
  },
  axis: {
    en: "https://en.wikipedia.org/wiki/Cartesian_coordinate_system#Axes",
    fr: "https://fr.wikipedia.org/wiki/Rep%C3%A8re_cart%C3%A9sien#Axes",
  },
  axes: {
    en: "https://en.wikipedia.org/wiki/Cartesian_coordinate_system#Axes",
    fr: "https://fr.wikipedia.org/wiki/Rep%C3%A8re_cart%C3%A9sien#Axes",
  },
  radian: {
    en: "https://en.wikipedia.org/wiki/Radian",
    fr: "https://fr.wikipedia.org/wiki/Radian",
  },
  radians: {
    en: "https://en.wikipedia.org/wiki/Radian",
    fr: "https://fr.wikipedia.org/wiki/Radian",
  },
  degree: {
    en: "https://en.wikipedia.org/wiki/Degree_(angle)",
    fr: "https://fr.wikipedia.org/wiki/Degr%C3%A9_(angle)",
  },
  degrees: {
    en: "https://en.wikipedia.org/wiki/Degree_(angle)",
    fr: "https://fr.wikipedia.org/wiki/Degr%C3%A9_(angle)",
  },

  // Vector/Matrix operations
  "dot product": {
    en: "https://en.wikipedia.org/wiki/Dot_product",
    fr: "https://fr.wikipedia.org/wiki/Produit_scalaire",
  },
  "cross product": {
    en: "https://en.wikipedia.org/wiki/Cross_product",
    fr: "https://fr.wikipedia.org/wiki/Produit_vectoriel",
  },
  "scalar product": {
    en: "https://en.wikipedia.org/wiki/Dot_product",
    fr: "https://fr.wikipedia.org/wiki/Produit_scalaire"
  },
  
  // Distance and length
  "euclidean": {
    en: "https://en.wikipedia.org/wiki/Euclidean_distance",
    fr: "https://fr.wikipedia.org/wiki/Distance_euclidienne"
  },
  "euclidean distance": {
    en: "https://en.wikipedia.org/wiki/Euclidean_distance",
    fr: "https://fr.wikipedia.org/wiki/Distance_euclidienne"
  },
  "manhattan distance": {
    en: "https://en.wikipedia.org/wiki/Taxicab_geometry",
    fr: "https://fr.wikipedia.org/wiki/Distance_de_Manhattan"
  },
  
  // Normalization
  "normalize": {
    en: "https://en.wikipedia.org/wiki/Unit_vector",
    fr: "https://fr.wikipedia.org/wiki/Vecteur_unitaire"
  },
  "unit vector": {
    en: "https://en.wikipedia.org/wiki/Unit_vector",
    fr: "https://fr.wikipedia.org/wiki/Vecteur_unitaire"
  },
  
  // Rotations
  "quaternion": {
    en: "https://en.wikipedia.org/wiki/Quaternion",
    fr: "https://fr.wikipedia.org/wiki/Quaternion"
  },
  "euler angles": {
    en: "https://en.wikipedia.org/wiki/Euler_angles",
    fr: "https://fr.wikipedia.org/wiki/Angles_d%27Euler"
  },
  "gimbal lock": {
    en: "https://en.wikipedia.org/wiki/Gimbal_lock",
    fr: "https://fr.wikipedia.org/wiki/Blocage_de_cardan"
  },
  
  // Matrices
  "matrix": {
    en: "https://en.wikipedia.org/wiki/Matrix_(mathematics)",
    fr: "https://fr.wikipedia.org/wiki/Matrice_(math%C3%A9matiques)"
  },
  "transpose": {
    en: "https://en.wikipedia.org/wiki/Transpose",
    fr: "https://fr.wikipedia.org/wiki/Matrice_transpos%C3%A9e"
  },
  "determinant": {
    en: "https://en.wikipedia.org/wiki/Determinant",
    fr: "https://fr.wikipedia.org/wiki/D%C3%A9terminant_(math%C3%A9matiques)"
  },
  "inverse": {
    en: "https://en.wikipedia.org/wiki/Invertible_matrix",
    fr: "https://fr.wikipedia.org/wiki/Matrice_inversible"
  },
  "identity matrix": {
    en: "https://en.wikipedia.org/wiki/Identity_matrix",
    fr: "https://fr.wikipedia.org/wiki/Matrice_identit%C3%A9"
  },
  
  // Interpolation
  "lerp": {
    en: "https://en.wikipedia.org/wiki/Linear_interpolation",
    fr: "https://fr.wikipedia.org/wiki/Interpolation_lin%C3%A9aire"
  },
  "linear interpolation": {
    en: "https://en.wikipedia.org/wiki/Linear_interpolation",
    fr: "https://fr.wikipedia.org/wiki/Interpolation_lin%C3%A9aire"
  },
  "slerp": {
    en: "https://en.wikipedia.org/wiki/Slerp",
    fr: "https://fr.wikipedia.org/wiki/Slerp"
  },
  "spherical linear interpolation": {
    en: "https://en.wikipedia.org/wiki/Slerp",
    fr: "https://fr.wikipedia.org/wiki/Slerp"
  },
  
  // Projection
  "projection": {
    en: "https://en.wikipedia.org/wiki/Vector_projection",
    fr: "https://fr.wikipedia.org/wiki/Projection_vectorielle"
  },
  "orthogonal projection": {
    en: "https://en.wikipedia.org/wiki/Projection_(linear_algebra)",
    fr: "https://fr.wikipedia.org/wiki/Projection_orthogonale"
  },
  
  // Geometry
  "reflection": {
    en: "https://en.wikipedia.org/wiki/Reflection_(mathematics)",
    fr: "https://fr.wikipedia.org/wiki/R%C3%A9flexion_(math%C3%A9matiques)"
  },
  "normal": {
    en: "https://en.wikipedia.org/wiki/Normal_(geometry)",
    fr: "https://fr.wikipedia.org/wiki/Normale_%C3%A0_une_surface"
  },
  "tangent": {
    en: "https://en.wikipedia.org/wiki/Tangent",
    fr: "https://fr.wikipedia.org/wiki/Tangente"
  },
  "plane": {
    en: "https://en.wikipedia.org/wiki/Plane_(geometry)",
    fr: "https://fr.wikipedia.org/wiki/Plan_(math%C3%A9matiques)"
  },
  
  // Coordinate systems
  "cartesian": {
    en: "https://en.wikipedia.org/wiki/Cartesian_coordinate_system",
    fr: "https://fr.wikipedia.org/wiki/Coordonn%C3%A9es_cart%C3%A9siennes"
  },
  "cylindrical": {
    en: "https://en.wikipedia.org/wiki/Cylindrical_coordinate_system",
    fr: "https://fr.wikipedia.org/wiki/Coordonn%C3%A9es_cylindriques"
  },
  "spherical": {
    en: "https://en.wikipedia.org/wiki/Spherical_coordinate_system",
    fr: "https://fr.wikipedia.org/wiki/Coordonn%C3%A9es_sph%C3%A9riques"
  },
  "rotation": {
    en: "https://en.wikipedia.org/wiki/Rotation_(mathematics)",
    fr: "https://fr.wikipedia.org/wiki/Rotation",
  },
  
  // Other operations
  "clamp": {
    en: "https://en.wikipedia.org/wiki/Clamp_(function)",
    fr: "https://en.wikipedia.org/wiki/Clamp_(function)"
  },
  "power of two": {
    en: "https://en.wikipedia.org/wiki/Power_of_two",
    fr: "https://fr.wikipedia.org/wiki/Puissance_de_deux"
  },
  "integer": {
    en: "https://en.wikipedia.org/wiki/Integer",
    fr: "https://fr.wikipedia.org/wiki/Entier_relatif"
  },
  "magnitude": {
    en: "https://en.wikipedia.org/wiki/Magnitude_(mathematics)",
    fr: "https://fr.wikipedia.org/wiki/Norme_(math%C3%A9matiques)"
  },
  "homogeneous coordinates": {
    en: "https://en.wikipedia.org/wiki/Homogeneous_coordinates",
    fr: "https://fr.wikipedia.org/wiki/Coordonn%C3%A9es_homog%C3%A8nes"
  }
};

/**
 * Enriches a description with Wikipedia links for technical terms
 * 
 * @param description - The raw description text
 * @param locale - Language for Wikipedia links ('en' or 'fr')
 * @returns HTML string with anchor tags for technical terms
 * 
 * @example
 * enrichDescriptionWithLinks("Calculates the dot product", "en")
 * // Returns: 'Calculates the <a href="..." target="_blank">dot product</a>'
 */
export function enrichDescriptionWithLinks(
  description: string,
  locale: "en" | "fr" = "en"
): string {
  if (!description) return description;
  
  let enriched = description;
  
  // Sort terms by length (longest first) to avoid partial matches
  const sortedTerms = Object.keys(TECHNICAL_TERMS).sort(
    (a, b) => b.length - a.length
  );
  
  for (const term of sortedTerms) {
    const urls = TECHNICAL_TERMS[term];
    const url = urls[locale] || urls.en; // Fallback to English if locale not found
    
    // Match whole words only, case-insensitive
    // Use negative lookahead/lookbehind to avoid matching inside HTML tags or URLs
    // This prevents enriching text that's already within <a> tags or href attributes
    const regex = new RegExp(
      `(?<!<[^>]*|href=["'][^"']*)(\\b${term}\\b)(?![^<]*>|[^"']*["'][^>]*>)`,
      "gi"
    );
    
    enriched = enriched.replace(
      regex,
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="wiki-link">$1</a>`
    );
  }
  
  return enriched;
}

/**
 * Get statistics about term usage in descriptions
 * 
 * @param descriptions - Array of description strings
 * @returns Map of term → usage count
 */
export function getTermUsageStats(descriptions: string[]): Map<string, number> {
  const stats = new Map<string, number>();
  
  for (const term of Object.keys(TECHNICAL_TERMS)) {
    const regex = new RegExp(`\\b${term}\\b`, "gi");
    let count = 0;
    
    for (const description of descriptions) {
      const matches = description.match(regex);
      if (matches) {
        count += matches.length;
      }
    }
    
    if (count > 0) {
      stats.set(term, count);
    }
  }
  
  return stats;
}
