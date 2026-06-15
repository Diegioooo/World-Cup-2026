import React from 'react';

interface FlagProps {
  country: string;
  className?: string;
}

export default function FlagIcon({ country, className = 'w-10 h-10' }: FlagProps) {
  const norm = country.trim().toLowerCase();

  // Draw country flags dynamically in SVG circles to maintain high aesthetic quality and independence from external URLs.
  const renderFlagContent = () => {
    switch (norm) {
      case 'france':
        return (
          <>
            <rect x="0" y="0" width="33.3" height="100" fill="#002395" />
            <rect x="33.3" y="0" width="33.4" height="100" fill="#FFFFFF" />
            <rect x="66.7" y="0" width="33.3" height="100" fill="#ED2939" />
          </>
        );
      case 'netherlands':
        return (
          <>
            <rect x="0" y="0" width="100" height="33.3" fill="#AE1C28" />
            <rect x="0" y="33.3" width="100" height="33.4" fill="#FFFFFF" />
            <rect x="0" y="66.7" width="100" height="33.3" fill="#21468B" />
          </>
        );
      case 'germany':
        return (
          <>
            <rect x="0" y="0" width="100" height="33.3" fill="#000000" />
            <rect x="0" y="33.3" width="100" height="33.4" fill="#FF0000" />
            <rect x="0" y="66.7" width="100" height="33.3" fill="#FFCC00" />
          </>
        );
      case 'belgium':
        return (
          <>
            <rect x="0" y="0" width="33.3" height="100" fill="#000000" />
            <rect x="33.3" y="0" width="33.4" height="100" fill="#FFE31B" />
            <rect x="66.7" y="0" width="33.3" height="100" fill="#E31525" />
          </>
        );
      case 'spain':
        return (
          <>
            <rect x="0" y="0" width="100" height="25" fill="#C8102E" />
            <rect x="0" y="25" width="100" height="50" fill="#FFC72C" />
            <rect x="0" y="75" width="100" height="25" fill="#C8102E" />
            {/* Simplified coat of arms */}
            <circle cx="30" cy="50" r="8" fill="#C8102E" opacity="0.85" />
            <rect x="28" y="44" width="4" height="12" fill="#507c5c" opacity="0.5" />
          </>
        );
      case 'portugal':
        return (
          <>
            <rect x="0" y="0" width="40" height="100" fill="#046A38" />
            <rect x="40" y="0" width="60" height="100" fill="#DA291C" />
            {/* Coat of arms */}
            <circle cx="40" cy="50" r="12" fill="#FFC72C" />
            <circle cx="40" cy="50" r="8" fill="#DA291C" />
            <rect x="38" y="45" width="4" height="10" fill="#002395" />
          </>
        );
      case 'italy':
        return (
          <>
            <rect x="0" y="0" width="33.3" height="100" fill="#008C45" />
            <rect x="33.3" y="0" width="33.4" height="100" fill="#F4F5F0" />
            <rect x="66.7" y="0" width="33.3" height="100" fill="#CD212A" />
          </>
        );
      case 'brazil':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#009739" />
            <polygon points="50,10 90,50 50,90 10,50" fill="#FFDF00" />
            <circle cx="50" cy="50" r="22" fill="#002776" />
            <path d="M 29 55 Q 50 42 71 52" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
            {/* Small yellow stars */}
            <circle cx="48" cy="60" r="1.5" fill="#FFFFFF" />
            <circle cx="53" cy="58" r="1" fill="#FFFFFF" />
            <circle cx="55" cy="62" r="1.5" fill="#FFFFFF" />
          </>
        );
      case 'argentina':
        return (
          <>
            <rect x="0" y="0" width="100" height="33.3" fill="#74ACDF" />
            <rect x="0" y="33.3" width="100" height="33.4" fill="#FFFFFF" />
            <rect x="0" y="66.7" width="100" height="33.3" fill="#74ACDF" />
            {/* Sun of May */}
            <circle cx="50" cy="50" r="7" fill="#F9A812" />
            <path d="M50,40 L50,60 M40,50 L60,50 M43,43 L57,57 M43,57 L57,43" stroke="#F9A812" strokeWidth="2" />
          </>
        );
      case 'england':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#FFFFFF" />
            <rect x="42" y="0" width="16" height="100" fill="#CE1126" />
            <rect x="0" y="42" width="100" height="16" fill="#CE1126" />
          </>
        );
      case 'scotland':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#005EB8" />
            <polygon points="0,0 12,0 100,88 100,100 88,100 0,12" fill="#FFFFFF" />
            <polygon points="100,0 100,12 12,100 0,100 0,88 88,0" fill="#FFFFFF" />
          </>
        );
      case 'croatia':
        return (
          <>
            <rect x="0" y="0" width="100" height="33.3" fill="#FF0000" />
            <rect x="0" y="33.3" width="100" height="33.4" fill="#FFFFFF" />
            <rect x="0" y="66.7" width="100" height="33.3" fill="#0000FF" />
            {/* Simplified checkerboard */}
            <rect x="42" y="32" width="16" height="16" fill="#FF0000" />
            <rect x="46" y="32" width="8" height="8" fill="#FFFFFF" />
            <rect x="42" y="40" width="8" height="8" fill="#FFFFFF" />
            <rect x="50" y="40" width="8" height="8" fill="#FFFFFF" />
          </>
        );
      case 'sweden':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#006AA7" />
            <rect x="30" y="0" width="18" height="100" fill="#FECC00" />
            <rect x="0" y="41" width="100" height="18" fill="#FECC00" />
          </>
        );
      case 'norway':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#EF2B2D" />
            <rect x="25" y="0" width="22" height="100" fill="#FFFFFF" />
            <rect x="0" y="39" width="100" height="22" fill="#FFFFFF" />
            <rect x="29" y="0" width="14" height="100" fill="#002868" />
            <rect x="0" y="43" width="100" height="14" fill="#002868" />
          </>
        );
      case 'switzerland':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#D52B1E" />
            <rect x="42" y="20" width="16" height="60" fill="#FFFFFF" rx="2" />
            <rect x="20" y="42" width="60" height="16" fill="#FFFFFF" rx="2" />
          </>
        );
      case 'united states':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#FFFFFF" />
            {Array.from({ length: 7 }).map((_, i) => (
              <rect key={i} x="0" y={i * 15.4} width="100" height="7.7" fill="#B22234" />
            ))}
            <rect x="0" y="0" width="50" height="52" fill="#3C3B6E" />
            {/* Simplified star layout */}
            <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
            <circle cx="25" cy="12" r="1.5" fill="#FFFFFF" />
            <circle cx="38" cy="12" r="1.5" fill="#FFFFFF" />
            <circle cx="18" cy="26" r="1.5" fill="#FFFFFF" />
            <circle cx="31" cy="26" r="1.5" fill="#FFFFFF" />
            <circle cx="12" cy="40" r="1.5" fill="#FFFFFF" />
            <circle cx="25" cy="40" r="1.5" fill="#FFFFFF" />
            <circle cx="38" cy="40" r="1.5" fill="#FFFFFF" />
          </>
        );
      case 'canada':
        return (
          <>
            <rect x="0" y="0" width="25" height="100" fill="#D80621" />
            <rect x="25" y="0" width="50" height="100" fill="#FFFFFF" />
            <rect x="75" y="0" width="25" height="100" fill="#D80621" />
            {/* Draw a simplified red leaf in the middle */}
            <path d="M 50 25 L 53 38 L 65 35 L 58 46 L 68 54 L 54 54 L 50 72 L 46 54 L 32 54 L 42 46 L 35 35 L 47 38 Z" fill="#D80621" />
          </>
        );
      case 'mexico':
        return (
          <>
            <rect x="0" y="0" width="33.3" height="100" fill="#006847" />
            <rect x="33.3" y="0" width="33.4" height="100" fill="#FFFFFF" />
            <rect x="66.7" y="0" width="33.3" height="100" fill="#C8102E" />
            {/* Golden eagle emblem center */}
            <circle cx="50" cy="50" r="6" fill="#8B5A2B" />
            <circle cx="50" cy="50" r="4" fill="#E5A93B" />
          </>
        );
      case 'uruguay':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#FFFFFF" />
            {Array.from({ length: 4 }).map((_, i) => (
              <rect key={i} x="0" y={11 + i * 22} width="100" height="11" fill="#0038A8" />
            ))}
            <rect x="0" y="0" width="38" height="44" fill="#FFFFFF" stroke="#0038A8" strokeWidth="1" />
            <circle cx="19" cy="22" r="7" fill="#FFCC00" />
            <circle cx="19" cy="22" r="4" fill="#7A4F00" opacity="0.4" />
          </>
        );
      case 'colombia':
        return (
          <>
            <rect x="0" y="0" width="100" height="50" fill="#FCD116" />
            <rect x="0" y="50" width="100" height="25" fill="#003893" />
            <rect x="0" y="75" width="100" height="25" fill="#CE1126" />
          </>
        );
      case 'ecuador':
        return (
          <>
            <rect x="0" y="0" width="100" height="50" fill="#FFD200" />
            <rect x="0" y="50" width="100" height="25" fill="#00358A" />
            <rect x="0" y="75" width="100" height="25" fill="#EF262C" />
            {/* Shield and condor in central part */}
            <ellipse cx="50" cy="50" rx="9" ry="12" fill="#E5A93B" opacity="0.9" />
            <circle cx="50" cy="42" r="3" fill="#000000" />
          </>
        );
      case 'paraguay':
        return (
          <>
            <rect x="0" y="0" width="100" height="33.3" fill="#D52B1E" />
            <rect x="0" y="33.3" width="100" height="33.4" fill="#FFFFFF" />
            <rect x="0" y="66.7" width="100" height="33.3" fill="#0038A8" />
            {/* Treasury seal */}
            <circle cx="50" cy="50" r="8" fill="#FFFFFF" stroke="#0038A8" strokeWidth="1" />
            <circle cx="50" cy="50" r="3" fill="#FFC72C" />
          </>
        );
      case 'australia':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#00008B" />
            {/* Quick Union Jack representation */}
            <rect x="0" y="0" width="45" height="45" fill="#00008B" stroke="#FFFFFF" strokeWidth="3" />
            <line x1="0" y1="0" x2="45" y2="45" stroke="#FF0000" strokeWidth="2" />
            <line x1="45" y1="0" x2="0" y2="45" stroke="#FF0000" strokeWidth="2" />
            <rect x="19" y="0" width="7" height="45" fill="#FFFFFF" />
            <rect x="0" y="19" width="45" height="7" fill="#FFFFFF" />
            <rect x="21" y="0" width="3" height="45" fill="#FF0000" />
            <rect x="0" y="21" width="45" height="3" fill="#FF0000" />
            {/* Commonwealth Star */}
            <polygon points="22,70 25,60 35,60 27,53 30,43 22,49 14,43 17,53 9,60 19,60" fill="#FFFFFF" />
            {/* Southern Cross representation */}
            <circle cx="75" cy="25" r="3" fill="#FFFFFF" />
            <circle cx="85" cy="40" r="3" fill="#FFFFFF" />
            <circle cx="75" cy="55" r="3" fill="#FFFFFF" />
            <circle cx="65" cy="40" r="3" fill="#FFFFFF" />
            <circle cx="80" cy="48" r="1.5" fill="#FFFFFF" />
          </>
        );
      case 'new zealand':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#00247D" />
            {/* Quick Union Jack representation */}
            <rect x="0" y="0" width="45" height="45" fill="#00247D" stroke="#FFFFFF" strokeWidth="3" />
            <line x1="0" y1="0" x2="45" y2="45" stroke="#FF0000" strokeWidth="1.5" />
            <line x1="45" y1="0" x2="0" y2="45" stroke="#FF0000" strokeWidth="1.5" />
            {/* White cross */}
            <rect x="20" y="0" width="5" height="45" fill="#FFFFFF" />
            <rect x="0" y="20" width="45" height="5" fill="#FFFFFF" />
            <rect x="21" y="0" width="3" height="45" fill="#FF0000" />
            <rect x="0" y="21" width="45" height="3" fill="#FF0000" />
            {/* Red Stars with white outline */}
            <circle cx="75" cy="30" r="4.5" fill="#FFFFFF" />
            <circle cx="75" cy="30" r="2.5" fill="#CC142B" />
            <circle cx="85" cy="45" r="4" fill="#FFFFFF" />
            <circle cx="85" cy="45" r="2" fill="#CC142B" />
            <circle cx="75" cy="65" r="5" fill="#FFFFFF" />
            <circle cx="75" cy="65" r="3" fill="#CC142B" />
            <circle cx="65" cy="48" r="4" fill="#FFFFFF" />
            <circle cx="65" cy="48" r="2" fill="#CC142B" />
          </>
        );
      case 'japan':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#FFFFFF" />
            <circle cx="50" cy="50" r="25" fill="#BC002D" />
          </>
        );
      case 'south korea':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#FFFFFF" />
            {/* Yin yang central disk */}
            <path d="M 50,30 A 20,20 0 0,0 50,70 A 10,10 0 0,0 50,50 A 10,10 0 0,1 50,30" fill="#CD2E3A" />
            <path d="M 50,30 A 20,20 0 0,1 50,70 A 10,10 0 0,0 50,50 A 10,10 0 0,1 50,30" fill="#0047A0" />
            {/* 4 Trigrams simplified bars */}
            <rect x="15" y="15" width="20" height="3" transform="rotate(-45 15 15)" fill="#000000" />
            <rect x="15" y="22" width="20" height="3" transform="rotate(-45 15 15)" fill="#000000" />
            <rect x="65" y="65" width="20" height="3" transform="rotate(-45 65 65)" fill="#000000" />
            <rect x="65" y="72" width="20" height="3" transform="rotate(-45 65 65)" fill="#000000" />
          </>
        );
      case 'morocco':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#C1272D" />
            {/* Green Pentagram star */}
            <path d="M 50,22 L 58,48 L 36,32 L 64,32 L 42,48 Z" fill="none" stroke="#006233" strokeWidth="4" />
          </>
        );
      case 'egypt':
        return (
          <>
            <rect x="0" y="0" width="100" height="33.3" fill="#C1272D" />
            <rect x="0" y="33.3" width="100" height="33.4" fill="#FFFFFF" />
            <rect x="0" y="66.7" width="100" height="33.3" fill="#000000" />
            {/* Small golden eagle */}
            <circle cx="50" cy="50" r="5" fill="#C4A834" />
          </>
        );
      case 'tunisia':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#E20E17" />
            <circle cx="50" cy="50" r="23" fill="#FFFFFF" />
            <circle cx="53" cy="50" r="14" fill="#E20E17" />
            <circle cx="57" cy="50" r="11" fill="#FFFFFF" />
            <polygon points="53,42 53,58 64,50" fill="#E20E17" />
          </>
        );
      case 'algeria':
        return (
          <>
            <rect x="0" y="0" width="50" height="100" fill="#006233" />
            <rect x="50" y="0" width="50" height="100" fill="#FFFFFF" />
            {/* Red crescent & star */}
            <circle cx="53" cy="50" r="18" fill="#D21F3C" />
            <circle cx="58" cy="50" r="14" fill="#FFFFFF" />
            <polygon points="57,43 57,57 66,50" fill="#D21F3C" />
          </>
        );
      case 'south africa':
        return (
          <>
            <rect x="0" y="0" width="100" height="50" fill="#E21C2F" />
            <rect x="0" y="50" width="100" height="50" fill="#001F7E" />
            {/* Green and White / Gold pall design */}
            <polygon points="0,0 45,50 0,100" fill="#000000" />
            <polygon points="0,0 0,10 40,50 0,90 0,100 10,100 55,50 10,0" fill="#FFB612" />
            <path d="M 0,35 L 35,50 L 0,65 Z" fill="#007A4D" />
            <polygon points="0,32 0,38 31,50 0,62 0,68 40,50" fill="#FFFFFF" />
            <rect x="35" y="40" width="65" height="20" fill="#007A4D" />
            <rect x="35" y="32" width="65" height="8" fill="#FFFFFF" />
            <rect x="35" y="60" width="65" height="8" fill="#FFFFFF" />
          </>
        );
      case 'senegal':
        return (
          <>
            <rect x="0" y="0" width="33.3" height="100" fill="#00853F" />
            <rect x="33.3" y="0" width="33.4" height="100" fill="#FDEF42" />
            <rect x="66.7" y="0" width="33.3" height="100" fill="#E11019" />
            {/* Green star in center */}
            <polygon points="50,33 53,44 63,44 55,50 58,61 50,54 42,61 45,50 37,44 47,44" fill="#00853F" />
          </>
        );
      case 'ivory coast':
        return (
          <>
            <rect x="0" y="0" width="33.3" height="100" fill="#F77F00" />
            <rect x="33.3" y="0" width="33.4" height="100" fill="#FFFFFF" />
            <rect x="66.7" y="0" width="33.3" height="100" fill="#009E60" />
          </>
        );
      case 'ghana':
        return (
          <>
            <rect x="0" y="0" width="100" height="33.3" fill="#DA291C" />
            <rect x="0" y="33.3" width="100" height="33.4" fill="#FCD116" />
            <rect x="0" y="66.7" width="100" height="33.3" fill="#006B3F" />
            {/* Black five-pointed star */}
            <polygon points="50,36 53,45 61,45 54,50 56,59 50,53 44,59 46,50 39,45 47,45" fill="#000000" />
          </>
        );
      case 'turkey':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#E30A17" />
            <circle cx="45" cy="50" r="18" fill="#FFFFFF" />
            <circle cx="49" cy="50" r="14" fill="#E30A17" />
            <polygon points="58,44 58,56 68,50" fill="#FFFFFF" />
          </>
        );
      case 'saudi arabia':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#006C35" />
            {/* Styled white sword */}
            <rect x="25" y="62" width="50" height="4" fill="#FFFFFF" />
            <rect x="30" y="58" width="4" height="12" fill="#FFFFFF" />
            {/* Simplified script */}
            <ellipse cx="50" cy="42" rx="15" ry="5" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
            <circle cx="40" cy="35" r="2.5" fill="#FFFFFF" />
            <circle cx="60" cy="35" r="2.5" fill="#FFFFFF" />
          </>
        );
      case 'iraq':
        return (
          <>
            <rect x="0" y="0" width="100" height="33.3" fill="#C1272D" />
            <rect x="0" y="33.3" width="100" height="33.4" fill="#FFFFFF" />
            <rect x="0" y="66.7" width="100" height="33.3" fill="#000000" />
            {/* Green Arabic Takbir */}
            <text x="50" y="54" fontSize="11" fill="#007A3D" fontWeight="bold" textAnchor="middle">الله أكبـر</text>
          </>
        );
      case 'qatar':
        return (
          <>
            <rect x="0" y="0" width="30" height="100" fill="#FFFFFF" />
            <rect x="30" y="0" width="70" height="100" fill="#8D1B3D" />
            {/* Nine pointed serrated teeth */}
            <polygon points="30,0 35,5 30,11 35,16 30,22 35,27 30,33 35,38 30,44 35,50 30,56 35,61 30,67 35,72 30,78 35,83 30,89 35,94 30,100" fill="#FFFFFF" />
          </>
        );
      case 'iran':
        return (
          <>
            <rect x="0" y="0" width="100" height="33.3" fill="#239F40" />
            <rect x="0" y="33.3" width="100" height="33.4" fill="#FFFFFF" />
            <rect x="0" y="66.7" width="100" height="33.3" fill="#DA2128" />
            {/* Central emblem */}
            <ellipse cx="50" cy="50" rx="4" ry="10" fill="none" stroke="#DA2128" strokeWidth="2.5" />
            <line x1="42" y1="50" x2="58" y2="50" stroke="#DA2128" strokeWidth="2" />
          </>
        );
      case 'uzbekistan':
        return (
          <>
            <rect x="0" y="0" width="100" height="31" fill="#00AEC7" />
            <rect x="0" y="31" width="100" height="3" fill="#E31B23" />
            <rect x="0" y="34" width="100" height="32" fill="#FFFFFF" />
            <rect x="0" y="66" width="100" height="3" fill="#E31B23" />
            <rect x="0" y="69" width="100" height="31" fill="#1EB53A" />
            {/* White Crescent */}
            <circle cx="25" cy="16" r="6" fill="#FFFFFF" />
            <circle cx="28" cy="16" r="5" fill="#00AEC7" />
          </>
        );
      case 'austria':
        return (
          <>
            <rect x="0" y="0" width="100" height="33.3" fill="#ED2939" />
            <rect x="0" y="33.3" width="100" height="33.4" fill="#FFFFFF" />
            <rect x="0" y="66.7" width="100" height="33.3" fill="#ED2939" />
          </>
        );
      case 'czech republic':
        return (
          <>
            <rect x="0" y="0" width="100" height="50" fill="#FFFFFF" />
            <rect x="0" y="50" width="100" height="50" fill="#D7141A" />
            <polygon points="0,0 50,50 0,100" fill="#11457E" />
          </>
        );
      case 'bosnia and herzegovina':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#002F6C" />
            <polygon points="25,0 85,0 85,100" fill="#FECB00" />
            {/* Mini stars lineup */}
            {Array.from({ length: 6 }).map((_, i) => (
              <circle key={i} cx={25 + i * 11} cy={10 + i * 16} r="2" fill="#FFFFFF" />
            ))}
          </>
        );
      case 'panama':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#FFFFFF" />
            <rect x="50" y="0" width="50" height="50" fill="#DA121A" />
            <rect x="0" y="50" width="50" height="50" fill="#072357" />
            {/* Stars in white panels */}
            <polygon points="25,18 27,24 33,24 28,28 30,34 25,30 20,34 22,28 17,24 23,24" fill="#072357" />
            <polygon points="75,68 77,74 83,74 78,78 80,84 75,80 70,84 72,78 67,74 73,74" fill="#DA121A" />
          </>
        );
      case 'haiti':
        return (
          <>
            <rect x="0" y="0" width="100" height="50" fill="#00209F" />
            <rect x="0" y="50" width="100" height="50" fill="#D21034" />
            {/* Arms square */}
            <rect x="38" y="38" width="24" height="24" fill="#FFFFFF" rx="1" />
            <circle cx="50" cy="50" r="5" fill="#006C35" />
            <line x1="50" y1="50" x2="50" y2="42" stroke="#8B5A2B" strokeWidth="2" />
          </>
        );
      case 'curaçao':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#002B7F" />
            <rect x="0" y="62" width="100" height="12" fill="#F9E814" />
            {/* Two white stars */}
            <circle cx="20" cy="22" r="4.5" fill="#FFFFFF" />
            <circle cx="35" cy="35" r="3" fill="#FFFFFF" />
          </>
        );
      case 'cape verde':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#002A8F" />
            <rect x="0" y="50" width="100" height="24" fill="#FFFFFF" />
            <rect x="0" y="56" width="100" height="12" fill="#D21034" />
            {/* Stars circle */}
            <circle cx="35" cy="62" r="14" fill="none" stroke="#F9E814" strokeWidth="2" strokeDasharray="5,4" />
          </>
        );
      case 'jordan':
        return (
          <>
            <rect x="0" y="0" width="100" height="33.3" fill="#000000" />
            <rect x="0" y="33.3" width="100" height="33.4" fill="#FFFFFF" />
            <rect x="0" y="66.7" width="100" height="33.3" fill="#007A3D" />
            {/* Red triangle with star */}
            <polygon points="0,0 45,50 0,100" fill="#E01A22" />
            <circle cx="18" cy="50" r="4.5" fill="#FFFFFF" />
          </>
        );
      case 'iraq':
        return (
          <>
            <rect x="0" y="0" width="100" height="33.3" fill="#C1272D" />
            <rect x="0" y="33.3" width="100" height="33.4" fill="#FFFFFF" />
            <rect x="0" y="66.7" width="100" height="33.3" fill="#000000" />
            {/* Green writing in center */}
            <circle cx="50" cy="50" r="4" fill="#007A3D" />
          </>
        );
      case 'congo':
        return (
          <>
            {/* Republic of Congo flag: diagonal green, yellow, red */}
            <polygon points="0,0 60,0 0,100" fill="#009543" />
            <polygon points="60,0 100,0 100,100 0,100 0,100" fill="#FBDE4A" />
            <polygon points="60,0 100,0 100,100 40,100" fill="#DC241F" />
          </>
        );
      case 'congo dr':
      case 'democratic republic of the congo':
        return (
          <>
            <rect x="0" y="0" width="100" height="100" fill="#007FFF" />
            <polygon points="0,100 100,0 100,10 10,100" fill="#FCE100" />
            <polygon points="0,100 100,0 100,2 2,100" fill="#CE102F" />
          </>
        );
      case 'uzbekistan':
        return (
          <>
            <rect x="0" y="0" width="100" height="32" fill="#00AEC7" />
            <rect x="0" y="32" width="100" height="4" fill="#DA2128" />
            <rect x="0" y="36" width="100" height="28" fill="#FFFFFF" />
            <rect x="0" y="64" width="100" height="4" fill="#DA2128" />
            <rect x="0" y="68" width="100" height="32" fill="#009B48" />
            {/* Moon inside */}
            <circle cx="22" cy="18" r="6" fill="#FFFFFF" />
            <circle cx="25" cy="18" r="5" fill="#00AEC7" />
          </>
        );
      case 'haiti':
        return (
          <>
            <rect x="0" y="0" width="100" height="50" fill="#00209F" />
            <rect x="0" y="50" width="100" height="50" fill="#D21034" />
            <rect x="35" y="35" width="30" height="30" fill="#FFFFFF" rx="2" />
            <circle cx="50" cy="50" r="7" fill="#006C35" />
          </>
        );
      case 'monaco':
        return (
          <>
            <rect x="0" y="0" width="100" height="50" fill="#E20E17" />
            <rect x="0" y="50" width="100" height="50" fill="#FFFFFF" />
          </>
        );
      default:
        // Default abstract country coloring based on string code
        const hash = Array.from(country).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const col1 = `hsl(${hash % 360}, 75%, 45%)`;
        const col2 = `white`;
        const col3 = `hsl(${(hash + 120) % 360}, 75%, 35%)`;
        return (
          <>
            <rect x="0" y="0" width="33.3" height="100" fill={col1} />
            <rect x="33.3" y="0" width="33.4" height="100" fill={col2} />
            <rect x="66.7" y="0" width="33.3" height="100" fill={col3} />
            <circle cx="50" cy="50" r="8" fill="#D4AF37" opacity="0.6" />
          </>
        );
    }
  };

  return (
    <div id={`flag-${country.replace(/\s+/g, '-').toLowerCase()}`} className={`relative inline-block overflow-hidden rounded-full shadow-md border-2 border-slate-700/50 flex-shrink-0 ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full object-cover"
        xmlns="http://www.w3.org/2000/svg"
      >
        <mask id="circle-mask">
          <circle cx="50" cy="50" r="50" fill="#FFFFFF" />
        </mask>
        <g mask="url(#circle-mask)">
          {renderFlagContent()}
        </g>
      </svg>
    </div>
  );
}
