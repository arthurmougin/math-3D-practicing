import type { EquationSignature } from "../../../types/types";
import { EQUATION_TYPE_DESCRIPTIONS, EQUATION_TYPE_NICENAMES } from "../../constants/equationType";

export function EquationDetailedView({
  selectedMethodName,
  selectedMethodDetails,
  onBack
}: {
  selectedMethodName: string | null;
  selectedMethodDetails: EquationSignature | null | undefined;
  onBack: () => void;
}) {


  return (
    <div className="equation-browser__detail-view">
      {selectedMethodName && selectedMethodDetails && (
        <>
          {/* Back Button */}
          <button
            className="equation-browser__back-btn"
            onClick={onBack}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back</span>
          </button>

          {/* Method Details */}
          <div className="equation-browser__detail-content">
            <h3>{selectedMethodDetails.methodName}</h3>
            <div className="equation-browser__detail-meta">
              <span className="class-badge">
                {selectedMethodDetails.className}
              </span>
              <span className="meta-separator">→</span>
              <span className="return-type">
                {selectedMethodDetails.returnType}
              </span>
            </div>

            {/* Signature */}
            <div className="equation-browser__detail-section">
              <h4>Signature</h4>
              <div className="section-content method-signature-detail">
                {selectedMethodDetails.className !== "MathUtils" && (
                  <span className="sig-class">
                    {selectedMethodDetails.className}.
                  </span>
                )}
                <span className="sig-method">
                  {selectedMethodDetails.methodName}
                </span>
                <span className="sig-paren">(</span>
                {selectedMethodDetails.parameters.length === 0 ? (
                  <span className="sig-empty"></span>
                ) : (
                  selectedMethodDetails.parameters.map((param, idx) => (
                    <span key={idx} className="sig-param-group">
                      <span className="sig-param-name">{param.name}</span>
                      <span className="sig-colon">:</span>
                      <span className="sig-param-type">{param.type}</span>
                      {idx < selectedMethodDetails.parameters.length - 1 && (
                        <span className="sig-comma">, </span>
                      )}
                    </span>
                  ))
                )}
                <span className="sig-paren">)</span>
                <span className="sig-colon">:</span>
                <span className="sig-return-type">
                  {selectedMethodDetails.returnType}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="equation-browser__detail-section">
              <h4>Description</h4>
              <div className="section-content">
                <p
                  dangerouslySetInnerHTML={{
                    __html: selectedMethodDetails.description,
                  }}
                />
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
                      {param.optional && (
                        <span className="param-optional">optional</span>
                      )}
                      {param.description && (
                        <p
                          dangerouslySetInnerHTML={{
                            __html: param.description,
                          }}
                        />
                      )}
                      {param.defaultValue && (
                        <span className="param-default">
                          Default: {param.defaultValue}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="section-content">
                  <p className="no-parameters">
                    This method takes no parameters.
                  </p>
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
                      <span
                        dangerouslySetInnerHTML={{
                          __html: selectedMethodDetails.returnDescription,
                        }}
                      />
                    </>
                  )}
                </p>
                <span className={`method-type-note`}></span>
              </div>
            </div>

            {/* Example */}
            {selectedMethodDetails.example && (
              <div className="equation-browser__detail-section">
                <h4>Example</h4>
                <div className="section-content">
                  <pre>
                    <code>{selectedMethodDetails.example}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Method Type Explanation */}
            <div className="equation-browser__detail-section">
              <h4>Method Type</h4>
              {Object.keys(selectedMethodDetails.equationType)
                .filter(
                  (key) =>
                    (selectedMethodDetails.equationType as any)[key] === true
                )
                .map((typeKey) => (
                  <div className="section-content method-type-explanation">
                    <span key={typeKey} className={`method-type-badge-inline`}>
                      {EQUATION_TYPE_NICENAMES[typeKey as keyof typeof EQUATION_TYPE_NICENAMES]}
                    </span>
                    <span>
                      {
                        EQUATION_TYPE_DESCRIPTIONS[
                          typeKey as keyof typeof EQUATION_TYPE_DESCRIPTIONS
                        ]
                      }
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
