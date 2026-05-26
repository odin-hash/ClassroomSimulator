import React from 'react';

interface EventDetail {
  id: string;
  title: string;
  description: string;
  severity: string; // low, medium, high
  instructions: string;
  affected_students: string[];
}

interface EventPopupProps {
  event: EventDetail | null;
}

export const EventPopup: React.FC<EventPopupProps> = ({ event }) => {
  if (!event) return null;

  // Set colors based on severity
  let severityColor = 'var(--color-info)';
  let borderColor = 'rgba(59, 130, 246, 0.3)';
  let bgGradient = 'linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(20, 28, 58, 0.4) 100%)';

  if (event.severity === 'high') {
    severityColor = 'var(--color-danger)';
    borderColor = 'rgba(239, 68, 68, 0.3)';
    bgGradient = 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(20, 28, 58, 0.4) 100%)';
  } else if (event.severity === 'medium') {
    severityColor = 'var(--color-warning)';
    borderColor = 'rgba(245, 158, 11, 0.3)';
    bgGradient = 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(20, 28, 58, 0.4) 100%)';
  }

  return (
    <div 
      className="event-alert-container" 
      style={{ 
        background: bgGradient, 
        borderColor: borderColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
      id="classroom-event-alert"
    >
      <div className="event-details">
        <span className="event-title" style={{ color: severityColor, display: 'flex', alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
          {event.title} ({event.severity.toUpperCase()} Priority)
        </span>
        <p style={{ fontSize: '0.9rem', fontWeight: 500, margin: '0.25rem 0' }}>{event.description}</p>
        <span className="event-instruction" style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
          <strong>Skill Tip:</strong>&nbsp;{event.instructions}
        </span>
      </div>
      
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.25rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}
      >
        <span>Affected: <strong>{event.affected_students.join(', ')}</strong></span>
      </div>
    </div>
  );
};
