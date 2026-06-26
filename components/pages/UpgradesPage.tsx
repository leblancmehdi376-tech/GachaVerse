'use client';
import { useState, useEffect } from 'react';
import { useGameStore, GOLD_UPGRADE_COSTS, GOLD_MULTIPLIERS } from '@/store/gameStore';
import { formatNumber } from '@/lib/game/format';
import { levelUpCost, evoCost, canEvolve, getLevelCap, calcCharDps, RARITY_CONFIG, calcBaseDpc, calcClickUpgradeCost } from '@/types/game';
import { getCharacterById, getCharFormName } from '@/lib/game/characters';
import { getItemDef } from '@/lib/game/items';
import { RarityBadge } from '@/components/ui/RarityBadge';
import { CharacterCardThumb } from '@/components/ui/CharacterCardThumb';
import { computeActiveSynergies, SYNERGIES_LIST as SYNERGIES } from '@/lib/game/synergies';

const RARITY_PRIORITY: Record<string, number> = {
  T: 0, P: 1, CO: 2, S: 3, M: 4, L: 5, E: 6, R: 7, U: 8, C: 9,
};

// ── Helpers ───────────────────────────────────────────────────────────────
function SectionHead({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
      <div style={{ width:4, height:18, background:`linear-gradient(180deg,${color},${color}66)`, borderRadius:2, boxShadow:`0 0 8px ${color}` }} />
      <span style={{ fontFamily:'var(--f-title)', fontSize:13, fontWeight:700, color, letterSpacing:2 }}>{children}</span>
    </div>
  );
}

function LevelBar({ level, cap, color }: { level: number; cap: number; color: string }) {
  const pct = Math.min((level / cap) * 100, 100);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:5, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${color}88,${color})`, borderRadius:3, boxShadow:`0 0 5px ${color}66`, transition:'width 0.3s' }} />
      </div>
      <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:10, color, whiteSpace:'nowrap' }}>Niv.{level}<span style={{ color:'rgba(255,255,255,0.25)', fontWeight:400 }}>/{cap}</span></span>
    </div>
  );
}

// ── Carte : Griffes Aiguisées (amélioration DPC) ───────────────────────────
function ClickUpgradeCard() {
  const { getHeroDpc, clickUpgradeLevel, pixelCoins, upgradeClick } = useGameStore();
  const cost      = calcClickUpgradeCost(clickUpgradeLevel); // ← source unique de vérité
  const dpc       = getHeroDpc();
  const canAfford = pixelCoins >= cost;
  // Prochain bonus = DPC au niveau suivant (via calcBaseDpc) moins DPC actuel
  const nextBonus = calcBaseDpc(clickUpgradeLevel + 1) - calcBaseDpc(clickUpgradeLevel);

  return (
    <div style={{ background:'linear-gradient(135deg,#1a1000,#130c00)', border:`2px solid ${canAfford?'#d97706':'#2a1f00'}`, borderRadius:12, padding:16, transition:'all 0.2s', boxShadow:canAfford?'0 0 20px rgba(217,119,6,0.15)':'none' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <div style={{ fontFamily:'var(--f-title)', fontSize:13, color:'#fbbf24', marginBottom:8 }}>⚡ GRIFFES AIGUISÉES</div>
          {[
            { label:'Niveau',        val:String(clickUpgradeLevel), color:'var(--text)' },
            { label:'DPC actuel',    val:formatNumber(dpc),         color:'#fb923c'     },
            { label:'Prochain niv.', val:`+${nextBonus} DPC`,       color:'#fbbf24'     },
          ].map(r=>(
            <div key={r.label} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:3 }}>
              <span style={{ fontFamily:'var(--f-ui)', fontSize:10, color:'var(--text-dim)', width:80, flexShrink:0 }}>{r.label}</span>
              <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:13, color:r.color }}>{r.val}</span>
            </div>
          ))}
        </div>
        <div style={{ background:'rgba(217,119,6,0.12)', border:'1px solid rgba(217,119,6,0.3)', borderRadius:8, padding:'8px 14px', textAlign:'center', flexShrink:0 }}>
          <span style={{ fontFamily:'var(--f-ui)', fontSize:8, color:'rgba(217,119,6,0.6)', display:'block', letterSpacing:1 }}>NIV.</span>
          <span style={{ fontFamily:'var(--f-ui)', fontWeight:900, fontSize:26, color:'#fbbf24', lineHeight:1 }}>{clickUpgradeLevel}</span>
        </div>
      </div>
      <div style={{ height:4, background:'rgba(255,255,255,0.05)', borderRadius:2, overflow:'hidden', marginBottom:12 }}>
        <div style={{ height:'100%', width:`${Math.min((pixelCoins/cost)*100,100)}%`, background:'linear-gradient(90deg,#92400e,#fbbf24)', borderRadius:2, transition:'width 0.3s' }} />
      </div>
      <button onClick={upgradeClick} disabled={!canAfford}
        style={{ width:'100%', padding:'10px', background:canAfford?'linear-gradient(135deg,#78350f,#a16207)':'rgba(255,255,255,0.03)', border:`1px solid ${canAfford?'#d97706':'var(--border)'}`, borderRadius:8, cursor:canAfford?'pointer':'not-allowed', fontFamily:'var(--f-ui)', fontWeight:700, fontSize:13, color:canAfford?'#fef3c7':'var(--text-muted)', transition:'all 0.15s', boxShadow:canAfford?'0 0 12px rgba(217,119,6,0.25)':'none', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
        <span>AMÉLIORER</span>
        <span style={{ color:'#fbbf24' }}>{formatNumber(cost)} 🪙</span>
      </button>
    </div>
  );
}

// ── Carte : Coffre d'Or (niveaux dynamiques depuis le store) ─────────────
const GOLD_COLORS = ['#fbbf24','#f59e0b','#d97706','#f97316','#ef4444','#a78bfa'];
const GOLD_LEVELS = GOLD_MULTIPLIERS.map((m, i) => {
  const pct = Math.round((m - 1) * 100);
  return {
    bonus: `+${pct}%`,
    cost: GOLD_UPGRADE_COSTS[i] ?? 0,
    desc: `${pct}% de coins en plus`,
    color: GOLD_COLORS[i % GOLD_COLORS.length],
  };
});

function GoldUpgradeCard() {
  const { goldUpgradeLevel, upgradeGold, pixelCoins, getGoldMultiplier } = useGameStore();
  const level     = goldUpgradeLevel ?? 0;
  const mult      = getGoldMultiplier();
  const maxed     = level >= GOLD_LEVELS.length;
  const nextLevel = GOLD_LEVELS[level];
  const canAfford = nextLevel && pixelCoins >= nextLevel.cost;

  return (
    <div style={{ background:'linear-gradient(135deg,#0c1a00,#081200)', border:`2px solid ${canAfford?'#4ade80':maxed?'rgba(74,222,128,0.4)':'#1a3000'}`, borderRadius:12, padding:16, transition:'all 0.2s', boxShadow:canAfford?'0 0 20px rgba(74,222,128,0.12)':maxed?'0 0 12px rgba(74,222,128,0.08)':'none' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <div style={{ fontFamily:'var(--f-title)', fontSize:13, color:'#4ade80', marginBottom:8 }}>🪙 COFFRE D&apos;OR</div>
          <div style={{ fontFamily:'var(--f-ui)', fontSize:11, color:'var(--text-dim)', marginBottom:8, lineHeight:1.6 }}>Augmente les coins obtenus par ennemi vaincu.</div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontFamily:'var(--f-ui)', fontSize:10, color:'var(--text-dim)' }}>Bonus actuel :</span>
            <span style={{ fontFamily:'var(--f-ui)', fontWeight:800, fontSize:16, color:'#4ade80' }}>×{mult.toFixed(2)}</span>
          </div>
        </div>
        <div style={{ background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:8, padding:'8px 14px', textAlign:'center', flexShrink:0 }}>
          <span style={{ fontFamily:'var(--f-ui)', fontSize:8, color:'rgba(74,222,128,0.6)', display:'block', letterSpacing:1 }}>NIV.</span>
          <span style={{ fontFamily:'var(--f-ui)', fontWeight:900, fontSize:26, color:'#4ade80', lineHeight:1 }}>{level}/{GOLD_LEVELS.length}</span>
        </div>
      </div>

      {/* 3 étapes visuelles */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${GOLD_LEVELS.length},1fr)`, gap:6, marginBottom:12 }}>
        {GOLD_LEVELS.map((g, i) => (
          <div key={i} style={{ padding:'8px 6px', background: i < level ? `${g.color}20` : 'rgba(255,255,255,0.03)', border:`1px solid ${i < level ? g.color+'55' : i === level ? g.color+'33' : 'var(--border)'}`, borderRadius:7, textAlign:'center', position:'relative', overflow:'hidden' }}>
            {i < level && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:g.color, boxShadow:`0 0 6px ${g.color}` }} />}
            <div style={{ fontFamily:'var(--f-ui)', fontWeight:800, fontSize:14, color:i < level ? g.color : 'var(--text-muted)' }}>{g.bonus}</div>
            <div style={{ fontFamily:'var(--f-ui)', fontSize:9, color:'var(--text-dim)', marginTop:2 }}>{formatNumber(g.cost)} 🪙</div>
            {i < level && <div style={{ fontSize:12, marginTop:2 }}>✅</div>}
          </div>
        ))}
      </div>

      {maxed ? (
        <div style={{ padding:'10px', background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.25)', borderRadius:8, textAlign:'center', fontFamily:'var(--f-ui)', fontWeight:700, fontSize:13, color:'#4ade80' }}>
          ✅ NIVEAU MAXIMUM ATTEINT — {GOLD_LEVELS[GOLD_LEVELS.length-1].bonus} coins
        </div>
      ) : (
        <button onClick={() => upgradeGold()} disabled={!canAfford}
          style={{ width:'100%', padding:'10px', background:canAfford?'linear-gradient(135deg,#14532d,#166534)':'rgba(255,255,255,0.03)', border:`1px solid ${canAfford?'#4ade80':'var(--border)'}`, borderRadius:8, cursor:canAfford?'pointer':'not-allowed', fontFamily:'var(--f-ui)', fontWeight:700, fontSize:13, color:canAfford?'#bbf7d0':'var(--text-muted)', transition:'all 0.15s', boxShadow:canAfford?'0 0 12px rgba(74,222,128,0.2)':'none', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <span>AMÉLIORER → {nextLevel?.bonus}</span>
          <span style={{ color:'#4ade80' }}>{formatNumber(nextLevel?.cost ?? 0)} 🪙</span>
        </button>
      )}
    </div>
  );
}

// ── Carte personnage avec PP ──────────────────────────────────────────────
function CharCard({ templateId }: { templateId: string }) {
  const { collection, pixelCoins, levelUpCharacter, evolveCharacter, inventory } = useGameStore();
  const owned = collection[templateId];
  const tpl   = getCharacterById(templateId);
  if (!owned || !tpl) return null;
  const cap      = getLevelCap(tpl, owned.currentForm);
  const atCap    = owned.level >= cap;
  const canEvo_  = canEvolve(tpl, owned, inventory);
  const lvCost   = levelUpCost(owned.level, tpl.rarity);
  const evoCostV = evoCost(tpl.rarity, owned.currentForm);
  const dps      = calcCharDps(tpl, owned);
  const cfg      = RARITY_CONFIG[tpl.rarity];
  const nextForm = tpl.forms?.[owned.currentForm + 1];
  const reqItem  = nextForm?.requiredItemId ? getItemDef(nextForm.requiredItemId) : null;
  const hasItem  = reqItem ? (inventory[reqItem.id] ?? 0) >= 1 : true;
  const name     = getCharFormName(tpl, owned.currentForm);

  return (
    <div style={{ background:'linear-gradient(135deg,#0e0c1a,#130f22)', border:`1px solid ${cfg.color}33`, borderRadius:12, padding:14, position:'relative', overflow:'hidden', boxShadow:`0 0 14px ${cfg.glow}0d` }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:`linear-gradient(180deg,${cfg.color},${cfg.glow})`, boxShadow:`0 0 8px ${cfg.glow}` }} />
      <div style={{ display:'flex', gap:12, alignItems:'flex-start', paddingLeft:8 }}>
        {/* Carte perso */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <CharacterCardThumb templateId={templateId} formIndex={owned.currentForm} name={name} rarity={tpl.rarity} width={64} height={88} />
          {tpl.forms && tpl.forms.length > 1 && (
            <div style={{ position:'absolute', bottom:-5, right:-5, background:cfg.color, borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, border:'2px solid var(--bg-deep)', fontWeight:700, color:'#000' }}>{owned.currentForm+1}</div>
          )}
        </div>
        {/* Infos */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:13, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
            <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:14, color:'var(--green)', flexShrink:0, marginLeft:8 }}>{formatNumber(dps)}/s</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
            <RarityBadge rarity={tpl.rarity} size="xs" />
            {tpl.universe && (
              <span style={{ fontFamily:'var(--f-ui)', fontSize:9, color:'var(--text-dim)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', padding:'1px 6px', borderRadius:4 }}>{tpl.universe}</span>
            )}
          </div>
          <LevelBar level={owned.level} cap={cap} color={cfg.color} />
          {tpl.forms && tpl.forms.length > 1 && (
            <div style={{ fontFamily:'var(--f-ui)', fontSize:9, color:'var(--text-dim)', marginTop:4 }}>
              Forme {owned.currentForm+1}/{tpl.forms.length} · Rang {owned.rank}/7
            </div>
          )}
        </div>
      </div>
      {/* Boutons */}
      <div style={{ display:'flex', gap:8, marginTop:12, paddingLeft:8 }}>
        <button onClick={() => levelUpCharacter(templateId)} disabled={atCap || pixelCoins < lvCost}
          style={{ flex:1, padding:'8px 10px', background:!atCap&&pixelCoins>=lvCost?`${cfg.color}18`:'rgba(255,255,255,0.03)', border:`1px solid ${!atCap&&pixelCoins>=lvCost?cfg.color+'55':'var(--border)'}`, borderRadius:8, cursor:!atCap&&pixelCoins>=lvCost?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.15s' }}>
          <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:11, color:!atCap&&pixelCoins>=lvCost?cfg.color:'var(--text-muted)' }}>{atCap?'⚠ CAP':'⬆ LVL UP'}</span>
          {!atCap&&<span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:11, color:'var(--gold)' }}>{formatNumber(lvCost)} 🪙</span>}
        </button>
        {atCap && !canEvo_ && reqItem && !hasItem && (
          <div style={{ padding:'7px 10px', background:'rgba(168,85,247,0.08)', border:'1px solid rgba(168,85,247,0.25)', borderRadius:8, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:14 }}>{reqItem.icon}</span>
            <span style={{ fontFamily:'var(--f-ui)', fontSize:11, color:'#c084fc' }}>Requiert : <b>{reqItem.name}</b> (Monarque des Ombres)</span>
          </div>
        )}
        {canEvo_ && (
          <button onClick={() => evolveCharacter(templateId)} disabled={pixelCoins < evoCostV}
            style={{ flex:1, padding:'8px 10px', background:pixelCoins>=evoCostV?'linear-gradient(135deg,#451a03,#78350f)':'rgba(255,255,255,0.03)', border:`1px solid ${pixelCoins>=evoCostV?'#d97706':'var(--border)'}`, borderRadius:8, cursor:pixelCoins>=evoCostV?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.15s', boxShadow:pixelCoins>=evoCostV?'0 0 12px rgba(217,119,6,0.3)':'none' }}>
            <span style={{ fontFamily:'var(--f-ui)', fontWeight:800, fontSize:11, color:pixelCoins>=evoCostV?'#fbbf24':'var(--text-muted)' }}>
              {reqItem ? `${reqItem.icon} ÉVOLUER` : '✦ ÉVOLUER'}
            </span>
            <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:11, color:'var(--gold)' }}>{formatNumber(evoCostV)} 🪙</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Panel synergies actives ───────────────────────────────────────────────
function SynergiesPanel() {
  const { equippedTeam } = useGameStore();
  const active = computeActiveSynergies(equippedTeam);
  const allSynergies = SYNERGIES;

  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:16 }}>
      <div style={{ fontFamily:'var(--f-ui)', fontSize:10, fontWeight:700, color:'var(--text-dim)', letterSpacing:2, marginBottom:12 }}>SYNERGIES ACTIVES ({active.length}/{allSynergies.length})</div>

      {active.length === 0 ? (
        <div style={{ fontFamily:'var(--f-ui)', fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'12px 0' }}>
          Équipe des alliés du même univers pour activer des synergies !
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {active.map(syn => (
            <div key={syn.def.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:`${syn.def.color}10`, border:`1px solid ${syn.def.color}44`, borderRadius:8, boxShadow:`0 0 10px ${syn.def.glow}15` }}>
              <div style={{ width:24, height:24, flexShrink:0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/sprites/synergies/${syn.def.id}.webp`} alt={syn.def.label}
                  style={{ width:'100%', height:'100%', objectFit:'contain' }}
                  onError={e => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.innerHTML=`<span style="font-size:18px">${syn.def.icon}</span>`; }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:12, color:syn.def.color }}>{syn.def.label}</div>
                <div style={{ fontFamily:'var(--f-ui)', fontSize:10, color:'var(--text-dim)', marginTop:1 }}>{syn.threshold.label}</div>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {syn.members.map(id => {
                  const ppSrc = `/sprites/pp/${id}.png`;
                  return (
                    <div key={id} style={{ width:24, height:24, borderRadius:5, overflow:'hidden', border:`1px solid ${syn.def.color}55` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ppSrc} alt={id} style={{ width:'100%', height:'100%', objectFit:'cover' }}
                        onError={e => { const t=e.target as HTMLImageElement; t.style.display='none'; t.parentElement!.style.background=syn.def.color+'22'; t.parentElement!.innerHTML=`<span style="font-size:12px;display:flex;align-items:center;justify-content:center;height:100%">?</span>`; }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ fontFamily:'var(--f-ui)', fontWeight:900, fontSize:14, color:syn.def.color, flexShrink:0 }}>
                {syn.count} / {syn.threshold.count}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toutes les synergies possibles */}
      <details style={{ marginTop:12 }}>
        <summary style={{ fontFamily:'var(--f-ui)', fontSize:10, color:'var(--text-dim)', cursor:'pointer', userSelect:'none', letterSpacing:1 }}>▼ VOIR TOUTES LES SYNERGIES</summary>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:5, marginTop:10 }}>
          {allSynergies.map(syn => {
            const isActive = active.some(a => a.def.id === syn.id);
            return (
              <div key={syn.id} style={{ padding:'6px 8px', background:isActive?`${syn.color}12`:'rgba(255,255,255,0.02)', border:`1px solid ${isActive?syn.color+'44':'var(--border)'}`, borderRadius:6, opacity:isActive?1:0.5 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
                  <div style={{ width:16, height:16, flexShrink:0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/sprites/synergies/${syn.id}.webp`} alt={syn.label}
                      style={{ width:'100%', height:'100%', objectFit:'contain' }}
                      onError={e => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.innerHTML=`<span style="font-size:13px">${syn.icon}</span>`; }} />
                  </div>
                  <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:10, color:syn.color }}>{syn.label}</span>
                </div>
                {syn.thresholds.map((t,i) => (
                  <div key={i} style={{ fontFamily:'var(--f-ui)', fontSize:8, color:'var(--text-dim)', lineHeight:1.5 }}>
                    ×{t.count} → {t.label}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────
export function UpgradesPage() {
  const { pixelCoins, nekoGems, getHeroDpc, getTotalDps, collection } = useGameStore();
  const ownedIds = Object.keys(collection).sort((a, b) => {
    const aRarity = getCharacterById(a)?.rarity ?? 'C';
    const bRarity = getCharacterById(b)?.rarity ?? 'C';
    return RARITY_PRIORITY[aRarity] - RARITY_PRIORITY[bRarity];
  });
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'20px 24px' }}>
      <div style={{ maxWidth:900, margin:'0 auto', display:'flex', flexDirection:'column', gap:24 }}>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {[
            { label:'PIXEL-COINS', val:formatNumber(pixelCoins),   color:'var(--gold)',  icon:'🪙' },
            { label:'NEKO-GEMMES', val:formatNumber(nekoGems),     color:'var(--cyan)',  icon:'💎' },
            { label:'DPC',         val:formatNumber(getHeroDpc()), color:'#fb923c',      icon:'⚡' },
            { label:'DPS',         val:formatNumber(getTotalDps()),color:'var(--green)', icon:'🔥' },
          ].map(s=>(
            <div key={s.label} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, right:0, width:0, height:0, borderStyle:'solid', borderWidth:'0 24px 24px 0', borderColor:`transparent ${s.color}22 transparent transparent` }} />
              <div style={{ fontFamily:'var(--f-ui)', fontSize:9, fontWeight:600, color:'var(--text-dim)', letterSpacing:1, marginBottom:5, display:'flex', gap:4 }}><span>{s.icon}</span><span>{s.label}</span></div>
              <div style={{ fontFamily:'var(--f-ui)', fontWeight:900, fontSize:22, color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Améliorations générales */}
        <div>
          <SectionHead color="var(--gold)">AMÉLIORATIONS GÉNÉRALES</SectionHead>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <ClickUpgradeCard />
            <GoldUpgradeCard />
          </div>
        </div>

        {/* Synergies */}
        <div>
          <SectionHead color="#a78bfa">SYNERGIES D&apos;ÉQUIPE</SectionHead>
          <SynergiesPanel />
        </div>

        {/* Alliés */}
        {ownedIds.length > 0 && (
          <div>
            <SectionHead color="var(--cyan)">ALLIÉS ({ownedIds.length})</SectionHead>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {ownedIds.map(id => <CharCard key={id} templateId={id} />)}
            </div>
          </div>
        )}

        {ownedIds.length === 0 && (
          <div style={{ textAlign:'center', padding:48, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, opacity:0.6 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <div style={{ fontFamily:'var(--f-ui)', fontSize:13, color:'var(--text-dim)', lineHeight:1.7 }}>Aucun allié à améliorer<br/>Invoque des personnages dans GACHA !</div>
          </div>
        )}
      </div>
    </div>
  );
}
