'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useUltimateStore } from '@/store/ultimateStore';
import { EVENT_BOSSES, rollEventDrop, getEventBossMaxHp, EventBossDef, DropResult } from '@/lib/game/eventBoss';
import { getItemDef } from '@/lib/game/items';
import { getCharacterById } from '@/lib/game/characters';
import { RARITY_CONFIG } from '@/types/game';
import { CharacterCardThumb } from '@/components/ui/CharacterCardThumb';
import { formatNumber } from '@/lib/game/format';
import { useFallbackImage, buildImageCandidates, stripKnownExtension } from '@/lib/image-fallback';
import { EventMusicPlayer } from '@/components/game/EventMusicPlayer';
import { useAntiAutoclick } from '@/hooks/useAntiAutoclick';

// ── Fond d'écran de l'événement avec cascade d'extensions ───────────────
// Repose sur public/sprites/events/<boss>_bg.* — si absent, retombe sur le dégradé du boss.
function EventBg({ boss }: { boss: EventBossDef }) {
  const candidates = buildImageCandidates(boss.bgImagePath);
  const { src, failed, onError } = useFallbackImage(candidates);

  if (failed || !src) {
    return <div style={{ position:'absolute', inset:0, background: boss.bgGradient }} />;
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" onError={onError}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', imageRendering:'pixelated' }} />
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(0,0,0,0.5) 0%,rgba(0,0,0,0.2) 30%,rgba(0,0,0,0.3) 60%,rgba(0,0,0,0.85) 100%)' }} />
    </>
  );
}

// ── Sprite du boss avec cascade d'extensions ───────────────────────────
function BossSprite({ boss, deadStyle }: { boss: EventBossDef; deadStyle: boolean }) {
  const candidates = buildImageCandidates(stripKnownExtension(boss.spritePath));
  const { src, failed, onError } = useFallbackImage(candidates);

  if (failed || !src) {
    return (
      <div style={{ width:240, height:320, background:'radial-gradient(circle,#3b0764,#0d0520)',
        borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:80, filter:'drop-shadow(0 0 20px #c084fc)' }}>👤</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={boss.name}
      style={{ width:240, height:320, objectFit:'contain', imageRendering:'pixelated',
        filter: deadStyle ? 'grayscale(1) brightness(0.3)' : undefined }}
      onError={onError} />
  );
}

// ── Résultat de drop affiché après victoire ────────────────────────────
function DropPopup({ drop, onClose }: { drop: DropResult; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);

  let icon = '💨'; let title = 'Rien cette fois...'; let sub = ''; let color = 'var(--text-dim)';

  if (drop.type === 'character' && drop.id) {
    const tpl = getCharacterById(drop.id);
    const cfg = tpl ? RARITY_CONFIG[tpl.rarity] : RARITY_CONFIG['C'];
    icon = '🃏'; title = tpl?.name ?? drop.id; sub = cfg.label; color = cfg.color;
  } else if (drop.type === 'item' && drop.id) {
    const item = getItemDef(drop.id);
    icon = item?.icon ?? '📦'; title = item?.name ?? drop.id; sub = 'Objet d\'évolution'; color = item?.color ?? '#c084fc';
  } else if (drop.type === 'gems') {
    icon = '💎'; title = `+${drop.qty} Gemmes`; color = 'var(--cyan)';
  } else if (drop.type === 'bossCrowns') {
    icon = '👑'; title = `+${drop.qty} BossCrowns`; color = '#fbbf24';
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,0.85)', animation:'fadeIn 0.3s ease' }} onClick={onClose}>
      <div style={{ background:`linear-gradient(135deg,#0d0720,${color}22)`,
        border:`2px solid ${color}`, borderRadius:16, padding:'32px 40px', textAlign:'center',
        boxShadow:`0 0 50px ${color}66`, animation:'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ fontSize:56, marginBottom:12 }}>{icon}</div>
        {drop.type === 'character' && drop.id && getCharacterById(drop.id) && (
          <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
            <CharacterCardThumb templateId={drop.id} name={getCharacterById(drop.id)!.name}
              rarity={getCharacterById(drop.id)!.rarity} width={100} height={140} />
          </div>
        )}
        <div style={{ fontFamily:'var(--f-title)', fontWeight:900, fontSize:22, color, marginBottom:6 }}>{title}</div>
        {sub && <div style={{ fontFamily:'var(--f-ui)', fontSize:13, color:'rgba(255,255,255,0.5)' }}>{sub}</div>}
        <div style={{ fontFamily:'var(--f-ui)', fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:16 }}>Cliquez pour fermer</div>
      </div>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  );
}

// ── Particule de dégât ────────────────────────────────────────────────
interface Dmg { id:number; x:number; y:number; val:number; crit:boolean; }

// ── Overlay d'excuse anti-autoclick (partagé entre boss event) ──────────
interface ApologyOverlayEventProps {
  strikeLevel: number;
  detectionReason: string;
  onSubmit: (text: string) => Promise<void>;
}
function ApologyOverlayEvent({ strikeLevel, onSubmit }: ApologyOverlayEventProps) {
  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');
  const MIN_LENGTH = 80;

  const handleSubmit = async () => {
    if (text.trim().length < MIN_LENGTH) {
      setError(`Au moins ${MIN_LENGTH} caractères — on veut de vraies excuses.`);
      return;
    }
    setSending(true); setError('');
    await onSubmit(text);
    setSending(false);
  };

  const strikeColor = strikeLevel >= 3 ? '#f87171' : strikeLevel === 2 ? '#fb923c' : '#fbbf24';

  return (
    <div style={{
      position:'absolute', inset:0, zIndex:30,
      background:'rgba(3,2,12,0.95)', backdropFilter:'blur(6px)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      gap:0, padding:'24px 20px', overflowY:'auto',
    }}>
      <div style={{ fontSize:40, marginBottom:10 }}>🤖</div>
      <div style={{ fontFamily:'var(--f-title)', fontSize:17, fontWeight:800, color:'#f87171', letterSpacing:2, textAlign:'center', marginBottom:6 }}>AUTOCLICK DÉTECTÉ</div>
      <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:14, background:`${strikeColor}18`, border:`1px solid ${strikeColor}66`, borderRadius:8, padding:'4px 14px' }}>
        <span style={{ fontFamily:'var(--f-ui)', fontWeight:800, fontSize:11, color:strikeColor, letterSpacing:1 }}>STRIKE {strikeLevel}</span>
      </div>
      <div style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'12px 16px', marginBottom:14, maxWidth:400 }}>
        <p style={{ fontFamily:'var(--f-ui)', fontSize:12, color:'rgba(255,255,255,0.85)', lineHeight:1.65, margin:0, textAlign:'center' }}>
          On sait très bien ce que tu as fait.<br/>
          <strong style={{ color:'#fbbf24' }}>Écris une vraie lettre d'excuse</strong> pour récupérer l'accès.<br/>
          <span style={{ color:'rgba(255,255,255,0.5)', fontSize:11 }}>Toutes les excuses sont enregistrées avec ton pseudo. Un comportement répété = <strong style={{ color:'#f87171' }}>suspension définitive</strong>.</span>
        </p>
      </div>
      <div style={{ width:'100%', maxWidth:420, marginBottom:10 }}>
        <div style={{ fontFamily:'var(--f-ui)', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:1, marginBottom:6 }}>
          TA LETTRE D'EXCUSE ({text.trim().length}/{MIN_LENGTH} caractères minimum)
        </div>
        <textarea value={text} onChange={e => { setText(e.target.value); setError(''); }}
          placeholder="Bonjour, je reconnais avoir utilisé un autoclick sur GachaVerse..."
          rows={5} style={{ width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,0.04)', border:`1px solid ${error?'rgba(239,68,68,0.6)':'rgba(255,255,255,0.12)'}`, borderRadius:8, padding:'10px 12px', resize:'vertical', fontFamily:'var(--f-ui)', fontSize:12, color:'rgba(255,255,255,0.85)', lineHeight:1.6, outline:'none' }} />
        <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:4, marginTop:4, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:4, transition:'width 0.2s, background 0.2s', width:`${Math.min(100,(text.trim().length/MIN_LENGTH)*100)}%`, background:text.trim().length>=MIN_LENGTH?'#4ade80':'#fbbf24' }} />
        </div>
        {error && <div style={{ fontFamily:'var(--f-ui)', fontSize:11, color:'#f87171', marginTop:6 }}>{error}</div>}
      </div>
      <button onClick={handleSubmit} disabled={sending||text.trim().length<MIN_LENGTH} className="btn-primary"
        style={{ width:'100%', maxWidth:420, padding:'12px 20px', fontFamily:'var(--f-title)', fontSize:14, letterSpacing:2, opacity:(sending||text.trim().length<MIN_LENGTH)?0.45:1, cursor:(sending||text.trim().length<MIN_LENGTH)?'not-allowed':'pointer' }}>
        {sending ? '⏳ ENVOI...' : '✉️ ENVOYER MES EXCUSES'}
      </button>
      <div style={{ fontFamily:'var(--f-ui)', fontSize:9, color:'rgba(255,255,255,0.2)', marginTop:12, textAlign:'center', letterSpacing:0.5 }}>
        DPS & DPC EN PAUSE — REPREND APRÈS VALIDATION
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────
export function EventPage() {
  const {
    getHeroDpc, getTotalDps,
    addItem, addToCollection, nekoGems, bossCrowns,
  } = useGameStore();
  const { registerClick, getClickDpcMultiplier, consumeNextClickMultiplier,
    getActiveEnemyDamageTakenMultiplier } = useUltimateStore();

  // ── Anti-autoclick ─────────────────────────────────────────────────────
  const { checkClick, isBlocked, strikeLevel, detectionReason, submitApology } = useAntiAutoclick();

  const getInitialBossId = () => {
    const now = Date.now();
    return EVENT_BOSSES.find(b => b.availableUntil > now)?.id ?? EVENT_BOSSES[0].id;
  };
  const initialBossId = getInitialBossId();
  const [selectedBossId, setSelectedBossId] = useState(initialBossId);
  const initialBoss = EVENT_BOSSES.find(b => b.id === initialBossId) ?? EVENT_BOSSES[0];
  const [maxHp,   setMaxHp]   = useState(() => getEventBossMaxHp(initialBoss, getHeroDpc() + getTotalDps()));
  const [hp,      setHp]      = useState(maxHp);
  const [dmgs,    setDmgs]    = useState<Dmg[]>([]);
  const [hit,     setHit]     = useState(false);
  const [drop,    setDrop]    = useState<DropResult | null>(null);
  const [dead,    setDead]    = useState(false);
  const [kills,   setKills]   = useState(0);
  const [phase,   setPhase]   = useState<'battle'|'reward'|'dead'>('battle');

  const boss = useMemo(() => EVENT_BOSSES.find(b => b.id === selectedBossId) ?? EVENT_BOSSES[0], [selectedBossId]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const freshMax = getEventBossMaxHp(boss, getHeroDpc() + getTotalDps());
    setMaxHp(freshMax);
    setHp(freshMax);
    setDead(false);
    setDrop(null);
    setPhase('battle');
  }, [boss, getHeroDpc, getTotalDps]);

  // DPS tick
  useEffect(() => {
    if (dead) return;
    const id = setInterval(() => {
      const dps = getTotalDps() * getActiveEnemyDamageTakenMultiplier();
      if (dps <= 0) return;
      setHp(h => {
        if (h <= 0) return 0;
        return Math.max(0, h - dps);
      });
    }, 1000);
    return () => clearInterval(id);
  }, [dead, getTotalDps, getActiveEnemyDamageTakenMultiplier]);

  // Mort du boss
  useEffect(() => {
    if (hp <= 0 && !dead) {
      setDead(true);
      const result = rollEventDrop(boss.id);
      // Applique le drop
      if (result.type === 'character' && result.id) {
        useGameStore.getState().addToCollection(result.id);
      } else if (result.type === 'item' && result.id) {
        addItem(result.id, result.qty ?? 1);
      } else if (result.type === 'gems') {
        useGameStore.setState(s => ({ nekoGems: s.nekoGems + (result.qty ?? 0) }));
      } else if (result.type === 'bossCrowns') {
        useGameStore.setState(s => ({ bossCrowns: s.bossCrowns + (result.qty ?? 0) }));
      }
      setTimeout(() => { setDrop(result); setPhase('reward'); }, 800);
    }
  }, [hp, dead, addItem, boss]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dead) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos  = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (!checkClick(pos)) return; // ← anti-autoclick
    registerClick();
    const baseDpc     = getHeroDpc();
    const dpcMult     = getClickDpcMultiplier();
    const nextMult    = consumeNextClickMultiplier();
    const enemyMult   = getActiveEnemyDamageTakenMultiplier();
    const crit        = Math.random() < 0.08;
    const finalDmg    = Math.max(1, Math.floor(baseDpc * dpcMult * nextMult * enemyMult * (crit ? 1.5 : 1)));
    setHp(h => Math.max(0, h - finalDmg));
    setHit(true); setTimeout(() => setHit(false), 150);
    const d: Dmg = { id:Date.now()+Math.random(), x:pos.x, y:pos.y, val:finalDmg, crit };
    setDmgs(p => [...p, d]);
    setTimeout(() => setDmgs(p => p.filter(x => x.id !== d.id)), 800);
  }, [dead, checkClick, getHeroDpc, getClickDpcMultiplier, consumeNextClickMultiplier, getActiveEnemyDamageTakenMultiplier, registerClick]);

  const respawn = () => {
    const freshMax = getEventBossMaxHp(boss, getHeroDpc() + getTotalDps());
    setMaxHp(freshMax); setHp(freshMax);
    setDead(false); setDrop(null); setPhase('battle'); setKills(k => k+1);
  };

  const hpPct     = Math.max(0, hp / maxHp * 100);
  const hpColor   = hpPct > 50 ? '#c084fc' : hpPct > 20 ? '#f87171' : '#ff4040';

  return (
    <div style={{ height:'100%', overflow:'hidden', position:'relative',
      display:'flex', flexDirection:'column' }}>

      <EventBg boss={boss} />
      <EventMusicPlayer />
      {/* Drop popup */}
      {drop && phase === 'reward' && <DropPopup drop={drop} onClose={() => { setDrop(null); respawn(); }} />}

      {/* Event selector */}
      <div style={{ position:'relative', padding:'10px 20px 6px', display:'flex', gap:12, overflowX:'auto', alignItems:'stretch', background:'rgba(0,0,0,0.32)', borderBottom:'1px solid rgba(192,132,252,0.12)' }}>
        {EVENT_BOSSES.map(event => {
          const active = event.id === boss.id;
          const expired = event.availableUntil <= now;
          return (
            <button key={event.id} onClick={() => setSelectedBossId(event.id)}
              style={{
                cursor: 'pointer',
                minWidth:220, minHeight:140, display:'flex', flexDirection:'column', justifyContent:'space-between',
                borderRadius:16,
                border: active ? `2px solid ${event.accentColor}` : '1px solid rgba(255,255,255,0.12)',
                background: active ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)', padding:'12px 14px',
                color: 'white', textAlign:'left', flexShrink:0,
                opacity: expired ? 0.85 : 1,
                filter: expired ? 'grayscale(0.18)' : 'none',
                boxShadow: active ? `0 0 12px ${event.accentColor}20` : undefined,
              }}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:4 }}>
                <div style={{ fontFamily:'var(--f-ui)', fontSize:11, fontWeight:800, color:event.accentColor }}>
                  {event.name}
                </div>
                <div style={{ fontFamily:'var(--f-ui)', fontSize:8, fontWeight:700, textTransform:'uppercase', letterSpacing:1.1,
                  color: event.availableUntil > now ? '#92f4a9' : '#fda4af' }}>
                  {event.availableUntil > now ? 'Actif' : 'Terminé'}
                </div>
              </div>
              <div style={{ fontFamily:'var(--f-ui)', fontSize:9, color:'rgba(255,255,255,0.75)', marginBottom:6, minHeight:20 }}>
                {event.subtitle}
              </div>
              <div style={{ fontFamily:'var(--f-ui)', fontSize:9, color:'rgba(255,255,255,0.55)', marginBottom:6, minHeight:26, overflow:'hidden' }}>
                {event.description}
              </div>
              <div style={{ fontFamily:'var(--f-ui)', fontSize:9, color:'rgba(255,255,255,0.45)' }}>
                Jusqu'au {new Date(event.availableUntil).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Header event */}
      <div style={{ position:'relative', padding:'10px 20px 6px', borderBottom:'1px solid rgba(192,132,252,0.12)',
        background:'rgba(0,0,0,0.35)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background: boss.availableUntil > now ? '#92f4a9' : '#fb7185',
                boxShadow: boss.availableUntil > now ? '0 0 8px #92f4a940' : '0 0 8px #fb718540', animation:'pulse 2s infinite' }} />
              <span style={{ fontFamily:'var(--f-ui)', fontSize:9, color: boss.availableUntil > now ? '#92f4a9' : '#fb7185',
                fontWeight:700, letterSpacing:1.5 }}>{boss.availableUntil > now ? 'ÉVÉNEMENT ACTIF' : 'ÉVÉNEMENT TERMINÉ'}</span>
            </div>
            <div style={{ fontFamily:'var(--f-title)', fontSize:18, fontWeight:900,
              color:'white', letterSpacing:1.8, marginTop:4 }}>
              {boss.name.toUpperCase()}
            </div>
            <div style={{ fontFamily:'var(--f-ui)', fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>
              {boss.subtitle}
            </div>
            <div style={{ fontFamily:'var(--f-ui)', fontSize:10, color:'rgba(255,255,255,0.5)', marginTop:4, maxWidth:520, lineHeight:1.4 }}>
              {boss.description}
            </div>
            <div style={{ fontFamily:'var(--f-ui)', fontSize:10, color:'rgba(255,255,255,0.45)', marginTop:8 }}>
              Disponible jusqu'au {new Date(boss.availableUntil).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}
            </div>
            <div style={{ fontFamily:'var(--f-ui)', fontSize:10, color: boss.availableUntil > now ? 'rgba(179, 255, 156, 0.8)' : 'rgba(255, 99, 99, 0.8)', marginTop:2 }}>
              {boss.availableUntil > now ? `${Math.max(0, Math.floor((boss.availableUntil-now)/86400000))} jours restants` : 'Événement terminé'}
            </div>
          </div>
          <div style={{ textAlign:'right', display:'flex', gap:16 }}>
            {[
              { icon:'⚔️', val:kills,             label:'Victoires' },
              { icon:'👑', val:bossCrowns,         label:'BossCrowns' },
              { icon:'💎', val:formatNumber(nekoGems), label:'Gemmes' },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'var(--f-ui)', fontWeight:900, fontSize:16, color:'white' }}>
                  {s.icon} {s.val}
                </div>
                <div style={{ fontFamily:'var(--f-ui)', fontSize:10, color:'rgba(255,255,255,0.4)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone de combat */}
      <div style={{ position:'relative', flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'0 24px', gap:24, overflow:'hidden' }}>

        {/* ── Anti-autoclick overlay ────────────────────────────────── */}
        {isBlocked && (
          <ApologyOverlayEvent
            strikeLevel={strikeLevel}
            detectionReason={detectionReason}
            onSubmit={submitApology}
          />
        )}

        {/* Barre de vie boss */}
        <div style={{ width:'100%', maxWidth:600 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:13, color:'white' }}>
              {boss.name}
            </span>
            <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:13, color:hpColor }}>
              {formatNumber(Math.max(0, hp))} / {formatNumber(maxHp)}
            </span>
          </div>
          <div style={{ height:16, background:'rgba(255,255,255,0.08)', borderRadius:8,
            overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ height:'100%', width:`${hpPct}%`, background:
              `linear-gradient(90deg,${hpColor}aa,${hpColor})`,
              borderRadius:8, transition:'width 0.3s ease',
              boxShadow:`0 0 12px ${hpColor}66` }} />
          </div>
        </div>

        {/* Sprite boss cliquable */}
        <div onClick={handleClick} style={{ position:'relative', cursor:dead?'default':'crosshair',
          userSelect:'none', filter: hit ? 'brightness(2) saturate(0)' : dead ? 'grayscale(1) brightness(0.3)' : 'none',
          transition:'filter 0.1s' }}>
          <BossSprite boss={boss} deadStyle={dead} />

          {/* Particules de dégâts */}
          {dmgs.map(d => (
            <div key={d.id} style={{ position:'absolute', left:d.x, top:d.y, pointerEvents:'none',
              fontFamily:'var(--f-ui)', fontWeight:900,
              fontSize: d.crit ? 20 : 14,
              color: d.crit ? '#fbbf24' : '#c084fc',
              textShadow: d.crit ? '0 0 10px #fbbf24' : '0 0 6px #c084fc',
              animation:'floatUp 0.8s ease forwards', whiteSpace:'nowrap',
              zIndex:10 }}>
              {d.crit ? '⚡ ' : ''}{formatNumber(d.val)}
            </div>
          ))}

          {/* Flash rouge au clic */}
          {hit && (
            <div style={{ position:'absolute', inset:0, borderRadius:16,
              background:'rgba(255,0,0,0.3)', pointerEvents:'none' }} />
          )}

          {/* Boss mort overlay */}
          {dead && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:8 }}>
              <div style={{ fontFamily:'var(--f-title)', fontWeight:900, fontSize:22,
                color:'#c084fc', textShadow:'0 0 20px #c084fc', letterSpacing:2 }}>VAINCU</div>
            </div>
          )}
        </div>

        {dead && !drop && (
          <div style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:13,
            color:'rgba(255,255,255,0.5)', animation:'pulse 1s infinite' }}>
            Calcul des récompenses...
          </div>
        )}

        {!dead && (
          <div style={{ fontFamily:'var(--f-ui)', fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center' }}>
            Clique sur le boss pour attaquer · Tes alliés attaquent automatiquement
          </div>
        )}
      </div>

      {/* Table des drops (rappel discret en bas) */}
      <div style={{ position:'relative', padding:'10px 24px 14px', borderTop:'1px solid rgba(255,255,255,0.05)',
        background:'rgba(0,0,0,0.3)', flexShrink:0 }}>
        <div style={{ fontFamily:'var(--f-ui)', fontSize:10, color:'rgba(255,255,255,0.3)',
          marginBottom:8, letterSpacing:1 }}>RÉCOMPENSES POSSIBLES</div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {boss.dropTable.filter(entry => entry.result.type !== 'nothing').map(entry => {
            const totalWeight = boss.dropTable.reduce((sum, item) => sum + item.weight, 0);
            const rate = `${Math.round(entry.weight / totalWeight * 1000) / 10}%`;
            const result = entry.result;
            let icon = '📦';
            let label = 'Récompense';
            let color = '#c084fc';

            if (result.type === 'character' && result.id) {
              const tpl = getCharacterById(result.id);
              icon = '🃏';
              label = tpl?.name ?? result.id;
              color = tpl ? RARITY_CONFIG[tpl.rarity]?.color ?? color : color;
            } else if (result.type === 'item' && result.id) {
              const item = getItemDef(result.id);
              icon = item?.icon ?? '📦';
              label = item?.name ?? result.id;
              color = item?.color ?? color;
            } else if (result.type === 'gems') {
              icon = '💎';
              label = `Gemmes ×${result.qty ?? 0}`;
              color = 'var(--cyan)';
            } else if (result.type === 'bossCrowns') {
              icon = '👑';
              label = `BossCrowns ×${result.qty ?? 0}`;
              color = '#fbbf24';
            }

            return (
              <div key={`${result.type}-${result.id ?? result.qty}-${entry.weight}`} style={{ display:'flex', alignItems:'center', gap:5,
                background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'4px 10px',
                border:`1px solid ${color}33` }}>
                <span style={{ fontSize:14 }}>{icon}</span>
                <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:11, color }}>{label}</span>
                <span style={{ fontFamily:'var(--f-ui)', fontSize:10, color:'rgba(255,255,255,0.3)' }}>{rate}</span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes floatUp { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-60px) scale(1.3)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
