'use client';
import { useMemo, useState, type CSSProperties } from 'react';
import { useGameStore } from '@/store/gameStore';
import { CHARACTER_POOL, getCharFormName } from '@/lib/game/characters';
import { getUltimateDef } from '@/lib/game/ultimates';
import { EQUIPMENT_DEFS } from '@/lib/game/items';
import { CharacterCardThumb } from '@/components/ui/CharacterCardThumb';
import { RarityBadge, RankStars } from '@/components/ui/RarityBadge';
import { Rarity, RARITY_CONFIG, calcCharDps } from '@/types/game';
import { formatNumber } from '@/lib/game/format';

const RARITY_ORDER: Rarity[] = ['C','U','R','E','L','M','S','CO','P','T'];

export function CollectionPage() {
  const { collection } = useGameStore();
  const [view, setView] = useState<'characters' | 'equipment'>('characters');
  const [filter, setFilter] = useState<Rarity | 'all' | 'owned' | 'missing'>('all');

  const ownedCount = useMemo(
    () => CHARACTER_POOL.filter(c => collection[c.id]).length,
    [collection]
  );
  const ownedEquipment = useMemo(
    () => Object.entries(collection).reduce((acc, [, owned]) => {
      const equipped = owned.equippedItems ?? { helmet:null,chest:null,pants:null,boots:null,weapon:null };
      return acc + Object.values(equipped).filter(Boolean).length;
    }, 0),
    [collection]
  );

  const filtered = useMemo(() => {
    return CHARACTER_POOL.filter(tpl => {
      const isOwned = !!collection[tpl.id];
      if (filter === 'owned')   return isOwned;
      if (filter === 'missing') return !isOwned;
      if (filter === 'all')     return true;
      return tpl.rarity === filter;
    });
  }, [collection, filter]);

  const grouped = useMemo(() => {
    const map = new Map<Rarity, typeof CHARACTER_POOL>();
    for (const r of RARITY_ORDER) map.set(r, []);
    for (const tpl of filtered) map.get(tpl.rarity)!.push(tpl);
    return map;
  }, [filtered]);

  const equipmentList = useMemo(() => {
    return Object.values(EQUIPMENT_DEFS).sort((a, b) => {
      const order = RARITY_ORDER.slice().reverse();
      return order.indexOf(a.rarity as Rarity) - order.indexOf(b.rarity as Rarity);
    });
  }, []);

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 28px' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'22px' }}>

        {/* En-tête + progression globale */}
        <div className="panel collection-header">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
              <div style={{ width:'4px', height:'18px', background:'linear-gradient(180deg,#60a5fa,#1d4ed8)', borderRadius:'2px', boxShadow:'0 0 8px #60a5fa' }} />
              <span style={{ fontFamily:'var(--f-title)', fontSize:'16px', fontWeight:700, color:'#60a5fa', letterSpacing:'2px' }}>📖 COLLECTION COMPLÈTE</span>
            </div>
            <div className="collection-header__subtitle">
              {view === 'characters'
                ? `Tous les personnages du jeu, obtenus ou non — ${ownedCount} / ${CHARACTER_POOL.length} débloqués`
                : `Tous les équipements du jeu — ${equipmentList.length} objets listés (${ownedEquipment} équipés)`}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth:'200px' }}>
            <div style={{ flex:1, height:'8px', background:'rgba(255,255,255,0.06)', borderRadius:'10px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(ownedCount/CHARACTER_POOL.length)*100}%`, background:'linear-gradient(90deg,#1d4ed8,#60a5fa)', borderRadius:'10px', boxShadow:'0 0 8px #60a5fa88', transition:'width 0.4s' }} />
            </div>
            <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'13px', color:'#60a5fa', flexShrink:0 }}>
              {Math.round((ownedCount/CHARACTER_POOL.length)*100)}%
            </span>
          </div>
        </div>

        {/* Bascule de vue */}
        <div className="collection-tabs">
          {([
            { key:'characters' as const, label:'PERSONNAGES' },
            { key:'equipment' as const,  label:'ÉQUIPEMENT' },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setView(tab.key)}
              style={{ padding:'8px 16px', borderRadius:'10px', cursor:'pointer', fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'12px', letterSpacing:'0.5px',
                background: view===tab.key ? 'rgba(96,165,250,0.18)' : 'var(--bg-card)',
                border: `1px solid ${view===tab.key ? '#60a5fa66' : 'var(--border)'}`,
                color: view===tab.key ? '#60a5fa' : 'var(--text-dim)' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {view === 'characters' ? (
          <>
            <div className="collection-filters">
              {([
                { key:'all' as const,     label:'TOUS' },
                { key:'owned' as const,   label:'✓ POSSÉDÉS' },
                { key:'missing' as const, label:'🔒 MANQUANTS' },
              ]).map(f => (
                <button key={f.key} className={`collection-filter-btn${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
                  {f.label}
                </button>
              ))}
              <div className="collection-filter-separator" />
              {RARITY_ORDER.map(r => {
                const cfg = RARITY_CONFIG[r];
                return (
                  <button key={r} className={`collection-filter-btn${filter === r ? ' active rarity' : ''}`} onClick={() => setFilter(r)} style={{ ['--accent' as string]: cfg.color } as CSSProperties}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {RARITY_ORDER.map(r => {
              const list = grouped.get(r) ?? [];
              if (list.length === 0) return null;
              const cfg = RARITY_CONFIG[r];
              return (
                <div key={r} className="collection-group">
                  <div className="collection-group__header" style={{ ['--accent' as string]: cfg.color } as CSSProperties}>
                    <span>{cfg.label.toUpperCase()}</span>
                    <span>({list.length})</span>
                  </div>
                  <div className="collection-grid">
                    {list.map(tpl => {
                      const owned = collection[tpl.id];
                      const ult = getUltimateDef(tpl.id);
                      if (!owned) {
                        return (
                          <div key={tpl.id} className="collection-card locked">
                            <div className="collection-card__thumb">
                              <CharacterCardThumb templateId={tpl.id} name={tpl.name} rarity={tpl.rarity} width={72} height={98} />
                              <div className="collection-lock">🔒</div>
                            </div>
                            <div className="collection-card__name">{tpl.name}</div>
                            <RarityBadge rarity={tpl.rarity} />
                          </div>
                        );
                      }
                      const dps = calcCharDps(tpl, owned);
                      return (
                        <div key={tpl.id} className="collection-card owned" style={{ ['--accent' as string]: cfg.color } as CSSProperties}>
                          <CharacterCardThumb templateId={tpl.id} formIndex={owned.currentForm} name={getCharFormName(tpl, owned.currentForm)} rarity={tpl.rarity} width={72} height={98} />
                          <div className="collection-card__name">{tpl.name}</div>
                          <RankStars rank={owned.rank} />
                          <div className="collection-card__dps">{formatNumber(dps)}/s</div>
                          {ult && (
                            <div className="collection-card__ult">
                              <div className="collection-card__ult-name">{ult.name}</div>
                              <div className="collection-card__ult-desc">{ult.description}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(230px, 1fr))', gap:'12px' }}>
              {equipmentList.map(item => (
                <div key={item.id} style={{ background:`${item.color}0c`, border:`1px solid ${item.color}44`, borderRadius:'14px', padding:'14px', display:'flex', flexDirection:'column', gap:'10px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:44, height:44, borderRadius:'14px', background:`${item.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>{item.icon}</div>
                      <div>
                        <div style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:14, color:'var(--text)' }}>{item.name}</div>
                        <div style={{ fontFamily:'var(--f-ui)', fontSize:11, color:'var(--text-muted)' }}>{item.slot.toUpperCase()}</div>
                      </div>
                    </div>
                    <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:12, color:item.color }}>{item.rarity}</span>
                  </div>
                  <div style={{ fontFamily:'var(--f-ui)', fontSize:12, color:'var(--text-muted)', minHeight:40 }}>{item.description}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'10px' }}>
                    <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:12, color:'var(--text)' }}>Recycle</span>
                    <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:14, color:'var(--green)' }}>{item.recycleValue} 🪙</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
