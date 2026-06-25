'use client';
import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { CharacterCardThumb } from '@/components/ui/CharacterCardThumb';
import { RarityBadge, RankStars } from '@/components/ui/RarityBadge';
import { getCharacterById, BANNER_POOL } from '@/lib/game/characters';
import { GACHA_COSTS } from '@/lib/game/gacha';
import { RARITY_CONFIG, Rarity } from '@/types/game';
import { formatNumber } from '@/lib/game/format';
import { useFallbackImage, buildImageCandidates } from '@/lib/image-fallback';

// Dos de carte avec cascade d'extensions — fond uni si rien ne charge
function CardBackImg() {
  const { src, failed, onError } = useFallbackImage(buildImageCandidates('/sprites/cards/card_back'));
  if (failed || !src) return <div style={{ width:'100%', height:'100%', background:'linear-gradient(160deg,#1a0d2e,#3b0764)' }} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Carte" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={onError} />
  );
}

type Res = { templateId: string; isNew: boolean };

// ── Carte retournable ──────────────────────────────────────────────────────
function FlipCard({ res, index, total, forceFlip }: {
  res: Res; index: number; total: number; forceFlip: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const tpl = getCharacterById(res.templateId);
  const cfg = tpl ? RARITY_CONFIG[tpl.rarity] : RARITY_CONFIG['C'];

  useEffect(() => {
    if (forceFlip && !flipped) {
      setFlipped(true);
      setTimeout(() => setRevealed(true), 320);
    }
  }, [forceFlip]);

  const handleFlip = () => {
    if (flipped) return;
    setFlipped(true);
    setTimeout(() => setRevealed(true), 320);
  };

  const w = total === 1 ? 220 : total <= 5 ? 150 : 120;
  const h = total === 1 ? 310 : total <= 5 ? 210 : 170;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleFlip}
      style={{ position:'relative', width:w, height:h, cursor:flipped?'default':'pointer',
        perspective:'1000px', flexShrink:0,
        animation:`cardSlideIn 0.5s ease ${index * 0.09}s both` }}
    >
      {/* Aura sous la carte */}
      <div style={{
        position:'absolute', bottom:-16, left:'50%', transform:'translateX(-50%)',
        width:'75%', height:30, borderRadius:'50%',
        background: cfg.color, filter:'blur(16px)',
        opacity: hovered && !flipped ? 0.9 : flipped ? 0.35 : 0,
        transition:'opacity 0.3s ease',
        boxShadow:`0 0 35px 10px ${cfg.glow}`,
        pointerEvents:'none', zIndex:0,
      }} />

      {/* Carte 3D */}
      <div style={{
        position:'relative', width:'100%', height:'100%',
        transformStyle:'preserve-3d',
        transition:'transform 0.65s cubic-bezier(0.4,0,0.2,1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        zIndex:1,
      }}>
        {/* DOS */}
        <div style={{
          position:'absolute', inset:0, backfaceVisibility:'hidden',
          borderRadius:14, overflow:'hidden',
          boxShadow: hovered && !flipped
            ? `0 0 0 2px ${cfg.color}, 0 10px 40px ${cfg.glow}88`
            : '0 8px 28px rgba(0,0,0,0.75)',
          transition:'box-shadow 0.3s',
        }}>
          <CardBackImg />
          {hovered && !flipped && (
            <div style={{
              position:'absolute', inset:0,
              background:`radial-gradient(ellipse at center,${cfg.color}28 0%,transparent 65%)`,
              display:'flex', alignItems:'flex-end', justifyContent:'center', paddingBottom:14,
            }}>
              <span style={{
                fontFamily:'var(--f-ui)', fontWeight:700, fontSize:11,
                color:cfg.color, letterSpacing:1,
                background:'rgba(0,0,0,0.65)', borderRadius:6,
                padding:'4px 12px', border:`1px solid ${cfg.color}66`,
              }}>RÉVÉLER</span>
            </div>
          )}
        </div>

        {/* FACE (personnage) */}
        <div style={{
          position:'absolute', inset:0, backfaceVisibility:'hidden',
          transform:'rotateY(180deg)', borderRadius:14, overflow:'hidden',
          boxShadow:`0 0 0 2px ${cfg.color}, 0 0 40px ${cfg.glow}88, 0 10px 40px rgba(0,0,0,0.8)`,
        }}>
          {tpl ? (<>
            <CharacterCardThumb templateId={res.templateId} name={tpl.name} rarity={tpl.rarity}
              width={w} height={h} style={{ border:'none', boxShadow:'none', borderRadius:0 }} />
            {revealed && (
              <div style={{
                position:'absolute', bottom:0, left:0, right:0,
                padding:'22px 10px 12px',
                background:'linear-gradient(0deg,rgba(0,0,0,0.92) 0%,transparent 100%)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                animation:'fadeInUp 0.4s ease',
              }}>
                <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:13, color:'white' }}>{tpl.name}</span>
                <RarityBadge rarity={tpl.rarity} size="xs" />
                {res.isNew && <span style={{ fontFamily:'var(--f-ui)', fontSize:10, color:'#4ade80', fontWeight:700, letterSpacing:1 }}>✦ NOUVEAU !</span>}
              </div>
            )}
          </>) : null}
        </div>
      </div>
    </div>
  );
}

// ── Overlay révélation fullscreen ──────────────────────────────────────────
function GachaRevealOverlay({ results, onClose }: { results: Res[]; onClose: () => void }) {
  const [phase, setPhase] = useState<'video' | 'cards'>('video');
  const [forceFlip, setForceFlip] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) { setPhase('cards'); return; }
    const onEnd = () => setPhase('cards');
    v.addEventListener('ended', onEnd);
    v.play().catch(() => setPhase('cards'));
    const t = setTimeout(() => setPhase('cards'), 8000);
    return () => { v.removeEventListener('ended', onEnd); clearTimeout(t); };
  }, []);

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'rgba(0,0,0,0.97)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
    }}>
      {/* Vidéo */}
      <video ref={videoRef} src="/videos/gacha_intro.mp4"
        muted playsInline preload="auto"
        style={{
          position:'absolute', inset:0, width:'100%', height:'100%',
          objectFit:'cover', pointerEvents:'none',
          opacity: phase === 'video' ? 1 : 0,
          transition:'opacity 0.7s ease',
        }} />

      {/* Skip */}
      {phase === 'video' && (
        <button onClick={() => setPhase('cards')} style={{
          position:'absolute', bottom:32, right:32, zIndex:2,
          fontFamily:'var(--f-ui)', fontWeight:700, fontSize:12,
          color:'rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.06)',
          border:'1px solid rgba(255,255,255,0.14)', borderRadius:8,
          padding:'8px 20px', cursor:'pointer', letterSpacing:1,
        }}>PASSER ▶</button>
      )}

      {/* Cartes */}
      {phase === 'cards' && (
        <div style={{
          display:'flex', flexDirection:'column', alignItems:'center',
          gap:36, padding:'0 28px', width:'100%',
          maxWidth: results.length === 1 ? 340 : 1140,
          animation:'fadeIn 0.5s ease',
        }}>
          <div style={{
            display:'flex', flexWrap:'wrap', gap:14,
            justifyContent:'center', alignItems:'flex-end',
          }}>
            {results.map((res, i) => (
              <FlipCard key={i} res={res} index={i} total={results.length} forceFlip={forceFlip} />
            ))}
          </div>

          <div style={{ display:'flex', gap:12 }}>
            <button onClick={() => setForceFlip(true)} style={{
              fontFamily:'var(--f-ui)', fontWeight:700, fontSize:13, letterSpacing:1,
              color:'#c084fc', background:'rgba(168,85,247,0.12)',
              border:'1px solid rgba(168,85,247,0.4)', borderRadius:8,
              padding:'11px 28px', cursor:'pointer',
            }}>✦ TOUT RÉVÉLER</button>
            <button onClick={onClose} style={{
              fontFamily:'var(--f-ui)', fontWeight:700, fontSize:13, letterSpacing:1,
              color:'rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.12)', borderRadius:8,
              padding:'11px 28px', cursor:'pointer',
            }}>FERMER ✕</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cardSlideIn {
          from { opacity:0; transform:translateY(50px) scale(0.88); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes fadeInUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

export function GachaPage() {
  const { nekoGems, pullSingle, pullMulti, collection } = useGameStore();
  const [results,     setResults]     = useState<Res[]>([]);
  const [pulling,     setPulling]     = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showPool,    setShowPool]    = useState(false);
  const canS = nekoGems >= GACHA_COSTS.single;
  const canM = nekoGems >= GACHA_COSTS.multi10;

  const doSingle = () => {
    if (!canS || pulling) return;
    setPulling(true);
    const id = pullSingle();
    if (id) { setResults([{ templateId: id, isNew: !collection[id] }]); setShowOverlay(true); }
    setPulling(false);
  };
  const doMulti = () => {
    if (!canM || pulling) return;
    setPulling(true);
    const ids = pullMulti();
    if (ids) { setResults(ids.map(id => ({ templateId: id, isNew: !collection[id] }))); setShowOverlay(true); }
    setPulling(false);
  };

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 28px' }}>
      {/* Overlay animation gacha */}
      {showOverlay && (
        <GachaRevealOverlay
          results={results}
          onClose={() => { setShowOverlay(false); setResults([]); }}
        />
      )}
      <div style={{ maxWidth:'820px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'24px' }}>

        {/* Bannière image */}
        <div style={{ position:'relative', borderRadius:'14px', overflow:'hidden', border:'2px solid var(--purple-dim)', boxShadow:'0 0 32px rgba(168,85,247,0.25), 0 8px 32px rgba(0,0,0,0.6)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gacha_banner.png" alt="Bannière"
            style={{ width:'100%', display:'block', imageRendering:'pixelated', maxHeight:'220px', objectFit:'cover', objectPosition:'center top' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'65%', background:'linear-gradient(0deg, rgba(8,6,17,0.95) 0%, rgba(8,6,17,0.5) 60%, transparent 100%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'16px 24px', zIndex:2 }}>
            <div style={{ fontFamily:'var(--f-ui)', fontSize:'10px', fontWeight:700, color:'var(--purple-hi)', letterSpacing:'3px', marginBottom:'4px', textShadow:'0 0 8px rgba(168,85,247,0.8)' }}>✦ BANNIÈRE EXCLUSIVE</div>
            <div style={{ fontFamily:'var(--f-title)', fontSize:'20px', fontWeight:900, color:'white', letterSpacing:'2px', marginBottom:'4px', textShadow:'0 0 20px rgba(168,85,247,0.7)' }}>GACHA VERSE VOL.1</div>
            <div style={{ fontFamily:'var(--f-ui)', fontSize:'12px', color:'rgba(255,255,255,0.55)' }}>15 personnages • 7 raretés • 4★+ garanti dans 32 tirages</div>
          </div>
        </div>

        {/* Compteur gemmes + boutons */}
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr', gap:'12px', alignItems:'stretch' }}>
          {/* Gemmes */}
          <div style={{ background:'var(--bg-card)', border:'1px solid rgba(34,211,238,0.3)', borderRadius:'12px', padding:'16px 20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'4px', boxShadow:'0 0 20px rgba(34,211,238,0.08)' }}>
            <span style={{ fontSize:'28px' }}>💎</span>
            <span style={{ fontFamily:'var(--f-ui)', fontWeight:900, fontSize:'24px', color:'var(--cyan)' }}>{formatNumber(nekoGems)}</span>
            <span style={{ fontFamily:'var(--f-ui)', fontSize:'10px', color:'var(--text-dim)', fontWeight:600, letterSpacing:'1px' }}>NEKO-GEMMES</span>
          </div>

          {/* ×1 */}
          <button onClick={doSingle} disabled={!canS||pulling}
            style={{ background:canS?'linear-gradient(135deg,#2d0f5e 0%,#4c1d95 100%)':'var(--bg-card)', border:`2px solid ${canS?'rgba(139,92,246,0.6)':'var(--border)'}`, borderRadius:'12px', padding:'20px', cursor:canS&&!pulling?'pointer':'not-allowed', opacity:canS?1:0.45, transition:'all 0.2s', boxShadow:canS?'0 4px 24px rgba(109,40,217,0.3)':'none', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'28px' }}>✦</span>
            <span style={{ fontFamily:'var(--f-title)', fontSize:'16px', color:canS?'var(--purple-glow)':'var(--text-muted)', fontWeight:700, letterSpacing:'1px' }}>TIRAGE ×1</span>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(34,211,238,0.25)', borderRadius:'8px', padding:'6px 16px' }}>
              <span style={{ fontSize:'14px' }}>💎</span>
              <span style={{ fontFamily:'var(--f-ui)', fontWeight:800, fontSize:'18px', color:'var(--cyan)' }}>{GACHA_COSTS.single}</span>
            </div>
          </button>

          {/* ×10 */}
          <button onClick={doMulti} disabled={!canM||pulling}
            style={{ background:canM?'linear-gradient(135deg,#451a03 0%,#7c2d12 100%)':'var(--bg-card)', border:`2px solid ${canM?'rgba(217,119,6,0.6)':'var(--border)'}`, borderRadius:'12px', padding:'20px', cursor:canM&&!pulling?'pointer':'not-allowed', opacity:canM?1:0.45, transition:'all 0.2s', boxShadow:canM?'0 4px 24px rgba(180,83,9,0.3)':'none', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:'8px', right:'8px', background:'#d97706', color:'#000', fontFamily:'var(--f-ui)', fontWeight:800, fontSize:'10px', padding:'2px 8px', borderRadius:'6px', letterSpacing:'0.5px' }}>-10%</div>
            <span style={{ fontSize:'28px' }}>✦✦</span>
            <span style={{ fontFamily:'var(--f-title)', fontSize:'16px', color:canM?'#fbbf24':'var(--text-muted)', fontWeight:700, letterSpacing:'1px' }}>TIRAGE ×10</span>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(34,211,238,0.25)', borderRadius:'8px', padding:'6px 16px' }}>
              <span style={{ fontSize:'14px' }}>💎</span>
              <span style={{ fontFamily:'var(--f-ui)', fontWeight:800, fontSize:'18px', color:'var(--cyan)' }}>{GACHA_COSTS.multi10}</span>
            </div>
          </button>
        </div>

        {/* Taux de drop */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
          <button onClick={() => setShowPool(!showPool)}
            style={{ width:'100%', padding:'14px 18px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'13px', color:'var(--text-sub)', letterSpacing:'1px', transition:'background 0.15s' }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='none'}>
            <span>{showPool ? '▲' : '▼'} TAUX DE DROP & POOL DE PERSONNAGES</span>
          </button>
          {showPool && (
            <div style={{ padding:'0 18px 18px', display:'flex', flexDirection:'column', gap:'16px' }}>
              {/* Taux */}
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {(Object.entries(RARITY_CONFIG) as [Rarity, typeof RARITY_CONFIG[Rarity]][]).sort((a,b)=>b[1].chance-a[1].chance).map(([r,cfg])=>(
                  <div key={r} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 12px', background:'rgba(255,255,255,0.02)', borderRadius:'8px' }}>
                    <div style={{ width:'80px', flexShrink:0 }}><RarityBadge rarity={r} /></div>
                    <div style={{ flex:1, height:'6px', background:'rgba(255,255,255,0.05)', borderRadius:'3px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.min(cfg.chance,65)/65*100}%`, background:`linear-gradient(90deg,${cfg.color}88,${cfg.color})`, boxShadow:`0 0 6px ${cfg.glow}`, borderRadius:'3px' }} />
                    </div>
                    <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'14px', color:cfg.color, minWidth:'44px', textAlign:'right' }}>{cfg.chance}%</span>
                    <span style={{ fontFamily:'var(--f-ui)', fontSize:'11px', color:'var(--text-dim)', minWidth:'44px', textAlign:'right' }}>×{cfg.dpsMultiplier} DPS</span>
                  </div>
                ))}
              </div>
              {/* Pool de personnages */}
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:'14px' }}>
                <div style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'11px', color:'var(--text-dim)', letterSpacing:'1.5px', marginBottom:'10px' }}>TOUS LES PERSONNAGES</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'8px' }}>
                  {BANNER_POOL.map(tpl => {
                    const cfg = RARITY_CONFIG[tpl.rarity];
                    const owned = collection[tpl.id];
                    return (
                      <div key={tpl.id} style={{ background:owned?`${cfg.color}0d`:'rgba(255,255,255,0.02)', border:`1px solid ${owned?cfg.color+'55':'var(--border)'}`, borderRadius:'8px', padding:'10px 6px', display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', opacity:owned?1:0.55 }}>
                        <CharacterCardThumb templateId={tpl.id} formIndex={owned?.currentForm ?? 0} name={tpl.name} rarity={tpl.rarity} width={48} height={66} />
                        <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'10px', color:'var(--text-sub)', textAlign:'center', lineHeight:1.2 }}>{tpl.name}</span>
                        <RarityBadge rarity={tpl.rarity} size="xs" />
                        {owned && <RankStars rank={owned.rank} />}
                        {!owned && <span style={{ fontFamily:'var(--f-ui)', fontSize:'9px', color:'var(--text-muted)' }}>Non obtenu</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
