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
        <span className="event-title" style={{ color: severityColor }}>
          ⚠️ {event.title} ({event.severity.toUpperCase()} Priority)
        </span>
        <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{event.description}</p>
        <span className="event-instruction">
          💡 <strong>B.Ed Skill Tip:</strong> {event.instructions}
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
