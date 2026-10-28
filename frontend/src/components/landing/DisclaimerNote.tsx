import React from 'react';

const DisclaimerNote: React.FC = () => (
  <div
    className="mx-auto"
    style={{ maxWidth: '1120px', padding: '0 32px 80px' }}
  >
    <div
      role="note"
      className="flex items-start gap-4 rounded-2xl p-6"
      style={{
        border: '1px solid rgba(232,201,160,.2)',
        background: 'rgba(201,154,107,.055)',
      }}
    >
      {/* Circular "!" mark */}
      <div
        aria-hidden="true"
        className="shrink-0 flex items-center justify-center font-bold"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1.5px solid rgba(232,201,160,.35)',
          color: '#C99A6B',
          fontSize: '1.05rem',
          marginTop: 2,
          background: 'rgba(201,154,107,.08)',
        }}
      >
        !
      </div>

      <div>
        <p className="text-sm leading-relaxed" style={{ color: '#D3C7B3', lineHeight: 1.7 }}>
          <strong style={{ color: '#F4EBDD', fontWeight: 600 }}>
            CourtMind supports legal information discovery and case understanding.
          </strong>{' '}
          It does not replace a qualified lawyer, and predictions or extracted information
          should not be treated as guaranteed legal outcomes.
        </p>
      </div>
    </div>
  </div>
);

export default DisclaimerNote;
