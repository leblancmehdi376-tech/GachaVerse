'use client';
import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { CharacterCardThumb } from '@/components/ui/CharacterCardThumb';
import { RarityBadge, RankStars } from '@/components/ui/RarityBadge';
import { getCharacterById, getCharFormName } from '@/lib/game/characters';
import { getUltimateDef } from '@/lib/game/ultimates';
import { ITEM_DEFS, getEquipmentDef } from '@/lib/game/items';
import { computeActiveSynergies } from '@/lib/game/synergies';
import { calcCharDps, EQUIPMENT_SLOT_LABELS, EQUIPMENT_SLOTS } from '@/types/game';
import { formatNumber } from '@/lib/game/format';
import { RARITY_CONFIG } from '@/types/game';

const RARITY_PRIORITY: Record<string, number> = {
  T: 0, P: 1, CO: 2, S: 3, M: 4, L: 5, E: 6, R: 7, U: 8, C: 9,
};

export function CompanionsPage() {
  const {
    collection,
    equippedTeam,
    equipCharacter,
    unequipCharacter,
    inventory,
    equipmentInventory,
    sellItem,
    equipItem,
    unequipItem,
    recycleEquipment,
  } = useGameStore();

  const [selSlot, setSelSlot] = useState<number | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  const owned = Object.values(collection).sort((a, b) => {
    const aRarity = getCharacterById(a.templateId)?.rarity ?? 'C';
    const bRarity = getCharacterById(b.templateId)?.rarity ?? 'C';
    return RARITY_PRIORITY[aRarity] - RARITY_PRIORITY[bRarity];
  });
  const ownedItems = Object.entries(inventory).filter(([, qty]) => qty > 0);
  const ownedEquipment = Object.entries(equipmentInventory).filter(([, qty]) => qty > 0);
  const selectedCharacter = selectedCharacterId ? collection[selectedCharacterId] : null;
  const selectedTpl = selectedCharacterId ? getCharacterById(selectedCharacterId) : null;
  const activeSynergies = computeActiveSynergies(equippedTeam);
  const selectedSynergy = selectedTpl ? activeSynergies.find(s => s.def.universe === selectedTpl.universe) : null;

  const totalDps = equippedTeam.reduce((sum, id) => {
    if (!id || !collection[id]) return sum;
    return sum + calcCharDps(getCharacterById(id)!, collection[id]);
  }, 0);

  const selectedDps = selectedTpl && selectedCharacter ? calcCharDps(selectedTpl, selectedCharacter) : 0;
  const selectedEquipMult = selectedCharacter ? (
    Object.values(selectedCharacter.equippedItems ?? {}).reduce((mult, eqId) => {
      if (!eqId) return mult;
      const def = getEquipmentDef(eqId);
      return def ? mult * def.dpsMultiplier : mult;
    }, 1) * (selectedTpl && selectedCharacter && selectedCharacter.equippedItems?.weapon
      ? (getEquipmentDef(selectedCharacter.equippedItems.weapon)?.bonusFor?.templateId === selectedTpl.id
        ? getEquipmentDef(selectedCharacter.equippedItems.weapon)!.bonusFor!.multiplier
        : 1)
      : 1)) : 1;
  const selectedDpsWithEquip = Math.floor(selectedDps * selectedEquipMult);
  const selectedUlt = selectedTpl ? getUltimateDef(selectedTpl.id) : null;

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 28px' }}>
      <div className="companion-page__stack">
        <div className="companion-stats">
          {[
            { label: 'Alliés possédés', value: String(owned.length), color: 'var(--purple-hi)' },
            { label: 'Slots utilisés', value: `${equippedTeam.filter(Boolean).length}/4`, color: 'var(--cyan)' },
            { label: 'DPS total équipe', value: `${formatNumber(totalDps)}/s`, color: 'var(--green)' },
          ].map((stat) => (
            <div key={stat.label} className="companion-stats__card" style={{ borderColor: `${stat.color}22` }}>
              <div className="companion-stats__label">{stat.label}</div>
              <div className="companion-stats__value" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <section className="companion-section companion-panel">
          <div className="companion-section__header">
            <div className="companion-section__title companion-section__title--purple">
              <span className="companion-section__decor" />
              Équipe active
            </div>
            <div className="companion-toast">
              {selSlot !== null ? `Sélectionne un allié pour le slot ${selSlot + 1}` : 'Clique pour choisir ou retirer un allié'}
            </div>
          </div>

          <div className="companion-grid--4">
            {equippedTeam.map((tid, index) => {
              const tpl = tid ? getCharacterById(tid) : null;
              const own = tid ? collection[tid] : null;
              const isSelected = selSlot === index;
              const cfg = tpl ? RARITY_CONFIG[tpl.rarity] : null;
              const dps = tpl && own ? calcCharDps(tpl, own) : 0;

              return (
                <div
                  key={index}
                  className={`companion-team-slot ${isSelected ? 'companion-team-slot--selected' : ''}`}
                  style={tpl ? { borderColor: isSelected ? 'var(--purple-hi)' : `${cfg!.color}55`, background: isSelected ? 'rgba(168,85,247,0.14)' : `${cfg!.color}10` } : undefined}
                  onClick={() => setSelSlot(isSelected ? null : index)}
                >
                  <div className="companion-team-slot__meta">SLOT {index + 1}</div>
                  {tpl && own ? (
                    <>
                      <CharacterCardThumb
                        templateId={tpl.id}
                        formIndex={own.currentForm}
                        name={getCharFormName(tpl, own.currentForm)}
                        rarity={tpl.rarity}
                        width={64}
                        height={88}
                      />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{tpl.name}</div>
                        <div style={{ marginTop: 6 }}><RarityBadge rarity={tpl.rarity} /></div>
                      </div>
                      <RankStars rank={own.rank} />
                      <div style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 16, color: 'var(--green)' }}>{formatNumber(dps)}/s</div>
                      {(() => {
                        const ult = getUltimateDef(tpl.id);
                        return ult ? (
                          <div style={{ textAlign: 'center', padding: '0 4px' }}>
                            <span style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 10, color: 'var(--purple-glow)' }}>{ult.name}</span>
                            <span style={{ fontFamily: 'var(--f-ui)', fontSize: 10, color: 'var(--text-dim)' }}> : {ult.description}</span>
                          </div>
                        ) : null;
                      })()}
                      <button
                        className="companion-button companion-button--danger"
                        onClick={(event) => { event.stopPropagation(); unequipCharacter(index); }}
                      >
                        Retirer
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 52, height: 52, border: `2px dashed ${isSelected ? 'var(--purple-hi)' : 'rgba(255,255,255,0.16)'}`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: isSelected ? 'var(--purple-glow)' : 'rgba(255,255,255,0.25)' }}>
                        {isSelected ? '✓' : '+'}
                      </div>
                      <span style={{ fontFamily: 'var(--f-ui)', fontSize: 12, fontWeight: 700, color: isSelected ? 'var(--purple-glow)' : 'var(--text-muted)' }}>Vide</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {ownedItems.length > 0 && (
          <section className="companion-section">
            <div className="companion-section__header">
              <div className="companion-section__title">
                <span className="companion-section__decor" />
                Inventaire
              </div>
              <div className="companion-toast">{ownedItems.length} objets stockés</div>
            </div>

            <div className="companion-item-grid">
              {ownedItems.map(([itemId, qty]) => {
                const item = ITEM_DEFS[itemId];
                if (!item) return null;
                return (
                  <div
                    key={itemId}
                    className="companion-item-card"
                    style={{ borderColor: `${item.color}40`, background: `${item.color}11` }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ fontSize: 26 }}>{item.icon}</div>
                      <div>
                        <div style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 13, color: item.color }}>{item.name}</div>
                        <div style={{ fontFamily: 'var(--f-ui)', fontWeight: 900, fontSize: 15, color: 'var(--text)' }}>×{qty}</div>
                      </div>
                    </div>
                    {/* Boutons de vente */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => sellItem(itemId, 1)}
                        style={{
                          flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(251,191,36,0.35)',
                          background: 'rgba(251,191,36,0.08)', cursor: 'pointer',
                          fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 10, color: '#fbbf24',
                          lineHeight: 1.3, textAlign: 'center',
                        }}
                      >
                        VENDRE ×1<br />
                        <span style={{ fontWeight: 400, opacity: 0.8 }}>{formatNumber(item.sellGems)} 💎</span>
                      </button>
                      {qty > 1 && (
                        <button
                          onClick={() => sellItem(itemId, qty)}
                          style={{
                            flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(248,113,113,0.35)',
                            background: 'rgba(248,113,113,0.08)', cursor: 'pointer',
                            fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 10, color: '#f87171',
                            lineHeight: 1.3, textAlign: 'center',
                          }}
                        >
                          TOUT VENDRE<br />
                          <span style={{ fontWeight: 400, opacity: 0.8 }}>{formatNumber(item.sellGems * qty)} 💎</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="companion-section companion-panel">
          <div className="companion-section__header">
            <div className="companion-section__title companion-section__title--purple">
              <span className="companion-section__decor" />
              Personnage sélectionné
            </div>
            <div className="companion-toast">{ownedEquipment.reduce((sum, [, qty]) => sum + qty, 0)} objets possédés</div>
          </div>

          {selectedCharacter && selectedTpl ? (
            <div className="companion-split">
              <div className="companion-card-hero companion-item-card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                  <CharacterCardThumb
                    templateId={selectedTpl.id}
                    formIndex={selectedCharacter.currentForm}
                    name={getCharFormName(selectedTpl, selectedCharacter.currentForm)}
                    rarity={selectedTpl.rarity}
                    width={72}
                    height={98}
                  />
                  <div>
                    <div style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{selectedTpl.name}</div>
                    <div style={{ marginTop: 6 }}><RarityBadge rarity={selectedTpl.rarity} /></div>
                  </div>
                </div>

                {selectedUlt ? (
                  <div className="companion-ult-info">
                    <div className="companion-ult-info__name">{selectedUlt.name}</div>
                    <div className="companion-ult-info__desc">{selectedUlt.description}</div>
                  </div>
                ) : null}

                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--f-ui)', fontSize: 13, color: 'var(--text-muted)' }}>DPS de base</span>
                    <span style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, color: 'var(--text)' }}>{formatNumber(selectedDps)}/s</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--f-ui)', fontSize: 13, color: 'var(--text-muted)' }}>Bonus équipement</span>
                    <span style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, color: 'var(--green)' }}>×{selectedEquipMult.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--f-ui)', fontSize: 13, color: 'var(--text-muted)' }}>DPS total</span>
                    <span style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, color: 'var(--green)' }}>{formatNumber(selectedDpsWithEquip)}/s</span>
                  </div>
                  {selectedSynergy ? (
                    <div className="companion-badge" style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.25)', color: '#60a5fa' }}>
                      <span style={{ fontSize: 11 }}>Synergie active</span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{selectedSynergy.def.label}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="companion-equip-grid">
                <div className="companion-card-hero">
                  {EQUIPMENT_SLOTS.map((slot) => {
                    const equippedId = selectedCharacter.equippedItems?.[slot] ?? null;
                    const equippedDef = equippedId ? getEquipmentDef(equippedId) : null;
                    return (
                      <div key={slot} className="companion-slot-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="companion-slot-card__icon" style={{ background: equippedDef ? `${equippedDef.color}15` : 'rgba(255,255,255,0.04)' }}>
                            {equippedDef ? equippedDef.icon : '—'}
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{EQUIPMENT_SLOT_LABELS[slot]}</div>
                            <div style={{ fontFamily: 'var(--f-ui)', fontSize: 11, color: 'var(--text-muted)' }}>{equippedDef ? equippedDef.name : 'Aucun équipement'}</div>
                          </div>
                        </div>
                        {equippedDef ? (
                          <button
                            className="companion-button companion-button--danger"
                            onClick={() => selectedCharacterId && unequipItem(selectedCharacterId, slot)}
                          >
                            Retirer
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="companion-card-hero">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontFamily: 'var(--f-ui)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Inventaire d’équipement</div>
                    <div style={{ fontFamily: 'var(--f-ui)', fontSize: 12, color: 'var(--text-muted)' }}>{ownedEquipment.reduce((sum, [, qty]) => sum + qty, 0)} objets</div>
                  </div>
                  <div className="companion-item-grid">
                    {ownedEquipment.map(([equipmentId, qty]) => {
                      const item = getEquipmentDef(equipmentId);
                      if (!item) return null;
                      return (
                        <div
                          key={equipmentId}
                          className="companion-item-card"
                          style={{ borderColor: `${item.color}30`, background: `${item.color}12` }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ fontSize: 22 }}>{item.icon}</div>
                              <div>
                                <div style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 13, color: item.color }}>{item.name}</div>
                                <div style={{ fontFamily: 'var(--f-ui)', fontSize: 11, color: 'var(--text-muted)' }}>{item.slot}</div>
                              </div>
                            </div>
                            <div style={{ fontFamily: 'var(--f-ui)', fontWeight: 900, fontSize: 14, color: 'var(--text)' }}>×{qty}</div>
                          </div>
                          <div style={{ fontFamily: 'var(--f-ui)', fontSize: 11, color: 'var(--text-muted)', minHeight: 32 }}>{item.description}</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              className="companion-button companion-button--primary"
                              onClick={() => selectedCharacterId && equipItem(selectedCharacterId, item.slot, item.id)}
                            >
                              Équiper
                            </button>
                            <button
                              className="companion-button companion-button--soft"
                              onClick={() => recycleEquipment(item.id)}
                            >
                              Recycler
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {ownedEquipment.length === 0 && (
                      <div className="companion-empty" style={{ gridColumn: '1 / -1' }}>
                        Tu n’as pas encore d’équipement. Tue des monstres pour obtenir des objets.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="companion-empty">
              Sélectionne un allié dans ta collection pour gérer son équipement.
            </div>
          )}
        </section>

        <section className="companion-section">
          <div className="companion-section__header">
            <div className="companion-section__title" style={{ color: 'var(--cyan)' }}>
              <span className="companion-section__decor" style={{ background: 'linear-gradient(180deg,var(--cyan),#0ea5e9)' }} />
              Collection ({owned.length})
            </div>
          </div>

          {owned.length === 0 ? (
            <div className="companion-empty">
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <div style={{ fontFamily: 'var(--f-title)', fontSize: 16, color: 'var(--text-dim)', marginBottom: 6 }}>Aucun allié invoqué</div>
              <div style={{ fontFamily: 'var(--f-ui)', fontSize: 13, color: 'var(--text-muted)' }}>Va dans l'onglet Gacha pour invoquer !</div>
            </div>
          ) : (
            <div className="companion-item-grid">
              {owned.map((ownedChar) => {
                const tpl = getCharacterById(ownedChar.templateId);
                if (!tpl) return null;
                const cfg = RARITY_CONFIG[tpl.rarity];
                const isEquipped = equippedTeam.includes(tpl.id);
                const dps = calcCharDps(tpl, ownedChar);
                const ult = getUltimateDef(tpl.id);
                return (
                  <div
                    key={tpl.id}
                    className="companion-item-card"
                    onClick={() => {
                      if (selSlot !== null) {
                        equipCharacter(tpl.id, selSlot);
                        setSelSlot(null);
                      } else {
                        setSelectedCharacterId(tpl.id === selectedCharacterId ? null : tpl.id);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      background: isEquipped ? `${cfg.color}12` : 'rgba(255,255,255,0.03)',
                      borderColor: selSlot !== null ? 'var(--purple-dim)' : isEquipped ? `${cfg.color}55` : 'rgba(255,255,255,0.08)',
                      boxShadow: isEquipped ? `0 0 16px ${cfg.glow}15` : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <CharacterCardThumb
                        templateId={tpl.id}
                        formIndex={ownedChar.currentForm}
                        name={getCharFormName(tpl, ownedChar.currentForm)}
                        rarity={tpl.rarity}
                        width={56}
                        height={78}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.name}</span>
                          {isEquipped && (
                            <span style={{ fontFamily: 'var(--f-ui)', fontSize: 10, color: cfg.color, fontWeight: 700, background: `${cfg.color}15`, border: `1px solid ${cfg.color}44`, borderRadius: 9999, padding: '3px 8px' }}>
                              Équipé
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <RarityBadge rarity={tpl.rarity} />
                          <span style={{ fontFamily: 'var(--f-ui)', fontSize: 11, color: 'var(--text-muted)' }}>{ownedChar.copies} copies</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <RankStars rank={ownedChar.rank} />
                          <span style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 15, color: 'var(--green)' }}>{formatNumber(dps)}/s</span>
                        </div>
                        {ult && (
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 8 }}>
                            <span style={{ fontFamily: 'var(--f-ui)', fontWeight: 700, fontSize: 10, color: 'var(--purple-glow)' }}>{ult.name}</span>
                            <span style={{ fontFamily: 'var(--f-ui)', fontSize: 10, color: 'var(--text-dim)' }}> : {ult.description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
