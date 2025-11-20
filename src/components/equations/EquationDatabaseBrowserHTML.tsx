import { useState, useMemo } from "react";
import {
  type MethodSignature,
  type MethodType,
  type SupportedType,
  getDatabaseStats,
} from "../../data/equationDatabaseHelper";
import equationDatabase from "../../data/equationDatabase.source.json";
import "./EquationDatabaseBrowserHTML.css";

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
  const [selectedClass, setSelectedClass] = useState<SupportedType | "all">("all");
  const [selectedReturnType, setSelectedReturnType] = useState<string | "all">("all");

  // State to manage the selected method that displays the details panel
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // State for filters panel expansion
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // State for method type filter
  const [selectedMethodType, setSelectedMethodType] = useState<MethodType | "all">("all");

  // State for entire panel collapse/expand
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  /**
   * Database imported from generated JSON file
   */
  const database = equationDatabase as {
    version: string;
    generatedAt: string;
    source: string;
    methods: MethodSignature[];
  };

  /**
   * Global database statistics
   */
  const stats = useMemo(() => getDatabaseStats(), []);

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
        selectedReturnType === "all" || method.returnType === selectedReturnType;
      
      const matchesMethodType =
        selectedMethodType === "all" || method.methodType === selectedMethodType;

      return matchesSearch && matchesClass && matchesReturnType && matchesMethodType;
    });
  }, [searchQuery, selectedClass, selectedReturnType, selectedMethodType]);

  /**
   * Methods grouped by method name
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

  /**
   * Get the full signature details for the selected method
   */
  const selectedMethodDetails = useMemo(() => {
    if (!selectedMethod) return null;
    return filteredMethods.find((m) => 
      `${m.className}.${m.methodName}` === selectedMethod
    );
  }, [selectedMethod, filteredMethods]);

  return (
    <div className={`equation-browser ${panelCollapsed ? "collapsed" : ""}`}>
      {/* Main Panel Container */}
      <div className="equation-browser__panel">
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

        {/* Views Container with sliding transition */}
        <div className="equation-browser__views-container">
          <div className={`equation-browser__views-wrapper ${selectedMethod ? "show-detail" : ""}`}>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                      All ({stats.total})
                    </button>
                    {classes.map((cls) => (
                      <button
                        key={cls}
                        className={selectedClass === cls ? "active" : ""}
                        onClick={() => setSelectedClass(cls as SupportedType)}
                      >
                        {cls} ({stats.byClass[cls] || 0})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Return Type Filter */}
                <div className="equation-browser__filter-group">
                  <label>Returns:</label>
                  <div className="equation-browser__filter-chips">
                    <button
                      className={selectedReturnType === "all" ? "active" : ""}
                      onClick={() => setSelectedReturnType("all")}
                    >
                      All
                    </button>
                    {returnTypes.map((type) => (
                      <button
                        key={type}
                        className={selectedReturnType === type ? "active" : ""}
                        onClick={() => setSelectedReturnType(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Method Type Filter */}
                <div className="equation-browser__filter-group">
                  <label>Type:</label>
                  <div className="equation-browser__filter-chips">
                    <button
                      className={selectedMethodType === "all" ? "active" : ""}
                      onClick={() => setSelectedMethodType("all")}
                      title="Show all method types"
                    >
                      All
                    </button>
                    <button
                      className={selectedMethodType === "calculation" ? "active" : ""}
                      onClick={() => setSelectedMethodType("calculation")}
                      title="Calculation: Returns a computed value without modifying the object"
                    >
                      🔢 Calculation
                    </button>
                    <button
                      className={selectedMethodType === "transformation" ? "active" : ""}
                      onClick={() => setSelectedMethodType("transformation")}
                      title="Transformation: Modifies the object's state and returns it"
                    >
                      🔄 Transform
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Methods List */}
          <div className="equation-browser__methods">
            {groupedMethods.length === 0 ? (
              <div className="equation-browser__empty">No methods found</div>
            ) : (
              groupedMethods.map(([methodName, methods]) => (
                <div key={methodName} className="equation-browser__method-group">
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
                    const showClass = method.className !== 'MathUtils';
                    return (
                      <button
                        key={key}
                        className="equation-browser__method-item"
                        onClick={() => setSelectedMethod(key)}
                      >
                        <div className="method-signature">
                          {showClass && <span className="signature-class">{method.className}.</span>}
                          <span className="signature-method">{method.methodName}</span>
                          <span className="signature-params">(
                            {method.parameters.length === 0 ? (
                              <span className="param-empty"></span>
                            ) : (
                              method.parameters.map((param, idx) => (
                                <span key={idx}>
                                  <span className="param-type-badge">{param.type}</span>
                                  {idx < method.parameters.length - 1 && ', '}
                                </span>
                              ))
                            )}
                          )</span>
                          <span className="signature-separator">:</span>
                          <span className="return-type-badge">{method.returnType}</span>
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
            <div className="equation-browser__detail-view">
              {selectedMethod && selectedMethodDetails && (
                <>
                  {/* Back Button */}
                  <button
                    className="equation-browser__back-btn"
                    onClick={() => setSelectedMethod(null)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    <span>Back</span>
                  </button>

                  {/* Method Details */}
                  <div className="equation-browser__detail-content">
                    <h3>{selectedMethodDetails.methodName}</h3>
                    <div className="equation-browser__detail-meta">
                      <span className="class-badge">{selectedMethodDetails.className}</span>
                      <span className="meta-separator">→</span>
                      <span className="return-type">{selectedMethodDetails.returnType}</span>
                    </div>

                    {/* Signature */}
                    <div className="equation-browser__detail-section">
                      <h4>Signature</h4>
                      <div className="section-content method-signature-detail">
                        {selectedMethodDetails.className !== 'MathUtils' && (
                          <span className="sig-class">{selectedMethodDetails.className}.</span>
                        )}
                        <span className="sig-method">{selectedMethodDetails.methodName}</span>
                        <span className="sig-paren">(</span>
                        {selectedMethodDetails.parameters.length === 0 ? (
                          <span className="sig-empty"></span>
                        ) : (
                          selectedMethodDetails.parameters.map((param, idx) => (
                            <span key={idx} className="sig-param-group">
                              <span className="sig-param-name">{param.name}</span>
                              <span className="sig-colon">:</span>
                              <span className="sig-param-type">{param.type}</span>
                              {idx < selectedMethodDetails.parameters.length - 1 && <span className="sig-comma">, </span>}
                            </span>
                          ))
                        )}
                        <span className="sig-paren">)</span>
                        <span className="sig-colon">:</span>
                        <span className="sig-return-type">{selectedMethodDetails.returnType}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="equation-browser__detail-section">
                      <h4>Description</h4>
                      <div className="section-content">
                        <p dangerouslySetInnerHTML={{ __html: selectedMethodDetails.description }} />
                      </div>
                    </div>

                    {/* Parameters */}
                    <div className="equation-browser__detail-section">
                      <h4>Parameters</h4>
                      {selectedMethodDetails.parameters.length > 0 ? (
                        <ul className="section-content equation-browser__params-list">
                          {selectedMethodDetails.parameters.map((param, idx) => (
                            <li key={idx}>
                              <code>{param.name}</code>
                              <span className="param-type">{param.type}</span>
                              {param.optional && <span className="param-optional">optional</span>}
                              {param.description && (
                                <p dangerouslySetInnerHTML={{ __html: param.description }} />
                              )}
                              {param.defaultValue && (
                                <span className="param-default">Default: {param.defaultValue}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="section-content">
                          <p className="no-parameters">This method takes no parameters.</p>
                        </div>
                      )}
                    </div>

                    {/* Return */}
                    <div className="equation-browser__detail-section">
                      <h4>Returns</h4>
                      <div className="section-content return-info">
                        <p>
                          <code>{selectedMethodDetails.returnType}</code>
                          {selectedMethodDetails.returnDescription && (
                            <>
                              {" - "}
                              <span dangerouslySetInnerHTML={{ __html: selectedMethodDetails.returnDescription }} />
                            </>
                          )}
                        </p>
                        <span className={`method-type-note ${selectedMethodDetails.methodType}`}>
                          {selectedMethodDetails.methodType === 'calculation' ? '🔢 Calc' : '🔄 Transform'}
                        </span>
                      </div>
                    </div>

                    {/* Example */}
                    {selectedMethodDetails.example && (
                      <div className="equation-browser__detail-section">
                        <h4>Example</h4>
                        <div className="section-content">
                          <pre><code>{selectedMethodDetails.example}</code></pre>
                        </div>
                      </div>
                    )}

                    {/* Method Type Explanation */}
                    <div className="equation-browser__detail-section">
                      <h4>Method Type</h4>
                      <div className="section-content method-type-explanation">
                        <span className={`method-type-badge-inline ${selectedMethodDetails.methodType}`}>
                          {selectedMethodDetails.methodType === 'calculation' ? '🔢 Calculation' : '🔄 Transformation'}
                        </span>
                        <p>
                          {selectedMethodDetails.methodType === 'calculation'
                            ? 'This is a calculation method. It computes and returns a value without modifying the object itself. The original object remains unchanged.'
                            : 'This is a transformation method. It modifies the object\'s internal state and returns the object itself (this), allowing method chaining.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
