'use client';
import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useUltimateStore } from '@/store/ultimateStore';
import { useAntiAutoclick } from '@/hooks/useAntiAutoclick';
import { ActiveUltsBar, UltCombatOverlay } from '@/components/game/UltAnimation';
import { PixelSprite } from '@/components/ui/PixelSprite';
import { CharacterCardThumb } from '@/components/ui/CharacterCardThumb';
import { useFallbackImage, buildImageCandidates } from '@/lib/image-fallback';
import { formatNumber } from '@/lib/game/format';
import { getPalierConfig } from '@/types/game';
import { getCharacterById, getCharFormName } from '@/lib/game/characters';
import { getEquipmentDef } from '@/lib/game/items';
import { computeActiveSynergies } from '@/lib/game/synergies';

interface Dmg { id: number; x: number; y: number; val: number; crit: boolean; }

function PalierBg({ palier, gradient }: { palier: number; gradient: string }) {
  const { src, failed, onError } = useFallbackImage(buildImageCandidates(`/backgrounds/bg_palier_${palier}`));
  if (!failed && src) return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt=""
        onError={onError}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', imageRendering:'pixelated' }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(0,0,0,0.4) 0%,transparent 25%,transparent 60%,rgba(0,0,0,0.85) 100%)' }} />
    </>
  );
  return <div style={{ position:'absolute', inset:0, background:gradient }} />;
}

// ── Carte alliée style gacha ──────────────────────────────────────────────
function AllyCard({ templateId, onManage }: { templateId: string; onManage: () => void }) {
  const { collection, activateCharacterUltimate } = useGameStore();
  const { cooldowns, activeUlts } = useUltimateStore();
  const tpl   = getCharacterById(templateId);
  const owned = collection[templateId];

  // Slot vide
  if (!tpl || !owned) return (
    <div onClick={onManage} style={{ width:88, display:'flex', flexDirection:'column', alignItems:'center', gap:6, cursor:'pointer', opacity:0.5 }}>
      <div style={{ width:88, height:118, border:'2px dashed rgba(255,255,255,0.12)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.02)', flexDirection:'column', gap:6 }}>
        <span style={{ fontSize:22, color:'rgba(255,255,255,0.2)' }}>+</span>
        <span style={{ fontFamily:'var(--f-ui)', fontSize:9, color:'rgba(255,255,255,0.2)', fontWeight:600, letterSpacing:1 }}>VIDE</span>
      </div>
    </div>
  );

  const cd       = cooldowns[templateId] ?? 0;
  const ready    = cd === 0;
  const isActive = activeUlts.some(a => a.templateId === templateId);
  const mins     = Math.floor(cd / 60);
  const secs     = cd % 60;
  const ultLabel = `${mins}:${String(secs).padStart(2,'0')}`;
  const formIdx  = owned.currentForm;
  const name     = getCharFormName(tpl, formIdx);

  const stars = Array.from({ length: 7 }, (_, i) => i < owned.rank);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, width:88 }}>
      {/* Carte image */}
      <div style={{ position:'relative', width:88, height:118, borderRadius:10, overflow:'hidden',
        border: isActive ? '2px solid #c084fc' : ready ? '2px solid #fbbf2488' : '2px solid rgba(255,255,255,0.12)',
        boxShadow: isActive ? '0 0 14px #c084fc88' : ready ? '0 0 10px #fbbf2455' : '0 4px 16px rgba(0,0,0,0.6)',
        cursor: ready ? 'pointer' : 'default', transition:'box-shadow 0.2s, border-color 0.2s' }}
        onClick={() => ready && activateCharacterUltimate(templateId, formIdx)}>
        <CharacterCardThumb templateId={templateId} formIndex={formIdx} name={name} rarity={tpl.rarity}
          width={88} height={118} style={{ border:'none', boxShadow:'none' }} />
        {/* Badge ULT — coin haut-droit, ne couvre pas l'illustration */}
        <div style={{ position:'absolute', top:3, right:3, display:'flex', alignItems:'center', gap:2,
          background: ready ? 'rgba(88,28,135,0.92)' : 'rgba(0,0,0,0.65)',
          border: ready ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.15)',
          borderRadius:5, padding:'2px 5px',
          animation: ready ? 'warnFlash 1.2s infinite' : undefined }}>
          <span style={{ fontSize:8 }}>{ready ? '⚡' : '⏳'}</span>
          <span style={{ fontFamily:'var(--f-ui)', fontWeight:800, fontSize:8, color: ready ? '#fde68a' : 'rgba(255,255,255,0.55)', letterSpacing:0.3 }}>
            {ready ? 'PRÊT' : ultLabel}
          </span>
        </div>
      </div>

      {/* Étoiles (rank) */}
      <div style={{ display:'flex', gap:2 }}>
        {stars.slice(0, Math.min(owned.rank, 5)).map((lit, i) => (
          <span key={i} style={{ fontSize:9, color: lit ? '#fbbf24' : 'rgba(255,255,255,0.15)', lineHeight:1 }}>★</span>
        ))}
      </div>

      {/* Niveau */}
      <span style={{ fontFamily:'var(--f-ui)', fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.55)' }}>
        Niv. {owned.level}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Barre des boosts BossCrown actifs (+20% DPS / +20% Or) ───────────────
function ActiveBoostsBar() {
  const { dpsBoostEndsAt, goldBoostEndsAt, isDpsBoostActive, isGoldBoostActive } = useGameStore();
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const dpsActive  = isDpsBoostActive();
  const goldActive = isGoldBoostActive();
  if (!dpsActive && !goldActive) return null;

  const fmt = (endsAt: number) => {
    const s = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  };

  return (
    <div style={{ position:'relative', zIndex:3, display:'flex', gap:8, padding:'0 18px 8px', flexShrink:0 }}>
      {dpsActive && (
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.4)', borderRadius:8, padding:'4px 10px' }}>
          <span style={{ fontSize:12 }}>⚡</span>
          <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:11, color:'#f87171' }}>+20% DPS — {fmt(dpsBoostEndsAt)}</span>
        </div>
      )}
      {goldActive && (
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(74,222,128,0.12)', border:'1px solid rgba(74,222,128,0.4)', borderRadius:8, padding:'4px 10px' }}>
          <span style={{ fontSize:12 }}>💰</span>
          <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:11, color:'#4ade80' }}>+20% Or — {fmt(goldBoostEndsAt)}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── Formulaire d'excuse (déclenché par l'anti-autoclick) ──────────────────
interface ApologyOverlayProps {
  strikeLevel: number;
  detectionReason: string;
  onSubmit: (text: string) => Promise<void>;
}

function ApologyOverlay({ strikeLevel, onSubmit }: ApologyOverlayProps) {
  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');
  const MIN_LENGTH = 80;

  const handleSubmit = async () => {
    if (text.trim().length < MIN_LENGTH) {
      setError(`Tes excuses doivent faire au moins ${MIN_LENGTH} caractères. On veut de vraies excuses, pas du remplissage.`);
      return;
    }
    setSending(true);
    setError('');
    await onSubmit(text);
    setSending(false);
  };

  const strikeColor = strikeLevel >= 3 ? '#f87171' : strikeLevel === 2 ? '#fb923c' : '#fbbf24';
  const strikeMsgs  = [
    '',
    '⚠️ C\'est ton 1er avertissement. Une prochaine fois et les sanctions seront plus lourdes.',
    '🚨 2ème strike. Tu joues avec le feu. Le prochain, c\'est un ban définitif.',
    '🔒 3ème strike. On garde tout. Un autre écart et tu dis adieu à ton compte.',
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      background: 'rgba(3,2,12,0.95)', backdropFilter: 'blur(6px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 0, borderRadius: 12, padding: '24px 20px', overflowY: 'auto',
    }}>
      {/* En-tête */}
      <div style={{ fontSize: 40, marginBottom: 10 }}>🤖</div>
      <div style={{ fontFamily: 'var(--f-title)', fontSize: 17, fontWeight: 800, color: '#f87171', letterSpacing: 2, textAlign: 'center', marginBottom: 6 }}>
        AUTOCLICK DÉTECTÉ
      </div>

      {/* Badge strike */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14,
        background: `${strikeColor}18`, border: `1px solid ${strikeColor}66`,
        borderRadius: 8, padding: '4px 14px',
      }}>
        <span style={{ fontFamily: 'var(--f-ui)', fontWeight: 800, fontSize: 11, color: strikeColor, letterSpacing: 1 }}>
          STRIKE {strikeLevel}
        </span>
      </div>

      {/* Message sérieux */}
      <div style={{
        background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: 10, padding: '12px 16px', marginBottom: 14, maxWidth: 400,
      }}>
        <p style={{ fontFamily: 'var(--f-ui)', fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, margin: 0, textAlign: 'center' }}>
          On sait très bien ce que tu as fait.<br />
          <strong style={{ color: '#fbbf24' }}>Écris une vraie lettre d'excuse</strong> pour récupérer l'accès au jeu.<br />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
            Toutes les excuses sont enregistrées avec ton pseudo et conservées par l'équipe.
            Un comportement répété entraînera la <strong style={{ color: '#f87171' }}>suspension définitive de ton compte</strong>.
          </span>
        </p>
      </div>

      {strikeLevel >= 2 && (
        <div style={{ fontFamily: 'var(--f-ui)', fontSize: 11, color: strikeColor, marginBottom: 12, textAlign: 'center', fontWeight: 700 }}>
          {strikeMsgs[Math.min(strikeLevel, 3)]}
        </div>
      )}

      {/* Textarea */}
      <div style={{ width: '100%', maxWidth: 420, marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--f-ui)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 6 }}>
          TA LETTRE D'EXCUSE ({text.trim().length}/{MIN_LENGTH} caractères minimum)
        </div>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setError(''); }}
          placeholder="Bonjour, je reconnais avoir utilisé un autoclick sur GachaVerse. Je m'en excuse sincèrement car..."
          rows={6}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 8, padding: '10px 12px', resize: 'vertical',
            fontFamily: 'var(--f-ui)', fontSize: 12, color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.6, outline: 'none',
          }}
        />
        {/* Barre de progression longueur */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginTop: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4, transition: 'width 0.2s, background 0.2s',
            width: `${Math.min(100, (text.trim().length / MIN_LENGTH) * 100)}%`,
            background: text.trim().length >= MIN_LENGTH ? '#4ade80' : '#fbbf24',
          }} />
        </div>
        {error && (
          <div style={{ fontFamily: 'var(--f-ui)', fontSize: 11, color: '#f87171', marginTop: 6, lineHeight: 1.4 }}>
            {error}
          </div>
        )}
      </div>

      {/* Bouton envoyer */}
      <button
        onClick={handleSubmit}
        disabled={sending || text.trim().length < MIN_LENGTH}
        className="btn-primary"
        style={{
          width: '100%', maxWidth: 420, padding: '12px 20px',
          fontFamily: 'var(--f-title)', fontSize: 14, letterSpacing: 2,
          opacity: (sending || text.trim().length < MIN_LENGTH) ? 0.45 : 1,
          cursor: (sending || text.trim().length < MIN_LENGTH) ? 'not-allowed' : 'pointer',
        }}
      >
        {sending ? '⏳ ENVOI EN COURS...' : '✉️ ENVOYER MES EXCUSES'}
      </button>

      <div style={{ fontFamily: 'var(--f-ui)', fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 12, textAlign: 'center', letterSpacing: 0.5 }}>
        DPS & DPC EN PAUSE — LE JEU REPRENDRA APRÈS VALIDATION
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export function BattleZone() {
  const { currentEnemy, equippedTeam, getHeroDpc, getTotalDps, clickEnemy, wave, palier, bossActive, bossTimeLeft, lastEquipmentDrop, setLastEquipmentDrop } = useGameStore();
  const [dmgs, setDmgs] = useState<Dmg[]>([]);
  const [hit,  setHit]  = useState(false);
  const [dropToast, setDropToast] = useState<string | null>(null);
  const ultStore    = useUltimateStore();
  const dpcUltMult  = ultStore.getClickDpcMultiplier();
  const dpsUltMult  = ultStore.activeUlts.reduce((m, a) => m * (a.effect.dpsMultiplier ?? 1), 1);
  const dpc = Math.floor(getHeroDpc() * dpcUltMult);
  const dps = Math.floor(getTotalDps()); // inclut déjà dpsMultiplier/selfDpsMultiplier (calculé dans gameStore)
  const cfg = getPalierConfig(palier);
  const hp  = (currentEnemy.currentHp / currentEnemy.maxHp) * 100;
  const bossWarn = bossActive && bossTimeLeft <= 10;

  // ── Anti-autoclick ───────────────────────────────────────────────────────
  const { checkClick, isBlocked, strikeLevel, detectionReason, submitApology } = useAntiAutoclick();

  useEffect(() => {
    if (!lastEquipmentDrop) return;
    const def = getEquipmentDef(lastEquipmentDrop);
    if (!def) return;
    setDropToast(`${def.icon} Vous avez trouvé ${def.name} !`);
    setLastEquipmentDrop(null);
    const timeout = window.setTimeout(() => setDropToast(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [lastEquipmentDrop, setLastEquipmentDrop]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos  = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (!checkClick(pos)) return; // bloqué par l'anti-autoclick
    const result = clickEnemy();
    setHit(true); setTimeout(() => setHit(false), 180);
    const d: Dmg = { id: Date.now()+Math.random(), x: pos.x, y: pos.y, val: result.dmg, crit: result.crit };
    setDmgs(p => [...p, d]);
    setTimeout(() => setDmgs(p => p.filter(x => x.id !== d.id)), 800);
  }, [checkClick, clickEnemy]);

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', borderRadius:12, overflow:'hidden', border:'1px solid var(--border)', display:'flex', flexDirection:'column' }}>
      <PalierBg palier={palier} gradient={cfg.bgGradient} />

      {/* ── Formulaire d'excuse anti-autoclick ─────────────────────────── */}
      {isBlocked && (
        <ApologyOverlay
          strikeLevel={strikeLevel}
          detectionReason={detectionReason}
          onSubmit={submitApology}
        />
      )}

      {/* Timer boss */}
      {bossActive && (
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, zIndex:5 }}>
          <div style={{ height:'100%', width:`${(bossTimeLeft/cfg.bossTimerSeconds)*100}%`, background:bossWarn?'#ef4444':'#dc2626', transition:'width 1s linear', boxShadow:bossWarn?'0 0 10px #ef4444':undefined }} />
        </div>
      )}

      {/* HUD top */}
      <div style={{ position:'relative', zIndex:3, padding:'12px 18px 10px', background:'linear-gradient(180deg,rgba(0,0,0,0.7) 0%,transparent 100%)', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:'var(--f-ui)', fontWeight:800, fontSize:10, color:cfg.accentColor, letterSpacing:2 }}>{cfg.universe.toUpperCase()}</span>
            <span style={{ color:'rgba(255,255,255,0.2)' }}>·</span>
            <span style={{ fontFamily:'var(--f-ui)', fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:1 }}>{cfg.arc}</span>
            <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:currentEnemy.isBoss?'rgba(127,29,29,0.8)':'rgba(0,0,0,0.5)', border:`1px solid ${currentEnemy.isBoss?'rgba(239,68,68,0.5)':cfg.accentColor+'33'}`, borderRadius:6, padding:'2px 10px' }}>
              <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:10, color:currentEnemy.isBoss?'#f87171':cfg.accentColor }}>
                {currentEnemy.isBoss ? '★ BOSS' : `ÉTAGE ${wave} / 10`}
              </span>
            </div>
          </div>
          {bossActive && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(127,29,29,0.85)', border:'1px solid rgba(239,68,68,0.5)', borderRadius:8, padding:'5px 14px' }}>
              <span style={{ fontSize:13, animation:'warnFlash 0.5s infinite' }}>⚠</span>
              <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:13, color:'#f87171' }}>BOSS — {bossTimeLeft}s</span>
            </div>
          )}
        </div>
        <h2 style={{ fontFamily:'var(--f-title)', fontSize:currentEnemy.isBoss?'18px':'15px', fontWeight:700, color:'white', letterSpacing:2, textShadow:currentEnemy.isBoss?'0 0 24px rgba(239,68,68,0.7)':'0 0 16px rgba(255,255,255,0.2)', marginBottom:8 }}>
          {currentEnemy.name}
        </h2>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ fontFamily:'var(--f-ui)', fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.35)', letterSpacing:1 }}>HP</span>
          <span style={{ fontFamily:'var(--f-ui)', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>{formatNumber(currentEnemy.currentHp)} / {formatNumber(currentEnemy.maxHp)}</span>
        </div>
        <div style={{ height:8, background:'rgba(0,0,0,0.5)', borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)', marginBottom:6 }}>
          <div style={{ height:'100%', width:`${hp}%`, transition:'width 0.15s ease', borderRadius:10,
            background:hp>50?'linear-gradient(90deg,#166534,#4ade80)':hp>25?'linear-gradient(90deg,#78350f,#fbbf24)':'linear-gradient(90deg,#7f1d1d,#f87171)',
            boxShadow:`0 0 12px ${hp>50?'#4ade8077':hp>25?'#fbbf2477':'#f8717177'}` }} />
        </div>
        <div style={{ display:'flex', gap:3 }}>
          {Array.from({length:10},(_,i)=>(
            <div key={i} style={{ flex:1, height:3, borderRadius:2,
              background:i+1<wave?cfg.accentColor:i+1===wave?(currentEnemy.isBoss?'#ef4444':cfg.accentColor):'rgba(255,255,255,0.08)',
              border:i===9?'1px solid rgba(239,68,68,0.4)':undefined, transition:'background 0.3s' }} />
          ))}
        </div>
      </div>

      {/* Barre des effets actifs */}
      <ActiveUltsBar />
      <ActiveBoostsBar />
      {dropToast && (
        <div style={{ position:'absolute', top:96, left:'50%', transform:'translateX(-50%)', zIndex:6, background:'rgba(15,23,42,0.92)', border:'1px solid rgba(96,165,250,0.35)', borderRadius:12, padding:'10px 16px', boxShadow:'0 0 30px rgba(56,189,248,0.2)', color:'#e2e8f0', fontFamily:'var(--f-ui)', fontSize:13, fontWeight:700, letterSpacing:0.5, whiteSpace:'nowrap' }}>
          {dropToast}
        </div>
      )}

      {/* ENNEMI centré */}
      <div onClick={handleClick} style={{ flex:1, position:'relative', zIndex:2, cursor:'crosshair', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className={hit?'anim-shake':currentEnemy.isBoss?'anim-boss':'anim-idle'}
          style={{ position:'relative', transform:'scaleX(-1)',
            filter:hit?`brightness(3) drop-shadow(0 0 32px ${cfg.accentColor})`:currentEnemy.isBoss?'drop-shadow(0 0 28px rgba(239,68,68,0.85)) drop-shadow(0 12px 24px rgba(0,0,0,0.95))':`drop-shadow(0 0 16px ${cfg.accentColor}77) drop-shadow(0 10px 20px rgba(0,0,0,0.9))` }}>
          <PixelSprite src={currentEnemy.spritePath} alt={currentEnemy.name}
            size={currentEnemy.isBoss?280:220} rarity={currentEnemy.isBoss?'L':'C'} />
        </div>
        {dmgs.map(d=>(
          <div key={d.id} style={{ position:'absolute', left:d.x, top:d.y, pointerEvents:'none', transform:'translate(-50%,-50%)',
            fontFamily:d.crit?'var(--f-title)':'var(--f-ui)', fontWeight:800,
            fontSize:d.crit?'26px':'18px', color:d.crit?'#f87171':'#fbbf24',
            textShadow:d.crit?'0 0 16px #ef4444':'0 0 12px #f59e0b',
            animation:'floatDmg 0.8s ease-out forwards', whiteSpace:'nowrap', zIndex:10 }}>
            {d.crit&&<span style={{fontSize:13,marginRight:4}}>CRIT!</span>}{formatNumber(d.val)}
          </div>
        ))}
      </div>

      {/* BARRE BAS */}
      <div style={{ position:'relative', zIndex:3, background:'linear-gradient(0deg,rgba(5,4,15,0.97),rgba(5,4,15,0.7))', borderTop:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>

        {/* Compagnons — style carte */}
        <div style={{ display:'flex', alignItems:'flex-end', gap:10, padding:'10px 18px 8px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          {/* Panel compagnons */}
          <div style={{ background:'rgba(15,10,30,0.85)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'10px 12px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <span style={{ fontFamily:'var(--f-ui)', fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:2 }}>COMPAGNONS</span>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              {equippedTeam.map((tid, i) => (
                <AllyCard key={i} templateId={tid ?? ''} onManage={() => {}} />
              ))}
            </div>
          </div>
          <div style={{ flex:1 }} />
          {/* Synergies actives mini-badges */}
          {(() => {
            const syns = computeActiveSynergies(equippedTeam);
            if (syns.length === 0) return null;
            return (
              <div style={{ display:'flex', gap:4, alignItems:'center', marginRight:8 }}>
                {syns.map(s => (
                  <div key={s.def.id} title={`${s.def.label} — ${s.threshold.label}`}
                    style={{ display:'flex', alignItems:'center', gap:4, background:`${s.def.color}18`, border:`1px solid ${s.def.color}55`, borderRadius:6, padding:'3px 8px', boxShadow:`0 0 8px ${s.def.glow}33` }}>
                    {/* Logo de synergie — fallback emoji */}
                    <div style={{ width:16, height:16, flexShrink:0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/sprites/synergies/${s.def.id}.png`} alt={s.def.label}
                        style={{ width:'100%', height:'100%', objectFit:'contain', borderRadius:2 }}
                        onError={e => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.innerHTML=`<span style="font-size:12px">${s.def.icon}</span>`; }} />
                    </div>
                    <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:9, color:s.def.color, whiteSpace:'nowrap' }}>
                      {s.threshold.dpsBonus > 0 ? `+${s.threshold.dpsBonus}%` : `+${s.threshold.globalBonus}% glb`}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
          <div style={{ display:'flex', gap:14 }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'var(--f-ui)', fontSize:9, fontWeight:600, color:'rgba(255,255,255,0.25)', letterSpacing:1 }}>⚡ DPC</div>
              <div style={{ fontFamily:'var(--f-ui)', fontSize:18, fontWeight:900, color: dpcUltMult > 1 ? '#f87171' : '#fb923c', lineHeight:1 }}>
                {formatNumber(dpc)}{dpcUltMult > 1 && <span style={{ fontSize:10, marginLeft:2 }}>×{dpcUltMult}</span>}
              </div>
            </div>
            <div style={{ width:1, background:'rgba(255,255,255,0.08)' }} />
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'var(--f-ui)', fontSize:9, fontWeight:600, color:'rgba(255,255,255,0.25)', letterSpacing:1 }}>🔥 DPS</div>
              <div style={{ fontFamily:'var(--f-ui)', fontSize:18, fontWeight:900, color: dpsUltMult > 1 ? '#4ade80' : 'var(--green)', lineHeight:1 }}>
                {formatNumber(dps)}{dpsUltMult > 1 && <span style={{ fontSize:10, marginLeft:2 }}>×{dpsUltMult}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Attaquer */}
        <div style={{ display:'flex', gap:10, padding:'10px 18px' }}>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'8px 14px', flexShrink:0, textAlign:'center', minWidth:90 }}>
            <div style={{ fontFamily:'var(--f-ui)', fontSize:9, fontWeight:600, color:'rgba(255,255,255,0.25)', letterSpacing:1, marginBottom:3 }}>BUTIN</div>
            <div style={{ fontFamily:'var(--f-ui)', fontSize:13, fontWeight:700, color:'var(--gold)' }}>+{formatNumber(currentEnemy.pixelCoinsReward)} 🪙</div>
            {currentEnemy.gemsReward>0&&<div style={{ fontFamily:'var(--f-ui)', fontSize:12, fontWeight:700, color:'var(--cyan)' }}>+{currentEnemy.gemsReward} 💎</div>}
            <div style={{ fontFamily:'var(--f-ui)', fontSize:9, fontWeight:600, color:'rgba(34,211,238,0.45)', marginTop:3 }}>✦ 0.5% 💎 par ennemi</div>
            {currentEnemy.isBoss && <div style={{ fontFamily:'var(--f-ui)', fontSize:9, fontWeight:700, color:'var(--cyan)', marginTop:1 }}>+20 💎 palier franchi</div>}
          </div>
          <button onClick={e=>{e.stopPropagation(); if(!checkClick({x:0,y:0})) return; clickEnemy();}} className="btn-primary"
            disabled={isBlocked}
            style={{ flex:1, padding:'13px 20px', fontSize:17, display:'flex', flexDirection:'column', alignItems:'center', gap:1, position:'relative', overflow:'hidden', borderRadius:10 }}>
            <div style={{ position:'absolute', top:0, bottom:0, width:'35%', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)', animation:'shimmerSlide 2.5s infinite', pointerEvents:'none' }} />
            <span style={{ fontFamily:'var(--f-title)', letterSpacing:3, fontSize:16, position:'relative' }}>⚔ ATTAQUER</span>
            <span style={{ fontFamily:'var(--f-ui)', fontSize:10, fontWeight:400, opacity:0.5, position:'relative' }}>CLIQUEZ !</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes rainbowShift { 0%{background-position:0% center} 100%{background-position:200% center} }
        @keyframes floatDmg { 0%{opacity:1;transform:translate(-50%,-50%) translateY(0) scale(1)} 100%{opacity:0;transform:translate(-50%,-50%) translateY(-64px) scale(0.75)} }
        @keyframes shimmerSlide { 0%{left:-60%} 100%{left:110%} }
      `}</style>
    </div>
  );
}
