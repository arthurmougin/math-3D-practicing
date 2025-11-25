import { useState, useMemo } from "react";
import equationDatabase from "../../data/equationDatabase.source.json";
import "./EquationDatabaseBrowserHTML.css";
import type {
  ValueTypeName,
  EquationType,
  EquationSignature,
  EnhancedEquationDatabase,
} from "../../../types/types.d.ts";
import { useScenarioStore } from "../../stores/scenarioStore";
import { EquationDetailedView } from "./EquationDetailedView.tsx";
import { EQUATION_TYPE_NICENAMES } from "../../constants/equationTypeConstants.ts";

/**
 * Equation Database Browser Component (HTML Version)
 *
 * Compact sidebar component that displays all available Three.js mathematical methods
 * with their complete documentation.
 *
 * @architecture
 * - Fixed 320px width sidebar on the left side of the screen
 * - Sliding panel: list view ↔ method detail view
 * - Smooth CSS transitions between both views
 *
 * @features
 * - Search by method name or description with integrated clear button
 * - Filters by class (Vector3, Quaternion, etc.) and return type (number, boolean)
 * - Methods grouped by name (to handle overloads)
 * - Detailed view with complete JSDoc documentation on click
 * - Native HTML scrollbars and interactions
 *
 * @data
 * Source: equationDatabase.source.json (generated from Three.js sources)
 * Format: version 2.0.0 with complete JSDoc documentation
 */
export function EquationDatabaseBrowserHTML() {
  // Search and filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<ValueTypeName | "all">(
    "all"
  );
  const [selectedReturnType, setSelectedReturnType] = useState<string | "all">(
    "all"
  );

  // State to manage the selected method that displays the details panel
  const [selectedMethodName, setSelectedMethodName] = useState<string | null>(
    null
  );

  // State for filters panel expansion
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // State for method type filter
  const [selectedEquationType, setSelectedEquationType] = useState<
    keyof EquationType | "all"
  >("all");

  // State for entire panel collapse/expand
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  /**
   * Database imported from generated JSON file
   */
  const database: EnhancedEquationDatabase =
    equationDatabase as EnhancedEquationDatabase;

  if (selectedMethodName) {
    const method = equationDatabase.methods.find(
      (m) => `${m.className}.${m.methodName}` === selectedMethodName
    );
    if (method) {
      useScenarioStore
        .getState()
        .addScenarioUsingMethod(method as EquationSignature);
    }
  }

  /**
   * Unique list of available classes (sorted alphabetically)
   */
  const classes = useMemo(() => {
    const classSet = new Set(database.methods.map((m) => m.className));
    return Array.from(classSet).sort();
  }, []);

  /**
   * Unique list of available return types (sorted alphabetically)
   */
  const returnTypes = useMemo(() => {
    const typeSet = new Set(database.methods.map((m) => m.returnType));
    return Array.from(typeSet).sort();
  }, []);

  /**
   * Methods filtered according to search and active filters
   */
  const filteredMethods = useMemo(() => {
    return database.methods.filter((method) => {
      const matchesSearch =
        searchQuery === "" ||
        method.methodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        method.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass =
        selectedClass === "all" || method.className === selectedClass;

      const matchesReturnType =
        selectedReturnType === "all" ||
        method.returnType === selectedReturnType;

      const matchesEquationType =
        selectedEquationType === "all" ||
        method.equationType[selectedEquationType] === true;

      return (
        matchesSearch &&
        matchesClass &&
        matchesReturnType &&
        matchesEquationType
      );
    });
  }, [searchQuery, selectedClass, selectedReturnType, selectedEquationType]);

  /**
   * Methods grouped by method name
   */
  const groupedMethods = useMemo(() => {
    const groups = new Map<string, EquationSignature[]>();
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

  /**
   * Get the full signature details for the selected method
   */
  const selectedMethodDetails = useMemo(() => {
    if (!selectedMethodName) return null;
    return filteredMethods.find(
      (m) => `${m.className}.${m.methodName}` === selectedMethodName
    );
  }, [selectedMethodName, filteredMethods]);

  const samepleEquationType: EquationType = {
    isStatic: true,
    isMutatingInvoker: true,
    isMutatingParameter: true,
    isReturningInstance: true,
    isPureFunction: true,
  };

  return (
    <div className={`equation-browser ${panelCollapsed ? "collapsed" : ""}`}>
      {/* Collapse/Expand Button */}
      <button
        className="equation-browser__collapse-btn"
        onClick={() => setPanelCollapsed(!panelCollapsed)}
        title={panelCollapsed ? "Expand" : "Collapse"}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 3h18M3 9h18M3 15h18M3 21h18" />
        </svg>
      </button>
      {/* Main Panel Container */}
      <div className="equation-browser__panel">
        {/* Views Container with sliding transition */}
        <div className="equation-browser__views-container">
          <div
            className={`equation-browser__views-wrapper ${
              selectedMethodName ? "show-detail" : ""
            }`}
          >
            {/* List View */}
            <div className="equation-browser__list-view">
              {/* Header */}
              <div className="equation-browser__header">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  onClick={() => setPanelCollapsed(!panelCollapsed)}
                >
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                <h2>Equations</h2>
              </div>

              {/* Search Bar */}
              <div className="equation-browser__search">
                <svg
                  className="equation-browser__search-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search methods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="equation-browser__clear-btn"
                    onClick={() => setSearchQuery("")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="equation-browser__filters">
                <button
                  className="equation-browser__filters-toggle"
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={filtersExpanded ? "rotated" : ""}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span>Filters</span>
                </button>

                {filtersExpanded && (
                  <div className="equation-browser__filters-content">
                    {/* Class Filter */}
                    <div className="equation-browser__filter-group">
                      <label>Class:</label>
                      <div className="equation-browser__filter-chips">
                        <button
                          className={selectedClass === "all" ? "active" : ""}
                          onClick={() => setSelectedClass("all")}
                        >
                          All ({filteredMethods.length})
                        </button>
                        {classes.map((cls) => {
                          const count = filteredMethods.filter(
                            (m) => m.className === cls
                          ).length;
                          return (
                            <button
                              key={cls}
                              className={`${
                                selectedClass === cls ? "active" : ""
                              } ${count === 0 ? "disabled" : ""}`}
                              onClick={() =>
                                count > 0 &&
                                setSelectedClass(cls as ValueTypeName)
                              }
                              disabled={count === 0}
                            >
                              {cls}
                              {count > 0 ? ` (${count})` : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Return Type Filter */}
                    <div className="equation-browser__filter-group">
                      <label>Returns:</label>
                      <div className="equation-browser__filter-chips">
                        <button
                          className={
                            selectedReturnType === "all" ? "active" : ""
                          }
                          onClick={() => setSelectedReturnType("all")}
                        >
                          All ({filteredMethods.length})
                        </button>
                        {returnTypes.map((type) => {
                          const count = filteredMethods.filter(
                            (m) => m.returnType === type
                          ).length;
                          return (
                            <button
                              key={type}
                              className={`${
                                selectedReturnType === type ? "active" : ""
                              } ${count === 0 ? "disabled" : ""}`}
                              onClick={() => setSelectedReturnType(type)}
                            >
                              {type}
                              {count > 0 ? ` (${count})` : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Method Type Filter */}
                    <div className="equation-browser__filter-group">
                      <label>Type:</label>
                      <div className="equation-browser__filter-chips">
                        <button
                          className={
                            selectedEquationType === "all" ? "active" : ""
                          }
                          onClick={() => setSelectedEquationType("all")}
                          title="Show all method types"
                        >
                          All
                          {filteredMethods.length > 0
                            ? ` (${filteredMethods.length})`
                            : ""}
                        </button>
                        {filteredMethods.length > 0 && (
                          Object.keys(samepleEquationType) as (keyof EquationType)[]
                        ).map((typeKey) => {
                          const count = filteredMethods.filter(m => m.equationType[typeKey] === true).length;
                          return (
                            <button
                            className={`${
                                selectedEquationType === typeKey
                                  ? "active"
                                  : ""
                              } ${count === 0 ? "disabled" : ""}`}
                              onClick={() => setSelectedEquationType(typeKey)}
                            >
                              {EQUATION_TYPE_NICENAMES[typeKey as keyof typeof EQUATION_TYPE_NICENAMES]}
                              {count > 0 ? ` (${count})` : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Methods List */}
              <div className="equation-browser__methods">
                {groupedMethods.length === 0 ? (
                  <div className="equation-browser__empty">
                    No methods found
                  </div>
                ) : (
                  groupedMethods.map(([methodName, methods]) => (
                    <div
                      key={methodName}
                      className="equation-browser__method-group"
                    >
                      <div className="equation-browser__method-name">
                        {methodName}
                        {methods.length > 1 && (
                          <span className="method-overloads-count">
                            {methods.length} overloads
                          </span>
                        )}
                      </div>
                      {methods.map((method) => {
                        const key = `${method.className}.${method.methodName}`;
                        const showClass = method.className !== "MathUtils";
                        return (
                          <button
                            key={key}
                            className="equation-browser__method-item"
                            onClick={() => setSelectedMethodName(key)}
                          >
                            <div className="method-signature">
                              {showClass && (
                                <span className="signature-class">
                                  {method.className}.
                                </span>
                              )}
                              <span className="signature-method">
                                {method.methodName}
                              </span>
                              <span className="signature-params">
                                (
                                {method.parameters.length === 0 ? (
                                  <span className="param-empty"></span>
                                ) : (
                                  method.parameters.map((param, idx) => (
                                    <span key={idx}>
                                      <span className="param-type-badge">
                                        {param.type}
                                      </span>
                                      {idx < method.parameters.length - 1 &&
                                        ", "}
                                    </span>
                                  ))
                                )}
                                )
                              </span>
                              <span className="signature-separator">:</span>
                              <span className="return-type-badge">
                                {method.returnType}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Detail View */}
            <EquationDetailedView
              selectedMethodName={selectedMethodName}
              selectedMethodDetails={selectedMethodDetails}
              onBack={() => setSelectedMethodName(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
