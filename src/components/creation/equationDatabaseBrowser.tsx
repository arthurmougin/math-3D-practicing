import { Container, Text } from "@react-three/uikit";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Separator,
  colors,
} from "@react-three/uikit-default";
import { Search, X, ChevronDown, ChevronRight, Code, Settings, ArrowLeft, ChevronLeft } from "@react-three/uikit-lucide";
import { useState, useMemo } from "react";
import type { Object3DEventMap } from "three";
import {
  type MethodSignature,
  type SupportedType,
  getDatabaseStats,
} from "../../data/equationDatabaseHelper";
import equationDatabase from "../../data/equationDatabase.source.json";
import { useCameraStore } from "../../stores/cameraStore";

/**
 * Equation Database Browser Component
 * 
 * Composant sidebar compact qui affiche toutes les méthodes mathématiques Three.js
 * disponibles avec leur documentation complète.
 * 
 * @architecture
 * - Sidebar fixe de 320px de large à gauche de l'écran
 * - Panneau glissant: vue liste ↔ vue détail d'une méthode
 * - Transition horizontale fluide entre les deux vues
 * 
 * @features
 * - Recherche par nom de méthode ou description avec bouton clear intégré
 * - Filtres par classe (Vector3, Quaternion, etc.) et type de retour (number, boolean)
 * - Groupement des méthodes par nom (pour gérer les overloads)
 * - Vue détaillée avec documentation JSDoc complète au click
 * - Désactivation automatique de l'OrbitControl pendant l'interaction
 * - Scrollbars visibles et personnalisées
 * 
 * @data
 * Source: equationDatabase.source.json (généré depuis les sources Three.js)
 * Format: version 2.0.0 avec documentation JSDoc complète
 */
export function EquationDatabaseBrowser() {
  // Store pour contrôler l'OrbitControl (désactivé pendant l'interaction avec la sidebar)
  const cameraStore = useCameraStore();
  
  // État de la recherche et des filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<SupportedType | "all">("all");
  const [selectedReturnType, setSelectedReturnType] = useState<string | "all">("all");
  
  // État pour gérer la méthode sélectionnée qui affiche le panneau de détails
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  
  // État pour l'expansion du panneau de filtres
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // État pour le collapse/expand du panneau entier
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  /**
   * Désactive l'OrbitControl quand le pointeur entre dans la sidebar
   * Permet d'éviter que le scroll de la liste fasse tourner la caméra
   * Ignore les événements si l'utilisateur est en train de draguer (buttons !== 0)
   */
  const handlePointerEnter = (event: Object3DEventMap['pointerenter']) => {
    // Ignore if any button is pressed (user is dragging)
    if ((event.nativeEvent as PointerEvent).buttons !== 0) return;
    cameraStore.setEnabled(false);
  };

  /**
   * Réactive l'OrbitControl quand le pointeur sort de la sidebar
   * Restaure le contrôle de la caméra pour l'utilisateur
   */
  const handlePointerLeave = (event: Object3DEventMap['pointerleave']) => {
    // Ignore if any button is pressed (user is dragging)
    if ((event.nativeEvent as PointerEvent).buttons !== 0) return;
    cameraStore.setEnabled(true);
  };

  /**
   * Base de données importée depuis le fichier JSON généré
   * Contient 39 méthodes avec documentation JSDoc complète
   * Classes: Vector2, Vector3, Vector4, Quaternion, Euler, Matrix3, Matrix4
   */
  const database = equationDatabase as {
    version: string;
    generatedAt: string;
    source: string;
    methods: MethodSignature[];
  };

  /**
   * Statistiques globales de la base de données
   * - total: nombre total de méthodes
   * - byClass: répartition par classe (ex: Vector3: 10, Quaternion: 5)
   * - byMethod: répartition par nom de méthode (ex: dot: 4, equals: 7)
   */
  const stats = useMemo(() => getDatabaseStats(), []);

  /**
   * Liste unique des classes disponibles (triée alphabétiquement)
   * Utilisé pour les boutons de filtre
   * Ex: ["Euler", "Matrix3", "Matrix4", "Quaternion", "Vector2", "Vector3", "Vector4"]
   */
  const classes = useMemo(() => {
    const classSet = new Set(database.methods.map(m => m.className));
    return Array.from(classSet).sort();
  }, []);

  /**
   * Liste unique des types de retour disponibles (triée alphabétiquement)
   * Utilisé pour les boutons de filtre
   * Ex: ["boolean", "number"]
   */
  const returnTypes = useMemo(() => {
    const typeSet = new Set(database.methods.map(m => m.returnType));
    return Array.from(typeSet).sort();
  }, []);

  /**
   * Méthodes filtrées selon la recherche et les filtres actifs
   * 
   * Filtres appliqués:
   * 1. Recherche textuelle (nom de méthode ou description)
   * 2. Filtre par classe (Vector3, Quaternion, etc.)
   * 3. Filtre par type de retour (number, boolean)
   * 
   * Recalculé automatiquement quand searchQuery, selectedClass ou selectedReturnType change
   */
  const filteredMethods = useMemo(() => {
    return database.methods.filter((method) => {
      // Search filter - recherche dans le nom et la description
      const matchesSearch = searchQuery === "" || 
        method.methodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        method.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Class filter - filtre par classe si une est sélectionnée
      const matchesClass = selectedClass === "all" || method.className === selectedClass;

      // Return type filter - filtre par type de retour si un est sélectionné
      const matchesReturnType = selectedReturnType === "all" || method.returnType === selectedReturnType;

      return matchesSearch && matchesClass && matchesReturnType;
    });
  }, [searchQuery, selectedClass, selectedReturnType]);

  /**
   * Méthodes groupées par nom de méthode
   * 
   * Permet de gérer les overloads (méthodes avec le même nom mais des signatures différentes)
   * Ex: "dot" peut avoir plusieurs signatures pour Vector2, Vector3, Vector4, Quaternion
   * 
   * Structure: Map<methodName, MethodSignature[]>
   * Converti en tableau [methodName, methods[]] trié alphabétiquement
   */
  const groupedMethods = useMemo(() => {
    const groups = new Map<string, MethodSignature[]>();
    filteredMethods.forEach((method) => {
      const key = method.methodName;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(method);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredMethods]);

  return (
    <>
      {/* Bouton flottant pour rouvrir le panneau quand il est collapsed */}
      {panelCollapsed && (
        <Container
          positionType="absolute"
          positionLeft={8}
          positionTop={8}
          zIndex={1000}
          onClick={() => setPanelCollapsed(false)}
          cursor="pointer"
          padding={8}
          borderRadius={8}
          backgroundColor={colors.card}
          borderWidth={1}
          borderColor={colors.border}
          hover={{ backgroundColor: colors.accent }}
          opacity={1}
        >
          <ChevronRight width={20} height={20} color={colors.primary} />
        </Container>
      )}

      {/* Panneau principal */}
      <Container
        width={320}
        height="100%"
        backgroundColor={colors.card}
        borderRightWidth={1}
        borderColor={colors.border}
        onPointerEnter={handlePointerEnter}   // Désactive OrbitControl au survol
        onPointerLeave={handlePointerLeave}   // Réactive OrbitControl quand on sort
        overflow="hidden"        // Cache le débordement pour la transition
        transformTranslateX={panelCollapsed ? -320 : 0}  // Glisse hors écran quand collapsed
      >
      {/* Container principal qui se translate horizontalement entre liste et détail */}
      <Container
        flexDirection="row"
        width="200%"  // Deux vues côte à côte
        height="100%"
        transformTranslateX={selectedMethod ? -320 : 0}  // Glisse vers la gauche quand une méthode est sélectionnée
      >
        {/* Vue Liste (recherche et méthodes) */}
        <Container
          width={320}
          height="100%"
          flexDirection="column"
          gap={12}
          padding={8}
          flexShrink={0}
        >
          {/* En-tête compact avec icône et titre */}
          <Container flexDirection="row" alignItems="center" gap={8} minHeight={32}>
            <Container
              onClick={() => setPanelCollapsed(!panelCollapsed)}
              cursor="pointer"
              padding={4}
              borderRadius={6}
              hover={{ backgroundColor: colors.accent }}
              flexShrink={0}
            >
              <Code width={20} height={20} color={colors.primary} />
            </Container>
            <Text fontSize={16} fontWeight="bold" lineHeight="100%">
              Equations
            </Text>
          </Container>

      <Separator />

      {/* Barre de recherche compacte avec bouton clear intégré */}
      <Container flexDirection="column" gap={6}>
        <Container positionType="relative" width="100%">
          <Input
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder="Search..."
            width="100%"
            paddingRight={searchQuery ? 36 : undefined}
          />
          {/* Bouton clear visible uniquement si une recherche est active, positionné en absolu à droite */}
          {searchQuery && (
            <Container
              positionType="absolute"
              positionRight={8}
              positionTop={8}
              onClick={() => setSearchQuery("")}
              cursor="pointer"
              padding={4}
              borderRadius={4}
              hover={{ backgroundColor: colors.accent }}
              zIndex={10}
            >
              <X width={14} height={14} color={colors.mutedForeground} />
            </Container>
          )}
        </Container>
      </Container>

      {/* Panneau de filtres collapsible (fermé par défaut) */}
      <Card>
        <CardHeader
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          cursor="pointer"
          padding={8}
          paddingX={12}
        >
          <Container flexDirection="row" alignItems="center" justifyContent="space-between" width="100%">
            <Container flexDirection="row" alignItems="center" gap={6}>
              <Settings width={14} height={14} color={colors.mutedForeground} />
              <Text fontSize={12} fontWeight="medium" lineHeight="100%">
                Filters
              </Text>
            </Container>
            {/* Icône chevron change selon l'état d'expansion */}
            {filtersExpanded ? (
              <ChevronDown width={14} height={14} color={colors.mutedForeground} />
            ) : (
              <ChevronRight width={14} height={14} color={colors.mutedForeground} />
            )}
          </Container>
        </CardHeader>
        
        {/* Contenu des filtres visible uniquement si expanded */}
        {filtersExpanded && (
          <CardContent padding={12} paddingTop={0} flexDirection="column" gap={12}>
            <Container flexDirection="row" gap={12} flexWrap="wrap">
            {/* Filtre par classe (Vector3, Quaternion, etc.) */}
            <Container flexDirection="column" gap={6} flexGrow={1} minWidth={200}>
              <Text fontSize={10} fontWeight="bold" color={colors.mutedForeground} lineHeight="100%">
                CLASS
              </Text>
              <Container flexDirection="row" gap={6} flexWrap="wrap">
                {/* Bouton "All" - affiche toutes les classes */}
                <Button
                  variant={selectedClass === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedClass("all")}
                >
                  <Text fontSize={11}>All ({stats.total})</Text>
                </Button>
                {/* Boutons pour chaque classe avec le nombre de méthodes */}
                {classes.map((className) => (
                  <Button
                    key={className}
                    variant={selectedClass === className ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedClass(className as SupportedType)}
                  >
                    <Text fontSize={11}>
                      {className} ({stats.byClass[className] || 0})
                    </Text>
                  </Button>
                ))}
              </Container>
            </Container>

            {/* Filtre par type de retour (number, boolean) */}
            <Container flexDirection="column" gap={6} flexGrow={1} minWidth={200}>
              <Text fontSize={10} fontWeight="bold" color={colors.mutedForeground} lineHeight="100%">
                RETURN TYPE
              </Text>
              <Container flexDirection="row" gap={6} flexWrap="wrap">
                {/* Bouton "All" - affiche tous les types */}
                <Button
                  variant={selectedReturnType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedReturnType("all")}
                >
                  <Text fontSize={11}>All</Text>
                </Button>
                {/* Boutons pour chaque type de retour */}
                {returnTypes.map((returnType) => (
                  <Button
                    key={returnType}
                    variant={selectedReturnType === returnType ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedReturnType(returnType)}
                  >
                    <Text fontSize={11}>{returnType}</Text>
                  </Button>
                ))}
              </Container>
            </Container>
          </Container>
          </CardContent>
        )}
      </Card>

      <Separator />

      {/* Compteur de résultats */}
      <Text fontSize={11} color={colors.mutedForeground} lineHeight="14px">
        {filteredMethods.length} result{filteredMethods.length !== 1 ? "s" : ""}
      </Text>

      {/* Liste compacte des méthodes avec scroll indépendant */}
      <Container 
        flexDirection="column" 
        gap={4} 
        overflow="scroll"     // Active le scroll sur cette zone uniquement
        flexGrow={1}          // Prend tout l'espace restant
        height={0}            // Nécessaire avec flexGrow pour activer le scroll (doc UIKit)
        paddingRight={12}         // Espace pour la scrollbar
        scrollbarColor="#000000"  // Scrollbar noire
        scrollbarWidth={8}        // Largeur de 8px
        scrollbarBorderRadius={4} // Coins arrondis
        scrollbarZIndex={100}     // Au-dessus des éléments
      >
        {groupedMethods.length === 0 ? (
          // Message affiché si aucune méthode ne correspond aux filtres
          <Container flexDirection="column" alignItems="center" gap={8} paddingY={24}>
            <Search width={32} height={32} color={colors.mutedForeground} />
            <Text fontSize={12} color={colors.mutedForeground} lineHeight="16px" textAlign="center">
              No methods found
            </Text>
          </Container>
        ) : (
          // Liste des méthodes groupées par nom
          groupedMethods.map(([methodName, methods]) => (
            <Container
              key={methodName}
              flexDirection="column"
              gap={2}
              flexShrink={0}        // Empêche l'écrasement visuel des éléments
            >
              {/* Carte compacte de la méthode - cliquable pour afficher les détails */}
              <Container
                backgroundColor={selectedMethod === methodName ? colors.accent : colors.card}
                hover={{ backgroundColor: colors.accent }}
                padding={8}
                borderRadius={6}
                cursor="pointer"
                flexDirection="column"
                gap={4}
                minHeight={48}      // Hauteur minimale pour éviter l'écrasement
                onClick={() => setSelectedMethod(methodName)}
              >
                {/* En-tête: nom de la méthode + badge avec nombre d'overloads (si > 1) */}
                <Container flexDirection="row" justifyContent="space-between" alignItems="center" gap={8}>
                  <Text fontSize={13} fontWeight="medium" lineHeight="100%">
                    {methodName}
                  </Text>
                  {/* Affiche le badge uniquement s'il y a plusieurs surcharges */}
                  {methods.length > 1 && (
                    <Container
                      backgroundColor={colors.secondary}
                      paddingX={4}
                      paddingY={2}
                      borderRadius={4}
                      flexShrink={0}    // Empêche le badge de rétrécir
                    >
                      <Text fontSize={9} fontWeight="medium" color={colors.secondaryForeground} lineHeight="100%">
                        +{methods.length - 1} overload{methods.length > 2 ? "s" : ""}
                      </Text>
                    </Container>
                  )}
                </Container>
                
                {/* Signature abrégée de la première surcharge */}
                <Text fontSize={10} fontFamily="monospace" color={colors.mutedForeground} lineHeight="12px">
                  {methods[0].className}.{methods[0].methodName}(...) → {methods[0].returnType}
                </Text>
              </Container>
            </Container>
          ))
        )}
      </Container>
        </Container>

        {/* Vue Détail (documentation complète de la méthode sélectionnée) */}
        <Container
          width={320}
          height="100%"
          flexDirection="column"
          gap={12}
          padding={8}
          flexShrink={0}
        >
          {/* En-tête avec bouton retour */}
          <Container flexDirection="row" alignItems="center" gap={8} minHeight={32}>
            <Container
              onClick={() => setSelectedMethod(null)}
              cursor="pointer"
              padding={6}
              borderRadius={6}
              hover={{ backgroundColor: colors.accent }}
              flexShrink={0}
            >
              <ArrowLeft width={20} height={20} color={colors.primary} />
            </Container>
            <Text fontSize={16} fontWeight="bold" lineHeight="100%" flexGrow={1}>
              {selectedMethod}
            </Text>
          </Container>

          <Separator />

          {/* Contenu scrollable de la documentation */}
          <Container
            overflow="scroll"
            flexGrow={1}
            height={0}
            flexDirection="column"
            gap={16}
            paddingRight={12}         // Espace pour la scrollbar
            scrollbarColor="#000000"  // Scrollbar noire
            scrollbarWidth={8}        // Largeur de 8px
            scrollbarBorderRadius={4} // Coins arrondis
            scrollbarZIndex={100}     // Au-dessus des éléments
          >
            {/* Affiche toutes les surcharges de la méthode sélectionnée */}
            {selectedMethod && groupedMethods
              .find(([name]) => name === selectedMethod)?.[1]
              .map((method, idx) => (
                <Container key={idx} flexDirection="column" gap={12} flexShrink={0}>
                  {/* Séparateur entre les surcharges (sauf pour la première) */}
                  {idx > 0 && <Separator />}
                  
                  {/* Badge indiquant la classe (Vector3, Quaternion, etc.) */}
                  <Container
                    backgroundColor={colors.primary}
                    paddingX={10}
                    paddingY={5}
                    borderRadius={6}
                    alignSelf="flex-start"
                  >
                    <Text fontSize={12} fontWeight="bold" color={colors.primaryForeground} lineHeight="100%">
                      {method.className}
                    </Text>
                  </Container>

                  {/* Signature complète de la méthode */}
                  <Container
                    backgroundColor={colors.muted}
                    padding={12}
                    borderRadius={8}
                    flexDirection="column"
                    gap={4}
                  >
                    <Text fontSize={11} fontWeight="bold" color={colors.mutedForeground} lineHeight="100%">
                      SIGNATURE
                    </Text>
                    <Text fontSize={13} fontFamily="monospace" lineHeight="18px">
                      {method.methodName}(
                      {method.parameters.map(p => 
                        `${p.name}: ${p.type}${p.optional ? "?" : ""}`
                      ).join(", ")}
                      ) → {method.returnType}
                    </Text>
                  </Container>

                  {/* Description JSDoc de la méthode */}
                  {method.description && (
                    <Container flexDirection="column" gap={6}>
                      <Text fontSize={11} fontWeight="bold" color={colors.mutedForeground} lineHeight="100%">
                        DESCRIPTION
                      </Text>
                      <Text fontSize={13} lineHeight="18px">{method.description}</Text>
                    </Container>
                  )}

                  {/* Liste des paramètres avec leurs descriptions */}
                  {method.parameters.length > 0 && (
                    <Container flexDirection="column" gap={8}>
                      <Text fontSize={11} fontWeight="bold" color={colors.mutedForeground} lineHeight="100%">
                        PARAMETERS
                      </Text>
                      <Container flexDirection="column" gap={8}>
                        {method.parameters.map((param, pIdx) => (
                          <Container
                            key={pIdx}
                            flexDirection="column"
                            gap={4}
                            backgroundColor={colors.muted}
                            padding={12}
                            borderRadius={6}
                          >
                            {/* Nom et type du paramètre avec bullet point */}
                            <Container flexDirection="row" gap={6} alignItems="center">
                              <Container
                                height={6}
                                width={6}
                                borderRadius={1000}
                                backgroundColor={colors.primary}
                              />
                              <Text fontSize={12} fontFamily="monospace" fontWeight="medium" lineHeight="100%">
                                {param.name}: {param.type}
                                {param.optional && " (optional)"}
                                {param.defaultValue && ` = ${param.defaultValue}`}
                              </Text>
                            </Container>
                            {/* Description JSDoc du paramètre */}
                            {param.description && (
                              <Text fontSize={12} color={colors.mutedForeground} lineHeight="16px" paddingLeft={12}>
                                {param.description}
                              </Text>
                            )}
                          </Container>
                        ))}
                      </Container>
                    </Container>
                  )}

                  {/* Type de retour avec sa description */}
                  {method.returnDescription && (
                    <Container flexDirection="column" gap={6}>
                      <Text fontSize={11} fontWeight="bold" color={colors.mutedForeground} lineHeight="100%">
                        RETURNS
                      </Text>
                      <Container
                        backgroundColor={colors.muted}
                        padding={12}
                        borderRadius={6}
                        flexDirection="row"
                        gap={8}
                        alignItems="center"
                      >
                        {/* Badge avec le type de retour */}
                        <Container
                          backgroundColor={colors.primary}
                          paddingX={8}
                          paddingY={4}
                          borderRadius={4}
                        >
                          <Text fontSize={11} fontFamily="monospace" fontWeight="bold" color={colors.primaryForeground} lineHeight="100%">
                            {method.returnType}
                          </Text>
                        </Container>
                        {/* Description de ce qui est retourné */}
                        <Text fontSize={12} lineHeight="16px">
                          {method.returnDescription}
                        </Text>
                      </Container>
                    </Container>
                  )}

                  {/* Exemple d'utilisation (si disponible dans les données) */}
                  {method.example && (
                    <Container flexDirection="column" gap={6}>
                      <Text fontSize={11} fontWeight="bold" color={colors.mutedForeground} lineHeight="100%">
                        EXAMPLE
                      </Text>
                      <Container
                        backgroundColor={colors.muted}
                        padding={12}
                        borderRadius={6}
                      >
                        <Text fontSize={12} fontFamily="monospace" lineHeight="16px">
                          {method.example}
                        </Text>
                      </Container>
                    </Container>
                  )}
                </Container>
              ))}
          </Container>
        </Container>
      </Container>
    </Container>
    </>
  );
}
