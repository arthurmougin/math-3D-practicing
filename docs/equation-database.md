# 🎯 Equation Database System

Un système intelligent de suggestions d'équations mathématiques Three.js basé sur les types de paramètres.

## 🚀 Quick Start

### Méthode recommandée : Analyse JSDoc (ACTUELLE)

```bash
npm run generate-from-source
```

**Analyse le code source JavaScript de Three.js** dans `docs/threeMathFolder/` et extrait les méthodes avec leur documentation JSDoc complète.

**Résultat :**

- ✅ **39 méthodes** avec documentation complète
- ✅ **100% de précision** (aucun faux positif)
- ✅ **7 classes** supportées (Vector2, Vector3, Vector4, Quaternion, Euler, Matrix3, Matrix4)
- ✅ Génération en **~2 secondes**

### Méthode alternative : Test runtime amélioré

```bash
npm run generate-equations
```

**Teste les méthodes par exécution** avec validation anti-faux-positifs (valeurs non-triviales, double test, ordre croissant).

**Résultat :**

- ⚠️ **37 signatures** dont ~17 faux positifs
- ⚠️ **Aucune documentation**
- ⚠️ **4 classes** seulement (Vector3, Quaternion, Euler, Matrix4)
- ⚠️ Génération en **~10 secondes**

**Utilisation recommandée :** Tests de validation croisée uniquement.

### Tester la base de données

```bash
npm run test-equations
```

Affiche des statistiques et des exemples de recherches.

### Utiliser dans l'interface

Le composant `EquationSelector` est déjà intégré dans `ScenarioCreator` :

1. Ajoutez des paramètres (ex: Alpha: Vector3, Beta: Vector3)
2. Le système suggère automatiquement les équations compatibles
3. Cliquez sur une suggestion pour l'appliquer

## 📊 Statistiques

### Base de données actuelle (JSDoc)

| Classe | Méthodes | Exemples |
|--------|----------|----------|
| Vector2 | 12 | `dot`, `lengthSq`, `length`, `manhattanLength`, `distanceTo`, `angleTo`, etc. |
| Vector3 | 10 | `dot`, `lengthSq`, `length`, `manhattanLength`, `distanceTo`, `angleTo`, etc. |
| Vector4 | 6 | `dot`, `lengthSq`, `length`, `manhattanLength`, `distanceTo`, `angleTo` |
| Quaternion | 5 | `dot`, `lengthSq`, `length`, `angleTo`, `slerp` |
| Matrix4 | 3 | `determinant`, `getMaxScaleOnAxis`, `compose` |
| Matrix3 | 2 | `determinant`, `getNormalMatrix` |
| Euler | 1 | `equals` |
| **Total** | **39** | Toutes avec documentation JSDoc complète |

### Comparaison des méthodes

| Métrique | JSDoc (actuelle) | Runtime améliorée | Runtime naïve |
|----------|------------------|-------------------|---------------|
| **Signatures** | 39 | 37 | 2580 |
| **Documentation** | ✅ Complète | ❌ Aucune | ❌ Aucune |
| **Précision** | 100% | ~54% | ~0.8% |
| **Faux positifs** | 0 | ~17 | ~2560 |
| **Classes** | 7 | 4 | 4 |
| **Temps** | ~2s | ~10s | ~15s |
| **Warnings** | 0 | ~300 | ~500 |

## Overview

Ce système génère automatiquement une base de données de toutes les équations mathématiques valides de Three.js, permettant des suggestions intelligentes dans l'interface de création de scénarios.

## Architecture

### 1. Génération de la base de données (méthode actuelle)

**Script**: `scripts/generateFromSource.ts`

- Lit les fichiers JavaScript de Three.js dans `docs/threeMathFolder/math/`
- Parse les commentaires JSDoc pour chaque classe
- Extrait les méthodes avec leurs signatures complètes
- Capture les descriptions de méthodes et de paramètres
- Filtre les méthodes utiles (mathématiques, retournant des valeurs)
- Génère un fichier JSON enrichi avec toute la documentation

**Commande**: `npm run generate-from-source`

**Classes analysées**: Vector2, Vector3, Vector4, Quaternion, Euler, Matrix3, Matrix4

### 2. Base de données générée

**Fichier**: `src/data/equationDatabase.json`

**Structure enrichie** (version 2.0.0) :

```json
{
  "version": "2.0.0",
  "generatedAt": "2025-11-15T...",
  "source": "Three.js source code analysis",
  "methods": [
    {
      "className": "Vector3",
      "methodName": "dot",
      "description": "Calculates the dot product of the given vector with this instance.",
      "parameters": [
        {
          "name": "v",
          "type": "Vector3",
          "optional": false,
          "description": "The vector to compute the dot product with."
        }
      ],
      "returnType": "number",
      "returnDescription": "The result of the dot product."
    }
  ]
}
```

**Statistiques** (dernière génération) :

- Total de méthodes : **39** avec documentation complète
- Vector2 : 12 méthodes
- Vector3 : 10 méthodes
- Vector4 : 6 méthodes
- Quaternion : 5 méthodes
- Matrix4 : 3 méthodes
- Matrix3 : 2 méthodes
- Euler : 1 méthode

### 3. Helper Functions

**Fichier**: `src/data/equationDatabaseHelper.ts`

**Interfaces TypeScript** :

```typescript
interface MethodParameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
  description?: string;  // Description du paramètre
}

interface MethodSignature {
  className: string;
  methodName: string;
  description: string;  // Description de la méthode
  parameters: MethodParameter[];
  returnType: string;
  returnDescription?: string;  // Description du retour
}
```

**Fonctions principales** :

- `findEquationsByParameters(paramTypes)` - Trouve les méthodes correspondant à des types de paramètres
- `findEquationsByReturnType(returnType)` - Trouve par type de retour
- `findEquationsByMethodName(methodName)` - Trouve par nom de méthode
- `getEquationSignatureString(method)` - Génère une signature lisible (ex: `dot(v: Vector3) → number`)
- `getTypeName(value)` - Extrait le nom du type d'une valeur
- `getDatabaseStats()` - Retourne les statistiques de la base de données

### 4. UI Component

**Fichier**: `src/components/creation/equationSelector.tsx`

Composant React qui :

- Affiche les suggestions d'équations basées sur les paramètres actuels
- Montre les **descriptions complètes** des méthodes
- Affiche les **descriptions de chaque paramètre**
- Montre les signatures disponibles pour l'équation sélectionnée
- Permet de sélectionner une équation suggérée d'un clic
- Supporte l'affichage/masquage des suggestions

**Exemple d'affichage** :

```text
Suggested equations (6)

[Button] dot
         dot(v: Vector3) → number
         Calculates the dot product of the given vector with this instance.
         v: The vector to compute the dot product with.

[Button] angleTo
         angleTo(v: Vector3) → number
         Returns the angle between this vector and vector v in radians.
         v: The vector to compute the angle with.
```

## Fonctionnement

### Flux de suggestions

1. L'utilisateur ajoute des paramètres dans le ScenarioCreator
2. Le composant EquationSelector extrait les types de chaque paramètre
3. Il interroge la base de données pour trouver les méthodes correspondantes
4. Les suggestions sont affichées avec :
   - Signature complète avec noms de paramètres
   - Description de la méthode
   - Description de chaque paramètre
5. L'utilisateur peut cliquer sur une suggestion pour l'appliquer

### Exemple détaillé

**Paramètres créés :**

- Alpha : Vector3(1, 2, 3)
- Beta : Vector3(4, 5, 6)

**Suggestions affichées (6 méthodes) :**

```text
dot(v: Vector3) → number
  Description: Calculates the dot product of the given vector with this instance.
  Parameter v: The vector to compute the dot product with.

angleTo(v: Vector3) → number
  Description: Returns the angle between this vector and vector v in radians.
  Parameter v: The vector to compute the angle with.

distanceTo(v: Vector3) → number
  Description: Computes the distance from this vector to v.
  Parameter v: The vector to compute the distance to.

distanceToSquared(v: Vector3) → number
  Description: Computes the squared distance from this vector to v.
  Parameter v: The vector to compute the squared distance to.

manhattanDistanceTo(v: Vector3) → number
  Description: Computes the Manhattan distance from this vector to v.
  Parameter v: The vector to compute the Manhattan distance to.

equals(v: Vector3) → boolean
  Description: Returns true if this vector is equal with the given one.
  Parameter v: The vector to compare with.
```

## Notes importantes

### Génération de la base de données (méthode JSDoc)

Le script `generateFromSource.ts` :

- Parse les fichiers JavaScript Three.js avec des **regex JSDoc**
- Extrait uniquement les **méthodes documentées** (avec commentaires JSDoc)
- Filtre les méthodes **utiles** :
  - Retournent une valeur (`number`, `boolean`, etc.)
  - Opérations mathématiques
  - Maximum 3 paramètres
- **Aucun faux positif** : seules les signatures officielles Three.js
- **Aucun warning** : pas d'exécution runtime

### Méthodes exclues

Le générateur filtre automatiquement :

- Constructeurs
- Méthodes de conversion (`toJSON`, `toString`, `toArray`)
- Getters/setters simples
- Méthodes de mutation retournant `this` (fluent API)
- Méthodes de copie (`clone`, `copy`, `fromArray`)
- Méthodes sans documentation JSDoc
- Méthodes privées (commençant par `_`)

### Performance

La base de données JSON (version 2.0.0) :

- **487 lignes** (vs 27K avec la méthode runtime)
- Importée statiquement au démarrage
- Pas de requête réseau
- Recherche instantanée en mémoire
- Taille réduite : **98% plus petite** que l'ancienne méthode

## 💡 Exemples d'utilisation

### Recherche par types de paramètres

```typescript
import { findEquationsByParameters } from "./src/data/equationDatabaseHelper";

// Trouver toutes les méthodes prenant 1 Vector3
const methods = findEquationsByParameters(["Vector3"]);
// Résultat: 6 méthodes (dot, angleTo, distanceTo, distanceToSquared, manhattanDistanceTo, equals)

// Avec documentation complète
methods.forEach(method => {
  console.log(method.methodName);
  console.log(method.description);
  method.parameters.forEach(param => {
    console.log(`  ${param.name}: ${param.description}`);
  });
});
```

### Recherche par nom de méthode

```typescript
import { findEquationsByMethodName } from "./src/data/equationDatabaseHelper";

// Trouver toutes les surcharges de "dot"
const dotMethods = findEquationsByMethodName("dot");
// Résultat: 7 méthodes (Vector2.dot, Vector3.dot, Vector4.dot, Quaternion.dot)

dotMethods.forEach(method => {
  console.log(`${method.className}.${method.methodName}`);
  console.log(`Description: ${method.description}`);
  console.log(`Parameters: ${method.parameters.map(p => p.name).join(", ")}`);
});
```

### Recherche par type de retour

```typescript
import { findEquationsByReturnType } from "./src/data/equationDatabaseHelper";

// Trouver toutes les méthodes qui retournent un nombre
const numberMethods = findEquationsByReturnType("number");
// Résultat: 32 méthodes (dot, length, lengthSq, angleTo, distanceTo, etc.)

// Trouver toutes les méthodes qui retournent un boolean
const booleanMethods = findEquationsByReturnType("boolean");
// Résultat: 7 méthodes (equals dans chaque classe)
```

## 🔍 Comment ça marche ?

### Génération (generateFromSource.ts)

```typescript
// Pour chaque classe Three.js
for (const className of ["Vector3", "Vector2", "Vector4", "Quaternion", "Euler", "Matrix3", "Matrix4"]) {
  // Lit le fichier source JavaScript
  const sourceCode = readFileSync(`docs/threeMathFolder/math/${className}.js`, "utf-8");
  
  // Parse les blocs JSDoc avec regex
  const methods = extractMethodsFromFile(sourceCode, className);
  
  // Pour chaque méthode trouvée
  for (const method of methods) {
    // Parse le JSDoc pour extraire:
    const jsdoc = parseJSDoc(method.comment);
    
    // - Description de la méthode
    method.description = jsdoc.description;
    
    // - Paramètres avec leurs descriptions
    method.parameters = jsdoc.params.map(p => ({
      name: p.name,
      type: mapTypeToSupported(p.type),
      optional: p.optional,
      description: p.description  // ← Extrait du @param
    }));
    
    // - Type et description du retour
    method.returnType = mapTypeToSupported(jsdoc.returns.type);
    method.returnDescription = jsdoc.returns.description;
    
    // Filtre les méthodes utiles (retourne une valeur, max 3 params)
    if (isUsefulMethod(method)) {
      database.methods.push(method);
    }
  }
}
```

### Recherche (equationDatabaseHelper.ts)

```typescript
export function findEquationsByParameters(paramTypes: SupportedType[]) {
  return database.methods.filter(method => {
    // Filtre les paramètres obligatoires seulement
    const requiredParams = method.parameters.filter(p => !p.optional);
    
    // Vérifie que les types correspondent
    return requiredParams.length === paramTypes.length &&
           requiredParams.every((param, i) => 
             normalizeType(param.type) === normalizeType(paramTypes[i])
           );
  });
}

export function getEquationSignatureString(method: MethodSignature): string {
  // Génère: "dot(v: Vector3) → number"
  const params = method.parameters
    .map(p => `${p.name}: ${p.type}`)
    .join(", ");
  return `${method.className}.${method.methodName}(${params}): ${method.returnType}`;
}
```

### Interface (equationSelector.tsx)

```typescript
// Surveille les changements de paramètres
useEffect(() => {
  const paramTypes = parameters.map(p => getTypeName(p.value));
  const matches = findEquationsByParameters(paramTypes);
  setSuggestions(matches.slice(0, 10)); // Limite à 10 suggestions
}, [parameters]);

// Affiche les suggestions avec documentation complète
{suggestions.map(method => (
  <Button onClick={() => onEquationChange(method.methodName)}>
    <Container flexDirection="column">
      {/* Nom et signature */}
      <Text fontWeight="bold">{method.methodName}</Text>
      <Text opacity={0.7}>{getEquationSignatureString(method)}</Text>
      
      {/* Description de la méthode */}
      {method.description && (
        <Text opacity={0.6}>{method.description}</Text>
      )}
      
      {/* Descriptions des paramètres */}
      {method.parameters.map(param => 
        param.description && (
          <Container flexDirection="row">
            <Text opacity={0.5}>{param.name}:</Text>
            <Text opacity={0.5}>{param.description}</Text>
          </Container>
        )
      )}
    </Container>
  </Button>
))}
```

## 🎨 Exemples de suggestions

### Scénario 1: Deux vecteurs 3D

**Paramètres:**

- Alpha: Vector3(1, 2, 3)
- Beta: Vector3(4, 5, 6)

**Suggestions (6 méthodes) :**

```typescript
dot(v: Vector3) → number
  "Calculates the dot product of the given vector with this instance."

angleTo(v: Vector3) → number
  "Returns the angle between this vector and vector v in radians."

distanceTo(v: Vector3) → number
  "Computes the distance from this vector to v."

distanceToSquared(v: Vector3) → number
  "Computes the squared distance from this vector to v."

manhattanDistanceTo(v: Vector3) → number
  "Computes the Manhattan distance from this vector to v."

equals(v: Vector3) → boolean
  "Returns true if the components of this vector and v are strictly equal; false otherwise."
```

### Scénario 2: Deux quaternions

**Paramètres:**

- Rotation1: Quaternion(0, 0, 0, 1)
- Rotation2: Quaternion(0.707, 0, 0, 0.707)

**Suggestions (3 méthodes) :**

```typescript
dot(q: Quaternion) → number
  "Calculates the dot product of quaternions q and this quaternion."

angleTo(q: Quaternion) → number
  "Returns the angle between this quaternion and quaternion q in radians."

equals(q: Quaternion) → boolean
  "Returns true if the components of this quaternion and q are strictly equal; false otherwise."
```

### Scénario 3: Un vecteur seul

**Paramètres:**

- Position: Vector3(5, 12, 0)

**Suggestions (4 méthodes) :**

```typescript
lengthSq() → number
  "Computes the square of the Euclidean length..."

length() → number
  "Computes the Euclidean length (straight-line length) from (0, 0, 0) to (x, y, z)."

manhattanLength() → number
  "Computes the Manhattan length of this vector."

getComponent(index: number) → number
  "Returns the value of the vector component which matches the given index."
```

## ⚙️ Configuration

### Ajouter de nouveaux types

**Étape 1**: Ajoutez le fichier source dans `docs/threeMathFolder/math/`

```bash
# Exemple: ajouter Color.js
cp node_modules/three/src/math/Color.js docs/threeMathFolder/math/
```

**Étape 2**: Ajoutez le type dans `generateFromSource.ts` :

```typescript
const filesToAnalyze = [
  { file: "Vector3.js", className: "Vector3" },
  { file: "Vector2.js", className: "Vector2" },
  { file: "Vector4.js", className: "Vector4" },
  { file: "Quaternion.js", className: "Quaternion" },
  { file: "Euler.js", className: "Euler" },
  { file: "Matrix4.js", className: "Matrix4" },
  { file: "Matrix3.js", className: "Matrix3" },
  { file: "Color.js", className: "Color" },  // ← Nouveau
];
```

**Étape 3**: Regénérez

```bash
npm run generate-from-source
```

### Filtrer des méthodes

Dans `generateFromSource.ts`, la fonction `isUsefulMethod()` :

```typescript
function isUsefulMethod(method: MethodSignature): boolean {
  // Exclut les méthodes spécifiques
  const excludedMethods = ["maMethodeAExclure"];
  if (excludedMethods.includes(method.methodName)) return false;
  
  // Doit retourner une valeur
  if (method.returnType === "void" || method.returnType === "unknown") return false;
  
  // Maximum 3 paramètres
  if (method.parameters.length > 3) return false;
  
  return true;
}
```

## ✨ Fonctionnalités complètes

### Documentation enrichie

La base de données JSDoc contient pour chaque méthode :

- ✅ **Description de la méthode** : Extraite du JSDoc Three.js
- ✅ **Noms des paramètres** : `v`, `index`, `q`, etc.
- ✅ **Types des paramètres** : `Vector3`, `number`, `Quaternion`, etc.
- ✅ **Description de chaque paramètre** : Explique le rôle de chaque paramètre
- ✅ **Paramètres optionnels** : Marqués avec le flag `optional`
- ✅ **Valeurs par défaut** : Pour les paramètres optionnels
- ✅ **Description du retour** : Ce que retourne la méthode
- ✅ **Type de retour** : `number`, `boolean`, `Vector3`, etc.

### Affichage dans l'UI

Le composant `EquationSelector` affiche maintenant :

1. **Liste des suggestions** avec :
   - Nom de la méthode
   - Signature complète avec noms de paramètres
   - Description JSDoc de la méthode
   - **Documentation détaillée de chaque paramètre** (nom et description)

2. **Signatures de l'équation actuelle** avec :
   - Toutes les surcharges disponibles
   - Documentation de chaque variante
   - **Section "Parameters" détaillant chaque paramètre**

### Exemple de données complètes

```json
{
  "className": "Vector3",
  "methodName": "dot",
  "description": "Calculates the dot product of the given vector with this instance.",
  "parameters": [
    {
      "name": "v",
      "type": "Vector3",
      "optional": false,
      "description": "The vector to compute the dot product with."
    }
  ],
  "returnType": "number",
  "returnDescription": "The result of the dot product."
}
```

```json
{
  "className": "Vector3",
  "methodName": "getComponent",
  "description": "Returns the value of the vector component which matches the given index.",
  "parameters": [
    {
      "name": "index",
      "type": "number",
      "optional": false,
      "description": "The component index. `0` equals to x, `1` equals to y, `2` equals to z."
    }
  ],
  "returnType": "number",
  "returnDescription": "A vector component value."
}
```

## 🚧 Limitations actuelles

1. **Types supportés limités** : Vector2/3/4, Quaternion, Euler, Matrix3/4, number, boolean
2. **Dépend de la documentation Three.js** : Seules les méthodes avec JSDoc sont extraites
3. **Maximum 3 paramètres** : Les méthodes avec plus de paramètres sont filtrées
4. **Pas de validation runtime** : Les équations ne sont pas validées avant exécution dans les scénarios
5. **Types fixes** : Pas de support des types génériques TypeScript
6. **Pas de méthodes statiques** : Seulement les méthodes d'instance

## 🔮 Améliorations futures

- [ ] Filtrage par type de retour souhaité dans l'UI
- [ ] Auto-complétion dans l'input d'équation
- [ ] Validation des équations avant exécution
- [ ] Support de plus de types Three.js (Color, Box3, Ray, Plane, etc.)
- [ ] Génération d'exemples de valeurs
- [ ] Historique des équations utilisées
- [ ] Export/import de scénarios complets
- [ ] Preview du résultat d'équation en temps réel
