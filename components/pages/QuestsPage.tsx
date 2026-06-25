'use client';
import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

export function QuestsPage() {
  const { quests, claimQuest } = useGameStore();

  return (
    <div style={{ height:'100%', overflowY:'auto', padding:'24px 28px' }}>
      <div style={{ maxWidth:'700px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'24px' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
            <div style={{ width:'4px', height:'18px', background:'linear-gradient(180deg,#34d399,#059669)', borderRadius:'2px', boxShadow:'0 0 8px #34d399' }} />
            <span style={{ fontFamily:'var(--f-title)', fontSize:'14px', fontWeight:700, color:'#34d399', letterSpacing:'2px' }}>QUÊTES QUOTIDIENNES</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {(quests ?? []).map((q: { id:string; icon:string; label:string; current:number; target:number; reward:number; rewardType:string; done:boolean }) => {
              const pct = Math.min((q.current/q.target)*100,100);
              const canClaim = q.current >= q.target && !q.done;
              return (
                <div key={q.id} style={{ background:'var(--bg-card)', border:`1px solid ${q.done?'rgba(74,222,128,0.3)':canClaim?'rgba(168,85,247,0.4)':'var(--border)'}`, borderRadius:'12px', padding:'16px 18px', display:'flex', gap:'14px', alignItems:'center', boxShadow:canClaim?'0 0 16px rgba(168,85,247,0.12)':q.done?'0 0 10px rgba(74,222,128,0.08)':'none', transition:'all 0.2s' }}>
                  <span style={{ fontSize:'28px', flexShrink:0 }}>{q.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                      <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'15px', color:'var(--text)' }}>{q.label}</span>
                      <span style={{ fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'14px', color:'var(--gold)', background:'rgba(245,166,35,0.12)', border:'1px solid rgba(245,166,35,0.25)', padding:'3px 12px', borderRadius:'6px' }}>
                        {q.rewardType==='gems'?'💎':'🪙'} {q.reward}
                      </span>
                    </div>
                    <div style={{ height:'8px', background:'rgba(255,255,255,0.05)', borderRadius:'4px', overflow:'hidden', marginBottom:'6px' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:q.done?'linear-gradient(90deg,#166534,#4ade80)':canClaim?'linear-gradient(90deg,#4c1d95,#a855f7)':'linear-gradient(90deg,#1e1040,#6d28d9)', borderRadius:'4px', transition:'width 0.3s', boxShadow:q.done?'0 0 8px #4ade8066':canClaim?'0 0 8px #a855f766':'none' }} />
                    </div>
                    <div style={{ fontFamily:'var(--f-ui)', fontSize:'12px', color:'var(--text-dim)', fontWeight:600 }}>{q.current} / {q.target}</div>
                  </div>
                  {q.done ? (
                    <span style={{ fontSize:'28px', flexShrink:0 }}>✅</span>
                  ) : canClaim ? (
                    <button onClick={() => claimQuest(q.id)}
                      style={{ background:'linear-gradient(135deg,#3b0764,#6d28d9)', border:'2px solid var(--purple-hi)', borderRadius:'10px', padding:'10px 18px', cursor:'pointer', fontFamily:'var(--f-ui)', fontWeight:700, fontSize:'13px', color:'white', flexShrink:0, boxShadow:'0 0 16px rgba(124,58,237,0.4)', letterSpacing:'0.5px' }}>
                      RÉCUPÉRER
                    </button>
                  ) : (
                    <div style={{ width:80, flexShrink:0, textAlign:'center', fontFamily:'var(--f-ui)', fontSize:'11px', color:'var(--text-muted)', fontWeight:600 }}>EN COURS</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
