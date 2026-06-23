import React, { useState, useEffect } from 'react';
import { Team, Match, PredictionState } from './types';
import { groupsData } from './data';
import FlagIcon from './components/FlagIcon';
import BetSlip from './components/BetSlip';
import PenaltyGame from './components/PenaltyGame';
import {
  Trophy,
  Sparkles,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Lock,
  Compass,
  FileSpreadsheet,
  AlertCircle,
  Settings,
  X,
  Volume2,
  VolumeX,
  Languages,
  ArrowLeft,
  Crown
} from 'lucide-react';
import { Language, translate, translateTeam } from './translations';
import { playClickSound, playFailureSound, playSuccessSound, getVolumeState, setVolumeState } from './utils/audio';

const LOCAL_STORAGE_KEY = 'world_cup_2026_predictor_state';

export default function App() {
  // Navigation & Step Tracking
  const [currentStep, setCurrentStep] = useState<'selection' | 'semi_predictions' | 'final_prediction' | 'ticket' | 'shootout'>('selection');

  // Application State
  const [state, setState] = useState<PredictionState>({
    semiFinalists: [],
    semiFinals: {},
    final: undefined,
    champion: undefined,
  });

  // Immersive preferences state
  const [language, setLanguage] = useState<Language>('it');
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [currentTheme, setCurrentTheme] = useState<'glass' | 'midnight' | 'emerald'>('glass');
  const [pdfPreference, setPdfPreference] = useState<'A4' | 'Letter'>('A4');

  // UI Open/close handlers
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Restore previous session prompt states
  const [showRestorePrompt, setShowRestorePrompt] = useState<boolean>(false);
  const [restoreState, setRestoreState] = useState<any>(null);

  // Exact Score intermediate selections (Step 2 & 3)
  const [sf1Scores, setSf1Scores] = useState({ home: 2, away: 1, mode: 'simple' as 'simple' | 'exact' });
  const [sf2Scores, setSf2Scores] = useState({ home: 1, away: 2, mode: 'simple' as 'simple' | 'exact' });
  const [finalScores, setFinalScores] = useState({ home: 2, away: 1, mode: 'simple' as 'simple' | 'exact' });

  // Simple direct winners selected
  const [sf1SimpleWinner, setSf1SimpleWinner] = useState<'home' | 'away' | null>(null);
  const [sf2SimpleWinner, setSf2SimpleWinner] = useState<'home' | 'away' | null>(null);
  const [finalSimpleWinner, setFinalSimpleWinner] = useState<'home' | 'away' | null>(null);

  // Global validation error
  const [predictionError, setPredictionError] = useState<string>('');

  // 1. Initial Preferences, Audio, & Restore Loader
  useEffect(() => {
    // Strictly utilize Italian as the sole system language
    setLanguage('it');

    // Loading sound volume enabled state from custom module
    const volState = getVolumeState();
    setSoundEnabledState(volState);

    // Restoring visual theme choice
    try {
      const savedTheme = localStorage.getItem('wcupsf_theme');
      if (savedTheme === 'glass' || savedTheme === 'midnight' || savedTheme === 'emerald') {
        setCurrentTheme(savedTheme);
      }
    } catch (e) {}

    // Restoring export PDF document format
    try {
      const savedExport = localStorage.getItem('wcupsf_export_pref');
      if (savedExport === 'A4' || savedExport === 'Letter') {
        setPdfPreference(savedExport);
      }
    } catch (e) {}

    // Loading predictor session state
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed && parsed.semiFinalists && parsed.semiFinalists.length > 0) {
          setRestoreState(parsed);
          setShowRestorePrompt(true);
        }
      }
    } catch (e) {
      console.error('Failed to read from localStorage', e);
    }
  }, []);

  // Set values & sync persistent storage
  const handleSetLanguage = (lang: Language) => {
    playClickSound();
    setLanguage(lang);
    try {
      localStorage.setItem('wcupsf_language', lang);
    } catch (e) {}
  };

  const handleToggleSound = () => {
    const newValue = !soundEnabled;
    setVolumeState(newValue);
    setSoundEnabledState(newValue);
    // Instant feedback with new state
    if (newValue) {
      setTimeout(() => playClickSound(), 100);
    }
  };

  const handleSetTheme = (theme: 'glass' | 'midnight' | 'emerald') => {
    playClickSound();
    setCurrentTheme(theme);
    try {
      localStorage.setItem('wcupsf_theme', theme);
    } catch (e) {}
  };

  const handleSetPdfPreference = (pref: 'A4' | 'Letter') => {
    playClickSound();
    setPdfPreference(pref);
    try {
      localStorage.setItem('wcupsf_export_pref', pref);
    } catch (e) {}
  };

  // Restore session handlers
  const acceptRestore = () => {
    playSuccessSound();
    setState(restoreState);
    
    // Attempt to reconstruct match scores modes back to inputs
    if (restoreState.semiFinals?.sf1) {
      const sf1 = restoreState.semiFinals.sf1;
      if (sf1.exactScore) {
        setSf1Scores({ home: sf1.exactScore.home, away: sf1.exactScore.away, mode: 'exact' });
      } else if (sf1.predictedWinner) {
        setSf1SimpleWinner(sf1.predictedWinner);
        setSf1Scores(prev => ({ ...prev, mode: 'simple' }));
      }
    }

    if (restoreState.semiFinals?.sf2) {
      const sf2 = restoreState.semiFinals.sf2;
      if (sf2.exactScore) {
        setSf2Scores({ home: sf2.exactScore.home, away: sf2.exactScore.away, mode: 'exact' });
      } else if (sf2.predictedWinner) {
        setSf2SimpleWinner(sf2.predictedWinner);
        setSf2Scores(prev => ({ ...prev, mode: 'simple' }));
      }
    }

    if (restoreState.final) {
      const f = restoreState.final;
      if (f.exactScore) {
        setFinalScores({ home: f.exactScore.home, away: f.exactScore.away, mode: 'exact' });
      } else if (f.predictedWinner) {
        setFinalSimpleWinner(f.predictedWinner);
        setFinalScores(prev => ({ ...prev, mode: 'simple' }));
      }
    }

    // Determine latest safe step to resume from
    if (restoreState.champion) {
      setCurrentStep('ticket');
    } else if (restoreState.final) {
      setCurrentStep('final_prediction');
    } else if (restoreState.semiFinals?.sf1 && restoreState.semiFinals?.sf2) {
      setCurrentStep('final_prediction');
    } else if (restoreState.semiFinalists.length === 4) {
      setCurrentStep('semi_predictions');
    } else {
      setCurrentStep('selection');
    }

    setShowRestorePrompt(false);
  };

  const declineRestore = () => {
    playClickSound();
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}
    setShowRestorePrompt(false);
  };

  // Helper to persist state directly
  const saveState = (newState: PredictionState) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to write state', e);
    }
  };

  // Selection Phase (Step 1) Toggle Handler
  const handleTeamClick = (team: Team) => {
    playClickSound();
    const isAlreadySelected = state.semiFinalists.some(t => t.name === team.name);

    if (isAlreadySelected) {
      // Remove team
      const updated = state.semiFinalists.filter(t => t.name !== team.name);
      const newState = { ...state, semiFinalists: updated, semiFinals: {}, final: undefined, champion: undefined };
      setState(newState);
      saveState(newState);
    } else {
      // Add team (max 4)
      if (state.semiFinalists.length >= 4) {
        playFailureSound();
        return; 
      }
      const updated = [...state.semiFinalists, team];
      const newState = { ...state, semiFinalists: updated };
      setState(newState);
      saveState(newState);

      // Auto-generate matchups when 4 are selected
      if (updated.length === 4) {
        generateMatchups(updated);
      }
    }
  };

  // Generate Semi Matchups based on 4 chosen teams
  const generateMatchups = (teams: Team[]) => {
    const sf1: Match = {
      id: 'sf1',
      homeTeam: teams[0],
      awayTeam: teams[1],
    };
    const sf2: Match = {
      id: 'sf2',
      homeTeam: teams[2],
      awayTeam: teams[3],
    };

    const newState = {
      ...state,
      semiFinalists: teams,
      semiFinals: { sf1, sf2 },
      final: undefined,
      champion: undefined
    };
    setState(newState);
    saveState(newState);
  };

  // Submit step 1 (Proceed to Semi-predictions)
  const proceedToSemiPredictions = () => {
    playClickSound();
    if (state.semiFinalists.length !== 4) return;
    setCurrentStep('semi_predictions');
    setPredictionError('');
  };

  // Process and validate Semi-Final predictions
  const submitSemiPredictions = () => {
    playClickSound();
    setPredictionError('');
    const s1 = state.semiFinals.sf1;
    const s2 = state.semiFinals.sf2;

    if (!s1 || !s2) return;

    let winner1: Team | null = null;
    let winner2: Team | null = null;

    // Resolve Semi Final 1 Winner
    if (sf1Scores.mode === 'simple') {
      if (!sf1SimpleWinner) {
        playFailureSound();
        setPredictionError(translate('winnerError', language, [1]));
        return;
      }
      winner1 = sf1SimpleWinner === 'home' ? s1.homeTeam : s1.awayTeam;
      s1.predictedWinner = sf1SimpleWinner;
      s1.exactScore = undefined;
    } else {
      if (sf1Scores.home === sf1Scores.away) {
        playFailureSound();
        setPredictionError(translate('tieError', language, [1]));
        return;
      }
      winner1 = sf1Scores.home > sf1Scores.away ? s1.homeTeam : s1.awayTeam;
      s1.exactScore = { home: sf1Scores.home, away: sf1Scores.away };
      s1.predictedWinner = undefined;
    }

    // Resolve Semi Final 2 Winner
    if (sf2Scores.mode === 'simple') {
      if (!sf2SimpleWinner) {
        playFailureSound();
        setPredictionError(translate('winnerError', language, [2]));
        return;
      }
      winner2 = sf2SimpleWinner === 'home' ? s2.homeTeam : s2.awayTeam;
      s2.predictedWinner = sf2SimpleWinner;
      s2.exactScore = undefined;
    } else {
      if (sf2Scores.home === sf2Scores.away) {
        playFailureSound();
        setPredictionError(translate('tieError', language, [2]));
        return;
      }
      winner2 = sf2Scores.home > sf2Scores.away ? s2.homeTeam : s2.awayTeam;
      s2.exactScore = { home: sf2Scores.home, away: sf2Scores.away };
      s2.predictedWinner = undefined;
    }

    // Now auto-generate the Final match screen
    const finalMatch: Match = {
      id: 'final',
      homeTeam: winner1,
      awayTeam: winner2,
    };

    const newState = {
      ...state,
      final: finalMatch,
    };

    setState(newState);
    saveState(newState);
    setCurrentStep('final_prediction');
  };

  // Submit and evaluate Final predicted winner
  const submitFinalPrediction = () => {
    playClickSound();
    setPredictionError('');
    const f = state.final;
    if (!f) return;

    let champion: Team | null = null;

    if (finalScores.mode === 'simple') {
      if (!finalSimpleWinner) {
        playFailureSound();
        setPredictionError(translate('finalWinnerError', language));
        return;
      }
      champion = finalSimpleWinner === 'home' ? f.homeTeam : f.awayTeam;
      f.predictedWinner = finalSimpleWinner;
      f.exactScore = undefined;
    } else {
      if (finalScores.home === finalScores.away) {
        playFailureSound();
        setPredictionError(translate('finalError', language));
        return;
      }
      champion = finalScores.home > finalScores.away ? f.homeTeam : f.awayTeam;
      f.exactScore = { home: finalScores.home, away: finalScores.away };
      f.predictedWinner = undefined;
    }

    const newState = {
      ...state,
      champion,
    };

    setState(newState);
    saveState(newState);
    setCurrentStep('ticket');
  };

  // Reset predictor completely
  const resetPredictor = () => {
    playClickSound();
    setState({
      semiFinalists: [],
      semiFinals: {},
      final: undefined,
      champion: undefined,
    });
    setSf1Scores({ home: 2, away: 1, mode: 'simple' });
    setSf2Scores({ home: 1, away: 2, mode: 'simple' });
    setFinalScores({ home: 2, away: 1, mode: 'simple' });
    setSf1SimpleWinner(null);
    setSf2SimpleWinner(null);
    setFinalSimpleWinner(null);
    setPredictionError('');
    setCurrentStep('selection');
    
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}
  };

  // Direct reset dialog confirmation trigger
  const triggerResetConfirm = () => {
    playClickSound();
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    playSuccessSound();
    resetPredictor();
    setShowResetConfirm(false);
    setShowSettings(false);
  };

  const handleShootoutWinner = (shootoutWinner: Team) => {
    playSuccessSound();
    const newState = {
      ...state,
      champion: shootoutWinner,
    };
    setState(newState);
    saveState(newState);
    setCurrentStep('ticket');
  };

  return (
    <div 
      className="min-h-screen text-white flex flex-col font-sans selection:bg-yellow-500 selection:text-black overflow-x-hidden transition-all duration-700 relative"
      style={{ 
        backgroundColor: currentTheme === 'midnight' ? '#030409' : currentTheme === 'emerald' ? '#040d08' : '#0c0f1d',
        backgroundImage: currentTheme === 'midnight' 
          ? 'radial-gradient(circle at 50% -20%, #1e113a 0%, #030409 85%)' 
          : currentTheme === 'emerald'
          ? 'radial-gradient(circle at 50% -20%, #0a3d24 0%, #040d08 85%)'
          : 'radial-gradient(circle at 50% -20%, #1c2a5e 0%, #0c0f1d 85%)'
      }}
    >
      
      {/* Dynamic drifting glow blobs representing visionOS ambient illumination */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-80">
        <div 
          className="absolute top-[8%] left-[15%] w-[480px] h-[480px] rounded-full blur-[150px] transition-all duration-1000"
          style={{
            background: currentTheme === 'midnight' 
              ? 'rgba(124, 58, 237, 0.06)' 
              : currentTheme === 'emerald'
              ? 'rgba(16, 185, 129, 0.05)'
              : 'rgba(59, 130, 246, 0.08)'
          }}
        />
        <div 
          className="absolute bottom-[25%] right-[10%] w-[580px] h-[580px] rounded-full blur-[180px] transition-all duration-1000"
          style={{
            background: currentTheme === 'midnight' 
              ? 'rgba(219, 39, 119, 0.03)' 
              : currentTheme === 'emerald'
              ? 'rgba(234, 179, 8, 0.04)'
              : 'rgba(234, 179, 8, 0.04)'
          }}
        />
      </div>

      {/* Main glass-like stick-header bar */}
      <header className="relative z-30 h-16 border-b border-white/10 bg-white/[0.03] backdrop-blur-xl sticky top-0 flex items-center justify-between shadow-md">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex items-center justify-between gap-4">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3" id="branding-container">
            <div className="w-10 h-10 bg-gradient-to-tr from-yellow-500 through-white/10 to-transparent rounded-full flex items-center justify-center border border-white/20 shadow-sm relative group">
              <div className="absolute inset-0 rounded-full bg-yellow-500/10 blur-[4px] opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-xl relative z-10 leading-none">⚽</span>
            </div>
            <div className="text-left leading-none">
              <span className="hidden sm:inline-block text-[9px] text-yellow-500/80 uppercase tracking-widest font-mono font-bold">
                {language === 'it' ? 'FANTASY GAME NON UFFICIALE' : 'UNOFFICIAL FANTASY GAME'}
              </span>
              <h1 className="font-sans font-black text-white tracking-tight uppercase text-base sm:text-lg leading-none">
                <span className="text-yellow-500 font-display font-bold">BPER</span> <span className="text-slate-200 font-light font-sans">FantaMondiale</span>
              </h1>
            </div>
          </div>

          {/* Core Steps indicators (Glass capsule on larger screens) */}
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-semibold tracking-wider uppercase">
            <div className={`px-3 py-1.5 rounded-full transition-all ${currentStep === 'selection' ? 'bg-white/15 text-white shadow-sm' : 'text-white/45'}`}>
              {translate('stepSelection', language)}
            </div>
            <div className={`px-3 py-1.5 rounded-full transition-all ${currentStep === 'semi_predictions' ? 'bg-white/15 text-white shadow-sm' : 'text-white/45'}`}>
              {translate('stepSemis', language)}
            </div>
            <div className={`px-3 py-1.5 rounded-full transition-all ${currentStep === 'final_prediction' ? 'bg-white/15 text-white shadow-sm' : 'text-white/45'}`}>
              {translate('stepFinal', language)}
            </div>
            <div className={`px-3 py-1.5 rounded-full transition-all ${currentStep === 'ticket' ? 'bg-white/15 text-white shadow-sm' : 'text-white/45'}`}>
              {translate('stepReceipt', language)}
            </div>
          </div>

          {/* Navigation Controls: Permanent Language Selector & Controls gear */}
          <div className="flex items-center gap-2">

            {/* Sound volume toggle button */}
            <button
              onClick={handleToggleSound}
              className="p-2 bg-white/5 border border-white/10 hover:border-white/25 text-white/80 hover:text-white rounded-full transition shadow-sm cursor-pointer"
              aria-label="Toggle Sound"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-yellow-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-white/40" />
              )}
            </button>

            {/* Permanent restart button */}
            <button
              onClick={triggerResetConfirm}
              className="p-2 bg-white/5 border border-white/10 hover:border-white/25 text-white/80 hover:text-white rounded-full transition shadow-sm cursor-pointer"
              aria-label="Reset Tournament"
              title="Reset"
            >
              <RefreshCw className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      </header>

      {/* Main central content grid */}
      <main className="flex-1 relative z-10 max-w-7xl mx-auto w-full py-8 px-4 sm:px-6">
        
        {/* Apple slide dialog to recover session from localStorage */}
        {showRestorePrompt && (
          <div className="bg-white/[0.04] border border-white/15 backdrop-blur-xl p-5 md:p-6 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-5 max-w-2xl mx-auto shadow-2xl animate-zoom-in relative">
            <div className="absolute top-[2%] left-[45%] right-[45%] h-1 bg-white/15 rounded-full md:hidden" />
            
            <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
              <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-500 flex-shrink-0">
                <Sparkles className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">
                  {translate('restoreTitle', language)}
                </h4>
                <p className="text-xs text-white/60 mt-1 max-w-sm leading-relaxed">
                  {translate('restoreDesc', language)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={declineRestore}
                className="flex-1 md:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold rounded-xl border border-white/10 transition cursor-pointer"
              >
                {translate('clearSaved', language)}
              </button>
              <button
                onClick={acceptRestore}
                className="flex-1 md:flex-none px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition shadow shadow-yellow-500/10 cursor-pointer"
              >
                {translate('recoverSession', language)}
              </button>
            </div>
          </div>
        )}

        {/* Global validation notifications */}
        {predictionError && (
          <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-200 rounded-2xl max-w-xl mx-auto mb-6 flex items-start gap-3 animate-bounce">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
            <div>
              <div className="font-extrabold text-sm text-red-400 uppercase tracking-wider">
                {translate('constraintError', language)}
              </div>
              <p className="text-xs text-red-100 mt-1 leading-relaxed">
                {predictionError}
              </p>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 1: SEMI-FINALISTS CHOICES SELECTION
            ======================================================== */}
        {currentStep === 'selection' && (
          <div className="flex flex-col gap-8">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-2xl font-black font-display text-white uppercase tracking-tight">
                {translate('selectTitle', language)}
              </h2>
              <p className="text-white/65 text-xs sm:text-sm mt-3 leading-relaxed max-w-md mx-auto">
                {translate('selectDesc', language)}
              </p>
            </div>

            {/* Float progress capsule */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/15 py-4 px-6 rounded-2xl max-w-md mx-auto w-full flex items-center justify-between text-xs font-mono shadow-md">
              <span className="text-white/50">{translate('progression', language)}</span>
              <div className="flex items-center gap-3">
                <span className={`font-bold transition-colors ${state.semiFinalists.length === 4 ? 'text-emerald-400 text-[13px]' : 'text-yellow-500'}`}>
                  {translate('selectedCount', language, [state.semiFinalists.length])}
                </span>
                <div className="flex gap-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                        i < state.semiFinalists.length
                          ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Flat Alphabetical Grid of Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4.5 bg-white/[0.02] border border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-lg">
              {(() => {
                const flattenedTeams = groupsData.flatMap(g => g.teams);
                const uniqueTeamsMap = new Map<string, Team>();
                flattenedTeams.forEach(t => {
                  uniqueTeamsMap.set(t.name, t);
                });
                const uniqueSortedTeams = Array.from(uniqueTeamsMap.values()).sort((a, b) => {
                  const nameA = translateTeam(a.name, language);
                  const nameB = translateTeam(b.name, language);
                  return nameA.localeCompare(nameB, language === 'it' ? 'it' : 'en');
                });

                return uniqueSortedTeams.map((team) => {
                  const isSelected = state.semiFinalists.some(sf => sf.name === team.name);
                  const isLimitReached = state.semiFinalists.length >= 4;

                  return (
                    <button
                      key={team.name}
                      onClick={() => handleTeamClick(team)}
                      disabled={!isSelected && isLimitReached}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-300 relative overflow-hidden group/team cursor-pointer ${
                        isSelected
                          ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400 shadow-[0_2px_10px_rgba(234,179,8,0.05)] font-bold'
                          : !isSelected && isLimitReached
                          ? 'opacity-35 border-white/5 bg-white/5 text-white/40 cursor-not-allowed'
                          : 'bg-white/5 border-white/10 hover:border-white/25 text-white/90 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 z-10 text-left">
                        <FlagIcon country={team.name} className="w-7 h-7 flex-shrink-0" />
                        <span className="font-sans font-semibold text-xs truncate max-w-[130px]">
                          {translateTeam(team.name, language)}
                        </span>
                      </div>

                      <div className="z-10 flex items-center flex-shrink-0">
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-yellow-500 animate-zoom-in" />
                        ) : (
                          <span className="text-[9px] text-white/55 font-mono font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/10 group-hover/team:border-white/30 transition-colors uppercase">
                            {translate('chooseBtn', language)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            {/* Custom bottom floating glass action box */}
            <div className="fixed bottom-0 inset-x-0 bg-white/[0.04] border-t border-white/15 p-4.5 backdrop-blur-xl z-20 flex items-center justify-center shadow-lg">
              <div className="max-w-7xl w-full flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6">
                <div className="text-center sm:text-left">
                  <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase block">{translate('appName', language)}</span>
                  <div className="text-xs text-white/70 mt-0.5">
                    {state.semiFinalists.length === 4 ? (
                      <span className="text-emerald-400 font-semibold">{translate('completeMsg', language)}</span>
                    ) : (
                      <span>{translate('selectMore', language, [4 - state.semiFinalists.length, 4 - state.semiFinalists.length === 1 ? 'a' : 'e'])}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={proceedToSemiPredictions}
                  disabled={state.semiFinalists.length !== 4}
                  className="w-full sm:w-auto px-6 py-3.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-white/5 disabled:border-white/10 disabled:text-white/30 text-black font-sans font-extrabold uppercase text-xs tracking-widest rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {translate('bracketBtn', language)}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Safe spacing layout pad */}
            <div className="h-24" />
          </div>
        )}

        {/* ========================================================
            STEP 2: SEMI-FINALS MATCHUPS SCORING PREDICTIONS
            ======================================================== */}
        {currentStep === 'semi_predictions' && state.semiFinals.sf1 && state.semiFinals.sf2 && (
          <div className="max-w-3xl mx-auto flex flex-col gap-8 animate-fade-in pb-12">
            <div className="text-center">
              <h2 className="text-2xl font-black font-display text-white uppercase tracking-tight">
                {translate('semisTitle', language)}
              </h2>
              <p className="text-white/65 text-xs sm:text-sm mt-3 leading-relaxed max-w-md mx-auto">
                {translate('semisDesc', language)}
              </p>
            </div>

            <div className="flex flex-col gap-8">
              
              {/* Semi-Final 1 Predict Card Container */}
              <div className="bg-white/[0.03] border border-white/12 p-6 rounded-[28px] flex flex-col gap-5 relative overflow-hidden backdrop-blur-md shadow-xl">
                <div className="absolute top-0 right-0 p-1.5 bg-yellow-500 text-[8px] font-black text-black px-4 uppercase tracking-widest font-mono rounded-bl-xl shadow-md">
                  {translate('semi1Matchup', language)}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center pb-3.5 mt-5 border-b border-white/5 gap-3">
                  <span className="text-[10px] text-yellow-500 font-mono font-bold uppercase tracking-widest">
                    {translate('winnerOrScore', language)}
                  </span>

                  {/* Mode Selector Pill */}
                  <div className="flex bg-black/35 p-0.5 border border-white/10 rounded-full">
                    <button
                      onClick={() => {
                        playClickSound();
                        setSf1Scores(prev => ({ ...prev, mode: 'simple' }));
                      }}
                      className={`px-3.5 py-1.5 text-[10px] uppercase font-mono tracking-wider font-extrabold rounded-full transition-all cursor-pointer ${
                        sf1Scores.mode === 'simple'
                          ? 'bg-yellow-500 text-black shadow-md'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {translate('simpleMode', language)}
                    </button>
                    <button
                      onClick={() => {
                        playClickSound();
                        setSf1Scores(prev => ({ ...prev, mode: 'exact' }));
                      }}
                      className={`px-3.5 py-1.5 text-[10px] uppercase font-mono tracking-wider font-extrabold rounded-full transition-all cursor-pointer ${
                        sf1Scores.mode === 'exact'
                          ? 'bg-yellow-500 text-black shadow-md'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {translate('exactMode', language)}
                    </button>
                  </div>
                </div>

                {/* Team Grid Row Selection */}
                <div className="flex flex-col sm:flex-row items-center justify-between py-2 gap-6">
                  
                  {/* Home Team Column */}
                  <button
                    onClick={() => {
                      if (sf1Scores.mode === 'simple') {
                        playClickSound();
                        setSf1SimpleWinner('home');
                      }
                    }}
                    className={`flex flex-col items-center gap-2.5 text-center w-full sm:w-[31%] p-4.5 rounded-2xl border transition-all cursor-pointer ${
                      sf1Scores.mode === 'simple'
                        ? sf1SimpleWinner === 'home'
                          ? 'bg-yellow-500/15 border-yellow-500/55 shadow-md shadow-yellow-500/5'
                          : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                        : 'border-transparent bg-transparent pointer-events-none'
                    }`}
                  >
                    <FlagIcon country={state.semiFinals.sf1.homeTeam.name} className="w-16 h-16 rounded-full border border-white/10 shadow-md" />
                    <span className="font-bold text-xs md:text-sm text-white">{translateTeam(state.semiFinals.sf1.homeTeam.name, language)}</span>
                    <span className="text-[10px] bg-white/5 text-slate-400 px-2.5 py-0.5 rounded-md font-mono border border-white/10">
                      {translate('home', language)}
                    </span>
                  </button>

                  {/* Middle interactive controllers */}
                  <div className="flex flex-col items-center justify-center gap-3">
                    {sf1Scores.mode === 'simple' ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            playClickSound();
                            setSf1SimpleWinner('home');
                          }}
                          className={`w-14 h-14 rounded-2xl font-black font-sans text-lg border transition-all cursor-pointer ${
                            sf1SimpleWinner === 'home'
                              ? 'bg-yellow-500 border-yellow-600 text-black shadow-lg shadow-yellow-500/20'
                              : 'bg-white/5 border-white/10 hover:border-white/30 text-white'
                          }`}
                        >
                          1
                        </button>
                        <button
                          onClick={() => {
                            playClickSound();
                            setSf1SimpleWinner('away');
                          }}
                          className={`w-14 h-14 rounded-2xl font-black font-sans text-lg border transition-all cursor-pointer ${
                            sf1SimpleWinner === 'away'
                              ? 'bg-yellow-500 border-yellow-600 text-black shadow-lg shadow-yellow-500/20'
                              : 'bg-white/5 border-white/10 hover:border-white/30 text-white'
                          }`}
                        >
                          2
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3.5 bg-black/40 border border-white/5 px-5 py-3 rounded-2xl shadow-inner backdrop-blur">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => {
                              playClickSound();
                              setSf1Scores(prev => ({ ...prev, home: Math.max(0, prev.home - 1) }));
                            }}
                            className="w-7 h-7 font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-black text-2xl text-yellow-500">{sf1Scores.home}</span>
                          <button
                            onClick={() => {
                              playClickSound();
                              setSf1Scores(prev => ({ ...prev, home: prev.home + 1 }));
                            }}
                            className="w-7 h-7 font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-mono text-white/30 font-bold px-1 uppercase">{translate('vs', language)}</span>

                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => {
                              playClickSound();
                              setSf1Scores(prev => ({ ...prev, away: Math.max(0, prev.away - 1) }));
                            }}
                            className="w-7 h-7 font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-black text-2xl text-yellow-500">{sf1Scores.away}</span>
                          <button
                            onClick={() => {
                              playClickSound();
                              setSf1Scores(prev => ({ ...prev, away: prev.away + 1 }));
                            }}
                            className="w-7 h-7 font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                    {sf1Scores.mode === 'exact' && sf1Scores.home === sf1Scores.away && (
                      <span className="text-[9.5px] text-red-400 font-mono text-center block leading-none">{translate('noTies', language)}</span>
                    )}
                  </div>

                  {/* Away Team Column */}
                  <button
                    onClick={() => {
                      if (sf1Scores.mode === 'simple') {
                        playClickSound();
                        setSf1SimpleWinner('away');
                      }
                    }}
                    className={`flex flex-col items-center gap-2.5 text-center w-full sm:w-[31%] p-4.5 rounded-2xl border transition-all cursor-pointer ${
                      sf1Scores.mode === 'simple'
                        ? sf1SimpleWinner === 'away'
                          ? 'bg-yellow-500/15 border-yellow-500/55 shadow-md shadow-yellow-500/5'
                          : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                        : 'border-transparent bg-transparent pointer-events-none'
                    }`}
                  >
                    <FlagIcon country={state.semiFinals.sf1.awayTeam.name} className="w-16 h-16 rounded-full border border-white/10 shadow-md" />
                    <span className="font-bold text-xs md:text-sm text-white">{translateTeam(state.semiFinals.sf1.awayTeam.name, language)}</span>
                    <span className="text-[10px] bg-white/5 text-slate-400 px-2.5 py-0.5 rounded-md font-mono border border-white/10">
                      {translate('away', language)}
                    </span>
                  </button>

                </div>
              </div>

              {/* Semi-Final 2 Predict Card Container */}
              <div className="bg-white/[0.03] border border-white/12 p-6 rounded-[28px] flex flex-col gap-5 relative overflow-hidden backdrop-blur-md shadow-xl">
                <div className="absolute top-0 right-0 p-1.5 bg-yellow-500 text-[8px] font-black text-black px-4 uppercase tracking-widest font-mono rounded-bl-xl shadow-md">
                  {translate('semi2Matchup', language)}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center pb-3.5 mt-5 border-b border-white/5 gap-3">
                  <span className="text-[10px] text-yellow-500 font-mono font-bold uppercase tracking-widest">
                    {translate('winnerOrScore', language)}
                  </span>

                  {/* Mode Selector Pill */}
                  <div className="flex bg-black/35 p-0.5 border border-white/10 rounded-full">
                    <button
                      onClick={() => {
                        playClickSound();
                        setSf2Scores(prev => ({ ...prev, mode: 'simple' }));
                      }}
                      className={`px-3.5 py-1.5 text-[10px] uppercase font-mono tracking-wider font-extrabold rounded-full transition-all cursor-pointer ${
                        sf2Scores.mode === 'simple'
                          ? 'bg-yellow-500 text-black shadow-md'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {translate('simpleMode', language)}
                    </button>
                    <button
                      onClick={() => {
                        playClickSound();
                        setSf2Scores(prev => ({ ...prev, mode: 'exact' }));
                      }}
                      className={`px-3.5 py-1.5 text-[10px] uppercase font-mono tracking-wider font-extrabold rounded-full transition-all cursor-pointer ${
                        sf2Scores.mode === 'exact'
                          ? 'bg-yellow-500 text-black shadow-md'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {translate('exactMode', language)}
                    </button>
                  </div>
                </div>

                {/* Team Grid Row Selection */}
                <div className="flex flex-col sm:flex-row items-center justify-between py-2 gap-6">
                  
                  {/* Home Team Column */}
                  <button
                    onClick={() => {
                      if (sf2Scores.mode === 'simple') {
                        playClickSound();
                        setSf2SimpleWinner('home');
                      }
                    }}
                    className={`flex flex-col items-center gap-2.5 text-center w-full sm:w-[31%] p-4.5 rounded-2xl border transition-all cursor-pointer ${
                      sf2Scores.mode === 'simple'
                        ? sf2SimpleWinner === 'home'
                          ? 'bg-yellow-500/15 border-yellow-500/55 shadow-md shadow-yellow-500/5'
                          : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                        : 'border-transparent bg-transparent pointer-events-none'
                    }`}
                  >
                    <FlagIcon country={state.semiFinals.sf2.homeTeam.name} className="w-16 h-16 rounded-full border border-white/10 shadow-md" />
                    <span className="font-bold text-xs md:text-sm text-white">{translateTeam(state.semiFinals.sf2.homeTeam.name, language)}</span>
                    <span className="text-[10px] bg-white/5 text-slate-400 px-2.5 py-0.5 rounded-md font-mono border border-white/10">
                      {translate('home', language)}
                    </span>
                  </button>

                  {/* Middle interactive controllers */}
                  <div className="flex flex-col items-center justify-center gap-3">
                    {sf2Scores.mode === 'simple' ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            playClickSound();
                            setSf2SimpleWinner('home');
                          }}
                          className={`w-14 h-14 rounded-2xl font-black font-sans text-lg border transition-all cursor-pointer ${
                            sf2SimpleWinner === 'home'
                              ? 'bg-yellow-500 border-yellow-600 text-black shadow-lg shadow-yellow-500/20'
                              : 'bg-white/5 border-white/10 hover:border-white/30 text-white'
                          }`}
                        >
                          1
                        </button>
                        <button
                          onClick={() => {
                            playClickSound();
                            setSf2SimpleWinner('away');
                          }}
                          className={`w-14 h-14 rounded-2xl font-black font-sans text-lg border transition-all cursor-pointer ${
                            sf2SimpleWinner === 'away'
                              ? 'bg-yellow-500 border-yellow-600 text-black shadow-lg shadow-yellow-500/20'
                              : 'bg-white/5 border-white/10 hover:border-white/30 text-white'
                          }`}
                        >
                          2
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3.5 bg-black/40 border border-white/5 px-5 py-3 rounded-2xl shadow-inner backdrop-blur border-box">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => {
                              playClickSound();
                              setSf2Scores(prev => ({ ...prev, home: Math.max(0, prev.home - 1) }));
                            }}
                            className="w-7 h-7 font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-black text-2xl text-yellow-500">{sf2Scores.home}</span>
                          <button
                            onClick={() => {
                              playClickSound();
                              setSf2Scores(prev => ({ ...prev, home: prev.home + 1 }));
                            }}
                            className="w-7 h-7 font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-mono text-white/30 font-bold px-1 uppercase">{translate('vs', language)}</span>

                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => {
                              playClickSound();
                              setSf2Scores(prev => ({ ...prev, away: Math.max(0, prev.away - 1) }));
                            }}
                            className="w-7 h-7 font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-black text-2xl text-yellow-500">{sf2Scores.away}</span>
                          <button
                            onClick={() => {
                              playClickSound();
                              setSf2Scores(prev => ({ ...prev, away: prev.away + 1 }));
                            }}
                            className="w-7 h-7 font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                    {sf2Scores.mode === 'exact' && sf2Scores.home === sf2Scores.away && (
                      <span className="text-[9.5px] text-red-400 font-mono text-center block leading-none">{translate('noTies', language)}</span>
                    )}
                  </div>

                  {/* Away Team Column */}
                  <button
                    onClick={() => {
                      if (sf2Scores.mode === 'simple') {
                        playClickSound();
                        setSf2SimpleWinner('away');
                      }
                    }}
                    className={`flex flex-col items-center gap-2.5 text-center w-full sm:w-[31%] p-4.5 rounded-2xl border transition-all cursor-pointer ${
                      sf2Scores.mode === 'simple'
                        ? sf2SimpleWinner === 'away'
                          ? 'bg-yellow-500/15 border-yellow-500/55 shadow-md shadow-yellow-500/5'
                          : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                        : 'border-transparent bg-transparent pointer-events-none'
                    }`}
                  >
                    <FlagIcon country={state.semiFinals.sf2.awayTeam.name} className="w-16 h-16 rounded-full border border-white/10 shadow-md" />
                    <span className="font-bold text-xs md:text-sm text-white">{translateTeam(state.semiFinals.sf2.awayTeam.name, language)}</span>
                    <span className="text-[10px] bg-white/5 text-slate-400 px-2.5 py-0.5 rounded-md font-mono border border-white/10">
                      {translate('away', language)}
                    </span>
                  </button>

                </div>
              </div>

            </div>

            {/* CTAs */}
            <div className="flex gap-4.5 mt-2">
              <button
                onClick={() => {
                  playClickSound();
                  setCurrentStep('selection');
                }}
                className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold text-xs uppercase rounded-2xl border border-white/10 transition cursor-pointer"
              >
                {translate('goBack', language)}
              </button>
              <button
                onClick={submitSemiPredictions}
                className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-sans font-extrabold uppercase text-xs tracking-widest rounded-2xl transition shadow-lg shadow-yellow-500/10 active:scale-98 cursor-pointer"
              >
                {translate('advanceFinal', language)}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 3: GRAND FINAL DECISIVE prediction
            ======================================================== */}
        {currentStep === 'final_prediction' && state.final && (
          <div className="max-w-3xl mx-auto flex flex-col gap-8 animate-fade-in pb-12">
            <div className="text-center flex flex-col items-center">
              <div className="w-14 h-14 bg-yellow-500/10 border-2 border-yellow-500/40 text-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/10 animate-pulse mb-3.5">
                <Trophy className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black font-display text-white uppercase tracking-tight">
                {translate('finalTitle', language)}
              </h2>
              <p className="text-white/65 text-xs sm:text-sm mt-3 leading-relaxed max-w-md mx-auto">
                {translate('finalDesc', language)}
              </p>
            </div>

            {/* Match Card Container */}
            <div className="bg-white/[0.03] border border-yellow-500/20 p-6 rounded-[32px] flex flex-col gap-6 shadow-2xl relative backdrop-blur-md overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-950 font-black px-4 py-1 rounded-b-xl text-[8.5px] uppercase tracking-wider font-mono shadow-md">
                {translate('decisiveMatch', language)}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center pb-3.5 mt-5 border-b border-white/5 gap-3">
                <span className="text-[10px] text-yellow-500 font-mono font-bold uppercase tracking-widest block">
                  {translate('championshipMatch', language)}
                </span>

                {/* Mode Selector Pill */}
                <div className="flex bg-black/35 p-0.5 border border-white/10 rounded-full">
                  <button
                    onClick={() => {
                      playClickSound();
                      setFinalScores(prev => ({ ...prev, mode: 'simple' }));
                    }}
                    className={`px-3.5 py-1.5 text-[10px] uppercase font-mono tracking-wider font-extrabold rounded-full transition-all cursor-pointer ${
                      finalScores.mode === 'simple'
                        ? 'bg-yellow-500 text-black shadow-md'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {translate('simpleMode', language)}
                  </button>
                  <button
                    onClick={() => {
                      playClickSound();
                      setFinalScores(prev => ({ ...prev, mode: 'exact' }));
                    }}
                    className={`px-3.5 py-1.5 text-[10px] uppercase font-mono tracking-wider font-extrabold rounded-full transition-all cursor-pointer ${
                      finalScores.mode === 'exact'
                        ? 'bg-yellow-500 text-black shadow-md'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {translate('exactMode', language)}
                  </button>
                </div>
              </div>

              {/* Match Visual Battle Grid */}
              <div className="flex flex-col sm:flex-row items-center justify-between py-2 gap-6">
                
                {/* Home Team Finalist Column */}
                <button
                  onClick={() => {
                    if (finalScores.mode === 'simple') {
                      playClickSound();
                      setFinalSimpleWinner('home');
                    }
                  }}
                  className={`flex flex-col items-center gap-3 text-center w-full sm:w-[32%] p-5 rounded-2xl border transition-all cursor-pointer ${
                    finalScores.mode === 'simple'
                      ? finalSimpleWinner === 'home'
                        ? 'bg-yellow-500/15 border-yellow-500/55 shadow-md shadow-yellow-500/5'
                        : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                      : 'border-transparent bg-transparent pointer-events-none'
                  }`}
                >
                  <FlagIcon country={state.final.homeTeam.name} className="w-20 h-20 rounded-full border border-white/10 shadow-lg" />
                  <span className="font-bold text-base text-white mt-1">{translateTeam(state.final.homeTeam.name, language)}</span>
                  <span className="text-[10px] bg-white/5 text-slate-400 px-2.5 py-0.5 rounded-md font-mono border border-white/10">
                    {translate('home', language)}
                  </span>
                </button>

                {/* Middle tools */}
                <div className="flex flex-col items-center justify-center gap-3">
                  {finalScores.mode === 'simple' ? (
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          playClickSound();
                          setFinalSimpleWinner('home');
                        }}
                        className={`w-16 h-16 rounded-2xl font-black font-sans text-xl border transition-all cursor-pointer ${
                          finalSimpleWinner === 'home'
                            ? 'bg-yellow-500 border-yellow-600 text-black shadow-lg shadow-yellow-500/25'
                            : 'bg-white/5 border-white/10 hover:border-white/30 text-white'
                        }`}
                      >
                        1
                      </button>
                      <button
                        onClick={() => {
                          playClickSound();
                          setFinalSimpleWinner('away');
                        }}
                        className={`w-16 h-16 rounded-2xl font-black font-sans text-xl border transition-all cursor-pointer ${
                          finalSimpleWinner === 'away'
                            ? 'bg-yellow-500 border-yellow-600 text-black shadow-lg shadow-yellow-500/25'
                            : 'bg-white/5 border-white/10 hover:border-white/30 text-white'
                        }`}
                      >
                        2
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 bg-black/40 border border-white/5 px-6 py-4 rounded-2xl shadow-inner backdrop-blur border-box">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => {
                            playClickSound();
                            setFinalScores(prev => ({ ...prev, home: Math.max(0, prev.home - 1) }));
                          }}
                          className="w-8 h-8 font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-black text-3xl text-yellow-500">{finalScores.home}</span>
                        <button
                          onClick={() => {
                            playClickSound();
                            setFinalScores(prev => ({ ...prev, home: prev.home + 1 }));
                          }}
                          className="w-8 h-8 font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-sm font-mono text-white/30 font-bold px-2 uppercase">{translate('vs', language)}</span>

                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => {
                            playClickSound();
                            setFinalScores(prev => ({ ...prev, away: Math.max(0, prev.away - 1) }));
                          }}
                          className="w-8 h-8 font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-black text-3xl text-yellow-500">{finalScores.away}</span>
                        <button
                          onClick={() => {
                            playClickSound();
                            setFinalScores(prev => ({ ...prev, away: prev.away + 1 }));
                          }}
                          className="w-8 h-8 font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                  {finalScores.mode === 'exact' && finalScores.home === finalScores.away && (
                    <span className="text-[9.5px] text-red-400 font-mono text-center block leading-none">{translate('noTies', language)}</span>
                  )}
                </div>

                {/* Away Team Contender Column */}
                <button
                  onClick={() => {
                    if (finalScores.mode === 'simple') {
                      playClickSound();
                      setFinalSimpleWinner('away');
                    }
                  }}
                  className={`flex flex-col items-center gap-3 text-center w-full sm:w-[32%] p-5 rounded-2xl border transition-all cursor-pointer ${
                    finalScores.mode === 'simple'
                      ? finalSimpleWinner === 'away'
                        ? 'bg-yellow-500/15 border-yellow-500/55 shadow-md shadow-yellow-500/5'
                        : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                      : 'border-transparent bg-transparent pointer-events-none'
                  }`}
                >
                  <FlagIcon country={state.final.awayTeam.name} className="w-20 h-20 rounded-full border border-white/10 shadow-lg" />
                  <span className="font-bold text-base text-white mt-1">{translateTeam(state.final.awayTeam.name, language)}</span>
                  <span className="text-[10px] bg-white/5 text-slate-400 px-2.5 py-0.5 rounded-md font-mono border border-white/10">
                    {translate('away', language)}
                  </span>
                </button>

              </div>
            </div>

            {/* CTA action buttons */}
            <div className="flex gap-4.5">
              <button
                onClick={() => {
                  playClickSound();
                  setCurrentStep('semi_predictions');
                }}
                className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold text-xs uppercase rounded-2xl border border-white/10 transition cursor-pointer"
              >
                {translate('goBack', language)}
              </button>
              <button
                onClick={submitFinalPrediction}
                className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-sans font-extrabold uppercase text-xs tracking-widest rounded-2xl transition shadow-lg shadow-yellow-500/10 active:scale-98 cursor-pointer"
              >
                🏆 {translate('submitAndReceipt', language)}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 4: FINAL BET SLIP CERTIFICATE
            ======================================================== */}
        {currentStep === 'ticket' && (
          <BetSlip
            state={state}
            onPlayFinalGame={() => {
              playClickSound();
              setCurrentStep('shootout');
            }}
            onResetTournament={resetPredictor}
            lang={language}
          />
        )}

        {/* ========================================================
            STEP 5: INTERACTIVE SOCCER PENALTY SIMULATOR GAME
            ======================================================== */}
        {currentStep === 'shootout' && state.final && (
          <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-zoom-in">
            <PenaltyGame
              finalist1={state.final.homeTeam}
              finalist2={state.final.awayTeam}
              onSubmitWinner={handleShootoutWinner}
              onReset={() => {
                playClickSound();
                setCurrentStep('ticket');
              }}
              lang={language}
            />
          </div>
        )}



      </main>



      {/* ========================================================
          APPLE CUSTOM TRANSLUCENT SLIDING SETTINGS MODAL
          ======================================================== */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in bg-slate-950/60 backdrop-blur-sm">
          {/* Backdrop closer click */}
          <div className="absolute inset-0" onClick={() => { playClickSound(); setShowSettings(false); }} />

          {/* Right slid panel */}
          <div className="relative w-full max-w-sm bg-slate-900/90 border-l border-white/15 backdrop-blur-2xl p-6 shadow-2xl flex flex-col justify-between h-full z-10 animate-zoom-in">
            <div className="flex flex-col gap-6">
              
              {/* Settings Header bar */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div className="flex items-center gap-2 leading-none">
                  <Settings className="w-4.5 h-4.5 text-yellow-500" />
                  <span className="font-sans font-extrabold text-sm uppercase text-slate-100 tracking-wider">
                    {translate('settingsHeader', language)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    playClickSound();
                    setShowSettings(false);
                  }}
                  className="p-1.5 bg-white/5 border border-white/10 hover:border-white/20 text-white/70 hover:text-white rounded-full transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preferences List settings elements */}
              <div className="flex flex-col gap-5">

                {/* 2. Sound Effects preference toggle */}
                <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-2xl border border-white/10">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-200">{translate('soundLabel', language)}</span>
                    <span className="text-[10px] text-white/45 mt-0.5">{translate('soundOn', language)} / {translate('soundOff', language)}</span>
                  </div>
                  <button
                    onClick={handleToggleSound}
                    className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                      soundEnabled 
                        ? 'bg-yellow-500 text-black border-yellow-600 shadow' 
                        : 'bg-white/5 border-white/10 text-white/70'
                    }`}
                  >
                    {soundEnabled ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{translate('soundOn', language)}</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>{translate('soundOff', language)}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 3. Visual Appearance Theme selecting row */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-white/50">{translate('themeLabel', language)}</span>
                  <div className="grid grid-cols-3 gap-1 bg-black/35 p-1 rounded-xl border border-white/5">
                    {(['glass', 'midnight', 'emerald'] as const).map((theme) => {
                      const active = currentTheme === theme;
                      let label = translate('themeSystem', language);
                      if (theme === 'midnight') label = translate('themeMidnight', language);
                      if (theme === 'emerald') label = translate('themeEmerald', language);

                      return (
                        <button
                          key={theme}
                          onClick={() => handleSetTheme(theme)}
                          className={`py-2 text-[10px] font-bold rounded-lg transition-all capitalize cursor-pointer ${
                            active 
                              ? 'bg-yellow-500 text-black font-extrabold shadow' 
                              : 'text-white/60 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Export preferred format layout selector row */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-white/50">{translate('exportPrefLabel', language)}</span>
                  <div className="grid grid-cols-2 gap-1.5 bg-black/30 p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => handleSetPdfPreference('A4')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        pdfPreference === 'A4' ? 'bg-yellow-500 text-black font-extrabold' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {translate('pdfA4', language)}
                    </button>
                    <button
                      onClick={() => handleSetPdfPreference('Letter')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        pdfPreference === 'Letter' ? 'bg-yellow-500 text-black font-extrabold' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {translate('pdfLetter', language)}
                    </button>
                  </div>
                </div>

                {/* 5. Hard Reset All Data preferences */}
                <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-white/50">{translate('resetLabel', language)}</span>
                  <button
                    onClick={triggerResetConfirm}
                    className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-200 hover:text-red-100 font-sans font-bold text-xs uppercase tracking-wider rounded-xl border border-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                    {translate('resetAllData', language)}
                  </button>
                </div>

              </div>

            </div>

            {/* Slide menu bottom closer CTA */}
            <button
              onClick={() => {
                playClickSound();
                setShowSettings(false);
              }}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-sans font-bold text-xs uppercase rounded-xl transition cursor-pointer"
            >
              {translate('closePref', language)}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          APPLE MODAL PRESETS FOR RESET tournament CONFIRMATION
          ======================================================== */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-white/20 p-6 rounded-3xl shadow-2xl text-center backdrop-blur-3xl animate-zoom-in relative">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
            </div>

            <h3 className="text-lg font-extrabold text-slate-100 font-sans tracking-tight mb-2">
              {translate('resetConfirmTitle', language)}
            </h3>
            <p className="text-xs text-white/60 mb-5 leading-relaxed">
              {translate('resetConfirmDesc', language)}
            </p>

            <div className="flex gap-2.5 w-full">
              <button
                onClick={() => {
                  playClickSound();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/12 transition cursor-pointer"
              >
                {translate('cancel', language)}
              </button>
              <button
                onClick={handleConfirmReset}
                className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                {translate('confirm', language)}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
