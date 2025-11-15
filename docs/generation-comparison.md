# 🆚 Comparaison des deux méthodes de génération

## Méthode 1: Analyse du code source (RECOMMANDÉE)

**Script**: `npm run generate-from-source`

### ✅ Avantages

- **Documentation complète**: Extrait les commentaires JSDoc
- **Types précis**: Noms de paramètres et types exacts
- **Descriptions**: Explications de ce que fait chaque méthode
- **Rapide**: Quelques secondes seulement
- **Maintenable**: Suit la structure du code source

### Exemple de sortie

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

**Données complètes extraites :**

- ✅ Description de la méthode
- ✅ Nom de chaque paramètre
- ✅ Type de chaque paramètre
- ✅ **Description de chaque paramètre** (nouveau)
- ✅ Paramètres optionnels
- ✅ Valeurs par défaut
- ✅ Type de retour
- ✅ Description du retour

### Statistiques

- **39 méthodes** extraites
- Toutes avec documentation
- 7 classes supportées (Vector2, Vector3, Vector4, Quaternion, Euler, Matrix3, Matrix4)

---

## Méthode 2: Test runtime (ANCIENNE)

**Script**: `npm run generate-equations`

### ⚠️ Limitations

- **Pas de documentation**: Seulement les signatures
- **Faux positifs**: Méthodes qui acceptent n'importe quel nombre de params
- **Lent**: Doit tester toutes les combinaisons
- **Warnings**: Affiche des warnings Three.js
- **Moins précis**: Types devinent à partir du retour

### Exemple de sortie (ancienne méthode)

```json
{
  "className": "Vector3",
  "methodName": "dot",
  "parameters": ["Vector3"],
  "returnType": "number",
  "isStatic": false
}
```

### Statistiques (ancienne méthode)

- **2580 signatures** générées
- Aucune documentation
- Beaucoup de doublons et faux positifs
- Seulement 4 classes (Vector3, Quaternion, Euler, Matrix4)

---

## 🎯 Quelle méthode utiliser ?

### Utilisez generate-from-source

- ✅ Vous voulez de la documentation
- ✅ Vous voulez des types précis
- ✅ Vous voulez une génération rapide
- ✅ Vous voulez supporter plus de types (Vector2, Matrix3, etc.)

### Utilisez generate-equations

- ⚠️ Vous voulez TOUTES les combinaisons possibles
- ⚠️ Vous ne vous souciez pas de la documentation
- ⚠️ Vous voulez tester le comportement runtime

---

## 🔄 Migration

Si vous utilisez actuellement l'ancienne base de données, voici ce qui change :

### Avant (ancienne structure)

```typescript
interface EquationSignature {
  className: string;
  methodName: string;
  parameters: string[];  // Juste les types
  returnType: string;
  isStatic: boolean;
}
```

### Après (nouvelle structure)

```typescript
interface MethodSignature {
  className: string;
  methodName: string;
  description: string;  // 🆕 Documentation
  parameters: Array<{   // 🆕 Paramètres détaillés
    name: string;
    type: string;
    optional: boolean;
    defaultValue?: string;
    description?: string;  // 🆕 Description du paramètre
  }>;
  returnType: string;
  returnDescription?: string;  // 🆕 Description du retour
}
```

### Code helper mis à jour

Les fonctions `findEquationsByParameters`, `findEquationsByMethodName`, etc. sont déjà mises à jour pour supporter le nouveau format !

### Affichage UI amélioré

Le composant `EquationSelector` affiche maintenant :

**Dans les suggestions :**

```text
[Button] dot
         dot(v: Vector3) → number
         Calculates the dot product of the given vector with this instance.
         v: The vector to compute the dot product with.
```

**Dans les signatures actuelles :**

```text
Available signatures:

Vector3.dot(v: Vector3) → number
Calculates the dot product...

Parameters:
• v: The vector to compute the dot product with.
```
