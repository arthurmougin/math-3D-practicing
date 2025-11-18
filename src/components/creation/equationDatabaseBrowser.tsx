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
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Code,
  Settings,
  ArrowLeft,
  ChevronLeft,
} from "@react-three/uikit-lucide";
import { useState, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
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
 * Compact sidebar component that displays all available Three.js mathematical methods
 * with their complete documentation.
 *
 * @architecture
 * - Fixed 320px width sidebar on the left side of the screen
 * - Sliding panel: list view ↔ method detail view
 * - Smooth horizontal transition between both views
 *
 * @features
 * - Search by method name or description with integrated clear button
 * - Filters by class (Vector3, Quaternion, etc.) and return type (number, boolean)
 * - Methods grouped by name (to handle overloads)
 * - Detailed view with complete JSDoc documentation on click
 * - Automatic OrbitControl disabling during interaction
 * - Visible and customized scrollbars
 *
 * @data
 * Source: equationDatabase.source.json (generated from Three.js sources)
 * Format: version 2.0.0 with complete JSDoc documentation
 */
export function EquationDatabaseBrowser() {
  // Store to control OrbitControl (disabled during sidebar interaction)
  const cameraStore = useCameraStore();

  // Search and filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<SupportedType | "all">(
    "all"
  );
  const [selectedReturnType, setSelectedReturnType] = useState<string | "all">(
    "all"
  );

  // State to manage the selected method that displays the details panel
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  
  // Temporary state to keep content during close animation
  const [displayedMethod, setDisplayedMethod] = useState<string | null>(null);

  // State for filters panel expansion
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // State for entire panel collapse/expand
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  // States for animated positions
  const [panelPosition, setPanelPosition] = useState(0);
  const [viewPosition, setViewPosition] = useState(0);

  // Animation transitions with useFrame
  useFrame((state, delta) => {
    // Immediate update of displayed content when a method is selected
    // (even before the animation starts)
    if (selectedMethod && displayedMethod !== selectedMethod) {
      setDisplayedMethod(selectedMethod);
    }

    // Panel collapse/expand animation (towards -320 or 0)
    const targetPanelPos = panelCollapsed ? -320 : 0;
    setPanelPosition((prev) => {
      const diff = targetPanelPos - prev;
      if (Math.abs(diff) < 0.5) return targetPanelPos;
      return prev + diff * Math.min(delta * 6, 1);
    });

    // List/documentation transition animation (towards -320 or 0)
    const targetViewPos = selectedMethod ? -320 : 0;
    setViewPosition((prev) => {
      const diff = targetViewPos - prev;
      if (Math.abs(diff) < 0.5) return targetViewPos;
      return prev + diff * Math.min(delta * 6, 1);
    });
  });

  /**
   * Disables OrbitControl when pointer enters the sidebar
   * Prevents list scrolling from rotating the camera
   * Ignores events if user is dragging (buttons !== 0)
   */
  const handlePointerEnter = (event: Object3DEventMap["pointerenter"]) => {
    // Ignore if any button is pressed (user is dragging)
    if ((event.nativeEvent as PointerEvent).buttons !== 0) return;
    cameraStore.setEnabled(false);
  };

  /**
   * Re-enables OrbitControl when pointer leaves the sidebar
   * Restores camera control for the user
   */
  const handlePointerLeave = (event: Object3DEventMap["pointerleave"]) => {
    // Ignore if any button is pressed (user is dragging)
    if ((event.nativeEvent as PointerEvent).buttons !== 0) return;
    cameraStore.setEnabled(true);
  };

  /**
   * Database imported from generated JSON file
   * Contains 39 methods with complete JSDoc documentation
   * Classes: Vector2, Vector3, Vector4, Quaternion, Euler, Matrix3, Matrix4
   */
  const database = equationDatabase as {
    version: string;
    generatedAt: string;
    source: string;
    methods: MethodSignature[];
  };

  /**
   * Global database statistics
   * - total: total number of methods
   * - byClass: distribution by class (e.g., Vector3: 10, Quaternion: 5)
   * - byMethod: distribution by method name (e.g., dot: 4, equals: 7)
   */
  const stats = useMemo(() => getDatabaseStats(), []);

  /**
   * Unique list of available classes (sorted alphabetically)
   * Used for filter buttons
   * E.g., ["Euler", "Matrix3", "Matrix4", "Quaternion", "Vector2", "Vector3", "Vector4"]
   */
  const classes = useMemo(() => {
    const classSet = new Set(database.methods.map((m) => m.className));
    return Array.from(classSet).sort();
  }, []);

  /**
   * Unique list of available return types (sorted alphabetically)
   * Used for filter buttons
   * E.g., ["boolean", "number"]
   */
  const returnTypes = useMemo(() => {
    const typeSet = new Set(database.methods.map((m) => m.returnType));
    return Array.from(typeSet).sort();
  }, []);

  /**
   * Methods filtered according to search and active filters
   *
   * Applied filters:
   * 1. Text search (method name or description)
   * 2. Filter by class (Vector3, Quaternion, etc.)
   * 3. Filter by return type (number, boolean)
   *
   * Automatically recalculated when searchQuery, selectedClass or selectedReturnType changes
   */
  const filteredMethods = useMemo(() => {
    return database.methods.filter((method) => {
      // Search filter - search in name and description
      const matchesSearch =
        searchQuery === "" ||
        method.methodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        method.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Class filter - filter by class if one is selected
      const matchesClass =
        selectedClass === "all" || method.className === selectedClass;

      // Return type filter - filter by return type if one is selected
      const matchesReturnType =
        selectedReturnType === "all" ||
        method.returnType === selectedReturnType;

      return matchesSearch && matchesClass && matchesReturnType;
    });
  }, [searchQuery, selectedClass, selectedReturnType]);

  /**
   * Methods grouped by method name
   *
   * Allows handling overloads (methods with the same name but different signatures)
   * E.g., "dot" can have multiple signatures for Vector2, Vector3, Vector4, Quaternion
   *
   * Structure: Map<methodName, MethodSignature[]>
   * Converted to array [methodName, methods[]] sorted alphabetically
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
    return Array.from(groups.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [filteredMethods]);

  return (
    <>
      {/* Floating button to reopen panel when collapsed */}
      {panelCollapsed && (
        <Container
          positionType="absolute"
          positionLeft={8}
          positionTop={8}
          zIndex={1000}
          onClick={() => setPanelCollapsed(false)}
          cursor="pointer"
          padding={4}
          borderRadius={6}
          backgroundColor={colors.card}
          borderWidth={1}
          borderColor={colors.border}
          hover={{ backgroundColor: colors.accent }}
          opacity={1}
        >
          <ChevronRight width={20} height={20} color={colors.primary} />
        </Container>
      )}

      {/* Main panel */}
      <Container
        width={320}
        height="100%"
        backgroundColor={colors.card}
        borderRightWidth={1}
        borderColor={colors.border}
        onPointerEnter={handlePointerEnter} // Disables OrbitControl on hover
        onPointerLeave={handlePointerLeave} // Re-enables OrbitControl when leaving
        overflow="hidden" // Hides overflow for transition
        positionLeft={panelPosition} // Animated position for collapse/expand
      >
        {/* Main container that translates horizontally between list and detail */}
        <Container
          flexDirection="row"
          width="200%" // Two views side by side
          height="100%"
          positionLeft={viewPosition} // Animated position for list/documentation transition
        >
          {/* List View (search and methods) */}
          <Container
            width={320}
            height="100%"
            flexDirection="column"
            gap={12}
            padding={8}
            flexShrink={0}
          >
            {/* Compact header with icon and title */}
            <Container
              flexDirection="row"
              alignItems="center"
              gap={8}
              minHeight={32}
            >
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

            {/* Compact search bar with integrated clear button */}
            <Container flexDirection="column" gap={6}>
              <Container positionType="relative" width="100%">
                <Input
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  placeholder="Search..."
                  width="100%"
                  paddingRight={searchQuery ? 36 : undefined}
                />
                {/* Clear button visible only if search is active, positioned absolute on the right */}
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

            {/* Collapsible filters panel (closed by default) */}
            <Card>
              <CardHeader
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                cursor="pointer"
                padding={8}
                paddingX={12}
              >
                <Container
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
                  width="100%"
                >
                  <Container flexDirection="row" alignItems="center" gap={6}>
                    <Settings
                      width={14}
                      height={14}
                      color={colors.mutedForeground}
                    />
                    <Text fontSize={12} fontWeight="medium" lineHeight="100%">
                      Filters
                    </Text>
                  </Container>
                  {/* Chevron icon changes based on expansion state */}
                  {filtersExpanded ? (
                    <ChevronDown
                      width={14}
                      height={14}
                      color={colors.mutedForeground}
                    />
                  ) : (
                    <ChevronRight
                      width={14}
                      height={14}
                      color={colors.mutedForeground}
                    />
                  )}
                </Container>
              </CardHeader>

              {/* Filters content visible only if expanded */}
              {filtersExpanded && (
                <CardContent
                  padding={12}
                  paddingTop={0}
                  flexDirection="column"
                  gap={12}
                >
                  <Container flexDirection="row" gap={12} flexWrap="wrap">
                    {/* Filter by class (Vector3, Quaternion, etc.) */}
                    <Container
                      flexDirection="column"
                      gap={6}
                      flexGrow={1}
                      minWidth={200}
                    >
                      <Text
                        fontSize={10}
                        fontWeight="bold"
                        color={colors.mutedForeground}
                        lineHeight="100%"
                      >
                        CLASS
                      </Text>
                      <Container flexDirection="row" gap={6} flexWrap="wrap">
                        {/* "All" button - displays all classes */}
                        <Button
                          variant={
                            selectedClass === "all" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedClass("all")}
                        >
                          <Text fontSize={11}>All ({stats.total})</Text>
                        </Button>
                        {/* Buttons for each class with method count */}
                        {classes.map((className) => (
                          <Button
                            key={className}
                            variant={
                              selectedClass === className
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setSelectedClass(className as SupportedType)
                            }
                          >
                            <Text fontSize={11}>
                              {className} ({stats.byClass[className] || 0})
                            </Text>
                          </Button>
                        ))}
                      </Container>
                    </Container>

                    {/* Filter by return type (number, boolean) */}
                    <Container
                      flexDirection="column"
                      gap={6}
                      flexGrow={1}
                      minWidth={200}
                    >
                      <Text
                        fontSize={10}
                        fontWeight="bold"
                        color={colors.mutedForeground}
                        lineHeight="100%"
                      >
                        RETURN TYPE
                      </Text>
                      <Container flexDirection="row" gap={6} flexWrap="wrap">
                        {/* "All" button - displays all types */}
                        <Button
                          variant={
                            selectedReturnType === "all" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedReturnType("all")}
                        >
                          <Text fontSize={11}>All</Text>
                        </Button>
                        {/* Buttons for each return type */}
                        {returnTypes.map((returnType) => (
                          <Button
                            key={returnType}
                            variant={
                              selectedReturnType === returnType
                                ? "default"
                                : "outline"
                            }
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

            {/* Results counter */}
            <Text
              fontSize={11}
              color={colors.mutedForeground}
              lineHeight="14px"
            >
              {filteredMethods.length} result
              {filteredMethods.length !== 1 ? "s" : ""}
            </Text>

            {/* Compact methods list with independent scroll */}
            <Container
              flexDirection="column"
              gap={4}
              overflow="scroll" // Enables scroll on this area only
              flexGrow={1} // Takes all remaining space
              height={0} // Necessary with flexGrow to enable scroll (UIKit doc)
              paddingRight={12} // Space for scrollbar
              scrollbarColor="#000000" // Black scrollbar
              scrollbarWidth={8} // 8px width
              scrollbarBorderRadius={4} // Rounded corners
              scrollbarZIndex={100} // Above elements
            >
              {groupedMethods.length === 0 ? (
                // Message displayed if no method matches filters
                <Container
                  flexDirection="column"
                  alignItems="center"
                  gap={8}
                  paddingY={24}
                >
                  <Search
                    width={32}
                    height={32}
                    color={colors.mutedForeground}
                  />
                  <Text
                    fontSize={12}
                    color={colors.mutedForeground}
                    lineHeight="16px"
                    textAlign="center"
                  >
                    No methods found
                  </Text>
                </Container>
              ) : (
                // List of methods grouped by name
                groupedMethods.map(([methodName, methods]) => (
                  <Container
                    key={methodName}
                    flexDirection="column"
                    gap={2}
                    flexShrink={0} // Prevents visual crushing of elements
                  >
                    {/* Compact method card - clickable to display details */}
                    <Container
                      backgroundColor={
                        selectedMethod === methodName
                          ? colors.accent
                          : colors.card
                      }
                      hover={{ backgroundColor: colors.accent }}
                      padding={8}
                      borderRadius={6}
                      cursor="pointer"
                      flexDirection="column"
                      gap={4}
                      minHeight={48} // Minimum height to prevent crushing
                      onClick={() => setSelectedMethod(methodName)}
                    >
                      {/* Header: method name + badge with overload count (if > 1) */}
                      <Container
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        gap={8}
                      >
                        <Text
                          fontSize={13}
                          fontWeight="medium"
                          lineHeight="100%"
                        >
                          {methodName}
                        </Text>
                        {/* Display badge only if there are multiple overloads */}
                        {methods.length > 1 && (
                          <Container
                            backgroundColor={colors.secondary}
                            paddingX={4}
                            paddingY={2}
                            borderRadius={4}
                            flexShrink={0} // Prevents badge from shrinking
                          >
                            <Text
                              fontSize={9}
                              fontWeight="medium"
                              color={colors.secondaryForeground}
                              lineHeight="100%"
                            >
                              +{methods.length - 1} overload
                              {methods.length > 2 ? "s" : ""}
                            </Text>
                          </Container>
                        )}
                      </Container>

                      {/* Abbreviated signature of first overload */}
                      <Text
                        fontSize={10}
                        fontFamily="monospace"
                        color={colors.mutedForeground}
                        lineHeight="12px"
                      >
                        {methods[0].className}.{methods[0].methodName}(...) →{" "}
                        {methods[0].returnType}
                      </Text>
                    </Container>
                  </Container>
                ))
              )}
            </Container>
          </Container>

          {/* Detail View (complete documentation of selected method) */}
          <Container
            width={320}
            height="100%"
            flexDirection="column"
            gap={12}
            padding={8}
            flexShrink={0}
          >
            {/* Header with back button */}
            <Container
              flexDirection="row"
              alignItems="center"
              gap={8}
              minHeight={32}
            >
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
              <Text
                fontSize={16}
                fontWeight="bold"
                lineHeight="100%"
                flexGrow={1}
              >
                {displayedMethod}
              </Text>
            </Container>

            <Separator />

            {/* Scrollable documentation content */}
            <Container
              overflow="scroll"
              flexGrow={1}
              height={0}
              flexDirection="column"
              gap={16}
              paddingRight={12} // Space for scrollbar
              scrollbarColor="#000000" // Black scrollbar
              scrollbarWidth={8} // 8px width
              scrollbarBorderRadius={4} // Rounded corners
              scrollbarZIndex={100} // Above elements
            >
              {/* Display all overloads of selected method */}
              {displayedMethod &&
                groupedMethods
                  .find(([name]) => name === displayedMethod)?.[1]
                  .map((method, idx) => (
                    <Container
                      key={idx}
                      flexDirection="column"
                      gap={12}
                      flexShrink={0}
                    >
                      {/* Separator between overloads (except for first) */}
                      {idx > 0 && <Separator />}

                      {/* Badge indicating class (Vector3, Quaternion, etc.) */}
                      <Container
                        backgroundColor={colors.primary}
                        paddingX={10}
                        paddingY={5}
                        borderRadius={6}
                        alignSelf="flex-start"
                      >
                        <Text
                          fontSize={12}
                          fontWeight="bold"
                          color={colors.primaryForeground}
                          lineHeight="100%"
                        >
                          {method.className}
                        </Text>
                      </Container>

                      {/* Complete method signature */}
                      <Container
                        backgroundColor={colors.muted}
                        padding={12}
                        borderRadius={8}
                        flexDirection="column"
                        gap={4}
                      >
                        <Text
                          fontSize={11}
                          fontWeight="bold"
                          color={colors.mutedForeground}
                          lineHeight="100%"
                        >
                          SIGNATURE
                        </Text>
                        <Text
                          fontSize={13}
                          fontFamily="monospace"
                          lineHeight="18px"
                        >
                          {method.methodName}(
                          {method.parameters
                            .map(
                              (p) =>
                                `${p.name}: ${p.type}${p.optional ? "?" : ""}`
                            )
                            .join(", ")}
                          ) → {method.returnType}
                        </Text>
                      </Container>

                      {/* JSDoc description of method */}
                      {method.description && (
                        <Container flexDirection="column" gap={6}>
                          <Text
                            fontSize={11}
                            fontWeight="bold"
                            color={colors.mutedForeground}
                            lineHeight="100%"
                          >
                            DESCRIPTION
                          </Text>
                          <Text fontSize={13} lineHeight="18px">
                            {method.description}
                          </Text>
                        </Container>
                      )}

                      {/* Parameter list with descriptions */}
                      {method.parameters.length > 0 && (
                        <Container flexDirection="column" gap={8}>
                          <Text
                            fontSize={11}
                            fontWeight="bold"
                            color={colors.mutedForeground}
                            lineHeight="100%"
                          >
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
                                {/* Parameter name and type with bullet point */}
                                <Container
                                  flexDirection="row"
                                  gap={6}
                                  alignItems="center"
                                >
                                  <Container
                                    height={6}
                                    width={6}
                                    borderRadius={1000}
                                    backgroundColor={colors.primary}
                                  />
                                  <Text
                                    fontSize={12}
                                    fontFamily="monospace"
                                    fontWeight="medium"
                                    lineHeight="100%"
                                  >
                                    {param.name}: {param.type}
                                    {param.optional && " (optional)"}
                                    {param.defaultValue &&
                                      ` = ${param.defaultValue}`}
                                  </Text>
                                </Container>
                                {/* JSDoc description of parameter */}
                                {param.description && (
                                  <Text
                                    fontSize={12}
                                    color={colors.mutedForeground}
                                    lineHeight="16px"
                                    paddingLeft={12}
                                  >
                                    {param.description}
                                  </Text>
                                )}
                              </Container>
                            ))}
                          </Container>
                        </Container>
                      )}

                      {/* Return type with description */}
                      {method.returnDescription && (
                        <Container flexDirection="column" gap={6}>
                          <Text
                            fontSize={11}
                            fontWeight="bold"
                            color={colors.mutedForeground}
                            lineHeight="100%"
                          >
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
                            {/* Badge with return type */}
                            <Container
                              backgroundColor={colors.primary}
                              paddingX={8}
                              paddingY={4}
                              borderRadius={4}
                            >
                              <Text
                                fontSize={11}
                                fontFamily="monospace"
                                fontWeight="bold"
                                color={colors.primaryForeground}
                                lineHeight="100%"
                              >
                                {method.returnType}
                              </Text>
                            </Container>
                            {/* Description of what is returned */}
                            <Text fontSize={12} lineHeight="16px">
                              {method.returnDescription}
                            </Text>
                          </Container>
                        </Container>
                      )}

                      {/* Usage example (if available in data) */}
                      {method.example && (
                        <Container flexDirection="column" gap={6}>
                          <Text
                            fontSize={11}
                            fontWeight="bold"
                            color={colors.mutedForeground}
                            lineHeight="100%"
                          >
                            EXAMPLE
                          </Text>
                          <Container
                            backgroundColor={colors.muted}
                            padding={12}
                            borderRadius={6}
                          >
                            <Text
                              fontSize={12}
                              fontFamily="monospace"
                              lineHeight="16px"
                            >
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
