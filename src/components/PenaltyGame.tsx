import React, { useState, useEffect } from 'react';
import { Team, PenaltyShot, ShootoutScore } from '../types';
import FlagIcon from './FlagIcon';
import Confetti from './Confetti';
import { Trophy, HelpCircle, RefreshCw, Zap, Disc, ArrowLeft, ShieldAlert, Award } from 'lucide-react';
import { Language, translate, translateTeam } from '../translations';
import { playClickSound, playFailureSound, playGoalSound, playSuccessSound } from '../utils/audio';

interface PenaltyGameProps {
  finalist1: Team;
  finalist2: Team;
  onSubmitWinner: (winner: Team) => void;
  onReset: () => void;
  lang: Language;
}

export default function PenaltyGame({ finalist1, finalist2, onSubmitWinner, onReset, lang }: PenaltyGameProps) {
  const [playerTeam, setPlayerTeam] = useState<Team | null>(null);
  const [opponentTeam, setOpponentTeam] = useState<Team | null>(null);

  // Shootout phases: 'select_team' | 'playing' | 'celebration'
  const [phase, setPhase] = useState<'select_team' | 'playing' | 'celebration'>('select_team');

  // Shot states
  const [shootoutScores, setShootoutScores] = useState<ShootoutScore>({
    player: [],
    opponent: [],
  });

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [isPlayerTurn, setIsPlayerTurn] = useState<boolean>(true); // Player shoots, AI goalkeeper
  const [shotCount, setShotCount] = useState<number>(0);

  // Shooting controls
  const [shotDirection, setShotDirection] = useState<'left' | 'center' | 'right'>('center');
  const [shotHeight, setShotHeight] = useState<'low' | 'medium' | 'high'>('medium');
  const [shotPower, setShotPower] = useState<number>(75);

  // Goalkeeping controls
  const [gkDive, setGkDive] = useState<'left' | 'center' | 'right'>('center');

  // Animated states
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animBallPos, setAnimBallPos] = useState({ x: 50, y: 80, scale: 1, rotate: 0 });
  const [animGkPos, setAnimGkPos] = useState<'center' | 'left-low' | 'left-high' | 'right-low' | 'right-high' | 'center-high'>('center');
  
  const [lastShotResult, setLastShotResult] = useState<{
    shooter: string;
    action: 'save' | 'goal' | 'post' | 'miss';
    desc: string;
  } | null>(null);

  const [shootoutWinner, setShootoutWinner] = useState<Team | null>(null);

  // Set selected team
  const selectTeam = (team: Team) => {
    playClickSound();
    setPlayerTeam(team);
    setOpponentTeam(team.name === finalist1.name ? finalist2 : finalist1);
    setPhase('playing');
    setShootoutScores({ player: [], opponent: [] });
    setCurrentRound(1);
    setIsPlayerTurn(true);
    setLastShotResult(null);
  };

  // Kick Ball simulation
  const handleKick = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setLastShotResult(null);
    playClickSound();

    // AI Goalkeeper decision
    const directions: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
    const heights: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const aiDiveDir = directions[Math.floor(Math.random() * directions.length)];
    const aiDiveHeight = heights[Math.floor(Math.random() * heights.length)];

    let outcome: 'goal' | 'saved' | 'post' | 'missed' = 'goal';
    let desc = translate('elegantGoal', lang);

    const dirMap = { left: 25, center: 50, right: 75 };
    const hMap = { low: 45, medium: 32, high: 20 };

    const targetX = dirMap[shotDirection] + (Math.random() - 0.5) * (shotPower / 12);
    const targetY = hMap[shotHeight] - (Math.random() - 0.5) * (shotPower / 12);

    // AI dive positioning
    if (aiDiveDir === 'left') {
      setAnimGkPos(aiDiveHeight === 'high' ? 'left-high' : 'left-low');
    } else if (aiDiveDir === 'right') {
      setAnimGkPos(aiDiveHeight === 'high' ? 'right-high' : 'right-low');
    } else {
      setAnimGkPos(aiDiveHeight === 'high' ? 'center-high' : 'center');
    }

    // Power boundary checks
    if (shotPower > 92) {
      if (Math.random() < 0.6) {
        outcome = 'missed';
        desc = translate('overTheBar', lang);
      } else {
        outcome = 'post';
        desc = translate('rattledCrossbar', lang);
      }
    } else if (shotPower < 25) {
      outcome = 'saved';
      desc = translate('weakEffort', lang);
    } else {
      if (aiDiveDir === shotDirection) {
        if (aiDiveHeight === shotHeight) {
          outcome = 'saved';
          const heightLabel = lang === 'it' ? (shotHeight === 'high' ? 'alto' : shotHeight === 'medium' ? 'medio' : 'basso') : shotHeight;
          desc = translate('unbelievableSave', lang, [heightLabel]);
        } else if (Math.random() < 0.65) {
          outcome = 'saved';
          desc = translate('simpleSave', lang);
        } else {
          outcome = 'goal';
          desc = translate('powerfulGoal', lang);
        }
      } else {
        if (Math.random() < 0.08) {
          outcome = 'post';
          desc = translate('outOfPost', lang);
        } else {
          outcome = 'goal';
          desc = translate('elegantGoal', lang);
        }
      }
    }

    // Sound reactions
    setTimeout(() => {
      if (outcome === 'goal') {
        playGoalSound();
      } else if (outcome === 'saved') {
        playFailureSound();
      } else {
        playFailureSound();
      }
    }, 400);

    let finalBallX = targetX;
    let finalBallY = targetY;

    if (outcome === 'missed') {
      finalBallX = targetX + (Math.random() - 0.5) * 30;
      finalBallY = 5;
    } else if (outcome === 'post') {
      const side = Math.random() < 0.5 ? 'left' : 'right';
      finalBallX = side === 'left' ? 20 : 80;
      finalBallY = 16;
    }

    setAnimBallPos({ x: 50, y: 80, scale: 1, rotate: 0 });
    
    setTimeout(() => {
      setAnimBallPos({
        x: finalBallX,
        y: finalBallY,
        scale: 0.22,
        rotate: 720,
      });
    }, 50);

    setTimeout(() => {
      setLastShotResult({
        shooter: translateTeam(playerTeam?.name || 'Player', lang),
        action: outcome === 'goal' ? 'goal' : outcome === 'post' ? 'post' : outcome === 'missed' ? 'miss' : 'save',
        desc,
      });

      const newScores = { ...shootoutScores };
      newScores.player.push(outcome === 'goal' ? 'goal' : outcome === 'saved' ? 'saved' : 'miss');
      setShootoutScores(newScores);

      setIsAnimating(false);
      setTimeout(() => {
        setAnimBallPos({ x: 50, y: 80, scale: 1, rotate: 0 });
        setAnimGkPos('center');
        setIsPlayerTurn(false);
      }, 1900);
    }, 1200);
  };

  // AI kicks, human dives
  const handleDive = (diveSelected: 'left' | 'center' | 'right') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setLastShotResult(null);
    setGkDive(diveSelected);
    playClickSound();

    // AI shooter choices
    const directions: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
    const heights: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const aiKickDir = directions[Math.floor(Math.random() * directions.length)];
    const aiKickHeight = heights[Math.floor(Math.random() * heights.length)];
    const aiPower = Math.floor(Math.random() * 50) + 40;

    if (diveSelected === 'left') {
      setAnimGkPos(Math.random() < 0.5 ? 'left-high' : 'left-low');
    } else if (diveSelected === 'right') {
      setAnimGkPos(Math.random() < 0.5 ? 'right-high' : 'right-low');
    } else {
      setAnimGkPos(Math.random() < 0.5 ? 'center-high' : 'center');
    }

    const dirMap = { left: 28, center: 50, right: 72 };
    const hMap = { low: 46, medium: 33, high: 19 };

    const targetX = dirMap[aiKickDir] + (Math.random() - 0.5) * 4;
    const targetY = hMap[aiKickHeight] - (Math.random() - 0.5) * 4;

    let outcome: 'goal' | 'saved' | 'post' | 'missed' = 'goal';
    let desc = translate('opponentGoal', lang, [translateTeam(opponentTeam?.name || '', lang)]);

    if (aiPower > 86 && Math.random() < 0.4) {
      outcome = 'missed';
      desc = translate('opponentOverBar', lang, [translateTeam(opponentTeam?.name || '', lang)]);
    } else if (diveSelected === aiKickDir) {
      if (Math.random() < 0.75) {
        outcome = 'saved';
        desc = translate('opponentSave', lang);
      } else {
        outcome = 'goal';
        desc = translate('opponentDeflected', lang);
      }
    } else {
      if (Math.random() < 0.05) {
        outcome = 'post';
        desc = translate('opponentPost', lang);
      } else {
        outcome = 'goal';
        desc = translate('opponentElegant', lang);
      }
    }

    setTimeout(() => {
      if (outcome === 'saved') {
        playSuccessSound();
      } else if (outcome === 'goal') {
        playGoalSound();
      } else {
        playFailureSound();
      }
    }, 400);

    let finalBallX = targetX;
    let finalBallY = targetY;

    if (outcome === 'missed') {
      finalBallX = targetX + (Math.random() - 0.5) * 20;
      finalBallY = 4;
    } else if (outcome === 'post') {
      finalBallX = Math.random() < 0.5 ? 20 : 80;
      finalBallY = 16;
    }

    setTimeout(() => {
      setAnimBallPos({
        x: finalBallX,
        y: finalBallY,
        scale: 0.22,
        rotate: -540,
      });
    }, 50);

    setTimeout(() => {
      setLastShotResult({
        shooter: translateTeam(opponentTeam?.name || 'Com', lang),
        action: outcome === 'goal' ? 'goal' : outcome === 'post' ? 'post' : outcome === 'missed' ? 'miss' : 'save',
        desc,
      });

      const newScores = { ...shootoutScores };
      newScores.opponent.push(outcome === 'goal' ? 'goal' : outcome === 'saved' ? 'saved' : 'miss');
      setShootoutScores(newScores);

      setIsAnimating(false);

      setTimeout(() => {
        setAnimBallPos({ x: 50, y: 80, scale: 1, rotate: 0 });
        setAnimGkPos('center');
        evaluateProgress(newScores);
      }, 1900);
    }, 1200);
  };

  const evaluateProgress = (scores: ShootoutScore) => {
    const plShots = scores.player.length;
    const opShots = scores.opponent.length;

    if (plShots !== opShots) return;

    const plGoals = scores.player.filter(s => s === 'goal').length;
    const opGoals = scores.opponent.filter(s => s === 'goal').length;

    // Standard 5 rounds
    if (plShots < 5) {
      const plRemaining = 5 - plShots;
      const opRemaining = 5 - opShots;

      if (plGoals + plRemaining < opGoals) {
        endShootout(opponentTeam!);
      } else if (opGoals + opRemaining < plGoals) {
        endShootout(playerTeam!);
      } else {
        setCurrentRound(plShots + 1);
        setIsPlayerTurn(true);
      }
    } else {
      if (plGoals !== opGoals) {
        endShootout(plGoals > opGoals ? playerTeam! : opponentTeam!);
      } else {
        setCurrentRound(plShots + 1);
        setIsPlayerTurn(true);
      }
    }
  };

  const endShootout = (winner: Team) => {
    setShootoutWinner(winner);
    setPhase('celebration');
    playSuccessSound();

    try {
      localStorage.setItem('wcupsf_penalty_last_winner', JSON.stringify(winner));
      const penaltyStats = {
        winner: winner.name,
        playerTeam: playerTeam?.name,
        opponentTeam: opponentTeam?.name,
        date: new Date().toLocaleDateString(),
      };
      localStorage.setItem('wcupsf_penalty_stats', JSON.stringify(penaltyStats));
    } catch (e) {}
  };

  const handleFinishAndSubmit = () => {
    playClickSound();
    if (shootoutWinner) {
      onSubmitWinner(shootoutWinner);
    }
  };

  const renderDots = (team: 'player' | 'opponent') => {
    const results = shootoutScores[team];
    const maxDots = Math.max(5, currentRound);
    return (
      <div className="flex items-center gap-1.5">
        {Array.from({ length: maxDots }).map((_, i) => {
          const res = results[i];
          let color = 'bg-white/5 border border-white/10 text-white/40';
          let symbol = '';

          if (res === 'goal') {
            color = 'bg-emerald-500 border border-emerald-400 text-white shadow-md shadow-emerald-500/20';
            symbol = '✓';
          } else if (res === 'saved' || res === 'miss') {
            color = 'bg-rose-500 border border-rose-400 text-white shadow-md shadow-rose-500/20';
            symbol = '✗';
          } else if (i === results.length && isPlayerTurn === (team === 'player')) {
            color = 'bg-yellow-500/35 border border-yellow-400 animate-pulse text-yellow-300';
            symbol = '•';
          }

          return (
            <div
              key={i}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${color}`}
            >
              {symbol}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div id="penalty-simulation-container" className="relative w-full min-h-[500px] bg-slate-900/60 text-white rounded-[32px] border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between backdrop-blur-xl animate-fade-in">
      <Confetti active={phase === 'celebration'} />

      {/* Header bar */}
      <div className="w-full bg-white/[0.03] border-b border-white/10 p-4 flex justify-between items-center z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-500 w-4.5 h-4.5 animate-pulse" />
          <h2 className="font-sans font-extrabold text-xs md:text-sm text-yellow-500 uppercase tracking-widest">
            {translate('shootoutArena', lang)}
          </h2>
        </div>
        <button
          onClick={() => {
            playClickSound();
            onReset();
          }}
          className="flex items-center gap-1 text-[10px] text-white/70 hover:text-white border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all cursor-pointer font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {translate('predictorMenu', lang)}
        </button>
      </div>

      {phase === 'select_team' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto my-auto animate-zoom-in">
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/10 mb-5 animate-bounce">
            <Trophy className="w-7 h-7 text-slate-950" />
          </div>
          <h3 className="text-xl md:text-2xl font-black font-sans text-yellow-500 tracking-tight mb-2">
            {translate('selectShootoutTeam', lang)}
          </h3>
          <p className="text-white/60 text-xs md:text-sm mb-6 leading-relaxed">
            {translate('selectShootoutDesc', lang)}
          </p>

          <div className="grid grid-cols-2 gap-4 w-full">
            {[finalist1, finalist2].map((team) => (
              <button
                key={team.name}
                onClick={() => selectTeam(team)}
                className="group p-5 bg-white/5 border border-white/10 hover:border-yellow-500/50 rounded-2xl flex flex-col items-center gap-3.5 transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 cursor-pointer"
              >
                <FlagIcon country={team.name} className="w-14 h-14 ring-4 ring-white/10 group-hover:ring-yellow-500/40 transition-all rounded-full" />
                <span className="font-bold text-xs md:text-sm text-white/90 group-hover:text-yellow-400 transition-colors">
                  {translateTeam(team.name, lang)}
                </span>
                <span className="text-[9px] bg-white/5 px-2.5 py-1 rounded-lg text-white/50 font-mono font-bold tracking-wider">
                  {translate('playAs', lang)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <div className="flex-1 flex flex-col justify-between p-4 md:p-6 relative select-none">
          {/* Scoreboard layer */}
          <div className="w-full bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col md:flex-row justify-between items-center gap-4 z-10">
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-2">
                <FlagIcon country={playerTeam?.name || ''} className="w-8 h-8 rounded-full" />
                <div className="text-left leading-tight">
                  <span className="text-[9px] text-yellow-500 font-bold tracking-widest">{translate('you', lang)}</span>
                  <div className="font-bold text-xs max-w-[120px] truncate">{translateTeam(playerTeam?.name || '', lang)}</div>
                </div>
              </div>
              {renderDots('player')}
            </div>

            <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-mono font-bold text-white/80 border border-white/10 flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 fill-rose-500 stroke-rose-500 text-rose-500 animate-pulse" />
              {currentRound > 5 ? translate('suddenDeath', lang, [currentRound]) : translate('normalRound', lang, [currentRound])}
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              {renderDots('opponent')}
              <div className="flex items-center gap-2">
                <div className="text-right leading-tight">
                  <span className="text-[9px] text-white/50 font-bold tracking-widest">{translate('aiCom', lang)}</span>
                  <div className="font-bold text-xs max-w-[120px] truncate">{translateTeam(opponentTeam?.name || '', lang)}</div>
                </div>
                <FlagIcon country={opponentTeam?.name || ''} className="w-8 h-8 rounded-full" />
              </div>
            </div>
          </div>

          {/* Goal Perspective Arena */}
          <div className="flex-1 relative flex items-center justify-center my-6 min-h-[220px] bg-black/20 rounded-2xl overflow-hidden border border-white/10">
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-950/90 [background-image:radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.45)_100%)] opacity-90" />
            
            {/* Goal netting posts */}
            <div className="absolute top-[15%] left-[10%] right-[10%] bottom-0 border-t-4 border-x-4 border-white/90 rounded-t-lg bg-emerald-950/10 max-h-[160px] max-w-[620px] mx-auto flex items-end justify-center shadow-lg">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

              {/* Keepers position visual */}
              <div
                className={`w-14 h-24 absolute transition-all duration-500 pb-2 ${
                  animGkPos === 'center' ? 'bottom-0 translate-x-0' :
                  animGkPos === 'left-low' ? 'bottom-0 -translate-x-12 rotate-[-25deg]' :
                  animGkPos === 'left-high' ? 'bottom-10 -translate-x-16 rotate-[-45deg]' :
                  animGkPos === 'right-low' ? 'bottom-0 translate-x-12 rotate-[25deg]' :
                  animGkPos === 'right-high' ? 'bottom-10 translate-x-16 rotate-[45deg]' :
                  'bottom-12 -translate-y-2 translate-x-0 scale-y-110'
                }`}
                style={{ left: 'calc(50% - 28px)' }}
              >
                <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]">
                  <circle cx="50" cy="30" r="14" fill="#E2B79A" />
                  <rect x="42" y="16" width="16" height="6" fill="#1e293b" />
                  <path d="M25,48 L75,48 L80,110 L20,110 Z" fill="#F97316" stroke="#EA580C" strokeWidth="2" />
                  <line x1="25" y1="48" x2="10" y2="25" stroke="#F97316" strokeWidth="10" strokeLinecap="round" />
                  <line x1="75" y1="48" x2="90" y2="25" stroke="#F97316" strokeWidth="10" strokeLinecap="round" />
                  <circle cx="10" cy="22" r="7" fill="#E21C2F" />
                  <circle cx="90" cy="22" r="7" fill="#E21C2F" />
                  <rect x="25" y="110" width="50" height="25" fill="#1E293B" />
                  <rect x="30" y="135" width="14" height="45" fill="#E2B79A" />
                  <rect x="56" y="135" width="14" height="45" fill="#E2B79A" />
                  <rect x="26" y="176" width="20" height="10" fill="#000000" rx="3" />
                  <rect x="54" y="176" width="20" height="10" fill="#000000" rx="3" />
                </svg>
              </div>
            </div>

            {/* Stadium floor grass lines */}
            <div className="absolute bottom-0 inset-x-0 h-[22%] bg-gradient-to-t from-emerald-950/50 to-transparent border-t border-emerald-900/10 pointer-events-none" />

            {/* Interactive moving ball element */}
            <div
              className="absolute w-12 h-12 transition-all duration-[1150ms] ease-out pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] flex items-center justify-center z-25"
              style={{
                left: `${animBallPos.x}%`,
                top: `${animBallPos.y}%`,
                transform: `translate(-50%, -50%) scale(${animBallPos.scale}) rotate(${animBallPos.rotate}deg)`,
              }}
            >
              <div className="w-full h-full rounded-full bg-white border border-slate-950 relative overflow-hidden flex items-center justify-center shadow-md">
                <div className="absolute w-5 h-5 bg-slate-950 rotate-45" />
                <div className="absolute top-1 left-2 w-3 h-3 bg-slate-950 rounded-full" />
                <div className="absolute bottom-2 right-2 w-3 h-3 bg-slate-950 rounded-full" />
                <div className="absolute bottom-1 left-5 w-2 h-2 bg-slate-950 rounded-full" />
                <div className="absolute top-2 right-4 w-2.5 h-2.5 bg-slate-950 rounded-full" />
              </div>
            </div>

            {/* Overlay feedback screen */}
            {lastShotResult && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-md z-30 transition-all duration-300 p-4 rounded-xl text-center">
                <div className="max-w-xs md:max-w-md scale-95 animate-zoom-in">
                  <div className={`text-2xl md:text-3xl font-black uppercase tracking-widest mb-2 font-display ${
                    lastShotResult.action === 'goal' ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)] animate-pulse' :
                    lastShotResult.action === 'save' ? 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.3)]' :
                    'text-rose-400'
                  }`}>
                    {lastShotResult.action === 'goal' ? translate('goalLabel', lang) :
                     lastShotResult.action === 'save' ? translate('saveLabel', lang) :
                     lastShotResult.action === 'post' ? translate('postLabel', lang) : translate('missLabel', lang)}
                  </div>
                  <p className="text-white/95 text-xs md:text-sm font-semibold mb-1 shadow-sm font-sans px-2">
                    {lastShotResult.desc}
                  </p>
                  <p className="text-[10px] text-white/45 font-mono">
                    {translate('shooter', lang)}: {lastShotResult.shooter}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Interactive controls */}
          {isPlayerTurn ? (
            <div className="bg-white/[0.02] border border-white/10 p-4 rounded-2xl flex flex-col gap-4 z-10 backdrop-blur-md">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-yellow-500 tracking-wider uppercase font-mono">{translate('yourTurnStrike', lang)}</span>
                </div>
                <div className="text-[9px] text-white/50 font-mono">{translate('strikeHint', lang)}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Aiming Direction */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold font-mono">{translate('aimDirection', lang)}</span>
                  <div className="grid grid-cols-3 gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
                    {(['left', 'center', 'right'] as const).map((dir) => (
                      <button
                        key={dir}
                        onClick={() => setShotDirection(dir)}
                        disabled={isAnimating}
                        className={`py-2 text-[11px] font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                          shotDirection === dir
                            ? 'bg-yellow-500 text-black font-extrabold shadow-sm'
                            : 'bg-transparent text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {lang === 'it' ? (dir === 'left' ? 'Sinistra' : dir === 'right' ? 'Destra' : 'Centro') : dir}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aiming Height */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold font-mono">{translate('strokeHeight', lang)}</span>
                  <div className="grid grid-cols-3 gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
                    {(['low', 'medium', 'high'] as const).map((h) => (
                      <button
                        key={h}
                        onClick={() => setShotHeight(h)}
                        disabled={isAnimating}
                        className={`py-2 text-[11px] font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                          shotHeight === h
                            ? 'bg-yellow-500 text-black font-extrabold shadow-sm'
                            : 'bg-transparent text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {lang === 'it' ? (h === 'low' ? 'Basso' : h === 'high' ? 'Alto' : 'Medio') : h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aiming Power meter */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/50 font-bold font-mono">
                    <span>{translate('strikingForce', lang)}</span>
                    <span className={shotPower > 85 ? 'text-rose-400 font-extrabold' : 'text-yellow-400 font-extrabold'}>
                      {shotPower}% {shotPower > 85 ? translate('powerRisky', lang) : translate('powerPlaced', lang)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 h-9">
                    <input
                      type="range"
                      min="15"
                      max="100"
                      value={shotPower}
                      onChange={(e) => setShotPower(Number(e.target.value))}
                      disabled={isAnimating}
                      className="flex-1 accent-yellow-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Kick button */}
              <button
                onClick={handleKick}
                disabled={isAnimating}
                className="w-full py-3 bg-yellow-500 font-sans font-extrabold uppercase text-xs tracking-widest text-black rounded-xl transition-all shadow-md active:translate-y-[1px] cursor-pointer disabled:bg-white/5 disabled:text-white/30"
              >
                {isAnimating ? translate('executingStrike', lang) : translate('shootBtn', lang)}
              </button>
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/10 p-4 rounded-2xl flex flex-col gap-4 z-10 backdrop-blur-md">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-[10px] font-bold text-rose-400 tracking-wider uppercase font-mono">{translate('yourTurnGoal', lang)}</span>
                </div>
                <div className="text-[9px] text-white/50 font-mono">{translate('goalHint', lang)}</div>
              </div>

              <div className="flex flex-col gap-3 justify-center text-center">
                <p className="text-white/80 text-xs md:text-sm font-sans">
                  {translate('opponentStepped', lang, [translateTeam(opponentTeam?.name || '', lang)])}
                </p>

                <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto w-full p-1 bg-black/10 rounded-xl">
                  <button
                    onClick={() => handleDive('left')}
                    disabled={isAnimating}
                    className="py-3 bg-white/5 hover:bg-white/10 hover:border-white/30 border border-white/5 rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer font-sans"
                  >
                    <span className="text-sm">👈</span>
                    <span className="text-[10px] font-bold text-white/90">{translate('diveLeft', lang)}</span>
                  </button>
                  <button
                    onClick={() => handleDive('center')}
                    disabled={isAnimating}
                    className="py-3 bg-white/5 hover:bg-white/10 hover:border-white/30 border border-white/5 rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer font-sans"
                  >
                    <span className="text-sm">🧍</span>
                    <span className="text-[10px] font-bold text-white/90">{translate('stayCenter', lang)}</span>
                  </button>
                  <button
                    onClick={() => handleDive('right')}
                    disabled={isAnimating}
                    className="py-3 bg-white/5 hover:bg-white/10 hover:border-white/30 border border-white/5 rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer font-sans"
                  >
                    <span className="text-sm">👉</span>
                    <span className="text-[10px] font-bold text-white/90">{translate('diveRight', lang)}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'celebration' && shootoutWinner && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none z-10 max-w-xl mx-auto my-auto animate-zoom-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-2xl animate-pulse pointer-events-none" />
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-xl relative z-10">
              <Trophy className="w-12 h-12 text-slate-950 drag-shadow animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-mono shadow">
              CROWNED
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-black font-sans bg-clip-text text-transparent bg-gradient-to-r from-yellow-100 via-yellow-400 to-yellow-100 uppercase tracking-tight mb-1">
            {translate('shootoutChampion', lang)}
          </h1>
          <p className="text-white/45 text-[10px] font-mono tracking-widest uppercase mb-4">
            {translate('shootoutChampionSub', lang)}
          </p>

          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-8 py-4 flex items-center gap-4 mb-7 shadow-lg">
            <FlagIcon country={shootoutWinner.name} className="w-12 h-12 ring-2 ring-yellow-500/50 rounded-full" />
            <div className="text-left leading-tight">
              <div className="text-[8px] text-white/50 tracking-widest font-mono font-bold uppercase">{translate('predictedChampion', lang).replace(':', '').trim()}</div>
              <div className="text-lg font-black text-yellow-500 font-sans">
                {translateTeam(shootoutWinner.name, lang)}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={handleFinishAndSubmit}
              className="flex-1 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black font-sans font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Award className="w-4 h-4" />
              {translate('crownAndReturn', lang)}
            </button>
            <button
              onClick={() => {
                playClickSound();
                setPhase('select_team');
                setPlayerTeam(null);
                setShootoutWinner(null);
              }}
              className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-sans font-bold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {translate('rematchPlayAgain', lang)}
            </button>
          </div>
        </div>
      )}

      {/* Footer metadata details */}
      <div className="w-full border-t border-white/5 px-4 py-3 flex flex-col sm:flex-row justify-between items-center text-[9px] opacity-40 gap-1 font-mono">
        <span>{translate('metadataFictional', lang)}</span>
        <span>{translate('metadataSecure', lang)}</span>
      </div>
    </div>
  );
}
