# Pipeline de génération de la base de données d'équations

## Vue d'ensemble

Ce document explique le pipeline complet de génération de la base de données d'équations, de l'extraction depuis les sources Three.js jusqu'à l'affichage dans l'interface utilisateur avec des liens Wikipedia enrichis.

## Architecture du pipeline

```
Three.js Sources (docs/ia-only/math/*.js)
    ↓
scripts/generateFromSource.ts
    ↓ (parsing JSDoc)
scripts/technicalTerms.ts
    ↓ (enrichissement Wikipedia)
src/data/equationDatabase.source.json
    ↓ (import)
src/components/creation/EquationDatabaseBrowserHTML.tsx
    ↓ (affichage HTML)
Navigateur (avec liens Wikipedia cliquables)
```

## Composants du pipeline

### 1. Sources Three.js (`docs/ia-only/math/`)

**Fichiers analysés :**
- `Vector2.js`, `Vector3.js`, `Vector4.js`
- `Quaternion.js`, `Euler.js`
- `Matrix3.js`, `Matrix4.js`

**Format :** Code JavaScript avec commentaires JSDoc complets

**Exemple :**
```javascript
/**
 * Calculates the dot product of this vector and v.
 *
 * @param {Vector3} v - The vector to compute the dot product with.
 * @returns {number} The result of the dot product.
 */
dot( v ) {
  return this.x * v.x + this.y * v.y + this.z * v.z;
}
```

### 2. Script de génération (`scripts/generateFromSource.ts`)

**Responsabilités :**
1. Parser les fichiers JavaScript Three.js
2. Extraire les commentaires JSDoc
3. Identifier les méthodes utiles (calculs, transformations)
4. Enrichir les descriptions avec les liens Wikipedia
5. Générer le fichier JSON de sortie

**Fonctions principales :**

#### `parseJSDoc(jsDocComment: string)`
Parse un bloc de commentaire JSDoc et extrait :
- Description de la méthode
- Paramètres (nom, type, optionnel, valeur par défaut, description)
- Valeur de retour (type, description)

#### `extractMethodsFromFile(filePath: string, className: string)`
Extrait toutes les méthodes d'un fichier avec leur documentation.

**Filtres appliqués :**
- ❌ Skip `constructor`, méthodes privées (`_prefix`)
- ❌ Skip méthodes de copie (`copy`, `clone`, `toJSON`, `fromJSON`)
- ❌ Skip méthodes retournant `this` (API fluent)
- ✅ Garde les méthodes retournant des types supportés
- ✅ Garde max 3 paramètres requis

#### `isUsefulMethod(method: EquationSignature)`
Détermine si une méthode est utile pour la base d'équations.

**Critères :**
- Retourne un type supporté (`number`, `boolean`, `Vector3`, etc.)
- Tous les paramètres sont de types supportés
- Maximum 3 paramètres requis
- Nom suggérant une opération mathématique

**Patterns reconnus :**
```regex
/^(add|sub|multiply|divide|scale|dot|cross|distance|angle|length|
   normalize|clamp|lerp|min|max|abs|ceil|floor|round|apply|
   transform|project|rotate)/i

/^(get|compute|calculate|is|equals|contains|intersect)/i
```

### 3. Dictionnaire de termes techniques (`scripts/technicalTerms.ts`)

**Structure :**
```typescript
export const TECHNICAL_TERMS: TechnicalTermDictionary = {
  "dot product": {
    en: "https://en.wikipedia.org/wiki/Dot_product",
    fr: "https://fr.wikipedia.org/wiki/Produit_scalaire"
  },
  // ... 30+ termes
};
```

**Termes couverts (30+) :**

| Catégorie | Termes |
|-----------|---------|
| **Opérations vectorielles** | dot product, cross product, scalar product |
| **Distance & longueur** | euclidean, euclidean distance, manhattan distance, magnitude |
| **Normalisation** | normalize, unit vector |
| **Rotations** | quaternion, euler angles, gimbal lock |
| **Matrices** | matrix, transpose, determinant, inverse, identity matrix |
| **Interpolation** | lerp, linear interpolation, slerp, spherical linear interpolation |
| **Projection** | projection, orthogonal projection |
| **Géométrie** | reflection, normal, tangent, plane |
| **Systèmes de coordonnées** | cartesian, cylindrical, spherical |
| **Autres** | clamp, homogeneous coordinates |

#### `enrichDescriptionWithLinks(description: string, locale: "en" | "fr")`

**Algorithme :**
1. Trie les termes par longueur (plus long d'abord) pour éviter les correspondances partielles
2. Pour chaque terme :
   - Créer une regex avec limites de mots (`\b terme \b`)
   - Insensible à la casse
   - Remplacer par un lien HTML `<a>`
3. Retourne la description enrichie en HTML

**Exemple :**
```typescript
enrichDescriptionWithLinks("Calculates the dot product", "en")
// → 'Calculates the <a href="https://en.wikipedia.org/wiki/Dot_product" 
//    target="_blank" rel="noopener noreferrer" class="wiki-link">dot product</a>'
```

**Sécurité :**
- `target="_blank"` : Ouvre dans un nouvel onglet
- `rel="noopener noreferrer"` : Prévient les failles de sécurité
- `class="wiki-link"` : Permet le styling CSS

#### `getTermUsageStats(descriptions: string[])`

Analyse les descriptions et compte l'occurrence de chaque terme technique.
Utilisé pour afficher des statistiques après génération.

### 4. Base de données générée (`src/data/equationDatabase.source.json`)

**Format :**
```json
{
  "version": "2.0.0",
  "generatedAt": "2025-11-19T22:01:37.219Z",
  "source": "Three.js source code analysis",
  "methods": [
    {
      "className": "Vector3",
      "methodName": "dot",
      "description": "Calculates the <a href=\"...\">dot product</a> of...",
      "parameters": [
        {
          "name": "v",
          "type": "Vector3",
          "optional": false,
          "description": "The vector to compute the <a href=\"...\">dot product</a> with."
        }
      ],
      "returnType": "number",
      "returnDescription": "The result of the <a href=\"...\">dot product</a>."
    }
  ]
}
```

**Statistiques (version actuelle) :**
- **39 méthodes** utiles extraites
- **7 termes techniques** avec liens Wikipedia
- **57 occurrences** de liens au total
- **7 classes** Three.js couvertes

**Répartition par classe :**
| Classe | Méthodes |
|--------|----------|
| Vector2 | 12 |
| Vector3 | 10 |
| Vector4 | 6 |
| Quaternion | 5 |
| Matrix4 | 3 |
| Matrix3 | 2 |
| Euler | 1 |

### 5. Interface utilisateur (`EquationDatabaseBrowserHTML.tsx`)

**Rendu des descriptions enrichies :**

```tsx
// Description principale
<p dangerouslySetInnerHTML={{ __html: selectedMethodDetails.description }} />

// Descriptions des paramètres
{param.description && (
  <p dangerouslySetInnerHTML={{ __html: param.description }} />
)}

// Description de la valeur de retour
<span dangerouslySetInnerHTML={{ __html: selectedMethodDetails.returnDescription }} />
```

**⚠️ Note de sécurité :** `dangerouslySetInnerHTML` est utilisé de manière sécurisée car :
- Le HTML provient d'un fichier JSON généré statiquement (pas d'input utilisateur)
- Les URLs sont contrôlées (dictionnaire fermé)
- Génération au build-time, pas au runtime

### 6. Styling CSS (`EquationDatabaseBrowserHTML.css`)

```css
.equation-browser__detail-section .wiki-link {
  color: hsl(222 47% 41%);           /* Bleu */
  text-decoration: none;
  border-bottom: 1px dotted hsl(222 47% 41%);
  transition: all 0.2s;
  font-weight: 500;
}

.equation-browser__detail-section .wiki-link:hover {
  color: hsl(222 47% 31%);           /* Bleu plus foncé */
  border-bottom-style: solid;        /* Bordure solide */
  background: hsl(222 47% 97%);      /* Fond légèrement bleuté */
  padding: 0 2px;
  border-radius: 2px;
}
```

**Design choices :**
- Bordure pointillée pour distinguer des liens standards
- Pas de soulignement traditionnel (plus moderne)
- Hover state avec background subtil
- Transition douce pour une meilleure UX

## Utilisation

### Régénérer la base de données

```bash
npm run generate-from-source
```

**Ce que fait cette commande :**
1. ✅ Parse tous les fichiers Three.js dans `docs/ia-only/math/`
2. ✅ Extrait les JSDoc et méthodes utiles
3. ✅ Enrichit avec les liens Wikipedia (en anglais)
4. ✅ Génère `equationDatabase.source.json`
5. ✅ Affiche les statistiques dans la console

**Output console :**
```
🔍 Analyzing Three.js source code...

📊 Analyzing Vector3...
   Found 11 methods, 10 useful

✅ Enhanced database generated successfully!
   Total useful methods: 39

🔗 Wikipedia links added for 7 technical terms:
   "dot product": 12 occurrences
   "euclidean": 10 occurrences
   ...
```

### Ajouter de nouveaux termes techniques

1. **Éditer `scripts/technicalTerms.ts` :**

```typescript
export const TECHNICAL_TERMS: TechnicalTermDictionary = {
  // ... termes existants
  
  "nouveau terme": {
    en: "https://en.wikipedia.org/wiki/Article_Name",
    fr: "https://fr.wikipedia.org/wiki/Nom_Article"
  },
};
```

2. **Régénérer la base :**
```bash
npm run generate-from-source
```

3. **Vérifier les statistiques** dans la console

**Bonnes pratiques :**
- ✅ Termes en minuscules
- ✅ URLs Wikipedia complètes
- ✅ Support bilingue (en + fr)
- ✅ Termes complets (pas d'abréviations)
- ⚠️ Vérifier que le terme n'existe pas déjà

### Changer la langue des liens

Actuellement, les liens sont en **anglais** par défaut.

**Pour passer en français :**

```typescript
// Dans scripts/generateFromSource.ts, ligne ~150
description: enrichDescriptionWithLinks(parsed.description, "fr"), // ← Changer "en" en "fr"
```

**Futur (TODO) :** Détecter automatiquement la langue du navigateur et adapter les liens dynamiquement.

## Tests et validation

### Vérifier la génération

Après avoir exécuté `npm run generate-from-source`, vérifier :

1. **Aucune erreur TypeScript :**
```bash
npm run lint
```

2. **Le fichier existe :**
```bash
ls src/data/equationDatabase.source.json
```

3. **Les liens sont bien formés :**
```bash
# Chercher les balises <a> dans le JSON
Select-String -Path "src/data/equationDatabase.source.json" -Pattern '<a href=' | Measure-Object
```

4. **Lancer l'application :**
```bash
npm run dev
```

5. **Vérifier visuellement :**
   - Ouvrir le panneau équations
   - Sélectionner une méthode (ex: `Vector3.dot`)
   - Vérifier que les termes techniques sont cliquables
   - Cliquer sur un lien → doit ouvrir Wikipedia dans un nouvel onglet

### Tests manuels recommandés

| Méthode | Terme attendu | Vérification |
|---------|---------------|--------------|
| `Vector3.dot` | "dot product" | 3 liens (description + param + return) |
| `Vector3.length` | "euclidean" | 1 lien dans description |
| `Vector3.cross` | "cross product" | 2+ liens |
| `Quaternion.slerp` | "slerp" ou "spherical linear interpolation" | 1+ lien |
| `Matrix4.determinant` | "determinant" | 1+ lien |

## Améliorations futures

### Court terme
- [ ] Ajouter plus de termes techniques (actuellement 30+)
- [ ] Support i18n dynamique (détection langue navigateur)
- [ ] Tooltip preview au hover des liens (extrait Wikipedia)

### Moyen terme
- [ ] Générer aussi les exemples de code enrichis
- [ ] Ajouter des liens vers Three.js docs officielles
- [ ] Diagrammes interactifs pour visualiser les opérations

### Long terme
- [ ] IA générative pour enrichir automatiquement les descriptions
- [ ] Graphe de connaissances mathématiques
- [ ] Quiz interactifs basés sur la base de données

## Dépannage

### Problème : Les liens ne s'affichent pas

**Causes possibles :**
1. JSON non régénéré → `npm run generate-from-source`
2. Cache navigateur → Hard refresh (Ctrl+Shift+R)
3. `dangerouslySetInnerHTML` manquant → Vérifier le code TSX

### Problème : Erreurs TypeScript après génération

**Solution :**
```bash
# Vérifier la structure du JSON
cat src/data/equationDatabase.source.json | jq '.methods[0]'

# Régénérer avec logs
npm run generate-from-source 2>&1 | tee generation.log
```

### Problème : Liens incorrects ou cassés

**Vérification :**
1. Tester les URLs dans `technicalTerms.ts` manuellement
2. Vérifier l'encodage des caractères spéciaux (ex: `%27` pour apostrophes)
3. Utiliser des URLs anglaises si version française manquante

**Exemple d'URL cassée :**
```typescript
// ❌ MAUVAIS
"euler angles": {
  fr: "https://fr.wikipedia.org/wiki/Angles d'Euler"  // espace non encodé
}

// ✅ BON
"euler angles": {
  fr: "https://fr.wikipedia.org/wiki/Angles_d%27Euler"  // encodé correctement
}
```

## Maintenance

### Quand régénérer la base ?

**Obligatoire :**
- ✅ Après mise à jour de Three.js
- ✅ Après ajout de nouveaux termes techniques
- ✅ Après modification des fichiers sources dans `docs/ia-only/math/`

**Optionnel :**
- Changement de langue cible (en → fr)
- Amélioration des filtres de méthodes utiles

### Fréquence recommandée

- **Développement :** À chaque modification des sources Three.js
- **Production :** À chaque version majeure de Three.js (ex: 0.181.x → 0.182.x)

## Références

### Code source
- `scripts/generateFromSource.ts` - Script principal de génération
- `scripts/technicalTerms.ts` - Dictionnaire de termes avec URLs
- `src/data/equationDatabase.source.json` - Base de données générée
- `src/components/creation/EquationDatabaseBrowserHTML.tsx` - Affichage UI
- `src/components/creation/EquationDatabaseBrowserHTML.css` - Styles des liens

### Documentation externe
- [Three.js Math Documentation](https://threejs.org/docs/#api/en/math/Vector3)
- [JSDoc Specification](https://jsdoc.app/)
- [Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page)

---

**Dernière mise à jour :** 19 novembre 2025
**Version du pipeline :** 2.0.0
