'use client';
import { useState, useEffect } from 'react';
import { BattleZone } from '@/components/game/BattleZone';
import { UpgradesPage } from '@/components/pages/UpgradesPage';
import { CompanionsPage } from '@/components/pages/CompanionsPage';
import { GachaPage } from '@/components/pages/GachaPage';
import { QuestsPage } from '@/components/pages/QuestsPage';
import { ShopPage } from '@/components/pages/ShopPage';
import { CollectionPage } from '@/components/pages/CollectionPage';
import { EventPage } from '@/components/pages/EventPage';
import { SettingsPage } from '@/components/pages/SettingsPage';
import { LeaderboardPage } from '@/components/pages/LeaderboardPage';
import { MarketplacePage } from '@/components/pages/MarketplacePage';
import { AuthModal } from '@/components/layout/AuthModal';
import { UltAnimation } from '@/components/game/UltAnimation';
import { MusicPlayer } from '@/components/game/MusicPlayer';
import { useGameStore, PALIER_PASS_GEMS } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';
import { useCloudSave } from '@/hooks/useCloudSave';
import { useDpsTick } from '@/hooks/useDpsTick';
import { formatNumber } from '@/lib/game/format';
import { getPalierConfig } from '@/types/game';

type Page = 'home' | 'upgrades' | 'companions' | 'collection' | 'gacha' | 'shop' | 'quests' | 'events' | 'settings' | 'leaderboard' | 'marketplace';

const NAV: { id: Page; label: string; icon: string; accent?: string }[] = [
  { id:'home',        label:'ACCUEIL',       icon:'🏠', accent:'var(--purple-glow)' },
  { id:'upgrades',    label:'AMÉLIORATIONS', icon:'⚔',  accent:'var(--gold)'        },
  { id:'companions',  label:'COMPAGNONS',    icon:'🐱', accent:'var(--purple-hi)'   },
  { id:'collection',  label:'COLLECTION',    icon:'📖', accent:'#60a5fa'            },
  { id:'gacha',       label:'GACHA',         icon:'💎', accent:'var(--cyan)'        },
  { id:'shop',        label:'BOUTIQUE',      icon:'🛒', accent:'#4ade80'            },
  { id:'quests',      label:'QUÊTES',        icon:'📜', accent:'#34d399'            },
  { id:'events',      label:'ÉVÉNEMENTS',    icon:'⭐', accent:'#fbbf24'            },
  { id:'leaderboard', label:'CLASSEMENT',     icon:'🏆', accent:'#fbbf24'            },
  { id:'marketplace', label:'HÔTEL DE VILLE', icon:'🏛', accent:'#f97316'            },
  { id:'settings',    label:'PARAMÈTRES',     icon:'⚙',  accent:'var(--text-sub)'    },
];

// Pages qui affichent la zone de combat (pas de panel central)
const COMBAT_PAGES: Page[] = ['home'];

export function GameLayout() {
  useDpsTick();
  const [page,     setPage]     = useState<Page>('home');
  const [showAuth, setShowAuth] = useState(false);
  const { pixelCoins, nekoGems, palier, wave, maxPalierReached, quests, ensureDailyQuests, username } = useGameStore();
  const { user } = useAuth();
  const { forceSave } = useCloudSave(user?.uid ?? null);
  const cfg = getPalierConfig(palier);
  const isCombat = COMBAT_PAGES.includes(page);
  const progressPct = Math.round((wave / 10) * 100);
  const currentNav = NAV.find(n => n.id === page)!;

  // Vérifie/réinitialise les quêtes quotidiennes une fois au montage (couvre toutes les pages)
  useEffect(() => { ensureDailyQuests(); }, [ensureDailyQuests]);

  // Quêtes réclamables
  const claimable = (quests ?? []).filter((q: { current: number; target: number; done: boolean }) => q.current >= q.target && !q.done).length;

  return (
    <div style={{ width:'100vw', height:'100vh', display:'flex', flexDirection:'column', background:'var(--bg-deep)', overflow:'hidden' }}>

      {/* ══ TOP BAR ══════════════════════════════════════════════════════ */}
      <header style={{ height:'54px', flexShrink:0, display:'flex', alignItems:'center', background:'linear-gradient(180deg,#0c0918,var(--bg-dark))', borderBottom:'1px solid var(--border)', padding:'0 20px', gap:'16px', zIndex:30, boxShadow:'0 2px 20px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.03)' }}>

        {/* Logo */}
        <div style={{ width:'200px', flexShrink:0 }}>
          <div style={{ fontFamily:'var(--f-title)', fontSize:'17px', fontWeight:900, letterSpacing:'3px', background:'linear-gradient(90deg,#c084fc,#a855f7,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1 }}>
            GACHA VERSE
          </div>
          <div style={{ fontFamily:'var(--f-ui)', fontSize:'9px', color:'var(--text-muted)', letterSpacing:'5px', marginTop:'2px' }}>ガチャバース</div>
        </div>

        {/* Avatar / Bouton connexion */}
        <button onClick={() => setShowAuth(true)}
          style={{ display:'flex', alignItems:'center', gap:'10px',
            background: user ? 'var(--bg-card)' : 'linear-gradient(135deg,#3b0764,#6d28d9)',
            border: user ? '1px solid var(--border)' : '1px solid #c084fc',
            borderRadius:'10px', padding:'5px 14px 5px 6px', cursor:'pointer',
            transition:'all 0.15s', flexShrink:0,
            boxShadow: user ? 'none' : '0 0 16px rgba(168,85,247,0.4)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter = 'brightness(1.15)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = 'none'}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg,#3b0764,#6d28d9)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', border:'1px solid var(--purple-dim)', boxShadow:'0 0 12px rgba(109,40,217,0.35)', flexShrink:0 }}>🐱</div>
          <div style={{ textAlign:'left' }}>
            {user ? (<>
              <div style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'13px', color:'var(--text)', lineHeight:1.2 }}>{username || user.email?.split('@')[0]}</div>
              <div style={{ fontFamily:'var(--f-ui)', fontSize:'10px', color:'var(--text-dim)', lineHeight:1 }}>Palier {palier} — Vague {wave}/10</div>
            </>) : (<>
              <div style={{ fontFamily:'var(--f-ui)', fontWeight:800, fontSize:'13px', color:'#e9d5ff', lineHeight:1.2, letterSpacing:'0.5px' }}>SE CONNECTER</div>
              <div style={{ fontFamily:'var(--f-ui)', fontSize:'10px', color:'rgba(233,213,255,0.6)', lineHeight:1 }}>ou créer un compte</div>
            </>)}
          </div>
        </button>

        {/* Ressources */}
        <div style={{ display:'flex', gap:'8px' }}>
          {[
            { icon:'🪙', val:formatNumber(pixelCoins), color:'var(--gold)',  bg:'rgba(120,53,15,0.25)',  border:'rgba(180,83,9,0.4)'  },
            { icon:'💎', val:formatNumber(nekoGems),   color:'var(--cyan)',  bg:'rgba(8,70,92,0.25)',    border:'rgba(14,116,144,0.4)' },
          ].map((r,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'7px', background:r.bg, border:`1px solid ${r.border}`, borderRadius:'20px', padding:'5px 16px', cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter = 'brightness(1.15)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = 'none'}>
              <span style={{ fontSize:'15px' }}>{r.icon}</span>
              <span style={{ fontFamily:'var(--f-ui)', fontWeight:800, fontSize:'15px', color:r.color }}>{r.val}</span>
              <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'15px', color:r.color, opacity:0.45 }}>+</span>
            </div>
          ))}
        </div>

        {/* Breadcrumb page */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'5px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:'8px' }}>
          <span style={{ fontSize:'14px' }}>{currentNav.icon}</span>
          <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'12px', color: currentNav.accent ?? 'var(--text-sub)', letterSpacing:'1px' }}>{currentNav.label}</span>
        </div>

        {/* Icônes droite */}
        <div style={{ marginLeft:'auto', display:'flex', gap:'6px', alignItems:'center' }}>
          {[
            { icon:'🏆', label:'CLASSEMENT', page: 'leaderboard' as Page },
            { icon:'📜', label:'QUÊTES',     page: 'quests' as Page },
            { icon:'⚙',  label:'OPTIONS',    page: 'settings' as Page },
          ].map(n => (
            <button key={n.label} onClick={() => n.page && setPage(n.page)}
              style={{ background:'none', border:'1px solid transparent', borderRadius:'8px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', padding:'5px 10px', color:'var(--text-dim)', transition:'all 0.15s', position:'relative' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='var(--text-sub)'; (e.currentTarget as HTMLElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='var(--text-dim)'; (e.currentTarget as HTMLElement).style.borderColor='transparent'; (e.currentTarget as HTMLElement).style.background='none'; }}>
              <span style={{ fontSize:'19px' }}>{n.icon}</span>
              <span style={{ fontFamily:'var(--f-ui)', fontSize:'8px', fontWeight:600, letterSpacing:'0.5px' }}>{n.label}</span>
              {n.label === 'QUÊTES' && claimable > 0 && (
                <div style={{ position:'absolute', top:'2px', right:'2px', width:14, height:14, background:'#ef4444', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'9px', color:'white', border:'1px solid var(--bg-dark)' }}>
                  {claimable}
                </div>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ══ MAIN ══════════════════════════════════════════════════════════ */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* ── SIDEBAR GAUCHE ─────────────────────────────────────────────── */}
        <aside style={{ width:'210px', flexShrink:0, background:'linear-gradient(180deg,var(--bg-dark) 0%,var(--bg-deep) 100%)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', padding:'10px 8px', gap:'2px', overflowY:'auto' }}>
          {NAV.map(item => (
            <div key={item.id} className={`nav-item${page===item.id?' active':''}`}
              onClick={() => setPage(item.id)}
              style={{ position:'relative' }}>
              <span style={{ fontSize:'17px', width:'22px', textAlign:'center', flexShrink:0 }}>{item.icon}</span>
              <span>{item.label}</span>
              {/* Badge quêtes */}
              {item.id === 'quests' && claimable > 0 && (
                <div style={{ position:'absolute', right:'10px', width:18, height:18, background:'#ef4444', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'10px', color:'white' }}>{claimable}</div>
              )}
            </div>
          ))}

          <div style={{ flex:1 }} />

          {/* Événement */}
          <div style={{ background:'linear-gradient(135deg,#140822,#1e0e38)', border:'1px solid var(--purple-dim)', borderRadius:'10px', padding:'14px', marginTop:'8px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:'-15px', right:'-15px', width:'70px', height:'70px', background:'radial-gradient(circle,rgba(168,85,247,0.12),transparent)', borderRadius:'50%' }} />
            <div style={{ fontFamily:'var(--f-ui)', fontSize:'9px', color:'var(--purple-hi)', fontWeight:700, letterSpacing:'1px', marginBottom:'5px' }}>ÉVÉNEMENT !</div>
            <div style={{ fontFamily:'var(--f-title)', fontSize:'12px', color:'var(--text)', fontWeight:700, letterSpacing:'1px', marginBottom:'6px', lineHeight:1.3 }}>BOSS DES OMBRES</div>
            <div style={{ fontFamily:'var(--f-ui)', fontSize:'11px', color:'var(--text-dim)', lineHeight:1.5 }}>Vaincs le boss de chaque palier pour des récompenses exclusives</div>
            <div style={{ marginTop:'8px', fontFamily:'var(--f-ui)', fontSize:'10px', color:'var(--text-dim)', display:'flex', alignItems:'center', gap:'5px' }}>
              <span>⏰</span><span>Permanent</span>
            </div>
          </div>
        </aside>

        {/* ── CONTENU CENTRAL ───────────────────────────────────────────── */}
        <div style={{ flex:'1 1 0', minWidth:0, display:'flex', overflow:'hidden' }}>

          {/* Zone combat — visible seulement en Accueil */}
          {isCombat ? (
            <div style={{ flex:1, display:'flex', gap:'10px', padding:'10px', overflow:'hidden' }}>
              {/* Combat */}
              <div style={{ flex:'1 1 0', minWidth:0 }}>
                <BattleZone />
              </div>
              {/* Sidebar droite de combat */}
              <aside style={{ width:'260px', flexShrink:0, display:'flex', flexDirection:'column', gap:'10px', overflowY:'auto' }}>
                <ProgressCard palier={palier} wave={wave} progressPct={progressPct} cfg={cfg} />
                <QuestsCard quests={quests} claimQuest={useGameStore.getState().claimQuest} />
                <StatsCard maxPalierReached={maxPalierReached} />
              </aside>
            </div>
          ) : (
            /* Pages */
            <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
              {/* Page header */}
              <div style={{ padding:'16px 28px 12px', borderBottom:'1px solid var(--border)', background:'linear-gradient(180deg,var(--bg-dark),transparent)', flexShrink:0, display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'4px', height:'18px', background:`linear-gradient(180deg,${currentNav.accent??'var(--purple-hi)'},transparent)`, borderRadius:'2px', boxShadow:`0 0 8px ${currentNav.accent??'var(--purple-hi)'}` }} />
                <span style={{ fontSize:'20px' }}>{currentNav.icon}</span>
                <span style={{ fontFamily:'var(--f-title)', fontSize:'16px', fontWeight:700, color:currentNav.accent??'var(--text)', letterSpacing:'2px' }}>{currentNav.label}</span>
              </div>
              <div style={{ flex:1, overflow:'hidden' }}>
                {page === 'upgrades'   && <UpgradesPage />}
                {page === 'companions' && <CompanionsPage />}
                {page === 'collection' && <CollectionPage />}
                {page === 'gacha'      && <GachaPage />}
                {page === 'shop'       && <ShopPage />}
                {page === 'quests'     && <QuestsPage />}
                {page === 'events'     && <EventPage />}
                {page === 'settings'     && <SettingsPage onForceSave={forceSave} />}
                {page === 'leaderboard'  && <LeaderboardPage />}
                {page === 'marketplace'  && <MarketplacePage />}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <UltAnimation />
      <MusicPlayer />
    </div>
  );
}

/* ── Sous-composants sidebar droite combat ─────────────────────────── */
function ProgressCard({ palier, wave, progressPct, cfg }: { palier: number; wave: number; progressPct: number; cfg: ReturnType<typeof getPalierConfig> }) {
  return (
    <div className="panel" style={{ padding:'14px', flexShrink:0 }}>
      <div style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'10px', color:'var(--text-dim)', letterSpacing:'2px', marginBottom:'10px' }}>PROGRESSION</div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
        <div>
          <div style={{ fontFamily:'var(--f-ui)', fontSize:'10px', color:'var(--text-dim)', fontWeight:600 }}>PALIER {palier}</div>
          <div style={{ fontFamily:'var(--f-title)', fontSize:'14px', color:'var(--text)', fontWeight:700, letterSpacing:'1px', marginTop:'2px', lineHeight:1.2 }}>{cfg.name}</div>
        </div>
        <div style={{ width:40, height:40, background:`${cfg.accentColor}18`, border:`1px solid ${cfg.accentColor}44`, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>📦</div>
      </div>
      <div style={{ height:'6px', background:'rgba(255,255,255,0.06)', borderRadius:'10px', overflow:'hidden', marginBottom:'6px' }}>
        <div style={{ height:'100%', width:`${progressPct}%`, borderRadius:'10px', background:'linear-gradient(90deg,#6d28d9,#a855f7)', boxShadow:'0 0 8px rgba(168,85,247,0.5)', transition:'width 0.4s' }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
        <span style={{ fontFamily:'var(--f-ui)', fontSize:'11px', color:'var(--text-dim)', fontWeight:600 }}>Vague {wave}/10</span>
        <span style={{ fontFamily:'var(--f-ui)', fontSize:'12px', color:'var(--purple-glow)', fontWeight:700 }}>{progressPct}%</span>
      </div>
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:'6px', padding:'6px 10px', display:'flex', alignItems:'center', gap:'8px' }}>
        <span style={{ fontFamily:'var(--f-ui)', fontSize:'11px', color:'var(--text-dim)' }}>Récompense :</span>
        <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'13px', color:'var(--cyan)' }}>💎 ×{PALIER_PASS_GEMS}</span>
      </div>
    </div>
  );
}

function QuestsCard({ quests, claimQuest }: { quests: { id:string; icon:string; label:string; current:number; target:number; reward:number; rewardType:string; done:boolean }[]; claimQuest: (id: string) => void }) {
  return (
    <div className="panel" style={{ padding:'14px', flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <div style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'10px', color:'var(--text-dim)', letterSpacing:'2px', marginBottom:'10px', flexShrink:0 }}>QUÊTES QUOTIDIENNES</div>
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px' }}>
        {(quests ?? []).map(q => {
          const pct = Math.min((q.current/q.target)*100, 100);
          const canClaim = q.current >= q.target && !q.done;
          return (
            <div key={q.id} style={{ background:'var(--bg-card)', border:`1px solid ${canClaim?'rgba(168,85,247,0.4)':q.done?'rgba(74,222,128,0.2)':'var(--border)'}`, borderRadius:'8px', padding:'10px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'7px', gap:'8px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', flex:1, minWidth:0 }}>
                  <span style={{ fontSize:'14px', flexShrink:0 }}>{q.icon}</span>
                  <span style={{ fontFamily:'var(--f-ui)', fontWeight:600, fontSize:'12px', color:'var(--text-sub)', lineHeight:1.3 }}>{q.label}</span>
                </div>
                {q.done ? <span style={{ fontSize:'16px', flexShrink:0 }}>✅</span>
                  : canClaim ? (
                    <button onClick={() => claimQuest(q.id)}
                      style={{ background:'linear-gradient(135deg,#3b0764,#5b21b6)', border:'1px solid var(--purple)', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'10px', color:'white', flexShrink:0, boxShadow:'0 0 8px rgba(124,58,237,0.35)', whiteSpace:'nowrap' }}>
                      RÉCUP
                    </button>
                  ) : (
                    <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'11px', color:'var(--gold)', background:'rgba(245,166,35,0.1)', border:'1px solid rgba(245,166,35,0.2)', padding:'2px 7px', borderRadius:'5px', flexShrink:0, whiteSpace:'nowrap' }}>
                      {q.rewardType==='gems'?'💎':'🪙'} {q.reward}
                    </span>
                  )
                }
              </div>
              <div style={{ height:'5px', background:'rgba(255,255,255,0.05)', borderRadius:'3px', overflow:'hidden', marginBottom:'4px' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:q.done?'linear-gradient(90deg,#166534,#4ade80)':'linear-gradient(90deg,#4c1d95,#a855f7)', borderRadius:'3px', transition:'width 0.3s', boxShadow:canClaim?'0 0 6px #a855f766':undefined }} />
              </div>
              <div style={{ fontFamily:'var(--f-ui)', fontSize:'10px', color:'var(--text-dim)', textAlign:'right', fontWeight:600 }}>{q.current}/{q.target}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatsCard({ maxPalierReached }: { maxPalierReached: number }) {
  return (
    <div className="panel" style={{ padding:'12px', flexShrink:0 }}>
      <div style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'10px', color:'var(--text-dim)', letterSpacing:'2px', marginBottom:'8px' }}>STATISTIQUES</div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderTop:'1px solid var(--border)' }}>
        <span style={{ fontFamily:'var(--f-ui)', fontSize:'12px', color:'var(--text-dim)' }}>Palier max atteint</span>
        <span style={{ fontFamily:'var(--f-ui)', fontWeight:800, fontSize:'16px', color:'var(--purple-glow)' }}>{maxPalierReached}</span>
      </div>
    </div>
  );
}

function PlaceholderPage({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px', opacity:0.5 }}>
      <span style={{ fontSize:'56px' }}>{icon}</span>
      <span style={{ fontFamily:'var(--f-title)', fontSize:'18px', color:'var(--text-dim)', letterSpacing:'2px' }}>{title}</span>
      <span style={{ fontFamily:'var(--f-ui)', fontSize:'13px', color:'var(--text-muted)', maxWidth:'300px', textAlign:'center', lineHeight:1.6 }}>{desc}</span>
    </div>
  );
}
