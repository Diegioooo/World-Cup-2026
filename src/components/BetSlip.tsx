import React, { useRef, useState, useEffect } from 'react';
import { PredictionState, Team, Match } from '../types';
import FlagIcon from './FlagIcon';
import { Share2, Calendar, ShieldCheck, Ticket, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Language, translate, translateTeam } from '../translations';
import { playClickSound, playSuccessSound } from '../utils/audio';

// Helper to parse individual values which can be decimals or percentages
function parseNumber(val: string, maxVal = 1): number {
  const trimmed = val.trim();
  if (trimmed.endsWith('%')) {
    return (parseFloat(trimmed) / 100) * maxVal;
  }
  if (trimmed.endsWith('deg')) {
    return parseFloat(trimmed);
  }
  if (trimmed.endsWith('rad')) {
    return (parseFloat(trimmed) * 180) / Math.PI;
  }
  return parseFloat(trimmed);
}

// Convert OKLAB (L, a, b) values to RGB format
function oklabToRgb(L: number, aVal: number, bVal: number, alpha: number | undefined): string {
  const l_ = L + 0.3963377774 * aVal + 0.2158017574 * bVal;
  const m_ = L - 0.1055613458 * aVal - 0.0638541728 * bVal;
  const s_ = L - 0.0894841775 * aVal - 1.2914855480 * bVal;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLinear = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLinear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLinear = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const f = (c: number) => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  const r = Math.round(Math.min(255, Math.max(0, f(rLinear) * 255)));
  const g = Math.round(Math.min(255, Math.max(0, f(gLinear) * 255)));
  const b = Math.round(Math.min(255, Math.max(0, f(bLinear) * 255)));

  if (alpha !== undefined) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

// Convert OKLCH (L, C, H) values to RGB format
function oklchToRgb(l: number, c: number, h: number, a: number | undefined): string {
  const hRad = (h * Math.PI) / 180;
  const aVal = c * Math.cos(hRad);
  const bVal = c * Math.sin(hRad);
  return oklabToRgb(l, aVal, bVal, a);
}

// Sanitize strings containing oklch(...) or oklab(...) to regular rgb/rgba colors
function convertOklToRgb(str: string): string {
  if (typeof str !== 'string' || (!str.includes('oklch') && !str.includes('oklab'))) {
    return str;
  }

  const oklchRegex = /oklch\(\s*([0-9.]+%?)\s+([0-9.]+%?)\s+([0-9.]+(?:deg|rad)?%?)(?:\s*\/\s*([0-9.]+%?))?\s*\)/gi;
  const oklabRegex = /oklab\(\s*([0-9.]+%?)\s+([0-9.-]+%?)\s+([0-9.-]+%?)(?:\s*\/\s*([0-9.]+%?))?\s*\)/gi;

  let result = str;

  result = result.replace(oklchRegex, (_match, lStr, cStr, hStr, aStr) => {
    const l = parseNumber(lStr, 1);
    const c = parseNumber(cStr, 1);
    const h = parseNumber(hStr, 360);
    const a = aStr ? parseNumber(aStr, 1) : undefined;
    try {
      return oklchToRgb(l, c, h, a);
    } catch (e) {
      return 'rgb(0, 0, 0)';
    }
  });

  result = result.replace(oklabRegex, (_match, lStr, aValStr, bValStr, alphaStr) => {
    const l = parseNumber(lStr, 1);
    const aVal = parseNumber(aValStr, 1);
    const bVal = parseNumber(bValStr, 1);
    const a = alphaStr ? parseNumber(alphaStr, 1) : undefined;
    try {
      return oklabToRgb(l, aVal, bVal, a);
    } catch (e) {
      return 'rgb(0, 0, 0)';
    }
  });

  return result;
}

// Override computedStyle of target window during HTML2Canvas render to avoid oklab/oklch parser crashes
function startStylePatch(targetWindow: any) {
  const originalGetComputedStyle = targetWindow.getComputedStyle;
  if (!originalGetComputedStyle) return () => {};

  targetWindow.getComputedStyle = function(el: any, pseudoElt: any) {
    const style = originalGetComputedStyle.call(targetWindow, el, pseudoElt);
    if (!style) return style;

    return new Proxy(style, {
      get(target: any, prop: string | symbol) {
        const val = Reflect.get(target, prop);
        if (typeof val === 'string') {
          return convertOklToRgb(val);
        }
        if (typeof val === 'function') {
          if (prop === 'getPropertyValue') {
            return function(propertyName: string) {
              const originalVal = target.getPropertyValue(propertyName);
              return convertOklToRgb(originalVal);
            };
          }
          return val.bind(target);
        }
        return val;
      }
    });
  };

  return () => {
    targetWindow.getComputedStyle = originalGetComputedStyle;
  };
}

interface BetSlipProps {
  state: PredictionState;
  onPlayFinalGame: () => void;
  onResetTournament: () => void;
  lang: Language;
}

export default function BetSlip({ state, onPlayFinalGame, onResetTournament, lang }: BetSlipProps) {
  const slipRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>('');
  
  // Custom states for Name modal and Congratulations modal
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');
  const [showCongratulationsModal, setShowCongratulationsModal] = useState<boolean>(false);

  // Helper to render predictions exactly as selected (exact score vs simple outcome 1 or 2 vs other)
  const renderPredictionDisplay = (match: Match) => {
    if (match.exactScore) {
      return (
        <div className="flex flex-col items-center sm:items-end bg-black/40 px-4 py-2.5 rounded-xl border border-white/5 min-w-[140px] shadow-inner font-sans">
          <span className="text-[8px] text-white/40 font-mono uppercase tracking-wider mb-1">
            {lang === 'it' ? 'Punteggio Pronosticato' : 'Predicted Score'}
          </span>
          <span className="text-sm font-black text-yellow-400 font-mono tracking-widest bg-yellow-400/5 border border-yellow-500/20 px-2.5 py-1 rounded-lg">
            {match.exactScore.home} – {match.exactScore.away}
          </span>
        </div>
      );
    }

    if (match.predictedWinner) {
      const selectedOption = match.predictedWinner === 'home' ? '1' : '2';
      const winningTeamName = match.predictedWinner === 'home' ? match.homeTeam.name : match.awayTeam.name;
      return (
        <div className="flex flex-col items-center sm:items-end bg-black/40 px-4 py-2.5 rounded-xl border border-white/5 min-w-[140px] shadow-inner font-sans">
          <span className="text-[8px] text-white/40 font-mono uppercase tracking-wider mb-1">
            {lang === 'it' ? 'Esito Selezionato' : 'Selected Outcome'}
          </span>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-yellow-500 text-black font-black flex items-center justify-center text-xs shadow-md border border-yellow-600">
              {selectedOption}
            </span>
            <span className="text-xs font-bold text-yellow-400 font-sans">
              ({translateTeam(winningTeamName, lang)})
            </span>
          </div>
        </div>
      );
    }

    // Default fallback
    return (
      <div className="flex flex-col items-center sm:items-end bg-black/40 px-4 py-2.5 rounded-xl border border-white/5 min-w-[140px] shadow-inner font-sans">
        <span className="text-[8px] text-white/40 font-mono uppercase tracking-wider mb-1">{translate('predictionLabel', lang)}</span>
        <span className="text-xs font-bold text-yellow-500">-</span>
      </div>
    );
  };

  // Custom Localized Date formatting based on current selected language
  const slipDate = new Date().toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const slipTime = new Date().toLocaleTimeString(lang === 'it' ? 'it-IT' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const ticketId = 'WCS-2026-F' + Math.floor(100000 + Math.random() * 900000);
  const securityHash = 'SHA256: ' + Math.random().toString(16).substring(2, 10).toUpperCase() + '...' + Math.random().toString(16).substring(2, 6).toUpperCase();

  // Export to PNG (Image) using html2canvas with custom first/last names
  const handleExportPNG = async (fName: string, lName: string) => {
    if (!slipRef.current) return;
    setIsExporting(true);
    setExportMessage(translate('ticketMsg', lang));

    let unpatchWindow: (() => void) | null = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      unpatchWindow = startStylePatch(window);
      
      const canvas = await html2canvas(slipRef.current, {
        backgroundColor: '#0c0f1d', // Match midnight crystal slate container
        scale: 2, // High resolution crispness
        useCORS: true,
        logging: false,
        onclone: (clonedDocument) => {
          const styleTags = clonedDocument.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            const style = styleTags[i];
            if (style.textContent) {
              style.textContent = convertOklToRgb(style.textContent);
            }
          }
          const clonedWindow = clonedDocument.defaultView;
          if (clonedWindow) {
            startStylePatch(clonedWindow);
          }
        }
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');

      // Format custom name: capitalize first letter, replace spaces and special symbols with underscores
      const formatPart = (str: string) => {
        return str
          .trim()
          .replace(/[^a-zA-Z0-9\s]/g, '') // remove special symbols
          .replace(/\s+/g, '_')           // convert spaces to underscores
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join('_');
      };

      const cleanFirst = formatPart(fName) || 'Mario';
      const cleanLast = formatPart(lName) || 'Rossi';
      const customFileName = `World_Cup_2026_${cleanFirst}_${cleanLast}.png`;

      link.download = customFileName;
      link.href = dataUrl;
      link.click();
      setExportMessage(translate('downloadPngSuccess', lang));
      playSuccessSound();
      
      // Close custom input modal and open the second congratulations modal immediately
      setShowNameModal(false);
      setTimeout(() => {
        setShowCongratulationsModal(true);
      }, 500);
    } catch (error) {
      console.error('Error generating image export', error);
      setExportMessage(translate('downloadPngFail', lang));
    } finally {
      if (unpatchWindow) {
        unpatchWindow();
      }
      setIsExporting(false);
      setTimeout(() => setExportMessage(''), 4500);
    }
  };

  const sf1 = state.semiFinals.sf1;
  const sf2 = state.semiFinals.sf2;
  const final = state.final;

  return (
    <div id="bracket-receipt-ticket" className="flex flex-col gap-6 w-full max-w-2xl mx-auto animate-fade-in">
      
      {/* Dynamic Status message (fades or pulses) */}
      {exportMessage && (
        <div className={`p-4 text-xs md:text-sm text-center rounded-2xl border backdrop-blur-md flex items-center justify-center gap-2 animate-pulse ${
          exportMessage.toLowerCase().includes('fail') || exportMessage.toLowerCase().includes('impossibile')
            ? 'bg-red-950/40 border-red-500/30 text-red-200'
            : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
        }`}>
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          <span className="font-semibold">{exportMessage}</span>
        </div>
      )}

      {/* Actual Exportable Ticket Area - Apple Frosted Glass style */}
      <div
        ref={slipRef}
        className="relative bg-slate-900/40 border border-white/20 p-6 md:p-8 rounded-[32px] text-white select-none overflow-hidden shadow-2xl backdrop-blur-xl"
        style={{
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
        }}
      >
        {/* Specular highlighted reflections */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/3 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center pb-6 border-b border-dashed border-white/10 relative">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-white/90 rounded-full text-[10px] font-mono tracking-widest uppercase mb-3.5 shadow-sm">
            <Ticket className="w-3.5 h-3.5 text-yellow-500" />
            {translate('officialSlip', lang)}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-sans tracking-tight uppercase leading-none text-white flex flex-col sm:flex-row gap-1.5 justify-center items-center">
            <span className="text-yellow-500 font-display font-bold">{translate('wcPredictor', lang)}</span>
            <span className="text-slate-200 font-sans font-light">{translate('sfPredictor', lang)}</span>
          </h1>
          <p className="text-white/50 text-xs mt-2 max-w-sm leading-relaxed">
            {translate('fictionalSlipDesc', lang)}
          </p>

          <div className="flex mt-4 gap-4 text-[10px] text-white/45 font-mono">
            <div className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/15">
              <Calendar className="w-3 h-3 text-white/60" />
              <span>{slipDate} • {slipTime}</span>
            </div>
            <div className="bg-white/5 px-2.5 py-1 rounded-full border border-white/15 text-white/70">
              ID: <span className="text-yellow-500 font-bold">{ticketId}</span>
            </div>
          </div>

          {/* Elegant ticket notch punches */}
          <div className="absolute bottom-[-13px] left-[-31px] w-6 h-6 bg-[#0c0f1d] border-r border-white/15 rounded-full z-10" />
          <div className="absolute bottom-[-13px] right-[-31px] w-6 h-6 bg-[#0c0f1d] border-l border-white/15 rounded-full z-10" />
        </div>

        {/* Section A: Selected Semi-Finalists */}
        <div className="py-6 border-b border-dashed border-white/10">
          <h3 className="text-white/40 text-[10px] font-mono font-bold tracking-widest uppercase mb-4">
            {translate('slipSectionA', lang)}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {state.semiFinalists.map((team, idx) => (
              <div
                key={team.name}
                className="flex flex-col items-center gap-2 p-3.5 bg-white/5 border border-white/10 rounded-2xl relative shadow-md transition-all duration-300 hover:bg-white/10"
              >
                <div className="relative">
                  <FlagIcon country={team.name} className="w-10 h-10 rounded-full border-2 border-white/10 shadow-md" />
                  <span className="absolute bottom-[-4px] right-[-4px] w-5 h-5 bg-slate-950 border border-white/20 text-[9px] font-bold rounded-full flex items-center justify-center font-mono text-yellow-400">
                    {idx + 1}
                  </span>
                </div>
                <div className="font-sans font-bold text-xs truncate max-w-full text-white/95 leading-tight text-center mt-1">
                  {translateTeam(team.name, lang)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section B: Knockout Outcomes */}
        <div className="py-6 border-b border-dashed border-white/10">
          <h3 className="text-white/40 text-[10px] font-mono font-bold tracking-widest uppercase mb-4">
            {translate('slipSectionB', lang)}
          </h3>

          <div className="flex flex-col gap-4">
            {/* Semi Final 1 */}
            {sf1 && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <span className="text-[9px] text-yellow-500/80 font-mono uppercase tracking-wider font-semibold">{translate('semiFinal1', lang)}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <FlagIcon country={sf1.homeTeam.name} className="w-6 h-6 rounded-full border border-white/10" />
                    <span className="font-bold text-xs md:text-sm text-white/90 font-sans">{translateTeam(sf1.homeTeam.name, lang)}</span>
                    <span className="text-[10px] text-white/30 font-mono mx-1">{translate('vs', lang)}</span>
                    <span className="font-bold text-xs md:text-sm text-white/90 font-sans">{translateTeam(sf1.awayTeam.name, lang)}</span>
                    <FlagIcon country={sf1.awayTeam.name} className="w-6 h-6 rounded-full border border-white/10" />
                  </div>
                </div>

                {renderPredictionDisplay(sf1)}
              </div>
            )}

            {/* Semi Final 2 */}
            {sf2 && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <span className="text-[9px] text-yellow-500/80 font-mono uppercase tracking-wider font-semibold">{translate('semiFinal2', lang)}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <FlagIcon country={sf2.homeTeam.name} className="w-6 h-6 rounded-full border border-white/10" />
                    <span className="font-bold text-xs md:text-sm text-white/90 font-sans">{translateTeam(sf2.homeTeam.name, lang)}</span>
                    <span className="text-[10px] text-white/30 font-mono mx-1">{translate('vs', lang)}</span>
                    <span className="font-bold text-xs md:text-sm text-white/90 font-sans">{translateTeam(sf2.awayTeam.name, lang)}</span>
                    <FlagIcon country={sf2.awayTeam.name} className="w-6 h-6 rounded-full border border-white/10" />
                  </div>
                </div>

                {renderPredictionDisplay(sf2)}
              </div>
            )}

            {/* The Final match */}
            {final && (
              <div className="p-4 bg-white/5 border border-yellow-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <span className="text-[9px] text-yellow-500 font-mono uppercase tracking-widest font-black">{translate('grandFinalTitle', lang)}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <FlagIcon country={final.homeTeam.name} className="w-6 h-6 rounded-full border border-white/10" />
                    <span className="font-bold text-xs md:text-sm text-white/90 font-sans">{translateTeam(final.homeTeam.name, lang)}</span>
                    <span className="text-[10px] text-yellow-500/50 font-mono mx-1">{translate('vs', lang)}</span>
                    <span className="font-bold text-xs md:text-sm text-white/90 font-sans">{translateTeam(final.awayTeam.name, lang)}</span>
                    <FlagIcon country={final.awayTeam.name} className="w-6 h-6 rounded-full border border-white/10" />
                  </div>
                </div>

                {renderPredictionDisplay(final)}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Crown champion results */}
        {state.champion && (
          <div className="bg-gradient-to-r from-yellow-500/5 via-yellow-500/15 to-yellow-500/5 border-t border-b border-white/10 py-5 my-6 flex flex-col items-center text-center">
            <span className="text-[10px] text-yellow-400 font-mono font-black uppercase tracking-widest">
              {translate('predictedChampion', lang)}
            </span>
            <div className="flex items-center gap-4 mt-3">
              <FlagIcon country={state.champion.name} className="w-14 h-14 ring-4 ring-yellow-500/30 shadow-xl rounded-full" />
              <div className="text-left">
                <h2 className="text-2xl font-black text-yellow-500 tracking-tight leading-none uppercase font-sans">
                  {translateTeam(state.champion.name, lang)}
                </h2>
                <p className="text-[10px] text-white/50 font-mono mt-1.5 leading-none">
                  {translate('cupPrognosis', lang)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verification code & Barcode simulated */}
        <div className="flex flex-col items-center justify-center pt-2 relative">
          <div className="flex items-center gap-1.5 text-[8px] text-[#8fa0dd] font-mono tracking-widest uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{translate('secureVerified', lang)} • {securityHash}</span>
          </div>

          <div className="flex items-center justify-center gap-[1px] h-10 px-4 py-2 bg-white rounded-xl mt-3 w-11/12 opacity-85 hover:opacity-100 transition-all shadow-inner">
            {[2, 4, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 4, 2, 3, 1, 2, 1, 4, 3, 2, 1, 4, 1].map((weight, i) => (
              <div
                key={i}
                className="h-8 bg-slate-950"
                style={{ width: `${weight}px` }}
              />
            ))}
          </div>
          <span className="text-[9px] text-white/35 font-mono mt-2 tracking-widest">
            * {ticketId} *
          </span>
        </div>
      </div>

      {/* Action buttons with custom glass colors - ONLY PNG Export is the primary CTA */}
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={() => {
            playClickSound();
            setShowNameModal(true);
          }}
          disabled={isExporting}
          className="w-full py-4.5 bg-yellow-500 hover:bg-yellow-400 text-black font-sans font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2.5 rounded-2xl cursor-pointer shadow-lg shadow-yellow-500/15 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
          id="btn-export-png-slip"
        >
          <Share2 className="w-5 h-5 text-black" />
          {translate('exportPng', lang)} (for sharing)
        </button>
      </div>



      {/* Step 1: Input Name and Surname Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in" id="modal-name-container">
          <div className="w-full max-w-md bg-slate-900 border border-white/20 p-6 md:p-8 rounded-[32px] text-center shadow-2xl backdrop-blur-3xl animate-zoom-in relative">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />

            <h3 className="text-xl md:text-2xl font-black text-yellow-500 uppercase font-sans tracking-tight mb-2">
              Personalizza Esportazione
            </h3>
            <p className="text-xs text-white/70 mb-6 leading-relaxed">
              Inserisci i tuoi dati per personalizzare il nome del file PNG prima di scaricarlo.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!firstName.trim() || !lastName.trim()) {
                  setInputError('Per favore inserisci sia il Nome che il Cognome.');
                  return;
                }
                setInputError('');
                handleExportPNG(firstName, lastName);
              }}
              className="space-y-4 text-left font-sans"
            >
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1.5 font-bold">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (inputError) setInputError('');
                  }}
                  placeholder="Nome (es. Mario)"
                  className="w-full bg-black/40 border border-white/10 hover:border-white/25 focus:border-yellow-500 rounded-xl px-4 py-3 text-sm text-white font-sans placeholder-white/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-white/50 mb-1.5 font-bold">
                  Cognome
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (inputError) setInputError('');
                  }}
                  placeholder="Cognome (es. Rossi)"
                  className="w-full bg-black/40 border border-white/10 hover:border-white/25 focus:border-yellow-500 rounded-xl px-4 py-3 text-sm text-white font-sans placeholder-white/20 outline-none transition-all"
                />
              </div>

              {inputError && (
                <p className="text-red-400 text-xs font-semibold mt-1">
                  ⚠️ {inputError}
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setShowNameModal(false);
                    setInputError('');
                  }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isExporting}
                  className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isExporting ? (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Genera e Scarica'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step 2: Custom congratulations modal displayed exclusively in Italian after successful download */}
      {showCongratulationsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in" id="modal-congratulations-container">
          <div className="w-full max-w-lg bg-slate-900 border border-white/20 p-6 md:p-8 rounded-[32px] text-center shadow-2xl backdrop-blur-3xl animate-zoom-in relative">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Premium Trophy Visual */}
            <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/25 rounded-2xl flex items-center justify-center text-yellow-500 mx-auto mb-5 leading-none">
              <span className="text-3xl">🏆</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-yellow-500 uppercase font-sans tracking-tight leading-tight mb-4">
              Congratulazioni
            </h1>

            {/* Render exactly the Italian text requested by user */}
            <div className="text-slate-200 text-sm leading-relaxed max-w-md mx-auto mb-8 text-center space-y-4">
              <p className="font-semibold text-white/95 leading-relaxed">
                Hai simulato il tuo mondiale.
              </p>
              
              <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl text-left space-y-2">
                <p className="text-white/70">
                  Ricordati di condividere il tuo risultato alla mail:
                </p>
                <p className="font-black text-yellow-400 select-all font-mono break-all">
                  digitalsharedfunctions@bper.it
                </p>
                <div className="h-[1px] bg-white/10 my-2" />
                <p className="text-white/70">
                  Oggetto:
                </p>
                <p className="font-bold text-white font-mono">
                  Coppa del mondo 2026
                </p>
              </div>

              <p className="font-semibold text-white/90">
                Ora puoi giocare ai rigori con le tue finaliste.
              </p>
            </div>

            {/* Modal actions */}
            <div className="flex flex-col gap-3 w-full">
              {/* Primary CTA: Gioca ai rigori */}
              <button
                onClick={() => {
                  playClickSound();
                  setShowCongratulationsModal(false);
                  onPlayFinalGame();
                }}
                className="w-full py-4.5 bg-yellow-500 hover:bg-yellow-400 active:scale-[0.98] transition-all text-black font-sans font-black uppercase text-xs tracking-widest rounded-2xl cursor-pointer shadow-lg shadow-yellow-500/20"
                id="btn-play-shootout-modal"
              >
                ⚽ Gioca ai rigori
              </button>

              <div className="flex gap-2 w-full">
                {/* Secondary CTA: Chiudi */}
                <button
                  onClick={() => {
                    playClickSound();
                    setShowCongratulationsModal(false);
                  }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold rounded-xl border border-white/10 transition cursor-pointer"
                  id="btn-close-modal"
                >
                  Chiudi
                </button>
                {/* Restart CTA */}
                <button
                  onClick={() => {
                    playClickSound();
                    setShowCongratulationsModal(false);
                    onResetTournament();
                  }}
                  className="flex-1 py-3 bg-red-950/40 hover:bg-red-900/40 border border-red-500/20 text-red-100 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  id="btn-reset-modal"
                >
                  Ricomincia da Capo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
