import React, { useRef, useState, useEffect } from 'react';

interface BlackboardProps {
  onShare: (illustrationType: string) => void;
  subject: string;
  topic: string;
}

export const Blackboard: React.FC<BlackboardProps> = ({ onShare, subject, topic }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#0f172a'); // Chalk white
  const [penSize, setPenSize] = useState(2);
  const [isEraser, setIsEraser] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const chalkboardColor = '#fafafa'; // Whiteboard Soft White

  const getPresetListAndDrawer = () => {
    const top = (topic || '').toLowerCase();
    const sub = (subject || '').toLowerCase();

    // 1. FINE ARTS SPECIFIC TOPICS
    if (sub.includes('fine') || sub.includes('art')) {
      if (top.includes('perspective') || top.includes('point') || top.includes('horizon')) {
        return {
          categoryName: "Perspective Drawing",
          presets: [
            { id: 'horizon', label: 'Horizon Line' },
            { id: 'one-point', label: '1-Point VP' },
            { id: 'two-point', label: '2-Point VP' },
            { id: 'three-point', label: '3-Point VP' }
          ]
        };
      }
      if (top.includes('anatomy') || top.includes('proportion') || top.includes('human')) {
        return {
          categoryName: "Anatomy & Proportions",
          presets: [
            { id: 'anatomy-head', label: 'Head Scale' },
            { id: 'anatomy-face', label: 'Face Grid' },
            { id: 'anatomy-pose', label: 'Stick Pose' }
          ]
        };
      }
      if (top.includes('still life') || top.includes('sketching') || top.includes('shading')) {
        return {
          categoryName: "Still Life Sketching",
          presets: [
            { id: 'still-life', label: 'Still Life Group' },
            { id: 'still-shading', label: 'Light/Shadow' },
            { id: 'shading-value', label: 'Value Scale' }
          ]
        };
      }
      if (top.includes('folk art') || top.includes('madhubani') || top.includes('warli') || top.includes('kalamkari')) {
        return {
          categoryName: "Indian Folk Art",
          presets: [
            { id: 'folk-warli', label: 'Warli Figures' },
            { id: 'folk-madhubani', label: 'Madhubani Fish' },
            { id: 'folk-kalamkari', label: 'Kalamkari Bird' }
          ]
        };
      }
      if (top.includes('craft') || top.includes('origami')) {
        return {
          categoryName: "Paper Crafting",
          presets: [
            { id: 'origami-folds', label: 'Fold Lines' },
            { id: 'origami-crane', label: 'Paper Crane' },
            { id: 'origami-valley', label: 'Valley Fold' }
          ]
        };
      }
      if (top.includes('finger') || top.includes('texture')) {
        return {
          categoryName: "Textures & Patterns",
          presets: [
            { id: 'texture-crosshatch', label: 'Crosshatching' },
            { id: 'texture-stipple', label: 'Stippling' },
            { id: 'texture-sponge', label: 'Sponge Textures' }
          ]
        };
      }
      if (top.includes('landscape') || top.includes('watercolor')) {
        return {
          categoryName: "Landscape Drawing",
          presets: [
            { id: 'landscape-planes', label: 'Space Planes' },
            { id: 'landscape-mountain', label: 'Mountain Silhouette' },
            { id: 'landscape-tree', label: 'Tree Structure' }
          ]
        };
      }
      return {
        categoryName: "Color & Shading",
        presets: [
          { id: 'color-wheel', label: 'Color Wheel' },
          { id: 'color-contrast', label: 'Warm vs Cool' },
          { id: 'shading-value', label: 'Value Scale' }
        ]
      };
    }

    // 2. BENGALI
    if (sub.includes('bengali') || sub.includes('বাংলা')) {
      if (top.includes('বর্ণ') || top.includes('স্বরবর্ণ') || top.includes('শব্দ') || top.includes('বানান') || top.includes('যুক্তাক্ষর') || top.includes('alphabets') || top.includes('vowels') || top.includes('word') || top.includes('spelling') || top.includes('conjunct')) {
        return {
          categoryName: "Bengali Letters & Words",
          presets: [
            { id: 'ben-vowels', label: 'স্বরবর্ণ/ব্যঞ্জনবর্ণ' },
            { id: 'ben-joiner', label: 'যুক্তাক্ষর রূপ' },
            { id: 'ben-word', label: 'শব্দ গঠন' }
          ]
        };
      }
      if (top.includes('ব্যাকরণ') || top.includes('সন্ধি') || top.includes('কারক') || top.includes('সমাস') || top.includes('পদ') || top.includes('grammar') || top.includes('sandhi') || top.includes('karak') || top.includes('parts of speech') || top.includes('compounds')) {
        return {
          categoryName: "Bengali Grammar",
          presets: [
            { id: 'ben-sandhi', label: 'সন্ধি বিচ্ছেদ' },
            { id: 'ben-karak', label: 'কারক বিভক্তি' },
            { id: 'ben-samas', label: 'সমাস গঠন' }
          ]
        };
      }
      return {
        categoryName: "Bengali Literature",
        presets: [
          { id: 'ben-lit-analysis', label: 'সাহিত্য বিশ্লেষণ' },
          { id: 'ben-lit-timeline', label: 'সাহিত্য সময়রেখা' },
          { id: 'ben-char-map', label: 'চরিত্র চিত্রণ' }
        ]
      };
    }

    // 3. HINDI
    if (sub.includes('hindi') || sub.includes('हिंदी')) {
      if (top.includes('वर्णमाला') || top.includes('मात्रा') || top.includes('कहानी') || top.includes('संज्ञा') || top.includes('सर्वनाम') || top.includes('समानार्थक') || top.includes('vowels') || top.includes('nouns') || top.includes('synonyms')) {
        return {
          categoryName: "Hindi Alphabet & Nouns",
          presets: [
            { id: 'hin-varnamala', label: 'वर्णमाला' },
            { id: 'hin-grammar', label: 'संज्ञा/सर्वनाम' },
            { id: 'hin-words', label: 'विलोम/समानार्थक' }
          ]
        };
      }
      if (top.includes('संधि') || top.includes('समास') || top.includes('कारक') || top.includes('दोहे') || top.includes('मुहावरे') || top.includes('पत्र') || top.includes('dohas') || top.includes('idioms') || top.includes('letter')) {
        return {
          categoryName: "Hindi Grammar & Dohas",
          presets: [
            { id: 'hin-doha', label: 'दोहा संरचना' },
            { id: 'hin-sandhi', label: 'संधि विच्छेद' },
            { id: 'hin-idioms', label: 'मुहावरे' }
          ]
        };
      }
      return {
        categoryName: "Hindi Literature",
        presets: [
          { id: 'hin-premchand', label: 'प्रेमचंद कहानियाँ' },
          { id: 'hin-history', label: 'साहित्य इतिहास' },
          { id: 'hin-essay', label: 'निबंध प्रारूप' }
        ]
      };
    }

    // 4. URDU
    if (sub.includes('urdu') || sub.includes('اردو')) {
      if (top.includes('حروف') || top.includes('آوازیں') || top.includes('لفظوں') || top.includes('ہجے') || top.includes('کہانیوں') || top.includes('نظمیں') || top.includes('alphabets') || top.includes('spelling') || top.includes('poems')) {
        return {
          categoryName: "Urdu Letters & Phonics",
          presets: [
            { id: 'urd-alphabets', label: 'حروفِ تہجی' },
            { id: 'urd-phonics', label: 'الفاظ کی بناوٹ' },
            { id: 'urd-poems', label: 'ہم قافیہ الفاظ' }
          ]
        };
      }
      if (top.includes('قواعد') || top.includes('اقبال') || top.includes('مضمون') || top.includes('خطوط') || top.includes('محاورات') || top.includes('grammar') || top.includes('iqbal') || top.includes('essays') || top.includes('idioms')) {
        return {
          categoryName: "Urdu Grammar & Iqbal",
          presets: [
            { id: 'urd-grammar', label: 'اسم، فعل، صفت' },
            { id: 'urd-iqbal', label: 'علامہ اقبال شاعری' },
            { id: 'urd-letters', label: 'خطوط نگاری' }
          ]
        };
      }
      return {
        categoryName: "Urdu Ghazal & Prose",
        presets: [
          { id: 'urd-ghazal', label: 'غزل تشریح' },
          { id: 'urd-premchand', label: 'اردو افسانے' },
          { id: 'urd-terms', label: 'ادبی اصطلاحات' }
        ]
      };
    }

    // 5. ENGLISH
    if (sub.includes('english') || sub.includes('eng')) {
      if (top.includes('speech') || top.includes('tense') || top.includes('writing') || top.includes('synonym') || top.includes('grammar') || top.includes('parts of speech')) {
        return {
          categoryName: "English Grammar",
          presets: [
            { id: 'eng-svo', label: 'S-V-O Structure' },
            { id: 'eng-speech-flow', label: 'Direct vs Indirect' },
            { id: 'eng-tense', label: 'Tense Timeline' }
          ]
        };
      }
      return {
        categoryName: "English Literature",
        presets: [
          { id: 'eng-rhyme', label: 'Rhyme Scheme' },
          { id: 'eng-drama', label: 'Drama Plot' },
          { id: 'eng-devices', label: 'Literary Devices' }
        ]
      };
    }

    // 6. COMMERCE
    if (sub.includes('commerce') || sub.includes('comm')) {
      if (top.includes('money') || top.includes('saving') || top.includes('budget') || top.includes('needs') || top.includes('barter')) {
        return {
          categoryName: "Basic Finance & Trade",
          presets: [
            { id: 'comm-needs', label: 'Needs vs Wants' },
            { id: 'comm-budget', label: 'Budget Pie' },
            { id: 'comm-barter', label: 'Barter Exchange' }
          ]
        };
      }
      if (top.includes('market') || top.includes('trade') || top.includes('bank') || top.includes('interest') || top.includes('consumer') || top.includes('gst')) {
        return {
          categoryName: "Markets & Banking",
          presets: [
            { id: 'comm-supply-demand', label: 'Supply/Demand Curves' },
            { id: 'comm-gst', label: 'GST Tax Slabs' },
            { id: 'comm-interest', label: 'Interest Formula' }
          ]
        };
      }
      return {
        categoryName: "Accounting & Ledger",
        presets: [
          { id: 'comm-ledger', label: 'T-Ledger Account' },
          { id: 'comm-trialbalance', label: 'Trial Balance' },
          { id: 'comm-balancesheet', label: 'Balance Sheet' }
        ]
      };
    }

    // 7. COMPUTER SCIENCE
    if (sub.includes('computer') || sub.includes('comp') || sub.includes('programming') || sub.includes('scratch')) {
      if (top.includes('keyboard') || top.includes('mouse') || top.includes('drawing') || top.includes('paint') || top.includes('typing') || top.includes('device')) {
        return {
          categoryName: "Computer Basics",
          presets: [
            { id: 'comp-keyboard', label: 'Keyboard Layout' },
            { id: 'comp-paint', label: 'Paint Tools' },
            { id: 'comp-io', label: 'I/O Devices' }
          ]
        };
      }
      if (top.includes('scratch') || top.includes('code') || top.includes('block') || top.includes('word') || top.includes('spreadsheet') || top.includes('excel') || top.includes('browse') || top.includes('internet') || top.includes('html') || top.includes('webpage')) {
        return {
          categoryName: "Software & Web Basics",
          presets: [
            { id: 'comp-scratch', label: 'Scratch Blocks' },
            { id: 'comp-html', label: 'HTML DOM Tree' },
            { id: 'comp-excel', label: 'Spreadsheet Grid' }
          ]
        };
      }
      return {
        categoryName: "Advanced CompSci",
        presets: [
          { id: 'comp-python', label: 'Python Loop Flow' },
          { id: 'comp-sql', label: 'SQL Table JOIN' },
          { id: 'comp-network', label: 'Network Topologies' }
        ]
      };
    }

    // 8. MATHEMATICS
    if (sub.includes('math') || sub.includes('mathe')) {
      if (top.includes('number') || top.includes('fraction') || top.includes('part') || top.includes('decimal') || top.includes('place')) {
        return {
          categoryName: "Numbers & Fractions",
          presets: [
            { id: 'math-place', label: 'Place Value Chart' },
            { id: 'fraction-half', label: 'Half (1/2)' },
            { id: 'fraction-quarter', label: 'Quarter (1/4)' },
            { id: 'fraction-three-fourths', label: '3/4 Shaded' }
          ]
        };
      }
      if (top.includes('shape') || top.includes('pattern') || top.includes('angle') || top.includes('symmetry') || top.includes('geometry') || top.includes('triangle')) {
        return {
          categoryName: "Geometry Shapes",
          presets: [
            { id: 'shape-square', label: 'Square' },
            { id: 'shape-circle', label: 'Circle' },
            { id: 'shape-symmetry', label: 'Symmetry Line' },
            { id: 'triangle', label: 'Right Triangle' }
          ]
        };
      }
      if (top.includes('equation') || top.includes('algebra') || top.includes('rational') || top.includes('compare') || top.includes('ratio') || top.includes('proportion') || top.includes('percent') || top.includes('exponent') || top.includes('power') || top.includes('square root')) {
        return {
          categoryName: "Algebra & Equations",
          presets: [
            { id: 'math-balance', label: 'Equation Balance' },
            { id: 'math-ratio', label: 'Ratio Bar' },
            { id: 'math-power', label: 'Exponent Laws' }
          ]
        };
      }
      return {
        categoryName: "Advanced Math",
        presets: [
          { id: 'math-trig', label: 'Sin/Cos Wave' },
          { id: 'parabola', label: 'Parabola Curve' },
          { id: 'math-bell', label: 'Normal Bell Curve' }
        ]
      };
    }

    // 9. LIFE SCIENCE
    if (sub.includes('life') || sub.includes('science') || sub.includes('biology')) {
      if (top.includes('plant') || top.includes('photosynthesis') || top.includes('leaf') || top.includes('root') || top.includes('environment') || top.includes('garbage') || top.includes('recycle')) {
        return {
          categoryName: "Plant Biology & Ecology",
          presets: [
            { id: 'sci-photosyn', label: 'Photosynthesis Eq' },
            { id: 'sci-plant-organ', label: 'Leaf/Root Structure' },
            { id: 'sci-recycle', label: 'Recycle Waste Bin' }
          ]
        };
      }
      if (top.includes('cell') || top.includes('mitosis') || top.includes('reproduction') || top.includes('genetics') || top.includes('inheritance') || top.includes('dna') || top.includes('microorganism') || top.includes('nutrition')) {
        return {
          categoryName: "Cells & Molecular Biology",
          presets: [
            { id: 'cell-plant', label: 'Plant Cell' },
            { id: 'cell-animal', label: 'Animal Cell' },
            { id: 'cell-mitosis', label: 'Mitosis Division' },
            { id: 'sci-dna', label: 'DNA Double Helix' }
          ]
        };
      }
      return {
        categoryName: "Human Anatomy & Ecosystems",
        presets: [
          { id: 'sci-circulatory', label: 'Circulatory Loop' },
          { id: 'sci-neuron', label: 'Neuron Synapse' },
          { id: 'sci-foodweb', label: 'Food Web Pyramid' }
        ]
      };
    }

    // 10. GEOGRAPHY
    if (sub.includes('geography') || sub.includes('geo')) {
      if (top.includes('earth') || top.includes('ocean') || top.includes('continent') || top.includes('direction') || top.includes('map') || top.includes('landform')) {
        return {
          categoryName: "Earth Maps & Landforms",
          presets: [
            { id: 'geo-compass', label: '4 Directions' },
            { id: 'geo-continents', label: 'Continents Map' },
            { id: 'geo-landform', label: 'Landforms Profile' }
          ]
        };
      }
      if (top.includes('solar') || top.includes('rotation') || top.includes('revolution') || top.includes('globe') || top.includes('latitude') || top.includes('longitude') || top.includes('time zone')) {
        return {
          categoryName: "Earth Grid & Solar System",
          presets: [
            { id: 'geo-solar', label: 'Solar Orbits' },
            { id: 'geo-grid', label: 'Lat/Long Globe' },
            { id: 'geo-timezone', label: 'Time Zones Map' }
          ]
        };
      }
      if (top.includes('cycle') || top.includes('water') || top.includes('weather') || top.includes('climate')) {
        return {
          categoryName: "Water & Climate Cycle",
          presets: [
            { id: 'cycle-evap', label: 'Evaporation' },
            { id: 'cycle-cond', label: 'Condensation' },
            { id: 'cycle-runoff', label: 'Surface Runoff' }
          ]
        };
      }
      return {
        categoryName: "Physical & Human Geography",
        presets: [
          { id: 'tectonic-plates', label: 'Plate Collisions' },
          { id: 'geo-monsoon', label: 'Monsoon Winds' },
          { id: 'geo-demographics', label: 'Population Pyramid' }
        ]
      };
    }

    // 11. HISTORY
    if (sub.includes('history') || sub.includes('hist')) {
      if (top.includes('ancient') || top.includes('monument') || top.includes('timeline') || top.includes('fire') || top.includes('wheel') || top.includes('transport') || top.includes('freedom') || top.includes('hero') || top.includes('harappan')) {
        return {
          categoryName: "Ancient History",
          presets: [
            { id: 'hist-timeline-ancient', label: 'Ancient Timeline' },
            { id: 'hist-wheel', label: 'Wheel Evolution' },
            { id: 'hist-harappa', label: 'Harappan Street Grid' }
          ]
        };
      }
      if (top.includes('delhi') || top.includes('sultanate') || top.includes('mughal') || top.includes('empire') || top.includes('colonial') || top.includes('revolt') || top.includes('1857')) {
        return {
          categoryName: "Imperial & Colonial Eras",
          presets: [
            { id: 'hist-empire-map', label: 'Imperial Map' },
            { id: 'hist-dynasty', label: 'Dynasty Tree' },
            { id: 'hist-revolt', label: '1857 Revolt Centers' }
          ]
        };
      }
      return {
        categoryName: "Modern History & Revolutions",
        presets: [
          { id: 'hist-french-estates', label: 'French 3 Estates' },
          { id: 'hist-satyagraha', label: 'Satyagraha timeline' },
          { id: 'hist-industrial', label: 'Steam Engine' }
        ]
      };
    }

    // 12. POLITICAL SCIENCE
    if (sub.includes('political') || sub.includes('civic') || sub.includes('pol')) {
      if (top.includes('rules') || top.includes('helper') || top.includes('local') || top.includes('government') || top.includes('panchayat') || top.includes('mayor') || top.includes('national')) {
        return {
          categoryName: "Civics & Governance",
          presets: [
            { id: 'pol-helpers', label: 'Community Helpers' },
            { id: 'pol-panchayat', label: 'Gram Panchayat' },
            { id: 'pol-symbols', label: 'National Flag' }
          ]
        };
      }
      if (top.includes('democracy') || top.includes('prejudice') || top.includes('constitution') || top.includes('preamble') || top.includes('fundamental') || top.includes('rights') || top.includes('parliament') || top.includes('judiciary')) {
        return {
          categoryName: "Democratic Principles",
          presets: [
            { id: 'pol-constitution', label: 'Preamble Scroll' },
            { id: 'pol-rights', label: 'Fundamental Rights' },
            { id: 'pol-parliament', label: 'Parliament Branches' }
          ]
        };
      }
      return {
        categoryName: "Political Systems & Rights",
        presets: [
          { id: 'pol-federalism', label: 'Federal Power Map' },
          { id: 'pol-parties', label: 'Coalition Flow' },
          { id: 'pol-humanrights', label: 'Universal Human Rights' }
        ]
      };
    }

    // 13. PSYCHOLOGY
    if (sub.includes('psychology') || sub.includes('psych')) {
      if (top.includes('emotion') || top.includes('friendship') || top.includes('play') || top.includes('mindfulness') || top.includes('calm') || top.includes('stress') || top.includes('anxiety')) {
        return {
          categoryName: "Emotional Skills",
          presets: [
            { id: 'psych-emotions', label: 'Primary Emotions' },
            { id: 'psych-mindful', label: 'Calming Breathing' },
            { id: 'psych-cooperation', label: 'Cooperative Play' }
          ]
        };
      }
      if (top.includes('self') || top.includes('esteem') || top.includes('learn') || top.includes('cognitive') || top.includes('memory') || top.includes('peer') || top.includes('bullying') || top.includes('motivation') || top.includes('goal')) {
        return {
          categoryName: "Cognitive & Self Processes",
          presets: [
            { id: 'psych-memory', label: 'Memory Model' },
            { id: 'psych-motivation', label: 'Maslow Hierarchy' },
            { id: 'psych-self', label: 'Self-Esteem Mirror' }
          ]
        };
      }
      return {
        categoryName: "Psychological Methods & Growth",
        presets: [
          { id: 'psych-lifespan', label: 'Lifespan Stages' },
          { id: 'psych-research', label: 'Observation Sheet' },
          { id: 'psych-perception', label: 'Gestalt Principles' }
        ]
      };
    }

    // 14. SOCIOLOGY
    if (sub.includes('sociology') || sub.includes('socio')) {
      if (top.includes('family') || top.includes('neighborhood') || top.includes('culture') || top.includes('festival') || top.includes('tradition') || top.includes('role') || top.includes('helping')) {
        return {
          categoryName: "Family & Community",
          presets: [
            { id: 'soc-family', label: 'Family Tree' },
            { id: 'soc-neighborhood', label: 'Neighborhood Map' },
            { id: 'soc-roles', label: 'Social Roles' }
          ]
        };
      }
      if (top.includes('group') || top.includes('social') || top.includes('media') || top.includes('diversity') || top.includes('socialisation') || top.includes('peer')) {
        return {
          categoryName: "Socialization & Groups",
          presets: [
            { id: 'soc-groups', label: 'Primary vs Secondary' },
            { id: 'soc-socialization', label: 'Socialization Agents' },
            { id: 'soc-diversity', label: 'Linguistic Diversity' }
          ]
        };
      }
      return {
        categoryName: "Institutions & Stratification",
        presets: [
          { id: 'soc-stratification', label: 'Caste/Class Pyramid' },
          { id: 'soc-institutions', label: 'Social Institutions' },
          { id: 'soc-research', label: 'Research Methods' }
        ]
      };
    }

    // Default Fallback
    return {
      categoryName: "General Illustrations",
      presets: [
        { id: 'mind-map', label: 'Concept Map' },
        { id: 'flow-chart', label: 'Logical Flow' },
        { id: 'grid', label: 'Writing Grid' }
      ]
    };
  };

  const { categoryName, presets } = getPresetListAndDrawer();

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw subtle light gray dot grid (Miro/FigJam style)
    ctx.fillStyle = '#cbd5e1'; // light slate dot color
    for (let x = 15; x < canvas.width; x += 15) {
      for (let y = 15; y < canvas.height; y += 15) {
        ctx.fillRect(x, y, 1.2, 1.2);
      }
    }
  };

  useEffect(() => {
    initCanvas();
    setActivePreset(null);
  }, [subject, topic]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineWidth = isEraser ? 24 : penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? chalkboardColor : penColor;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    
    // Prevent default body scrolling while drawing on canvas
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    ctx.lineWidth = isEraser ? 24 : penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? chalkboardColor : penColor;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Prevent default body scrolling while drawing on canvas
    if (e.cancelable) {
      e.preventDefault();
    }
  };


  const clearBoard = () => {
    initCanvas();
    setActivePreset(null);
  };

  const applyPreset = (preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    clearBoard();
    setActivePreset(preset);

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.font = '11px monospace';
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    const w = canvas.width;
    const h = canvas.height;
    const midY = h / 2;
    const midX = w / 2;

    if (preset === 'horizon') {
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(10, midY); ctx.lineTo(w - 10, midY); ctx.stroke();
      ctx.beginPath(); ctx.arc(midX, midY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('Horizon Line', 20, midY - 8);
      ctx.fillText('Vanishing Point (V.P.)', midX - 55, midY + 18);

    } else if (preset === 'one-point') {
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(10, midY - 20); ctx.lineTo(w - 10, midY - 20); ctx.stroke();
      ctx.beginPath(); ctx.arc(midX, midY - 20, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('V.P.', midX - 10, midY - 30);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(midX, midY - 20); ctx.lineTo(15, h - 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX, midY - 20); ctx.lineTo(w - 15, h - 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX, midY - 20); ctx.lineTo(15, 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX, midY - 20); ctx.lineTo(w - 15, 10); ctx.stroke();
      
      ctx.setLineDash([]);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(midX, midY - 20); ctx.lineTo(midX - 35, h - 10);
      ctx.moveTo(midX, midY - 20); ctx.lineTo(midX + 35, h - 10);
      ctx.stroke();
      ctx.fillText('One-Point Perspective (All converging lines meet at V.P.)', 15, 20);

    } else if (preset === 'two-point') {
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(10, midY - 10); ctx.lineTo(w - 10, midY - 10); ctx.stroke();

      const vpL = 50, vpR = w - 50, vpY = midY - 10;
      ctx.beginPath(); ctx.arc(vpL, vpY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(vpR, vpY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('V.P. Left', vpL - 25, vpY - 10);
      ctx.fillText('V.P. Right', vpR - 25, vpY - 10);

      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(midX, midY - 40); ctx.lineTo(midX, h - 20); ctx.stroke();

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(vpL, vpY); ctx.lineTo(midX, midY - 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vpL, vpY); ctx.lineTo(midX, h - 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vpR, vpY); ctx.lineTo(midX, midY - 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vpR, vpY); ctx.lineTo(midX, h - 20); ctx.stroke();

      ctx.setLineDash([]);
      ctx.strokeStyle = '#334155';
      ctx.fillText('Two-Point Perspective (Lines meet at two vanishing points)', 15, 20);

    } else if (preset === 'three-point') {
      ctx.lineWidth = 1.5;
      const horizonY = h - 45;
      ctx.beginPath(); ctx.moveTo(10, horizonY); ctx.lineTo(w - 10, horizonY); ctx.stroke();

      const vpL = 50, vpR = w - 50, vpT = midX, vpTY = 15;
      ctx.beginPath(); ctx.arc(vpL, horizonY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(vpR, horizonY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(vpT, vpTY, 3, 0, Math.PI * 2); ctx.fill();
      
      ctx.fillText('V.P. Left', vpL - 25, horizonY + 14);
      ctx.fillText('V.P. Right', vpR - 25, horizonY + 14);
      ctx.fillText('3rd V.P. (Zenith)', vpT - 50, vpTY - 5);

      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(midX, 45); ctx.lineTo(midX, horizonY - 15); ctx.stroke();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath(); ctx.moveTo(midX - 45, 60); ctx.lineTo(midX - 58, horizonY - 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX + 45, 60); ctx.lineTo(midX + 58, horizonY - 15); ctx.stroke();

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(vpL, horizonY); ctx.lineTo(midX, 45); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vpL, horizonY); ctx.lineTo(midX, horizonY - 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vpR, horizonY); ctx.lineTo(midX, 45); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vpR, horizonY); ctx.lineTo(midX, horizonY - 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vpT, vpTY); ctx.lineTo(midX - 58, horizonY - 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vpT, vpTY); ctx.lineTo(midX + 58, horizonY - 15); ctx.stroke();

      ctx.setLineDash([]);
      ctx.strokeStyle = '#334155';
      ctx.fillText('Three-Point Perspective (Zenith VP + Left/Right VPs)', 15, 20);

    } else if (preset === 'anatomy-head') {
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(80, 30); ctx.lineTo(80, h - 20); ctx.stroke();
      const spacing = (h - 50) / 8;
      for (let i = 0; i <= 8; i++) {
        const y = 30 + i * spacing;
        ctx.beginPath(); ctx.moveTo(75, y); ctx.lineTo(85, y); ctx.stroke();
        ctx.fillText(`${i} Head${i > 1 ? 's' : ''}`, 90, y + 4);
      }
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(250, 30 + spacing/2, spacing/2 - 2, 0, Math.PI * 2);
      ctx.moveTo(250, 30 + spacing); ctx.lineTo(250, 30 + 1.3 * spacing);
      ctx.moveTo(225, 30 + 1.3 * spacing); ctx.lineTo(275, 30 + 1.3 * spacing);
      ctx.lineTo(270, 30 + 3.5 * spacing); ctx.lineTo(230, 30 + 3.5 * spacing); ctx.closePath();
      ctx.moveTo(225, 30 + 1.3 * spacing); ctx.lineTo(220, 30 + 2.5 * spacing); ctx.lineTo(218, 30 + 3.5 * spacing);
      ctx.moveTo(275, 30 + 1.3 * spacing); ctx.lineTo(280, 30 + 2.5 * spacing); ctx.lineTo(282, 30 + 3.5 * spacing);
      ctx.moveTo(250, 30 + 3.5 * spacing); ctx.lineTo(250, 30 + 4 * spacing);
      ctx.moveTo(235, 30 + 4 * spacing); ctx.lineTo(232, 30 + 6 * spacing); ctx.lineTo(230, h - 20);
      ctx.moveTo(265, 30 + 4 * spacing); ctx.lineTo(268, 30 + 6 * spacing); ctx.lineTo(270, h - 20);
      ctx.stroke();
      ctx.fillText('Human Anatomy: 8-Heads Tall Proportion Standard', 15, 20);

    } else if (preset === 'anatomy-face') {
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(midX, midY, 55, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(midX, 25); ctx.lineTo(midX, h - 25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 65, midY); ctx.lineTo(midX + 65, midY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 35, midY + 25); ctx.lineTo(midX + 35, midY + 25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 25, midY + 40); ctx.lineTo(midX + 25, midY + 40); ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(midX - 22, midY, 8, 4, 0, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(midX + 22, midY, 8, 4, 0, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 5, midY + 15); ctx.lineTo(midX, midY + 25); ctx.lineTo(midX + 5, midY + 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 15, midY + 40); ctx.bezierCurveTo(midX - 5, midY + 43, midX + 5, midY + 43, midX + 15, midY + 40); ctx.stroke();
      ctx.fillText('Eyes (Center)', midX + 75, midY + 4);
      ctx.fillText('Nose (1/4 Line)', midX + 75, midY + 28);
      ctx.fillText('Mouth (1/8 Line)', midX + 75, midY + 44);
      ctx.fillText('Human Figure Proportions: Face Grid Guides', 15, 20);

    } else if (preset === 'anatomy-pose') {
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(midX - 30, 45, 10, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 30, 55); ctx.lineTo(midX - 10, 95); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX - 26, 62); ctx.lineTo(midX - 50, 70); ctx.lineTo(midX - 45, 50);
      ctx.moveTo(midX - 26, 62); ctx.lineTo(midX - 10, 68); ctx.lineTo(midX - 5, 88);
      ctx.moveTo(midX - 10, 95); ctx.lineTo(midX - 35, 125); ctx.lineTo(midX - 20, h - 25);
      ctx.moveTo(midX - 10, 95); ctx.lineTo(midX + 15, 115); ctx.lineTo(midX + 5, h - 25);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      const joints = [{x: midX - 26, y: 62}, {x: midX - 50, y: 70}, {x: midX - 10, y: 68}, {x: midX - 10, y: 95}, {x: midX - 35, y: 125}, {x: midX + 15, y: 115}];
      joints.forEach(j => { ctx.beginPath(); ctx.arc(j.x, j.y, 4, 0, Math.PI*2); ctx.fill(); });
      ctx.fillStyle = '#0f172a';
      ctx.fillText('Gesture drawing: Action stick figure showing joint angles', 15, 20);

    } else if (preset === 'still-life') {
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(50, h - 30); ctx.lineTo(w - 50, h - 30); ctx.stroke();
      ctx.strokeRect(midX - 80, h - 105, 45, 75);
      ctx.beginPath(); ctx.ellipse(midX - 57.5, h - 105, 22.5, 8, 0, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(midX - 57.5, h - 30, 22.5, 8, 0, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(midX, h - 55, 25, 0, Math.PI*2); ctx.stroke();
      ctx.strokeRect(midX + 45, h - 85, 55, 55);
      ctx.beginPath();
      ctx.moveTo(midX + 45, h - 85); ctx.lineTo(midX + 65, h - 105);
      ctx.lineTo(midX + 120, h - 105); ctx.lineTo(midX + 100, h - 85);
      ctx.moveTo(midX + 100, h - 30); ctx.lineTo(midX + 120, h - 50);
      ctx.lineTo(midX + 120, h - 105);
      ctx.stroke();
      ctx.fillText('Still Life Grouping: Sphere, Cylinder & Cube', 15, 20);

    } else if (preset === 'still-shading') {
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(midX, midY + 10, 45, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(50, h - 25); ctx.lineTo(w - 50, h - 25); ctx.stroke();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath(); ctx.ellipse(midX + 45, h - 27, 45, 12, 0, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      for (let r = 5; r <= 45; r += 8) {
        ctx.beginPath(); ctx.ellipse(midX + 10, midY + 15, r, r - 3, Math.PI/4, 0, Math.PI, true); ctx.stroke();
      }
      ctx.strokeStyle = '#334155';
      ctx.fillText('Light Source (top-left)', midX - 160, 45);
      ctx.beginPath(); ctx.moveTo(midX - 140, 50); ctx.lineTo(midX - 85, 80); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 95, 80); ctx.lineTo(midX - 85, 80); ctx.lineTo(midX - 90, 72); ctx.stroke();
      ctx.fillText('Highlight', midX - 45, midY - 20);
      ctx.fillText('Core Shadow', midX + 35, midY + 30);
      ctx.fillText('Cast Shadow', midX + 50, h - 10);
      ctx.fillText('Light & Shadow: Rendering Form Shading', 15, 20);

    } else if (preset === 'folk-warli') {
      ctx.lineWidth = 2.5;
      const dancers = [midX - 120, midX - 40, midX + 40, midX + 120];
      dancers.forEach(dx => {
        ctx.beginPath(); ctx.arc(dx, midY - 30, 8, 0, Math.PI*2); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(dx - 12, midY - 18); ctx.lineTo(dx + 12, midY - 18);
        ctx.lineTo(dx, midY); ctx.closePath();
        ctx.moveTo(dx - 12, midY + 18); ctx.lineTo(dx + 12, midY + 18);
        ctx.lineTo(dx, midY); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(dx - 4, midY + 18); ctx.lineTo(dx - 16, midY + 35); ctx.lineTo(dx - 12, h - 20);
        ctx.moveTo(dx + 4, midY + 18); ctx.lineTo(dx + 16, midY + 35); ctx.lineTo(dx + 20, h - 20);
        ctx.moveTo(dx - 8, midY - 10); ctx.lineTo(dx - 25, midY - 20); ctx.lineTo(dx - 35, midY - 30);
        ctx.moveTo(dx + 8, midY - 10); ctx.lineTo(dx + 25, midY - 20); ctx.lineTo(dx + 35, midY - 30);
        ctx.stroke();
      });
      ctx.fillText('Indian Folk Art: Warli Tribe Stick Figurative Composition', 15, 20);

    } else if (preset === 'folk-madhubani') {
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(midX - 180, midY);
      ctx.bezierCurveTo(midX - 120, midY - 60, midX + 50, midY - 60, midX + 120, midY);
      ctx.bezierCurveTo(midX + 50, midY + 60, midX - 120, midY + 60, midX - 180, midY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX + 120, midY);
      ctx.lineTo(midX + 170, midY - 40); ctx.lineTo(midX + 150, midY); ctx.lineTo(midX + 170, midY + 40);
      ctx.closePath(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX - 20, midY - 42); ctx.bezierCurveTo(midX - 10, midY - 70, midX + 20, midY - 70, midX + 10, midY - 42); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX - 20, midY + 42); ctx.bezierCurveTo(midX - 10, midY + 70, midX + 20, midY + 70, midX + 10, midY + 42); ctx.stroke();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      for (let i = -140; i < 110; i += 18) {
        ctx.beginPath(); ctx.moveTo(midX + i, midY - 35); ctx.lineTo(midX + i - 15, midY + 35); ctx.stroke();
      }
      ctx.strokeStyle = '#334155';
      ctx.beginPath(); ctx.arc(midX - 120, midY - 8, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillText('Indian Folk Art: Madhubani Fish (Double border, Kachni lines)', 15, 20);

    } else if (preset === 'folk-kalamkari') {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(midX - 80, h - 25);
      ctx.bezierCurveTo(midX - 140, midY - 10, midX - 30, midY - 70, midX, 35);
      ctx.bezierCurveTo(midX + 30, midY - 70, midX + 140, midY - 10, midX + 80, h - 25);
      ctx.bezierCurveTo(midX + 30, h - 45, midX - 30, h - 45, midX - 80, h - 25);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX, h - 35);
      ctx.quadraticCurveTo(midX - 20, midY - 10, midX, 40);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      for (let y = 60; y < h - 45; y += 15) {
        ctx.beginPath(); ctx.moveTo(midX, y); ctx.quadraticCurveTo(midX - 45, y + 10, midX - 60, y - 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(midX, y); ctx.quadraticCurveTo(midX + 45, y + 10, midX + 60, y - 5); ctx.stroke();
      }
      ctx.strokeStyle = '#334155';
      ctx.fillText('Indian Folk Art: Kalamkari Decorative Paisley Motif', 15, 20);

    } else if (preset === 'origami-folds') {
      ctx.lineWidth = 1.5;
      ctx.strokeRect(midX - 150, midY - 60, 100, 100);
      ctx.fillText('Square Sheet', midX - 135, midY + 60);
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(midX - 150, midY - 60); ctx.lineTo(midX - 50, midY + 40); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(midX + 50, midY - 60); ctx.lineTo(midX + 150, midY + 40); ctx.lineTo(midX + 50, midY + 40);
      ctx.closePath(); ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#a5f3fc';
      ctx.beginPath(); ctx.arc(midX - 10, midY - 10, 20, Math.PI, Math.PI*1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 10, midY - 33); ctx.lineTo(midX - 5, midY - 30); ctx.lineTo(midX - 12, midY - 25); ctx.stroke();
      ctx.strokeStyle = '#334155';
      ctx.fillText('Origami Fold: Valley Fold line & Direction arrow', 15, 20);

    } else if (preset === 'origami-crane') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(midX - 100, midY + 20);
      ctx.lineTo(midX - 30, midY - 10);
      ctx.lineTo(midX, 40);
      ctx.lineTo(midX - 10, midY + 20);
      ctx.lineTo(midX + 40, midY - 20);
      ctx.lineTo(midX + 65, midY - 18);
      ctx.lineTo(midX + 30, midY + 10);
      ctx.lineTo(midX - 10, midY + 40);
      ctx.closePath(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX - 30, midY - 10); ctx.lineTo(midX - 10, midY + 40);
      ctx.moveTo(midX, 40);             ctx.lineTo(midX - 10, midY + 40);
      ctx.stroke();
      ctx.fillText('Origami Construction: Paper Crane creases & facets', 15, 20);

    } else if (preset === 'origami-valley') {
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(50, midY - 25); ctx.lineTo(190, midY - 25); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText('Valley Fold (Folds Forward)', 45, midY - 35);
      ctx.setLineDash([8, 2, 2, 2]);
      ctx.beginPath(); ctx.moveTo(midX + 20, midY - 25); ctx.lineTo(w - 50, midY - 25); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText('Mountain Fold (Folds Backward)', midX + 20, midY - 35);
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(120, midY + 25, 15, 0, Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(135, midY + 22); ctx.lineTo(135, midY + 30); ctx.lineTo(142, midY + 22); ctx.stroke();
      ctx.fillText('Valley Arrow', 150, midY + 28);
      ctx.fillText('Origami Symbols: Valley Fold vs. Mountain Fold', 15, 20);

    } else if (preset === 'texture-crosshatch') {
      ctx.strokeRect(midX - 60, midY - 35, 70, 70);
      ctx.lineWidth = 1;
      for (let i = -50; i <= 10; i += 6) {
        ctx.beginPath(); ctx.moveTo(midX + i, midY - 35); ctx.lineTo(midX + i + 50, midY + 35); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      for (let i = -50; i <= 10; i += 6) {
        ctx.beginPath(); ctx.moveTo(midX + i + 50, midY - 35); ctx.lineTo(midX + i, midY + 35); ctx.stroke();
      }
      ctx.strokeStyle = '#334155';
      ctx.fillText('Crosshatching shading style (dense overlapping)', 15, 20);

    } else if (preset === 'texture-stipple') {
      ctx.strokeRect(midX - 100, midY - 30, 200, 60);
      for(let x=midX-95; x < midX+95; x+=4) {
        const count = Math.floor((midX + 95 - x) / 10);
        for(let i=0; i<count; i++) {
          ctx.fillRect(x + Math.random()*8 - 4, midY - 25 + Math.random()*50, 1.5, 1.5);
        }
      }
      ctx.fillText('Stippling Texture (Variable Dot Density shading)', 15, 20);

    } else if (preset === 'texture-sponge') {
      ctx.strokeRect(midX - 100, midY - 30, 200, 60);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      for(let i=0; i<150; i++) {
        ctx.beginPath();
        ctx.arc(midX - 90 + Math.random()*180, midY - 20 + Math.random()*40, Math.random()*5 + 2, 0, Math.PI*2);
        ctx.stroke();
      }
      ctx.strokeStyle = '#334155';
      ctx.fillText('Organic Sponge Painting texturing effects', 15, 20);

    } else if (preset === 'landscape-planes') {
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(50, h - 30); ctx.lineTo(midX - 60, h - 75); ctx.lineTo(midX + 80, h - 30); ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(30, h - 30); ctx.quadraticCurveTo(midX - 10, h - 55, midX + 120, h - 30); ctx.stroke();
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(10, h - 25); ctx.quadraticCurveTo(midX + 30, h - 35, w - 10, h - 20); ctx.stroke();
      ctx.fillText('Background (Atmospheric depth)', midX - 60, h - 90);
      ctx.fillText('Foreground (Details/Values)', midX - 120, h - 6);
      ctx.fillText('Landscape Planes: Foreground, Midground, & Background', 15, 20);

    } else if (preset === 'landscape-mountain') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, h - 25); ctx.lineTo(130, 65); ctx.lineTo(250, h - 25);
      ctx.moveTo(180, h - 25); ctx.lineTo(310, 45); ctx.lineTo(440, h - 25);
      ctx.moveTo(360, h - 25); ctx.lineTo(480, 85); ctx.lineTo(w - 30, h - 25);
      ctx.stroke();
      ctx.fillText('Overlapping Ridgelines (Creates spatial perspective)', 15, 20);

    } else if (preset === 'landscape-tree') {
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(midX, h - 25); ctx.lineTo(midX, h - 85); ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(midX, h - 85); ctx.lineTo(midX - 35, h - 115);
      ctx.moveTo(midX, h - 85); ctx.lineTo(midX + 35, h - 115);
      ctx.moveTo(midX - 35, h - 115); ctx.lineTo(midX - 55, h - 135);
      ctx.moveTo(midX - 35, h - 115); ctx.lineTo(midX - 15, h - 135);
      ctx.moveTo(midX + 35, h - 115); ctx.lineTo(midX + 15, h - 135);
      ctx.moveTo(midX + 35, h - 115); ctx.lineTo(midX + 55, h - 135);
      ctx.stroke();
      ctx.fillText('Deciduous Branch Bifurcation Structure', 15, 20);

    } else if (preset === 'ben-vowels') {
      ctx.font = '24px sans-serif';
      ctx.fillText('অ  আ  ই  ঈ  উ  ঊ  ঋ  এ  ঐ  ও  ঔ', 30, midY);
      ctx.font = '11px monospace';
      ctx.fillText('Bengali Vowels (স্বরবর্ণ)', 15, 20);

    } else if (preset === 'ben-joiner') {
      ctx.font = '18px sans-serif';
      ctx.fillText('ক্ + ষ = ক্ষ  |  জ্ + ঞ = জ্ঞ  |  হ্ + ম = হ্ম', 30, midY);
      ctx.font = '11px monospace';
      ctx.fillText('Bengali Conjunct Characters (যুক্তাক্ষর রূপ)', 15, 20);

    } else if (preset === 'ben-word') {
      ctx.font = '20px sans-serif';
      ctx.fillText('ব + ন = বন  |  ক + ল + ম = কলম', 30, midY);
      ctx.font = '11px monospace';
      ctx.fillText('Bengali Word Construction (শব্দ গঠন)', 15, 20);

    } else if (preset === 'ben-sandhi') {
      ctx.font = '16px sans-serif';
      ctx.fillText('দেব + আলয় = দেবালয়  |  বিদ্যা + আলয় = বিদ্যালয়', 30, midY);
      ctx.font = '11px monospace';
      ctx.fillText('Bengali Grammar: Sandhi (সন্ধি বিচ্ছেদ)', 15, 20);

    } else if (preset === 'ben-karak') {
      ctx.fillText('কারক ও বিভক্তি (Karaks Case System):', 30, 45);
      ctx.fillText('১. কর্তৃ কারক (Nominative)  ২. কর্ম কারক (Accusative)', 30, 70);
      ctx.fillText('৩. করণ কারক (Instrumental)  ৪. সম্প্রদান কারক (Dative)', 30, 95);
      ctx.fillText('৫. অপাদান কারক (Ablative)    ৬. অধিকরণ কারক (Locative)', 30, 120);
      ctx.fillText('Bengali Case System (কারক বিভক্তি)', 15, 20);

    } else if (preset === 'ben-samas') {
      ctx.fillText('সমাস প্রকারভেদ (Types of Compounds):', 30, 45);
      ctx.fillText('দ্বন্দ্ব সমাস, তৎপুরুষ সমাস, বহুব্রীহি সমাস, দ্বিগু সমাস, কর্মধারয় সমাস', 30, 80);
      ctx.fillText('Bengali Grammar: Samas (সমাস গঠন)', 15, 20);

    } else if (preset === 'ben-lit-analysis') {
      ctx.fillText('সাহিত্য বিশ্লেষণ ফ্রেমওয়ার্ক (Literature Analysis):', 30, 45);
      ctx.fillText('চরিত্র (Character) ── ভাবার্থ (Theme) ── শৈলী (Style) ── ভাষা (Language)', 30, 85);
      ctx.fillText('Bengali Literary Analysis', 15, 20);

    } else if (preset === 'ben-lit-timeline') {
      ctx.fillText('বাংলা সাহিত্যের ইতিহাস (Timeline):', 30, 45);
      ctx.fillText('প্রাচীন যুগ (চর্যাপদ: ৯৫০-১২০০) ──> মধ্য যুগ (১২০১-১৮০০) ──> আধুনিক যুগ (১৮০১-বর্তমান)', 30, 85);
      ctx.fillText('Bengali Literature Timeline', 15, 20);

    } else if (preset === 'ben-char-map') {
      ctx.fillText('চরিত্র চিত্রণ ওয়েব (Character Mapping Web):', 30, 45);
      ctx.strokeRect(midX - 70, midY - 20, 140, 40);
      ctx.fillText('প্রধান চরিত্র', midX - 35, midY + 5);
      ctx.beginPath(); ctx.moveTo(midX - 70, midY); ctx.lineTo(midX - 150, midY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX + 70, midY); ctx.lineTo(midX + 150, midY); ctx.stroke();
      ctx.fillText('গুণাবলী', midX - 200, midY + 5);
      ctx.fillText('দ্বন্দ্ব', midX + 160, midY + 5);
      ctx.fillText('Bengali Character Mapping', 15, 20);

    } else if (preset === 'hin-varnamala') {
      ctx.font = '24px sans-serif';
      ctx.fillText('अ  आ  इ  ई  उ  ऊ  ऋ  ए  ऐ  ओ  औ', 30, midY);
      ctx.font = '11px monospace';
      ctx.fillText('Hindi Vowels (स्वरमाला)', 15, 20);

    } else if (preset === 'hin-grammar') {
      ctx.font = '16px sans-serif';
      ctx.fillText('संज्ञा (Noun)  ──>  किसी व्यक्ति, वस्तु या स्थान का नाम', 30, midY - 20);
      ctx.fillText('सर्वनाम (Pronoun) ──> संज्ञा के स्थान पर प्रयुक्त होने वाले शब्द', 30, midY + 20);
      ctx.font = '11px monospace';
      ctx.fillText('Hindi Nouns & Pronouns (संज्ञा और सर्वनाम)', 15, 20);

    } else if (preset === 'hin-words') {
      ctx.font = '18px sans-serif';
      ctx.fillText('विलोम: दिन ── रात  |  समानार्थक: सूर्य ── सूरज, दिनकर', 30, midY);
      ctx.font = '11px monospace';
      ctx.fillText('Hindi Vocabulary (विलोम और पर्यायवाची शब्द)', 15, 20);

    } else if (preset === 'hin-doha') {
      ctx.font = '14px sans-serif';
      ctx.fillText('कबीर दोहा: "काल करै सो आज कर, आज करै सो अब।', 30, midY - 15);
      ctx.fillText('पल में परलय होइगी, बहुरी करैगो कब॥"', 30, midY + 15);
      ctx.font = '11px monospace';
      ctx.fillText('Hindi Dohas (कबीर/रहीम के दोहे)', 15, 20);

    } else if (preset === 'hin-sandhi') {
      ctx.font = '16px sans-serif';
      ctx.fillText('हिम + आलय =  हिमालय  |  सत्य + आग्रही = सत्याग्रही', 30, midY);
      ctx.font = '11px monospace';
      ctx.fillText('Hindi Grammar: Sandhi (संधि विच्छेद)', 15, 20);

    } else if (preset === 'hin-idioms') {
      ctx.font = '16px sans-serif';
      ctx.fillText('मुहावरा: "अंगूठा दिखाना" (साफ मना करना)', 30, midY - 15);
      ctx.fillText('लोकोक्ति: "अधजल गगरी छलकत जाए" (अधूरा ज्ञान प्रदर्शन)', 30, midY + 15);
      ctx.font = '11px monospace';
      ctx.fillText('Hindi Idioms & Proverbs (मुहावरे और लोकोक्तियाँ)', 15, 20);

    } else if (preset === 'hin-premchand') {
      ctx.fillText('मुंशी प्रेमचंद की कृतियाँ (Works of Munshi Premchand):', 30, 45);
      ctx.fillText('१. गोदान (उपन्यास)   २. गबन (उपन्यास)   ३. ईदगाह (कहानी)', 30, 80);
      ctx.fillText('४. नमक का दरोगा (कहानी)  ५. पूस की रात (कहानी)', 30, 115);
      ctx.fillText('Hindi Literature: Munshi Premchand stories', 15, 20);

    } else if (preset === 'hin-history') {
      ctx.fillText('हिंदी साहित्य का इतिहास (History of Hindi Literature):', 30, 45);
      ctx.fillText('आदिकाल ──> भक्तिकाल (स्वर्ण युग) ──> रीतिकाल ──> आधुनिक काल', 30, 85);
      ctx.fillText('Hindi Literature History Eras', 15, 20);

    } else if (preset === 'hin-essay') {
      ctx.fillText('निबंध प्रारूप (Essay Structure Outline):', 30, 45);
      ctx.fillText('प्रस्तावना (Introduction) ──> मुख्य भाग (Body Content) ──> उपसंहार (Conclusion)', 30, 85);
      ctx.fillText('Hindi Essay Format Outline', 15, 20);

    } else if (preset === 'urd-alphabets') {
      ctx.font = '24px sans-serif';
      ctx.fillText('ا  ب  پ  ت  ٹ  ث  ج  چ  ح  خ  د  ڈ  ذ  ر  ڑ  ز  ژ', 30, midY);
      ctx.font = '11px monospace';
      ctx.fillText('Urdu Alphabets (حروفِ تہجی)', 15, 20);

    } else if (preset === 'urd-phonics') {
      ctx.font = '20px sans-serif';
      ctx.fillText('ب + ا + غ = باغ  |  ف + و + ج = فوج', 30, midY);
      ctx.font = '11px monospace';
      ctx.fillText('Urdu Word Phonics (الفاظ کی بناوٹ)', 15, 20);

    } else if (preset === 'urd-poems') {
      ctx.font = '18px sans-serif';
      ctx.fillText('ہم قافیہ الفاظ: بات ── رات  |  دل ── مل', 30, midY);
      ctx.font = '11px monospace';
      ctx.fillText('Urdu Rhymes (ہم قافیہ الفاظ)', 15, 20);

    } else if (preset === 'urd-grammar') {
      ctx.font = '16px sans-serif';
      ctx.fillText('اسم (Noun)  ──>  کسی شخص، جگہ یا چیز کا نام', 30, midY - 20);
      ctx.fillText('فعل (Verb)  ──>  کسی کام کا کرنا یا ہونا', 30, midY + 20);
      ctx.font = '11px monospace';
      ctx.fillText('Urdu Grammar Basics (اسم اور فعل)', 15, 20);

    } else if (preset === 'urd-iqbal') {
      ctx.font = '16px sans-serif';
      ctx.fillText('"عقابی روح جب بیدار ہوتی ہے جوانوں میں', 30, midY - 15);
      ctx.fillText('نظر آتی ہے ان کو اپنی منزل آسمانوں میں"', 30, midY + 15);
      ctx.font = '11px monospace';
      ctx.fillText('Urdu Poetry: Allama Iqbal (شاعری علامہ اقبال)', 15, 20);

    } else if (preset === 'urd-letters') {
      ctx.fillText('مکتوب نگاری کا خاکہ (Letter Writing Format):', 30, 45);
      ctx.fillText('القاب و آداب ──> نفسِ مضمون (باڈی) ──> خاتمہ (الوداعی کلمات)', 30, 85);
      ctx.fillText('Urdu Letter Writing Outline', 15, 20);

    } else if (preset === 'urd-ghazal') {
      ctx.fillText('غزل کی تشریح کا اصول (Ghazal Interpretation Guide):', 30, 45);
      ctx.fillText('مطلع (پہلا شعر) ──> مقطع (آخری شعر جس میں تخلص ہو) ──> ردیف و قافیہ', 30, 85);
      ctx.fillText('Urdu Ghazal Analysis (غزل تشریح)', 15, 20);

    } else if (preset === 'urd-premchand') {
      ctx.fillText('پریم چند کے اردو افسانے (Urdu Stories of Premchand):', 30, 45);
      ctx.fillText('۱. کفن   ۲. زیور کا ڈبہ   ۳. حجِ اکبر   ۴. بوڑھی کاکی', 30, 85);
      ctx.fillText('Urdu Literature: Premchand Stories', 15, 20);

    } else if (preset === 'urd-terms') {
      ctx.fillText('ادبی اصطلاحات (Literary Terms):', 30, 45);
      ctx.fillText('تشبیہ (Simile) ── استعارہ (Metaphor) ── تلمیح (Allusion)', 30, 85);
      ctx.fillText('Urdu Literary Terms', 15, 20);

    } else if (preset === 'eng-svo') {
      ctx.font = '14px monospace';
      ctx.strokeRect(40, midY - 20, 100, 35); ctx.fillText('SUBJECT', 60, midY + 3);
      ctx.beginPath(); ctx.moveTo(140, midY); ctx.lineTo(190, midY); ctx.stroke();
      ctx.strokeRect(190, midY - 20, 100, 35); ctx.fillText('VERB', 225, midY + 3);
      ctx.beginPath(); ctx.moveTo(290, midY); ctx.lineTo(340, midY); ctx.stroke();
      ctx.strokeRect(340, midY - 20, 100, 35); ctx.fillText('OBJECT', 370, midY + 3);
      ctx.fillText('Example: "The teacher  explains  the topic."', 45, h - 20);
      ctx.fillText('English Grammar: Sentence Structure (S-V-O)', 15, 20);

    } else if (preset === 'eng-speech-flow') {
      ctx.fillText('Direct Speech: She said, "I am teaching."', 30, midY - 20);
      ctx.fillText('Indirect Speech: She said that she was teaching.', 30, midY + 20);
      ctx.fillText('English Grammar: Direct vs Indirect Speech', 15, 20);

    } else if (preset === 'eng-tense') {
      ctx.beginPath(); ctx.moveTo(30, midY); ctx.lineTo(w - 30, midY); ctx.stroke();
      ctx.beginPath(); ctx.arc(midX, midY, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillText('Present', midX - 20, midY + 20);
      ctx.beginPath(); ctx.arc(midX - 150, midY, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillText('Past', midX - 160, midY + 20);
      ctx.beginPath(); ctx.arc(midX + 150, midY, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillText('Future', midX + 140, midY + 20);
      ctx.fillText('English Grammar: Tense Timeline', 15, 20);

    } else if (preset === 'eng-rhyme') {
      ctx.fillText('Rhyme Scheme AABB Example:', 30, 45);
      ctx.fillText('Twinkle, twinkle, little star,       (A)', 30, 75);
      ctx.fillText('How I wonder what you are!          (A)', 30, 100);
      ctx.fillText('Up above the world so high,         (B)', 30, 125);
      ctx.fillText('Like a diamond in the sky.          (B)', 30, 150);
      ctx.fillText('English Poetry Rhyme Scheme Analysis', 15, 20);

    } else if (preset === 'eng-drama') {
      ctx.beginPath();
      ctx.moveTo(40, h - 25);
      ctx.lineTo(midX - 50, h - 90);
      ctx.lineTo(midX, 40);
      ctx.lineTo(midX + 80, h - 60);
      ctx.lineTo(w - 40, h - 25);
      ctx.stroke();
      ctx.fillText('Exposition', 30, h - 10);
      ctx.fillText('Climax', midX - 20, 32);
      ctx.fillText('Resolution', w - 80, h - 10);
      ctx.fillText('Drama Structure: Freytag\'s Plot Pyramid', 15, 20);

    } else if (preset === 'eng-devices') {
      ctx.fillText('Literary Devices Definitions:', 30, 45);
      ctx.fillText('1. Simile: Comparison using "like/as" (e.g., brave as a lion)', 30, 75);
      ctx.fillText('2. Metaphor: Direct comparison (e.g., time is a thief)', 30, 105);
      ctx.fillText('3. Personification: Human traits to non-human (e.g., wind whispered)', 30, 135);
      ctx.fillText('English Literary Devices & Figures of Speech', 15, 20);

    } else if (preset === 'comm-needs') {
      ctx.beginPath(); ctx.moveTo(midX, 40); ctx.lineTo(midX, h - 20); ctx.stroke();
      ctx.fillText('NEEDS (Essential for Survival)', 40, 50);
      ctx.fillText('• Food & Water  • Shelter  • Healthcare', 40, 85);
      ctx.fillText('WANTS (Desires, not Essential)', midX + 30, 50);
      ctx.fillText('• Video Games  • Designer Clothes  • Luxury Car', midX + 30, 85);
      ctx.fillText('Commerce Basics: Wants vs Needs', 15, 20);

    } else if (preset === 'comm-budget') {
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(midX - 70, midY, 40, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 70, midY); ctx.lineTo(midX - 70, midY - 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 70, midY); ctx.lineTo(midX - 30, midY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 70, midY); ctx.lineTo(midX - 70 - 28, midY + 28); ctx.stroke();
      ctx.fillText('Savings (25%)', midX + 20, midY - 20);
      ctx.fillText('Needs/Rent (50%)', midX + 20, midY + 5);
      ctx.fillText('Wants/Fun (25%)', midX + 20, midY + 30);
      ctx.fillText('Basic Household Budget Allocation', 15, 20);

    } else if (preset === 'comm-barter') {
      ctx.strokeRect(40, midY - 25, 120, 50); ctx.fillText('Trader A (Has Apples)', 48, midY + 4);
      ctx.strokeRect(w - 160, midY - 25, 120, 50); ctx.fillText('Trader B (Has Rice)', w - 152, midY + 4);
      ctx.beginPath(); ctx.moveTo(165, midY - 10); ctx.lineTo(w - 165, midY - 10); ctx.stroke();
      ctx.fillText('Apples ──>', midX - 30, midY - 16);
      ctx.beginPath(); ctx.moveTo(w - 165, midY + 10); ctx.lineTo(165, midY + 10); ctx.stroke();
      ctx.fillText('<── Rice', midX - 30, midY + 24);
      ctx.fillText('Barter System: Double Coincidence of Wants', 15, 20);

    } else if (preset === 'comm-supply-demand') {
      ctx.beginPath(); ctx.moveTo(40, 40); ctx.lineTo(40, h - 30); ctx.lineTo(w - 50, h - 30); ctx.stroke();
      ctx.fillText('Price', 10, 48);
      ctx.fillText('Quantity', w - 100, h - 14);
      ctx.beginPath(); ctx.moveTo(55, h - 45); ctx.lineTo(midX + 100, 50); ctx.stroke();
      ctx.fillText('Supply (S)', midX + 110, 55);
      ctx.beginPath(); ctx.moveTo(55, 50); ctx.lineTo(midX + 100, h - 45); ctx.stroke();
      ctx.fillText('Demand (D)', midX + 110, h - 40);
      ctx.beginPath(); ctx.arc(midX - 10, midY - 12, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillText('Equilibrium (P*, Q*)', midX + 2, midY - 12);
      ctx.fillText('Market Supply and Demand Curves', 15, 20);

    } else if (preset === 'comm-gst') {
      ctx.fillText('Goods & Services Tax (GST) Slabs in India:', 30, 45);
      ctx.strokeRect(30, 70, 70, 40); ctx.fillText('0% (Exempt)', 34, 94);
      ctx.strokeRect(110, 70, 70, 40); ctx.fillText('5% (Basic)', 116, 94);
      ctx.strokeRect(190, 70, 70, 40); ctx.fillText('12% (Std-1)', 193, 94);
      ctx.strokeRect(270, 70, 70, 40); ctx.fillText('18% (Std-2)', 273, 94);
      ctx.strokeRect(350, 70, 70, 40); ctx.fillText('28% (Luxury)', 353, 94);
      ctx.fillText('Indirect Taxation Structure (One Nation One Tax)', 15, 20);

    } else if (preset === 'comm-interest') {
      ctx.font = '14px monospace';
      ctx.fillText('Simple Interest (SI) = (P × R × T) / 100', 30, midY - 15);
      ctx.fillText('Compound Interest (CI) = P(1 + R/100)^T - P', 30, midY + 25);
      ctx.font = '11px monospace';
      ctx.fillText('Financial Math: P = Principal, R = Rate, T = Time', 15, 20);

    } else if (preset === 'comm-ledger') {
      ctx.fillText('Cash Account (T-Ledger):', 30, 45);
      ctx.beginPath(); ctx.moveTo(60, 60); ctx.lineTo(w - 60, 60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX, 60); ctx.lineTo(midX, h - 20); ctx.stroke();
      ctx.fillText('Debit (Dr.)', 70, 52); ctx.fillText('Credit (Cr.)', midX + 20, 52);
      ctx.fillText('To Capital   $10,000', 70, 85);
      ctx.fillText('To Sales     $2,500', 70, 110);
      ctx.fillText('By Purchases  $4,000', midX + 20, 85);
      ctx.fillText('By Rent       $1,000', midX + 20, 110);
      ctx.fillText('Accounting: Double Entry Bookkeeping', 15, 20);

    } else if (preset === 'comm-trialbalance') {
      ctx.fillText('Trial Balance Sheet Template:', 30, 45);
      ctx.strokeRect(40, 60, w - 80, h - 90);
      ctx.beginPath(); ctx.moveTo(w - 240, 60); ctx.lineTo(w - 240, h - 30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w - 140, 60); ctx.lineTo(w - 140, h - 30); ctx.stroke();
      ctx.fillText('Particulars', 50, 75); ctx.fillText('Debit ($)', w - 230, 75); ctx.fillText('Credit ($)', w - 130, 75);
      ctx.fillText('Cash / Asset', 50, 100); ctx.fillText('12,500', w - 230, 100);
      ctx.fillText('Capital / Equity', 50, 125); ctx.fillText('12,500', w - 130, 125);
      ctx.fillText('Accounting Ledger Balance sheet', 15, 20);

    } else if (preset === 'comm-balancesheet') {
      ctx.font = '12px monospace';
      ctx.fillText('Balance Sheet Equation: Assets = Liabilities + Capital', 30, 45);
      ctx.strokeRect(40, 60, w - 80, h - 90);
      ctx.beginPath(); ctx.moveTo(midX, 60); ctx.lineTo(midX, h - 30); ctx.stroke();
      ctx.fillText('Assets (What you own)', 50, 75);
      ctx.fillText('• Cash, Buildings, Stock', 50, 100);
      ctx.fillText('Liabilities + Equity (What you owe)', midX + 15, 75);
      ctx.fillText('• Loans, Accounts Payable, Capital', midX + 15, 100);
      ctx.font = '11px monospace';
      ctx.fillText('Financial Statements: Balance Sheet Balance', 15, 20);

    } else if (preset === 'comp-keyboard') {
      ctx.strokeRect(40, 60, w - 80, 85);
      ctx.fillText('[ Esc ] [ F1 ] [ F2 ] [ F3 ] [ F4 ] [ F5 ] [ F6 ] [ F7 ]', 55, 80);
      ctx.fillText('[  ~ ] [ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ] [ 6 ] [ 7 ] [ 8 ] [ 9 ] [ 0 ]', 55, 105);
      ctx.fillText('[ Tab ] [ Q ] [ W ] [ E ] [ R ] [ T ] [ Y ] [ U ] [ I ] [ O ] [ P ]', 55, 130);
      ctx.fillText('Computer Basics: Keyboard Layout', 15, 20);

    } else if (preset === 'comp-paint') {
      ctx.strokeRect(40, 60, 80, 95);
      ctx.fillText('Pencil', 50, 80);
      ctx.fillText('Brush', 50, 100);
      ctx.fillText('Fill', 50, 120);
      ctx.fillText('Eraser', 50, 140);
      ctx.strokeRect(140, 60, w - 180, 95);
      ctx.fillText('(Paint Canvas Drawing Area)', 180, 110);
      ctx.fillText('Creative Drawing in MS Paint Tools', 15, 20);

    } else if (preset === 'comp-io') {
      ctx.beginPath(); ctx.moveTo(midX, 45); ctx.lineTo(midX - 100, 90); ctx.lineTo(midX + 100, 90); ctx.closePath();
      ctx.fillText('Computer System', midX - 45, 45);
      ctx.strokeRect(midX - 160, 90, 100, 35); ctx.fillText('INPUT DEVICE', midX - 150, 112);
      ctx.fillText('• Keyboard  • Mouse  • Mic', midX - 150, 145);
      ctx.strokeRect(midX + 60, 90, 100, 35); ctx.fillText('OUTPUT DEVICE', midX + 68, 112);
      ctx.fillText('• Monitor  • Printer  • Speaker', midX + 68, 145);
      ctx.fillText('Identify Input and Output Devices', 15, 20);

    } else if (preset === 'comp-scratch') {
      ctx.strokeRect(50, 45, 200, 110);
      ctx.fillText('when green flag clicked', 60, 65);
      ctx.strokeRect(60, 75, 160, 25); ctx.fillText('move (10) steps', 70, 92);
      ctx.strokeRect(60, 105, 160, 25); ctx.fillText('say [Hello!] for (2) secs', 70, 122);
      ctx.fillText('Visual Coding Block-Programming in Scratch', 15, 20);

    } else if (preset === 'comp-html') {
      ctx.font = '9px monospace';
      ctx.fillText('<html>', 40, 45);
      ctx.fillText('  <head> <title>My Webpage</title> </head>', 40, 65);
      ctx.fillText('  <body>', 40, 85);
      ctx.fillText('    <h1>Hello World</h1>', 40, 105);
      ctx.fillText('    <p>Introduction to HTML & web design.</p>', 40, 125);
      ctx.fillText('  </body>', 40, 145);
      ctx.fillText('</html>', 40, 165);
      ctx.font = '11px monospace';
      ctx.fillText('HTML Document Structure Tree', midX + 50, 100);

    } else if (preset === 'comp-excel') {
      ctx.strokeRect(40, 60, w - 80, 100);
      ctx.beginPath(); ctx.moveTo(40, 85); ctx.lineTo(w - 40, 85); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(100, 60); ctx.lineTo(100, 160); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(220, 60); ctx.lineTo(220, 160); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(340, 60); ctx.lineTo(340, 160); ctx.stroke();
      ctx.fillText('Cell A1', 50, 78); ctx.fillText('Cell B1', 120, 78); ctx.fillText('Cell C1', 240, 78);
      ctx.fillText('Data A2', 50, 110); ctx.fillText('Data B2', 120, 110); ctx.fillText('Data C2', 240, 110);
      ctx.fillText('Spreadsheet Cell Row & Column Layout', 15, 20);

    } else if (preset === 'comp-python') {
      ctx.fillText('Python Code Example:', 30, 45);
      ctx.fillText('numbers = [1, 2, 3, 4, 5]', 30, 70);
      ctx.fillText('sum = 0', 30, 90);
      ctx.fillText('for num in numbers:', 30, 110);
      ctx.fillText('    sum += num', 30, 130);
      ctx.fillText('print("Sum:", sum)', 30, 150);
      ctx.fillText('Python Loops and List Aggregation', 15, 20);

    } else if (preset === 'comp-sql') {
      ctx.fillText('SQL INNER JOIN Query:', 30, 45);
      ctx.fillText('SELECT u.name, o.item, o.price', 30, 75);
      ctx.fillText('FROM Users u', 30, 95);
      ctx.fillText('INNER JOIN Orders o ON u.id = o.user_id;', 30, 115);
      ctx.fillText('Relational Databases Join Condition', 15, 20);

    } else if (preset === 'comp-network') {
      ctx.fillText('Star Topology vs Bus Topology:', 30, 45);
      ctx.beginPath(); ctx.arc(100, midY, 12, 0, Math.PI*2); ctx.fill();
      ctx.fillText('HUB', 90, midY + 25);
      const nodesStar = [{x: 60, y: midY - 30}, {x: 140, y: midY - 30}, {x: 60, y: midY + 30}, {x: 140, y: midY + 30}];
      nodesStar.forEach(ns => {
        ctx.beginPath(); ctx.moveTo(100, midY); ctx.lineTo(ns.x, ns.y); ctx.stroke();
        ctx.beginPath(); ctx.arc(ns.x, ns.y, 6, 0, Math.PI*2); ctx.fill();
      });
      ctx.beginPath(); ctx.moveTo(midX + 40, midY); ctx.lineTo(w - 40, midY); ctx.stroke();
      ctx.fillText('Bus Backbone', midX + 80, midY - 10);
      const nodesBus = [midX + 60, midX + 110, midX + 160, midX + 210];
      nodesBus.forEach(bx => {
        ctx.beginPath(); ctx.moveTo(bx, midY); ctx.lineTo(bx, midY - 25); ctx.stroke();
        ctx.beginPath(); ctx.arc(bx, midY - 25, 5, 0, Math.PI*2); ctx.fill();
      });
      ctx.fillText('Computer Networks and Topologies', 15, 20);

    } else if (preset === 'math-place') {
      ctx.fillText('Number Place Value Chart:', 30, 45);
      ctx.strokeRect(40, 60, w - 80, 80);
      ctx.beginPath(); ctx.moveTo(40, 100); ctx.lineTo(w - 40, 100); ctx.stroke();
      const colW = (w - 80) / 4;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(40 + i * colW, 60); ctx.lineTo(40 + i * colW, 140); ctx.stroke();
      }
      ctx.fillText('Thousands', 45, 85); ctx.fillText('Hundreds', 45 + colW, 85); ctx.fillText('Tens', 45 + 2 * colW, 85); ctx.fillText('Ones', 45 + 3 * colW, 85);
      ctx.fillText('5', 45 + colW/2, 125); ctx.fillText('2', 45 + 1.5 * colW, 125); ctx.fillText('8', 45 + 2.5 * colW, 125); ctx.fillText('4', 45 + 3.5 * colW, 125);
      ctx.fillText('Mathematics: Number Place Values (5284)', 15, 20);

    } else if (preset === 'math-balance') {
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(midX, h - 25); ctx.lineTo(midX, h - 95); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 70, h - 25); ctx.lineTo(midX + 70, h - 25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 100, h - 95); ctx.lineTo(midX + 100, h - 95); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX - 100, h - 95); ctx.lineTo(midX - 120, h - 60); ctx.lineTo(midX - 80, h - 60); ctx.closePath();
      ctx.moveTo(midX + 100, h - 95); ctx.lineTo(midX + 80, h - 60); ctx.lineTo(midX + 120, h - 60); ctx.closePath();
      ctx.stroke();
      ctx.fillText('x + 5', midX - 110, h - 68);
      ctx.fillText('10', midX + 90, h - 68);
      ctx.fillText('Algebraic Equations as Balanced Scales', 15, 20);

    } else if (preset === 'math-ratio') {
      ctx.fillText('Comparing Quantities: Ratios & Fractions:', 30, 45);
      ctx.fillStyle = '#6366f1'; ctx.fillRect(60, 70, 160, 30);
      ctx.strokeStyle = '#334155'; ctx.strokeRect(60, 70, 160, 30);
      ctx.fillStyle = '#0f172a'; ctx.fillText('Part A: 4 Units (Blue)', 70, 90);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(60, 110, 80, 30);
      ctx.strokeStyle = '#334155'; ctx.strokeRect(60, 110, 80, 30);
      ctx.fillStyle = '#0f172a'; ctx.fillText('Part B: 2 Units (Orange)', 70, 130);
      ctx.fillText('Ratio A:B = 4:2 = 2:1', w - 240, 105);
      ctx.fillText('Comparing Quantities: Ratios & Proportions', 15, 20);

    } else if (preset === 'math-power') {
      ctx.fillText('Laws of Exponents & Powers:', 30, 45);
      ctx.font = '13px monospace';
      ctx.fillText('1. Multiplication Law: x^a × x^b = x^(a + b)', 40, 75);
      ctx.fillText('2. Division Law:       x^a ÷ x^b = x^(a - b)', 40, 105);
      ctx.fillText('3. Power of Power Law: (x^a)^b   = x^(a × b)', 40, 135);
      ctx.font = '11px monospace';
      ctx.fillText('Exponents, Power Laws and Roots rules', 15, 20);

    } else if (preset === 'math-trig') {
      ctx.beginPath(); ctx.moveTo(40, midY); ctx.lineTo(w - 40, midY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(40, 20); ctx.lineTo(40, h - 20); ctx.stroke();
      ctx.fillText('y = sin(x)', w - 120, 30);
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#a5f3fc';
      ctx.beginPath();
      for (let x = 40; x < w - 40; x++) {
        const rad = ((x - 40) / (w - 80)) * Math.PI * 4;
        const y = midY - Math.sin(rad) * 45;
        if (x === 40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.strokeStyle = '#334155';
      ctx.fillText('Trigonometric Waveforms (Sine wave periodicity)', 15, 20);

    } else if (preset === 'math-bell') {
      ctx.beginPath(); ctx.moveTo(40, h - 25); ctx.lineTo(w - 40, h - 25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX, 30); ctx.lineTo(midX, h - 20); ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#fbcfe8';
      ctx.beginPath();
      for (let x = 40; x < w - 40; x++) {
        const dx = (x - midX) / 50;
        const y = (h - 25) - Math.exp(-dx * dx / 2) * 110;
        if (x === 40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.strokeStyle = '#334155';
      ctx.fillText('Normal (Gaussian) Distribution Bell Curve', 15, 20);

    } else if (preset === 'sci-photosyn') {
      ctx.fillText('Photosynthesis Chemical Equation:', 30, 45);
      ctx.font = '14px monospace';
      ctx.fillText('6CO₂ + 6H₂O + Light Energy ──> C₆H₁₂O₆ + 6O₂', 35, midY);
      ctx.font = '11px monospace';
      ctx.fillText('Carbon Dioxide + Water ──> Glucose + Oxygen gas', 35, midY + 30);
      ctx.fillText('Plants: Leaves, Photosynthesis equation', 15, 20);

    } else if (preset === 'sci-plant-organ') {
      ctx.strokeRect(midX - 110, 45, 60, 110);
      ctx.fillText('Leaf cuticle', midX - 100, 40);
      ctx.beginPath(); ctx.moveTo(midX - 80, 45); ctx.bezierCurveTo(midX - 90, 80, midX - 70, 120, midX - 80, 155); ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(midX + 50, 45); ctx.lineTo(midX + 50, h - 45); ctx.stroke();
      for (let y = 60; y < h - 45; y += 15) {
        ctx.beginPath(); ctx.moveTo(midX + 50, y); ctx.quadraticCurveTo(midX + 80, y + 5, midX + 90, y - 5); ctx.stroke();
      }
      ctx.fillText('Root hair cell (Water absorption)', midX + 20, h - 20);
      ctx.fillText('Plant Organs: Leaf vein and root hair cells', 15, 20);

    } else if (preset === 'sci-recycle') {
      ctx.fillText('Classroom Environmental Waste Sorting Bins:', 30, 45);
      ctx.strokeRect(50, 70, 80, 70); ctx.fillText('PAPER', 72, 110);
      ctx.strokeRect(170, 70, 80, 70); ctx.fillText('PLASTIC', 186, 110);
      ctx.strokeRect(290, 70, 80, 70); ctx.fillText('GLASS', 312, 110);
      ctx.fillText('Reduce, Reuse, Recycle Waste Management', 15, 20);

    } else if (preset === 'sci-dna') {
      ctx.lineWidth = 1.5; ctx.strokeStyle = '#a5f3fc';
      ctx.beginPath();
      for (let x = 60; x < w - 60; x += 5) {
        const y1 = midY + Math.sin(x/15) * 25;
        if (x === 60) ctx.moveTo(x, y1);
        else ctx.lineTo(x, y1);
      }
      ctx.stroke();
      ctx.strokeStyle = '#fbcfe8';
      ctx.beginPath();
      for (let x = 60; x < w - 60; x += 5) {
        const y2 = midY - Math.sin(x/15) * 25;
        if (x === 60) ctx.moveTo(x, y2);
        else ctx.lineTo(x, y2);
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      for (let x = 70; x < w - 60; x += 15) {
        const y1 = midY + Math.sin(x/15) * 25;
        const y2 = midY - Math.sin(x/15) * 25;
        ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
      }
      ctx.strokeStyle = '#334155';
      ctx.fillText('Mendelian Genetics: DNA Double Helix Structure', 15, 20);

    } else if (preset === 'sci-circulatory') {
      ctx.lineWidth = 2;
      ctx.strokeRect(midX - 35, 45, 70, 40); ctx.fillText('LUNGS', midX - 18, 68);
      ctx.strokeRect(midX - 35, h - 65, 70, 40); ctx.fillText('BODY', midX - 14, h - 42);
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(midX, midY, 15, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillText('Heart', midX - 15, midY + 4);
      ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.arc(midX, midY, 35, -Math.PI/2, Math.PI/2); ctx.stroke();
      ctx.strokeStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(midX, midY, 35, Math.PI/2, -Math.PI/2); ctx.stroke();
      ctx.strokeStyle = '#334155';
      ctx.fillText('Double Circulation loop: Pulmonary & Systemic', 15, 20);

    } else if (preset === 'sci-neuron') {
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(80, midY, 15, 0, Math.PI*2); ctx.stroke();
      ctx.fillText('Soma', 65, midY - 22);
      ctx.beginPath(); ctx.moveTo(95, midY); ctx.lineTo(w - 120, midY); ctx.stroke();
      ctx.fillText('Axon transmission pathway', midX - 50, midY - 8);
      ctx.beginPath();
      ctx.moveTo(w - 120, midY); ctx.lineTo(w - 80, midY - 20);
      ctx.moveTo(w - 120, midY); ctx.lineTo(w - 80, midY + 20);
      ctx.stroke();
      ctx.fillText('Synapse Terminals', w - 75, midY + 4);
      ctx.fillText('Nervous System: Neuron Axon and Synapse', 15, 20);

    } else if (preset === 'sci-foodweb') {
      ctx.beginPath(); ctx.moveTo(midX, 40); ctx.lineTo(midX - 120, h - 30); ctx.lineTo(midX + 120, h - 30); ctx.closePath(); ctx.stroke();
      ctx.fillText('Tertiary Consumers (Eagles)', midX - 70, 75);
      ctx.beginPath(); ctx.moveTo(midX - 70, 85); ctx.lineTo(midX + 70, 85); ctx.stroke();
      ctx.fillText('Secondary Consumers (Frogs/Snakes)', midX - 95, 110);
      ctx.beginPath(); ctx.moveTo(midX - 100, 118); ctx.lineTo(midX + 100, 118); ctx.stroke();
      ctx.fillText('Producers (Plants/Grass)', midX - 60, h - 12);
      ctx.fillText('Ecological Energy Flow Pyramid: Trophic Levels', 15, 20);

    } else if (preset === 'geo-compass') {
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(midX, midY - 55); ctx.lineTo(midX, midY + 55); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 55, midY); ctx.lineTo(midX + 55, midY); ctx.stroke();
      ctx.font = '14px monospace';
      ctx.fillText('N', midX - 5, midY - 60); ctx.fillText('S', midX - 5, midY + 70);
      ctx.fillText('W', midX - 75, midY + 5);  ctx.fillText('E', midX + 63, midY + 5);
      ctx.font = '11px monospace';
      ctx.beginPath();
      ctx.moveTo(midX, midY - 45); ctx.lineTo(midX + 8, midY - 10); ctx.lineTo(midX + 45, midY);
      ctx.lineTo(midX + 8, midY + 10); ctx.lineTo(midX, midY + 45); ctx.lineTo(midX - 8, midY + 10);
      ctx.lineTo(midX - 45, midY); ctx.lineTo(midX - 8, midY - 10); ctx.closePath(); ctx.stroke();
      ctx.fillText('Map Cardinal Directions & Orientation', 15, 20);

    } else if (preset === 'geo-continents') {
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.strokeRect(50, 45, 90, 60); ctx.fillText('N. America', 60, 75);
      ctx.strokeRect(90, 110, 70, 65); ctx.fillText('S.America', 95, 140);
      ctx.strokeRect(midX - 50, 75, 80, 80); ctx.fillText('Africa', midX - 30, 115);
      ctx.strokeRect(midX + 50, 45, 140, 70); ctx.fillText('Eurasia', midX + 90, 75);
      ctx.strokeRect(w - 130, 120, 70, 50); ctx.fillText('Australia', w - 120, 145);
      ctx.strokeStyle = '#334155';
      ctx.fillText('Our Earth: Continents and Oceans world map', 15, 20);

    } else if (preset === 'geo-landform') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, h - 25);
      ctx.lineTo(100, h - 25);
      ctx.lineTo(160, 45);
      ctx.lineTo(210, h - 65);
      ctx.lineTo(310, h - 65);
      ctx.lineTo(350, h - 25);
      ctx.lineTo(w - 10, h - 25);
      ctx.stroke();
      ctx.fillText('Ocean', 40, h - 10);
      ctx.fillText('Mountain Peak', 120, 38);
      ctx.fillText('Valley', 215, h - 45);
      ctx.fillText('Plateau Tableland', 245, h - 75);
      ctx.fillText('Plains', w - 80, h - 10);
      ctx.fillText('Landforms Cross-Section Profile', 15, 20);

    } else if (preset === 'geo-solar') {
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(midX, midY, 15, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillText('Sun', midX - 10, midY + 4);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath(); ctx.arc(midX, midY, 40, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(midX, midY, 65, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(midX, midY, 90, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(midX - 45, midY - 45, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillText('Earth', midX - 75, midY - 48);
      ctx.fillText('The Earth in the Solar System & Orbits', 15, 20);

    } else if (preset === 'geo-grid') {
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(midX, midY, 55, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 55, midY); ctx.lineTo(midX + 55, midY); ctx.stroke();
      ctx.fillText('Equator (0°)', midX + 60, midY + 4);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath(); ctx.moveTo(midX - 48, midY - 25); ctx.lineTo(midX + 48, midY - 25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 48, midY + 25); ctx.lineTo(midX + 48, midY + 25); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(midX, midY, 25, 55, 0, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = '#334155';
      ctx.fillText('Prime Meridian', midX - 35, midY - 60);
      ctx.fillText('Globe Coordinate Grid: Latitudes & Longitudes', 15, 20);

    } else if (preset === 'geo-timezone') {
      ctx.strokeRect(50, 45, w - 100, 110);
      ctx.beginPath(); ctx.moveTo(midX, 45); ctx.lineTo(midX, 155); ctx.stroke();
      ctx.fillText('UTC (0:00) Greenwich Meridian', midX - 70, 168);
      ctx.fillText('UTC +5:30 (India)', midX + 60, 90);
      ctx.beginPath(); ctx.moveTo(midX + 120, 45); ctx.lineTo(midX + 120, 155); ctx.stroke();
      ctx.fillText('Globe Time Zones offsets diagram', 15, 20);

    } else if (preset === 'geo-monsoon') {
      ctx.fillText('Indian Monsoon Wind Circulation map:', 30, 45);
      ctx.beginPath();
      ctx.moveTo(midX - 60, 50); ctx.lineTo(midX + 60, 50);
      ctx.lineTo(midX, h - 50); ctx.closePath(); ctx.stroke();
      ctx.fillText('Peninsular India', midX - 45, 80);
      ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(midX - 90, h - 35); ctx.lineTo(midX - 30, h - 85); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 42, h - 85); ctx.lineTo(midX - 30, h - 85); ctx.lineTo(midX - 30, h - 73); ctx.stroke();
      ctx.fillStyle = '#0f172a'; ctx.fillText('South-West Monsoon Winds', midX - 130, h - 15);
      ctx.fillText('Monsoon Wind Systems & Precipitation Zones', 15, 20);

    } else if (preset === 'geo-demographics') {
      ctx.fillText('Demographics: Population Pyramid Structure:', 30, 45);
      ctx.beginPath(); ctx.moveTo(midX, 55); ctx.lineTo(midX, h - 25); ctx.stroke();
      ctx.fillStyle = '#6366f1'; ctx.fillRect(midX - 80, h - 45, 75, 15);
      ctx.fillStyle = '#fbcfe8'; ctx.fillRect(midX + 5, h - 45, 75, 15);
      ctx.fillStyle = '#6366f1'; ctx.fillRect(midX - 60, h - 75, 55, 15);
      ctx.fillStyle = '#fbcfe8'; ctx.fillRect(midX + 5, h - 75, 55, 15);
      ctx.fillStyle = '#6366f1'; ctx.fillRect(midX - 30, h - 105, 25, 15);
      ctx.fillStyle = '#fbcfe8'; ctx.fillRect(midX + 5, h - 105, 25, 15);
      ctx.fillStyle = '#0f172a';
      ctx.fillText('Male', midX - 50, 52); ctx.fillText('Female', midX + 15, 52);
      ctx.fillText('Broad Base = Rapid Expansion (NCERT Geography)', 15, 20);

    } else if (preset === 'hist-timeline-ancient') {
      ctx.beginPath(); ctx.moveTo(30, midY); ctx.lineTo(w - 30, midY); ctx.stroke();
      const milestones = [
        { x: 50, label: 'Indus Valley', year: '2500 BCE' },
        { x: 190, label: 'Vedic Era', year: '1500 BCE' },
        { x: 330, label: 'Maurya Empire', year: '322 BCE' },
        { x: 470, label: 'Gupta Golden Age', year: '320 CE' }
      ];
      milestones.forEach(m => {
        ctx.beginPath(); ctx.arc(m.x, midY, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(m.x, midY); ctx.lineTo(m.x, midY - 20); ctx.stroke();
        ctx.fillText(m.label, m.x - 30, midY - 25);
        ctx.fillText(m.year, m.x - 25, midY + 20);
      });
      ctx.fillText('Ancient Indian History Timeline & Eras', 15, 20);

    } else if (preset === 'hist-wheel') {
      ctx.fillText('Evolution of Transport: The Wheel:', 30, 45);
      ctx.strokeRect(60, 65, 80, 50); ctx.fillText('1. Wooden Log Rollers', 50, 135);
      ctx.beginPath(); ctx.arc(midX, 90, 25, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(midX, 90, 6, 0, Math.PI*2); ctx.fill();
      ctx.fillText('2. Solid Wood Disc', midX - 50, 135);
      ctx.beginPath(); ctx.arc(w - 100, 90, 25, 0, Math.PI*2); ctx.stroke();
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI/4) {
        ctx.beginPath(); ctx.moveTo(w - 100, 90); ctx.lineTo(w - 100 + Math.cos(angle)*25, 90 + Math.sin(angle)*25); ctx.stroke();
      }
      ctx.fillText('3. Spoked Chariot Wheel', w - 160, 135);
      ctx.fillText('Discovery of the Wheel and progression of transport', 15, 20);

    } else if (preset === 'hist-harappa') {
      ctx.fillText('Harappan Civilisation: Urban Grid street plans:', 30, 45);
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(60, 60); ctx.lineTo(w - 60, 60); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(60, 110); ctx.lineTo(w - 60, 110); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(120, 60); ctx.lineTo(120, 150); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(260, 60); ctx.lineTo(260, 150); ctx.stroke();
      ctx.fillText('Main Street (90° Intersections)', 135, 85);
      ctx.strokeRect(140, 120, 40, 20); ctx.fillText('Houses', 142, 135);
      ctx.strokeRect(300, 120, 40, 20); ctx.fillText('Citadel', 302, 135);
      ctx.fillText('Harappan Civilisation: Planned Citadels & Street Grids', 15, 20);

    } else if (preset === 'hist-empire-map') {
      ctx.fillText('Imperial India Conquest Map outlines:', 30, 45);
      ctx.beginPath();
      ctx.moveTo(midX - 40, 55); ctx.lineTo(midX + 40, 55);
      ctx.lineTo(midX, h - 55); ctx.closePath(); ctx.stroke();
      ctx.strokeRect(midX - 30, 65, 60, 30);
      ctx.fillText('Sultanate Core', midX - 35, 115);
      ctx.fillText('Imperial Dynasties: Expansion territorial limits', 15, 20);

    } else if (preset === 'hist-dynasty') {
      ctx.fillText('Mughal Dynasty Genealogical Family Tree:', 30, 45);
      ctx.strokeRect(midX - 180, 55, 70, 25); ctx.fillText('Babur', midX - 165, 72);
      ctx.beginPath(); ctx.moveTo(midX - 110, 68); ctx.lineTo(midX - 80, 68); ctx.stroke();
      ctx.strokeRect(midX - 80, 55, 70, 25); ctx.fillText('Humayun', midX - 68, 72);
      ctx.beginPath(); ctx.moveTo(midX - 10, 68); ctx.lineTo(midX + 20, 68); ctx.stroke();
      ctx.strokeRect(midX + 20, 55, 70, 25); ctx.fillText('Akbar', midX + 35, 72);
      ctx.beginPath(); ctx.moveTo(midX + 55, 80); ctx.lineTo(midX + 55, 105); ctx.stroke();
      ctx.strokeRect(midX + 20, 105, 70, 25); ctx.fillText('Jahangir', midX + 30, 122);
      ctx.fillText('Dynastic lineages and genealogical systems', 15, 20);

    } else if (preset === 'hist-revolt') {
      ctx.fillText('Major Centers of the Revolt of 1857:', 30, 45);
      ctx.fillText('• Meerut (Outbreak center)', 40, 75);
      ctx.fillText('• Delhi (Bahadur Shah Zafar declared Emperor)', 40, 100);
      ctx.fillText('• Jhansi (Rani Lakshmi Bai led defense)', 40, 125);
      ctx.fillText('• Kanpur (Nana Saheb lead operations)', 40, 150);
      ctx.fillText('Revolt of 1857: Indian Mutiny centers', 15, 20);

    } else if (preset === 'hist-french-estates') {
      ctx.beginPath(); ctx.moveTo(midX, 40); ctx.lineTo(midX - 120, h - 25); ctx.lineTo(midX + 120, h - 25); ctx.closePath(); ctx.stroke();
      ctx.fillText('1st Estate: Clergy (1%)', midX - 55, 68);
      ctx.beginPath(); ctx.moveTo(midX - 40, 78); ctx.lineTo(midX + 40, 78); ctx.stroke();
      ctx.fillText('2nd Estate: Nobility (2%)', midX - 60, 105);
      ctx.beginPath(); ctx.moveTo(midX - 85, 115); ctx.lineTo(midX + 85, 115); ctx.stroke();
      ctx.fillText('3rd Estate: Commoners (97%)', midX - 70, h - 10);
      ctx.fillText('French Revolution: Structure of Three Estates', 15, 20);

    } else if (preset === 'hist-satyagraha') {
      ctx.fillText('Gandhian Satyagraha Timeline in India:', 30, 45);
      ctx.beginPath(); ctx.moveTo(40, midY); ctx.lineTo(w - 40, midY); ctx.stroke();
      ctx.beginPath(); ctx.arc(100, midY, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillText('Champaran (1917)', 60, midY - 12);
      ctx.beginPath(); ctx.arc(280, midY, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillText('Kheda (1918)', 250, midY + 22);
      ctx.beginPath(); ctx.arc(460, midY, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillText('Salt March (1930)', 410, midY - 12);
      ctx.fillText('Gandhian Satyagraha & Non-Cooperation movement', 15, 20);

    } else if (preset === 'hist-industrial') {
      ctx.fillText('Industrial Revolution: Steam Engine Mechanism:', 30, 45);
      ctx.strokeRect(50, 70, 70, 50); ctx.fillText('Boiler', 65, 100);
      ctx.strokeRect(170, 70, 50, 60); ctx.fillText('Piston', 175, 105);
      ctx.beginPath(); ctx.moveTo(120, 95); ctx.lineTo(170, 95); ctx.stroke();
      ctx.fillText('Steam ->', 125, 90);
      ctx.beginPath(); ctx.arc(w - 110, 100, 30, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(220, 100); ctx.lineTo(w - 110, 100); ctx.stroke();
      ctx.fillText('Flywheel', w - 130, 150);
      ctx.fillText('Industrial Revolution: Coal Steam piston mechanisms', 15, 20);

    } else if (preset === 'pol-helpers') {
      ctx.fillText('Civics: Community Helpers roles in neighborhoods:', 30, 45);
      ctx.strokeRect(50, 70, 100, 50); ctx.fillText('Police', 82, 100);
      ctx.strokeRect(180, 70, 100, 50); ctx.fillText('Doctor', 212, 100);
      ctx.strokeRect(310, 70, 100, 50); ctx.fillText('Firefighter', 328, 100);
      ctx.fillText('Community Helpers: Essential Public Duties', 15, 20);

    } else if (preset === 'pol-panchayat') {
      ctx.beginPath(); ctx.moveTo(midX, 40); ctx.lineTo(midX - 120, h - 25); ctx.lineTo(midX + 120, h - 25); ctx.closePath(); ctx.stroke();
      ctx.fillText('Zilla Parishad (District)', midX - 60, 75);
      ctx.beginPath(); ctx.moveTo(midX - 50, 85); ctx.lineTo(midX + 50, 85); ctx.stroke();
      ctx.fillText('Panchayat Samiti (Block)', midX - 65, 115);
      ctx.beginPath(); ctx.moveTo(midX - 95, 125); ctx.lineTo(midX + 95, 125); ctx.stroke();
      ctx.fillText('Gram Panchayat (Village)', midX - 60, h - 10);
      ctx.fillText('Local Government: Three-Tier Gram Panchayat System', 15, 20);

    } else if (preset === 'pol-symbols') {
      ctx.strokeRect(midX - 100, midY - 40, 200, 133);
      ctx.beginPath(); ctx.moveTo(midX - 100, midY + 4); ctx.lineTo(midX + 100, midY + 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 100, midY - 20); ctx.lineTo(midX + 100, midY - 20); ctx.stroke();
      ctx.beginPath(); ctx.arc(midX, midY - 8, 10, 0, Math.PI*2); ctx.stroke();
      ctx.fillText('National Symbols: National Flag (3:2 Proportions)', 15, 20);

    } else if (preset === 'pol-constitution') {
      ctx.strokeRect(50, 45, w - 100, 115);
      ctx.font = '12px monospace';
      ctx.fillText('THE CONSTITUTION OF INDIA: PREAMBLE', 80, 68);
      ctx.fillText('• JUSTICE: Social, Economic and Political', 80, 92);
      ctx.fillText('• LIBERTY of thought, expression, belief, faith', 80, 112);
      ctx.fillText('• EQUALITY of status and of opportunity', 80, 132);
      ctx.font = '11px monospace';
      ctx.fillText('Indian Constitution: Core Democratic Principles', 15, 20);

    } else if (preset === 'pol-rights') {
      ctx.fillText('Six Fundamental Rights in the Indian Constitution:', 30, 45);
      ctx.fillText('1. Right to Equality         2. Right to Freedom', 40, 75);
      ctx.fillText('3. Against Exploitation      4. Freedom of Religion', 40, 105);
      ctx.fillText('5. Culture & Education       6. Constitutional Remedies', 40, 135);
      ctx.fillText('Indian Constitution: Fundamental Human Rights tree', 15, 20);

    } else if (preset === 'pol-parliament') {
      ctx.strokeRect(50, 70, 100, 50); ctx.fillText('LEGISLATIVE\n(Makes laws)', 60, 95);
      ctx.strokeRect(180, 70, 100, 50); ctx.fillText('EXECUTIVE\n(Enforces laws)', 190, 95);
      ctx.strokeRect(310, 70, 100, 50); ctx.fillText('JUDICIARY\n(Interprets)', 325, 95);
      ctx.fillText('Branches of Government: Checks and Balances', 15, 20);

    } else if (preset === 'pol-federalism') {
      ctx.strokeRect(40, midY - 30, 120, 60); ctx.fillText('UNION LIST\n(Defense, Foreign)', 48, midY - 5);
      ctx.strokeRect(midX - 60, midY - 30, 120, 60); ctx.fillText('CONCURRENT LIST\n(Education, Forest)', midX - 52, midY - 5);
      ctx.strokeRect(w - 160, midY - 30, 120, 60); ctx.fillText('STATE LIST\n(Police, Health)', w - 152, midY - 5);
      ctx.fillText('Power Sharing: Federal Division of Legislative Lists', 15, 20);

    } else if (preset === 'pol-parties') {
      ctx.strokeRect(50, 70, 100, 50); ctx.fillText('Party A (30%)', 60, 100);
      ctx.strokeRect(170, 70, 100, 50); ctx.fillText('Party B (25%)', 180, 100);
      ctx.beginPath(); ctx.moveTo(150, 95); ctx.lineTo(170, 95); ctx.stroke();
      ctx.strokeRect(w - 160, 70, 110, 50); ctx.fillText('Coalition Gov (55%)', w - 150, 100);
      ctx.fillText('Political Systems: Multiparty Coalition Dynamics', 15, 20);

    } else if (preset === 'pol-humanrights') {
      ctx.strokeRect(50, 45, w - 100, 115);
      ctx.fillText('Universal Declaration of Human Rights (UDHR):', 70, 65);
      ctx.fillText('• Article 1: All humans are born free and equal.', 70, 95);
      ctx.fillText('• Article 3: Right to life, liberty and security.', 70, 120);
      ctx.fillText('Global Human Rights & International Standards', 15, 20);

    } else if (preset === 'psych-emotions') {
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(midX - 100, midY, 20, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(midX - 100, midY, 10, 0, Math.PI); ctx.stroke();
      ctx.fillText('Happy', midX - 115, midY + 38);
      ctx.beginPath(); ctx.arc(midX, midY, 20, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(midX, midY + 12, 8, Math.PI, 0); ctx.stroke();
      ctx.fillText('Sad', midX - 10, midY + 38);
      ctx.beginPath(); ctx.arc(midX + 100, midY, 20, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX + 90, midY - 6); ctx.lineTo(midX + 98, midY - 2);
      ctx.moveTo(midX + 110, midY - 6); ctx.lineTo(midX + 102, midY - 2); ctx.stroke();
      ctx.fillText('Angry', midX + 85, midY + 38);
      ctx.fillText('Identifying Emotions & Child Feelings (Primary)', 15, 20);

    } else if (preset === 'psych-mindful') {
      ctx.beginPath(); ctx.moveTo(40, midY + 20); ctx.lineTo(w - 40, midY + 20); ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#06b6d4';
      ctx.beginPath();
      for (let x = 40; x < w - 40; x++) {
        const rad = ((x - 40) / (w - 80)) * Math.PI * 4;
        const y = (midY + 20) - Math.abs(Math.sin(rad)) * 60;
        if (x === 40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.strokeStyle = '#334155';
      ctx.fillText('Inhale (Rising)', midX - 100, 45);
      ctx.fillText('Exhale (Falling)', midX + 40, 45);
      ctx.fillText('Mindfulness: Diaphragmatic Calming Breathing Wave', 15, 20);

    } else if (preset === 'psych-cooperation') {
      ctx.strokeRect(midX - 70, midY - 25, 60, 50);
      ctx.strokeRect(midX + 10, midY - 25, 60, 50);
      ctx.fillText('Player 1', midX - 60, midY + 4);
      ctx.fillText('Player 2', midX + 20, midY + 4);
      ctx.fillText('Friendship Skills: Empathy and Cooperative Play', 15, 20);

    } else if (preset === 'psych-memory') {
      ctx.strokeRect(40, midY - 20, 110, 40); ctx.fillText('Sensory Memory', 48, midY + 4);
      ctx.beginPath(); ctx.moveTo(150, midY); ctx.lineTo(190, midY); ctx.stroke();
      ctx.strokeRect(190, midY - 20, 110, 40); ctx.fillText('Short-Term (STM)', 198, midY + 4);
      ctx.beginPath(); ctx.moveTo(300, midY); ctx.lineTo(340, midY); ctx.stroke();
      ctx.strokeRect(340, midY - 20, 110, 40); ctx.fillText('Long-Term (LTM)', 348, midY + 4);
      ctx.fillText('Human Memory: Information Processing Model', 15, 20);

    } else if (preset === 'psych-motivation') {
      ctx.beginPath(); ctx.moveTo(midX, 40); ctx.lineTo(midX - 110, h - 25); ctx.lineTo(midX + 110, h - 25); ctx.closePath(); ctx.stroke();
      ctx.fillText('Self-Actualization', midX - 50, 72);
      ctx.beginPath(); ctx.moveTo(midX - 35, 82); ctx.lineTo(midX + 35, 82); ctx.stroke();
      ctx.fillText('Self-Esteem Needs', midX - 52, 108);
      ctx.beginPath(); ctx.moveTo(midX - 70, 118); ctx.lineTo(midX + 70, 118); ctx.stroke();
      ctx.fillText('Physiological / Safety Needs', midX - 78, h - 12);
      ctx.fillText('Maslow\'s Hierarchy of Human Needs pyramid', 15, 20);

    } else if (preset === 'psych-self') {
      ctx.beginPath(); ctx.arc(midX - 70, midY, 35, 0, Math.PI*2); ctx.stroke();
      ctx.fillText('ACTUAL SELF\n(How I am)', midX - 110, midY + 50);
      ctx.beginPath(); ctx.arc(midX + 70, midY, 35, 0, Math.PI*2); ctx.stroke();
      ctx.fillText('IDEAL SELF\n(Who I want to be)', midX + 30, midY + 50);
      ctx.fillText('Self-Concept: Aligning Actual vs Ideal Self', 15, 20);

    } else if (preset === 'psych-lifespan') {
      ctx.beginPath(); ctx.moveTo(40, midY); ctx.lineTo(w - 40, midY); ctx.stroke();
      const stages = ['Infancy', 'Childhood', 'Adolescence', 'Adulthood'];
      stages.forEach((st, i) => {
        const x = 80 + i * 140;
        ctx.beginPath(); ctx.arc(x, midY, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillText(st, x - 25, midY - 12);
      });
      ctx.fillText('Psychology: Human Lifespan Development stages', 15, 20);

    } else if (preset === 'psych-research') {
      ctx.fillText('Child Observation checklist grid:', 30, 45);
      ctx.strokeRect(40, 60, w - 80, 80);
      ctx.beginPath(); ctx.moveTo(40, 95); ctx.lineTo(w - 40, 95); ctx.stroke();
      ctx.fillText('Behavior / Act', 45, 80); ctx.fillText('Frequency Count', midX, 80);
      ctx.fillText('1. Hand Raising', 45, 115); ctx.fillText('||||  (4)', midX, 115);
      ctx.fillText('Psychological enquiry: Scientific observation', 15, 20);

    } else if (preset === 'psych-perception') {
      ctx.fillText('Gestalt principles: Law of Proximity:', 30, 45);
      for (let y = 70; y < 130; y += 15) {
        ctx.beginPath(); ctx.arc(80, y, 4, 0, Math.PI*2); ctx.arc(95, y, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(140, y, 4, 0, Math.PI*2); ctx.arc(155, y, 4, 0, Math.PI*2); ctx.fill();
      }
      ctx.fillText('We group columns closer to each other.', midX - 30, 105);
      ctx.fillText('Perception: Gestalt Grouping Laws (Proximity)', 15, 20);

    } else if (preset === 'soc-family') {
      ctx.fillText('Sociology: Nuclear vs Joint Family structures:', 30, 45);
      ctx.strokeRect(50, 65, 150, 60); ctx.fillText('NUCLEAR FAMILY\n• Mother, Father\n• Immediate Children', 58, 85);
      ctx.strokeRect(w - 220, 65, 170, 60); ctx.fillText('JOINT FAMILY\n• Grandparents, Uncles\n• Cousins, Parents', w - 212, 85);
      ctx.fillText('Social Institutions: Family & Kinship structures', 15, 20);

    } else if (preset === 'soc-neighborhood') {
      ctx.strokeRect(50, 60, w - 100, 90);
      ctx.strokeRect(60, 70, 80, 35); ctx.fillText('Home A', 70, 92);
      ctx.strokeRect(160, 70, 80, 35); ctx.fillText('School', 170, 92);
      ctx.strokeRect(260, 70, 80, 35); ctx.fillText('Market', 270, 92);
      ctx.fillText('Diverse neighborhoods (Social cooperation)', 60, 135);
      ctx.fillText('Neighborhood cooperation and local integration', 15, 20);

    } else if (preset === 'soc-roles') {
      ctx.fillText('Sociological Roles & Expected Duties:', 30, 45);
      ctx.fillText('• Teacher ──> Delivers instruction, maintains order', 40, 75);
      ctx.fillText('• Student ──> Actively participates, learns concepts', 40, 100);
      ctx.fillText('• Parent  ──> Supports moral growth, provides care', 40, 125);
      ctx.fillText('Socialization: Role expectations and social values', 15, 20);

    } else if (preset === 'soc-groups') {
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(midX - 40, midY + 10, 45, 0, Math.PI*2); ctx.stroke();
      ctx.fillText('Primary (Family)', midX - 110, midY + 10);
      ctx.beginPath(); ctx.arc(midX + 40, midY + 10, 45, 0, Math.PI*2); ctx.stroke();
      ctx.fillText('Secondary (Work)', midX + 50, midY + 10);
      ctx.fillText('Primary Groups vs Secondary Social Groups', 15, 20);

    } else if (preset === 'soc-socialization') {
      ctx.strokeRect(midX - 45, midY - 20, 90, 40); ctx.fillText('INDIVIDUAL', midX - 35, midY + 4);
      const agents = [
        { x: midX - 160, y: midY - 30, label: 'Family' },
        { x: midX + 160, y: midY - 30, label: 'School' },
        { x: midX, y: 45, label: 'Peers/Media' }
      ];
      agents.forEach(ag => {
        ctx.beginPath(); ctx.moveTo(midX, midY); ctx.lineTo(ag.x, ag.y); ctx.stroke();
        ctx.strokeRect(ag.x - 45, ag.y - 15, 90, 30);
        ctx.fillText(ag.label, ag.x - 35, ag.y + 5);
      });
      ctx.fillText('Agents of Socialization: Interactive Networks', 15, 20);

    } else if (preset === 'soc-diversity') {
      ctx.fillText('Linguistic & Cultural Diversity mapping:', 30, 45);
      ctx.strokeRect(50, 65, 100, 70); ctx.fillText('State A\n(Hindi)', 60, 95);
      ctx.strokeRect(170, 65, 100, 70); ctx.fillText('State B\n(Bengali)', 180, 95);
      ctx.strokeRect(290, 65, 100, 70); ctx.fillText('State C\n(Urdu)', 300, 95);
      ctx.fillText('Social Diversity: Cultural regional divisions', 15, 20);

    } else if (preset === 'soc-stratification') {
      ctx.beginPath(); ctx.moveTo(midX, 40); ctx.lineTo(midX - 110, h - 25); ctx.lineTo(midX + 110, h - 25); ctx.closePath(); ctx.stroke();
      ctx.fillText('Upper Class (Elite)', midX - 48, 75);
      ctx.beginPath(); ctx.moveTo(midX - 40, 85); ctx.lineTo(midX + 40, 85); ctx.stroke();
      ctx.fillText('Middle Class', midX - 35, 112);
      ctx.beginPath(); ctx.moveTo(midX - 80, 122); ctx.lineTo(midX + 80, 122); ctx.stroke();
      ctx.fillText('Lower Class (Working)', midX - 58, h - 12);
      ctx.fillText('Social Stratification: Hierarchy & Class structure', 15, 20);

    } else if (preset === 'soc-institutions') {
      ctx.strokeRect(midX - 150, midY - 20, 80, 40); ctx.fillText('Family', midX - 130, midY + 4);
      ctx.strokeRect(midX + 70, midY - 20, 80, 40); ctx.fillText('Education', midX + 85, midY + 4);
      ctx.beginPath(); ctx.moveTo(midX - 70, midY); ctx.lineTo(midX + 70, midY); ctx.stroke();
      ctx.fillText('Socializes children ──>', midX - 60, midY - 6);
      ctx.fillText('Social Institutions: Family & Education connections', 15, 20);

    } else if (preset === 'soc-research') {
      ctx.fillText('Sociology Research Workflows:', 30, 45);
      ctx.strokeRect(40, 70, 180, 50); ctx.fillText('QUANTITATIVE RESEARCH\n• Surveys, Stats, Numbers', 45, 92);
      ctx.strokeRect(w - 240, 70, 180, 50); ctx.fillText('QUALITATIVE RESEARCH\n• Interviews, Fieldwork, Texts', w - 235, 92);
      ctx.fillText('Research Methods: Scientific enquiry schemas', 15, 20);
    } else if (preset === 'mind-map') {
      ctx.lineWidth = 2;
      ctx.fillStyle = '#6366f1';
      ctx.beginPath(); ctx.ellipse(midX, midY, 40, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillText('TOPIC', midX - 16, midY + 4);
      const nodes = [
        { x: midX - 150, y: midY - 30, label: 'Idea A', color: '#10b981' },
        { x: midX + 150, y: midY - 30, label: 'Idea B', color: '#f59e0b' },
        { x: midX, y: 40, label: 'Details', color: '#d946ef' }
      ];
      nodes.forEach((n) => {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath(); ctx.moveTo(midX, midY); ctx.lineTo(n.x, n.y); ctx.stroke();
        ctx.fillStyle = n.color;
        ctx.beginPath(); ctx.ellipse(n.x, n.y, 35, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.fillText(n.label, n.x - 22, n.y + 4);
      });
      ctx.fillText('Visual Mind Concept Map Outline', 15, 20);
    } else if (preset === 'flow-chart') {
      ctx.lineWidth = 2;
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.ellipse(midX, 35, 40, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillText('START', midX - 18, 38);
      ctx.strokeStyle = '#334155';
      ctx.beginPath(); ctx.moveTo(midX, 49); ctx.lineTo(midX, 72); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 3, 67); ctx.lineTo(midX, 72); ctx.lineTo(midX + 3, 67); ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(midX, 72); ctx.lineTo(midX + 50, 90); ctx.lineTo(midX, 108); ctx.lineTo(midX - 50, 90);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillText('IF TEST?', midX - 24, 94);
      ctx.beginPath(); ctx.moveTo(midX, 108); ctx.lineTo(midX, 135); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(midX - 3, 130); ctx.lineTo(midX, 135); ctx.lineTo(midX + 3, 130); ctx.stroke();
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(midX - 45, 135, 90, 24);
      ctx.fillStyle = '#0f172a'; ctx.fillText('PROCESS OUT', midX - 36, 151);
      ctx.fillText('Logical Process Flowchart Diagram', 15, 20);
    } else if (preset === 'grid') {
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      for (let x = 30; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 30; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('Writing Gridlines template active.', 15, 20);
    }
  };

  const handleShareClick = () => {
    let description = 'Visual diagram';
    
    if (activePreset) {
      const categoryObj = getPresetListAndDrawer();
      const found = categoryObj.presets.find(p => p.id === activePreset);
      if (found) {
        description = `${categoryObj.categoryName}: ${found.label}`;
      } else {
        description = activePreset.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    } else {
      description = 'Custom blackboard drawing';
    }

    onShare(description);
  };
  return (
    <div 
      className="glass holographic-board" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '1rem', 
        gap: '0.75rem',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-icon"
            style={{ fontSize: '1rem', padding: '0.25rem', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={isExpanded ? "Collapse Board" : "Expand Board"}
            type="button"
          >
            {isExpanded ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            )}
          </button>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M21 9H3"/><path d="M21 15H3"/><path d="M12 3v18"/></svg>
            Whiteboard ({categoryName})
          </span>
        </div>
        
        {/* Presets Selector Dropdown (Saves horizontal space) */}
        {isExpanded && presets.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Presets:</span>
            <select
              className="blackboard-presets-select"
              value={activePreset || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  applyPreset(val);
                } else {
                  setActivePreset(null);
                  initCanvas();
                }
              }}
              id="blackboard-presets-dropdown"
            >
              <option value="">-- No Preset --</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chalkboard Canvas & Floating Toolbar (Visible only when expanded) */}
      {isExpanded && (
        <div className="blackboard-canvas-container">
          <canvas
            ref={canvasRef}
            width={1000}
            height={450}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawingTouch}
            onTouchMove={drawTouch}
            onTouchEnd={stopDrawing}
            style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
          />

          {/* Centered Floating Toolbar Pill Menu */}
          <div className="blackboard-controls-dock">
            {/* Chalk Color Palette */}
            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
              {['#0f172a', '#2563eb', '#ef4444', '#0d9488'].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setPenColor(c);
                    setIsEraser(false);
                  }}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: penColor === c && !isEraser ? '1.5px solid var(--primary)' : '1px solid #777',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  title={`Chalk color ${c}`}
                  type="button"
                />
              ))}
            </div>

            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />

            {/* Brush Sizes */}
            <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
              {[2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => setPenSize(s)}
                  style={{
                    padding: '0.1rem 0.35rem',
                    fontSize: '0.65rem',
                    borderRadius: '4px',
                    background: penSize === s ? 'var(--primary)' : 'transparent',
                    color: penSize === s ? '#ffffff' : 'var(--text-primary)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  type="button"
                >
                  {s === 2 ? 'Thin' : s === 5 ? 'Med' : 'Thick'}
                </button>
              ))}
            </div>

            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />

            {/* Eraser / Clear */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={() => setIsEraser(!isEraser)}
                style={{ 
                  padding: '0.15rem 0.4rem', 
                  fontSize: '0.65rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: isEraser ? 'var(--primary-glow)' : 'transparent',
                  color: isEraser ? 'var(--primary)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                type="button"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l4.3 4.3c1 1 1 2.5 0 3.4l-9.6 9.6z"/>
                  <path d="m22 21-6V15"/>
                </svg>
                <span>Eraser</span>
              </button>
              <button
                onClick={clearBoard}
                style={{ 
                  padding: '0.15rem 0.4rem', 
                  fontSize: '0.65rem', 
                  borderRadius: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                type="button"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
                <span>Clear</span>
              </button>
            </div>

            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />

            {/* Share Illustrations Button */}
            <button
              onClick={handleShareClick}
              className="btn-primary"
              style={{ 
                padding: '0.2rem 0.6rem', 
                fontSize: '0.65rem', 
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              id="blackboard-btn-share"
              type="button"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/>
                <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
              </svg>
              <span>Share</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
