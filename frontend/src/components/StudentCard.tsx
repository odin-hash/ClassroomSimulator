import React from 'react';
import { Avatar } from './Avatar';

interface Student {
  name: string;
  personality: string;
  avatar_style: string;
}

interface StudentCardProps {
  student: Student;
  emotion: 'normal' | 'confused' | 'questioning' | 'sleeping' | 'distracted' | 'talking';
  isActiveSpeaker: boolean;
  bubbleText: string | null;
  onAction: (studentName: string, actionType: string) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  emotion,
  isActiveSpeaker,
  bubbleText,
  onAction,
}) => {
  // Translate emotion to human-readable attention state badge
  const getStatusBadge = () => {
    switch (emotion) {
      case 'confused':
        return <span className="status-badge confused">Confused</span>;
      case 'sleeping':
        return <span className="status-badge sleeping">Dozing Off</span>;
      case 'distracted':
        return <span className="status-badge distracted">Distracted</span>;
      case 'questioning':
        return <span className="status-badge focused">Questioning</span>;
      default:
        return <span className="status-badge focused">Focused</span>;
    }
  };

  return (
    <div 
      className={`student-desk glass ${isActiveSpeaker ? 'active-speaker' : ''} ${
        emotion === 'sleeping' ? 'sleeping' : emotion === 'distracted' ? 'distracted' : ''
      }`}
      id={`student-desk-${student.name.toLowerCase()}`}
    >
      {/* Speech bubble overlay when student speaks */}
      {bubbleText && (
        <div className="student-bubble">
          {bubbleText}
        </div>
      )}

      {/* Animated SVG Avatar */}
      <Avatar style={student.avatar_style} emotion={emotion} />

      {/* Name and Personality */}
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem' }}>{student.name}</h3>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        {student.personality}
      </p>
      
      {/* Status indicator */}
      {getStatusBadge()}

      {/* Interactive Teacher Management Actions (appears when off-task or confused) */}
      <div 
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '0.75rem',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {emotion === 'distracted' && (
          <button 
            className="btn-primary" 
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', background: 'var(--color-warning)' }}
            onClick={() => onAction(student.name, 'focus')}
            title="Tell student to focus on the class"
          >
            ⚠️ Remind
          </button>
        )}
        
        {emotion === 'sleeping' && (
          <button 
            className="btn-primary" 
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', background: 'var(--color-info)' }}
            onClick={() => onAction(student.name, 're-engage')}
            title="Ask them a question to wake them up"
          >
            💡 Wake Up
          </button>
        )}

        {emotion === 'confused' && (
          <button 
            className="btn-primary" 
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', background: 'var(--color-danger)' }}
            onClick={() => onAction(student.name, 'explain_basic')}
            title="Explain the concept again simply"
          >
            📖 Scaffold
          </button>
        )}
        
        {emotion === 'normal' && (
          <button 
            className="btn-secondary" 
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', border: 'none' }}
            onClick={() => onAction(student.name, 'prompt')}
            title="Ask this student to answer"
          >
            ❓ Call On
          </button>
        )}
      </div>
    </div>
  );
};
