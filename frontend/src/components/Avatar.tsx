import React from 'react';

interface AvatarProps {
  style: string;  // curious-boy, shy-girl, distracted-boy, hyperactive-boy, weak-learner-girl, overconfident-boy
  emotion: 'normal' | 'confused' | 'questioning' | 'sleeping' | 'distracted' | 'talking';
}

export const Avatar: React.FC<AvatarProps> = ({ style, emotion }) => {
  // Custom theme colors for each student type
  let skinColor = '#FDBA74'; // warm skin
  let hairColor = '#1F2937'; // dark grey
  let shirtColor = '#4F46E5'; // indigo
  let hairStyle: 'boy-spiky' | 'boy-curly' | 'boy-flat' | 'girl-long' | 'girl-ponytails' | 'girl-bob' = 'boy-spiky';
  let hasGlasses = false;
  
  if (style === 'curious-boy') {
    // Aarav
    skinColor = '#FDBA74';
    hairColor = '#1E1B4B'; // dark blue/black
    shirtColor = '#06B6D4'; // cyan
    hairStyle = 'boy-spiky';
    hasGlasses = true;
  } else if (style === 'shy-girl') {
    // Ananya
    skinColor = '#FED7AA';
    hairColor = '#451A03'; // brown
    shirtColor = '#EC4899'; // pink
    hairStyle = 'girl-long';
  } else if (style === 'distracted-boy') {
    // Vihaan
    skinColor = '#FDBA74';
    hairColor = '#78350F'; // warm brown
    shirtColor = '#10B981'; // green
    hairStyle = 'boy-curly';
  } else if (style === 'hyperactive-boy') {
    // Ishaan
    skinColor = '#FFEDD5';
    hairColor = '#000000';
    shirtColor = '#F59E0B'; // amber
    hairStyle = 'boy-flat';
  } else if (style === 'weak-learner-girl') {
    // Riya
    skinColor = '#FED7AA';
    hairColor = '#172554';
    shirtColor = '#8B5CF6'; // purple
    hairStyle = 'girl-ponytails';
    hasGlasses = true;
  } else if (style === 'overconfident-boy') {
    // Kabir
    skinColor = '#FDBA74';
    hairColor = '#4B5563'; // gray hair/cool cut
    shirtColor = '#EF4444'; // red
    hairStyle = 'boy-spiky';
  }

  // Animation helper class based on student state
  let animationClass = 'avatar-breathing';
  if (emotion === 'talking') {
    animationClass = 'avatar-talking';
  } else if (emotion === 'sleeping') {
    animationClass = 'avatar-sleeping';
  } else if (emotion === 'distracted') {
    animationClass = 'avatar-distracted';
  }

  return (
    <div className={`student-avatar-container ${animationClass}`}>
      <svg
        viewBox="0 0 100 100"
        className={`student-avatar-svg ${emotion}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background base */}
        <defs>
          <linearGradient id={`grad-${style}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        
        {/* Neck */}
        <path d="M 42 70 L 58 70 L 55 82 L 45 82 Z" fill={skinColor} filter="brightness(0.9)" />

        {/* Ears */}
        <circle cx="33" cy="55" r="5.5" fill={skinColor} />
        <circle cx="67" cy="55" r="5.5" fill={skinColor} />
        <circle cx="33" cy="55" r="2.5" fill={skinColor} filter="brightness(0.85)" />
        <circle cx="67" cy="55" r="2.5" fill={skinColor} filter="brightness(0.85)" />

        {/* Head/Face base */}
        <circle cx="50" cy="52" r="18" fill={skinColor} />

        {/* Hair - Back */}
        {hairStyle === 'girl-long' && (
          <path d="M 30 50 C 30 75 40 85 50 85 C 60 85 70 75 70 50 Z" fill={hairColor} />
        )}
        {hairStyle === 'girl-ponytails' && (
          <>
            <circle cx="28" cy="45" r="8" fill={hairColor} />
            <circle cx="72" cy="45" r="8" fill={hairColor} />
          </>
        )}

        {/* Shirt / Shoulders */}
        <path
          d="M 28 85 C 28 75 35 72 50 72 C 65 72 72 75 72 85 L 75 98 L 25 98 Z"
          fill={shirtColor}
        />
        {/* Collar details */}
        <path d="M 44 72 L 50 78 L 56 72 Z" fill={skinColor} filter="brightness(0.85)" />

        {/* Face Features: Eyes */}
        {emotion === 'sleeping' ? (
          /* Sleeping closed eyes */
          <>
            <path d="M 40 52 Q 44 54 46 52" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 54 52 Q 56 54 60 52" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        ) : emotion === 'distracted' ? (
          /* Looking sideways */
          <>
            <circle cx="43" cy="52" r="3" fill="#ffffff" />
            <circle cx="57" cy="52" r="3" fill="#ffffff" />
            <circle cx="41.5" cy="52" r="1.5" fill="#1f2937" />
            <circle cx="55.5" cy="52" r="1.5" fill="#1f2937" />
          </>
        ) : emotion === 'confused' ? (
          /* Puzzled/Uncertain eyes */
          <>
            <circle cx="43" cy="52" r="3.2" fill="#ffffff" />
            <circle cx="57" cy="52" r="3.2" fill="#ffffff" />
            <circle cx="43" cy="53" r="1.5" fill="#1f2937" />
            <circle cx="56.5" cy="51.5" r="1.5" fill="#1f2937" />
          </>
        ) : (
          /* Normal / Questioning / Talking */
          <>
            <circle cx="43" cy="52" r="3" fill="#ffffff" />
            <circle cx="57" cy="52" r="3" fill="#ffffff" />
            <circle cx="43" cy="52" r="1.5" fill="#1f2937" />
            <circle cx="57" cy="52" r="1.5" fill="#1f2937" />
          </>
        )}

        {/* Eyebrows */}
        {emotion === 'confused' ? (
          <>
            <path d="M 39 46 Q 43 49 47 47" stroke={hairColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M 53 45 Q 57 44 61 47" stroke={hairColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </>
        ) : emotion === 'questioning' ? (
          <>
            <path d="M 38 47 Q 43 45 47 47" stroke={hairColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M 53 43 Q 57 40 61 44" stroke={hairColor} strokeWidth="1.8" fill="none" strokeLinecap="round" /> {/* Raised */}
          </>
        ) : emotion === 'sleeping' ? (
          <>
            <path d="M 39 48 Q 43 48 46 48" stroke={hairColor} strokeWidth="1.2" fill="none" />
            <path d="M 54 48 Q 57 48 61 48" stroke={hairColor} strokeWidth="1.2" fill="none" />
          </>
        ) : (
          <>
            <path d="M 39 46 Q 43 44 47 46" stroke={hairColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M 53 46 Q 57 44 61 46" stroke={hairColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* Nose */}
        <path d="M 50 51 L 48.5 56 L 51.5 56 Z" fill={skinColor} filter="brightness(0.85)" />

        {/* Glasses */}
        {hasGlasses && (
          <>
            <circle cx="43" cy="52" r="5.5" fill="none" stroke="#6366F1" strokeWidth="1.5" />
            <circle cx="57" cy="52" r="5.5" fill="none" stroke="#6366F1" strokeWidth="1.5" />
            <line x1="48.5" y1="52" x2="51.5" y2="52" stroke="#6366F1" strokeWidth="1.5" />
            <line x1="33.5" y1="52" x2="37.5" y2="52" stroke="#6366F1" strokeWidth="1.5" />
            <line x1="62.5" y1="52" x2="66.5" y2="52" stroke="#6366F1" strokeWidth="1.5" />
          </>
        )}

        {/* Mouth */}
        {emotion === 'talking' ? (
          /* Talking animated mouth */
          <ellipse cx="50" cy="61.5" rx="3.5" ry="5" fill="#451A03" />
        ) : emotion === 'confused' ? (
          /* Wavy confused line */
          <path d="M 46 62 Q 48 60 50 62 T 54 62" stroke="#451A03" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        ) : emotion === 'sleeping' ? (
          /* Sleepy small sigh */
          <circle cx="50" cy="62" r="2.2" fill="#451A03" />
        ) : (
          /* Nice smile */
          <path d="M 45 61 C 45 61 48 64 50 64 C 52 64 55 61 55 61" stroke="#451A03" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        )}

        {/* Hair - Front */}
        {hairStyle === 'boy-spiky' && (
          <path
            d="M 32 45 C 35 38 40 33 50 33 C 60 33 65 38 68 45 C 62 40 56 42 50 45 C 44 42 38 40 32 45 Z"
            fill={hairColor}
          />
        )}
        {hairStyle === 'boy-curly' && (
          <path
            d="M 31 46 C 30 38 38 32 50 32 C 62 32 70 38 69 46 C 65 42 61 43 57 41 C 53 43 47 43 43 41 C 39 43 35 42 31 46 Z"
            fill={hairColor}
          />
        )}
        {hairStyle === 'boy-flat' && (
          <path
            d="M 32 46 C 34 38 42 35 50 35 C 58 35 66 38 68 46 L 68 43 L 32 43 Z"
            fill={hairColor}
          />
        )}
        {hairStyle === 'girl-long' && (
          <path
            d="M 32 46 C 34 36 42 34 50 34 C 58 34 66 36 68 46 C 63 39 57 41 50 44 C 43 41 37 39 32 46 Z"
            fill={hairColor}
          />
        )}
        {hairStyle === 'girl-ponytails' && (
          <path
            d="M 32 46 C 35 37 42 35 50 35 C 58 35 65 37 68 46 C 63 40 57 42 50 44 C 43 42 37 40 32 46 Z"
            fill={hairColor}
          />
        )}
      </svg>
      {emotion === 'sleeping' && (
        <span className="zzz-animation">Zzz</span>
      )}
    </div>
  );
};
