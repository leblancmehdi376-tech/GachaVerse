export interface UltimateEffect {
  dpcMultiplier?:              number;
  dpsMultiplier?:              number;
  coinMultiplier?:             number;
  selfDpsMultiplier?:          number;
  enemyDamageTakenBonusPct?:  number;
  critChance?:                 number;
  stackPerClickPct?:           number;
  comboGrowthPct?:             number;
  chancePerClickCoinBurst?:    { chancePct: number; coinFlat: number };
  autoStrikes?:                { perSecond: number; source: 'dpc' | 'teamDpsPct'; value: number };
  poisonDpsPctOfDpc?:          number;
  damageToCoinPct?:            number;
  instantClicks?:              number;
  instantDamagePctSelfDps?:    number;
  instantDamagePctTeamDps?:    number;
  instantDamagePctMaxHp?:      number;
  instantCoinMultiplierBurst?: number;
  nextClickMultiplier?:        number;
  reduceOtherCooldownsSeconds?:number;
  haltTeamCooldownHalved?:     boolean;
  resetBestOtherCooldown?:     boolean;
}

export interface UltimateDef {
  templateId:   string;
  name:         string;
  description:  string;
  duration:     number;
  cooldown:     number;
  effect:       UltimateEffect;
  animDuration: number;
}

export const ULTIMATE_DEFS: Record<string, UltimateDef> = {

  // ══ COMMUNS — cooldown 90s ═══════════════════════════════════════════
  canarticho: {
    templateId:'canarticho', name:'Coup Critique', duration:4, cooldown:90,
    description:'Taux de critique à 100% pendant 4s',
    effect:{ critChance:1.0 }, animDuration:1200,
  },
  cyborg: {
    templateId:'cyborg', name:'Tir Automatique', duration:6, cooldown:90,
    description:'1 tir/s à 30% du DPC pendant 6s',
    effect:{ autoStrikes:{ perSecond:1, source:'dpc', value:0.3 } }, animDuration:1200,
  },
  slime: {
    templateId:'slime', name:'Explosion Visqueuse', duration:1, cooldown:90,
    description:'Équivalent à 4 clics instantanés',
    effect:{ instantClicks:4 }, animDuration:1200,
  },
  axolotl: {
    templateId:'axolotl', name:'Capture Surprise', duration:1, cooldown:90,
    description:'×0 coins instantané sur l\'ennemi actuel',
    effect:{ instantCoinMultiplierBurst:0 }, animDuration:1200,
  },
  garry_fish: {
    templateId:'garry_fish', name:'Saut Hors de l\'Eau', duration:8, cooldown:90,
    description:'10% de chance par clic de looter des coins bonus',
    effect:{ chancePerClickCoinBurst:{ chancePct:10, coinFlat:3 } }, animDuration:1200,
  },
  birthday_boy: {
    templateId:'birthday_boy', name:'Bougie Magique', duration:6, cooldown:90,
    description:'×1.3 DPC pendant 6s',
    effect:{ dpcMultiplier:1.3 }, animDuration:1200,
  },
  gummigoo: {
    templateId:'gummigoo', name:'Glu Collante', duration:6, cooldown:90,
    description:'L\'ennemi reçoit +5% de dégâts pendant 6s',
    effect:{ enemyDamageTakenBonusPct:5 }, animDuration:1200,
  },
  yamcha: {
    templateId:'yamcha', name:'La Pose', duration:1, cooldown:90,
    description:'×0 coins instantané sur l\'ennemi actuel',
    effect:{ instantCoinMultiplierBurst:0 }, animDuration:1400,
  },
  korogu: {
    templateId:'korogu', name:'Cri de la Forêt', duration:8, cooldown:90,
    description:'8% de chance par clic de looter des coins bonus',
    effect:{ chancePerClickCoinBurst:{ chancePct:8, coinFlat:3 } }, animDuration:1200,
  },
  bangers: {
    templateId:'bangers', name:'Explosion', duration:1, cooldown:120,
    description:'Inflige instantanément 3% des PV max de l\'ennemi',
    effect:{ instantDamagePctMaxHp:3 }, animDuration:1600,         // ← nerfé : était 25%
  },
  bubba: {
    templateId:'bubba', name:'Piétinement', duration:8, cooldown:90,
    description:'×1.4 DPS personnel pendant 8s',
    effect:{ selfDpsMultiplier:1.4 }, animDuration:1200,
  },
  tentacool: {
    templateId:'tentacool', name:'Venin', duration:8, cooldown:90,
    description:'Poison basé sur 50% du DPC pendant 8s',
    effect:{ poisonDpsPctOfDpc:50 }, animDuration:1200,
  },
  chenipan: {
    templateId:'chenipan', name:'Évolution Rapide', duration:1, cooldown:90,
    description:'Réduit le cooldown de tous les autres ultimates de 15s',
    effect:{ reduceOtherCooldownsSeconds:15 }, animDuration:1200,  // ← nerfé : était 30s
  },
  mr_popo: {
    templateId:'mr_popo', name:'Pecking Order', duration:15, cooldown:300,
    description:'×1.8 DPS d\'équipe et ×1.5 or sur cet ennemi pendant 15s',
    effect:{ dpsMultiplier:1.8, coinMultiplier:1.5 }, animDuration:1800,  // ← nerfé : était x3/x2 20s
  },

  // ══ UNCOMMUNS — cooldown 120s ═════════════════════════════════════════
  prince_lars: {
    templateId:'prince_lars', name:'Caprice Royal', duration:6, cooldown:120,
    description:'×1.3 DPC pendant 6s',
    effect:{ dpcMultiplier:1.3 }, animDuration:1400,
  },
  eugeo: {
    templateId:'eugeo', name:'Lame de Glace', duration:8, cooldown:120,
    description:'×1.5 DPS personnel pendant 8s',
    effect:{ selfDpsMultiplier:1.5 }, animDuration:1400,
  },
  angie: {
    templateId:'angie', name:'Volée de Papillons', duration:8, cooldown:120,
    description:'10% de chance par clic de looter des coins bonus',
    effect:{ chancePerClickCoinBurst:{ chancePct:10, coinFlat:5 } }, animDuration:1400,
  },
  gobuta: {
    templateId:'gobuta', name:'Charge Gobeline', duration:1, cooldown:120,
    description:'Inflige instantanément 2% des PV max de l\'ennemi',
    effect:{ instantDamagePctMaxHp:2 }, animDuration:1400,
  },
  vogue_merry: {
    templateId:'vogue_merry', name:'Réparation', duration:1, cooldown:240,
    description:'Réduit de 20s le cooldown de tous les autres ultimates',
    effect:{ reduceOtherCooldownsSeconds:20 }, animDuration:1600,  // ← nerfé : était /2
  },

  // ══ RARES — cooldown 150s ═════════════════════════════════════════════
  'salamèche': {
    templateId:'salamèche', name:'Brûlure', duration:8, cooldown:150,
    description:'L\'ennemi reçoit +8% de dégâts pendant 8s',
    effect:{ enemyDamageTakenBonusPct:8 }, animDuration:1600,
  },
  carapuce: {
    templateId:'carapuce', name:'Bulles', duration:20, cooldown:150,
    description:'×1.5 monnaie obtenue pendant 20s',
    effect:{ coinMultiplier:1.5 }, animDuration:1600,              // ← nerfé : était x2 30s
  },
  bulbizarre: {
    templateId:'bulbizarre', name:'Vampigraine', duration:12, cooldown:150,
    description:'Convertit 0.5% des dégâts infligés en monnaie pendant 12s',
    effect:{ damageToCoinPct:0.5 }, animDuration:1600,
  },
  kissy_missy: {
    templateId:'kissy_missy', name:'Cadeau', duration:1, cooldown:150,
    description:'×0 monnaie instantané sur l\'ennemi actuel',
    effect:{ instantCoinMultiplierBurst:0 }, animDuration:1600,    // ← nerfé : était x10
  },
  yuno: {
    templateId:'yuno', name:'Tempête de Vent', duration:5, cooldown:150,
    description:'×2 DPC pendant 5s',
    effect:{ dpcMultiplier:2 }, animDuration:1600,                 // ← nerfé : était x5
  },
  the_dress: {
    templateId:'the_dress', name:'Illusion Optique', duration:6, cooldown:150,
    description:'Taux de critique à 40% pendant 6s',
    effect:{ critChance:0.4 }, animDuration:1600,
  },
  kirito: {
    templateId:'kirito', name:'Dual Wield', duration:8, cooldown:150,
    description:'×1.8 DPC pendant 8s',
    effect:{ dpcMultiplier:1.8 }, animDuration:1600,
  },

  // ══ ÉPIQUES — cooldown 210s ═══════════════════════════════════════════
  arsene: {
    templateId:'arsene', name:'Agile', duration:10, cooldown:210,
    description:'×1.3 DPS d\'équipe pendant 10s',
    effect:{ dpsMultiplier:1.3 }, animDuration:1800,               // ← nerfé : était x1.5
  },
  huggy_wuggy: {
    templateId:'huggy_wuggy', name:'Étreinte', duration:8, cooldown:210,
    description:'Chaque clic ajoute +5% aux dégâts de clic suivants (8s)',
    effect:{ stackPerClickPct:5 }, animDuration:1800,              // ← nerfé : était +15%
  },
  diablo: {
    templateId:'diablo', name:'Chaos Imprévisible', duration:10, cooldown:210,
    description:'Le DPC croît de +4% à chaque clic pendant 10s',
    effect:{ comboGrowthPct:4 }, animDuration:1800,                // ← nerfé : était +8%
  },
  reaper_leviathan: {
    templateId:'reaper_leviathan', name:'Attaque des Profondeurs', duration:8, cooldown:210,
    description:'×2 DPS personnel pendant 8s',
    effect:{ selfDpsMultiplier:2 }, animDuration:2000,             // ← nerfé : était x4
  },
  reinhardt: {
    templateId:'reinhardt', name:'Marteau Pilon', duration:1, cooldown:210,
    description:'Inflige instantanément 80% du DPS d\'équipe',
    effect:{ instantDamagePctTeamDps:80 }, animDuration:1800,      // ← nerfé : était 150%
  },

  // ══ LÉGENDAIRES — cooldown 270s ═══════════════════════════════════════
  sanji: {
    templateId:'sanji', name:'Diable Jambe', duration:8, cooldown:270,
    description:'×2 DPC pendant 8s',
    effect:{ dpcMultiplier:2 }, animDuration:2000,                 // ← nerfé : était x3
  },
  asta: {
    templateId:'asta', name:'Black Hurricane', duration:20, cooldown:270,
    description:'×1.5 DPS personnel pendant 20s',
    effect:{ selfDpsMultiplier:1.5 }, animDuration:2000,           // ← nerfé : était x2 30s
  },
  taureau: {
    templateId:'taureau', name:'Charge Furieuse', duration:10, cooldown:270,
    description:'×2 DPS personnel pendant 10s',
    effect:{ selfDpsMultiplier:2 }, animDuration:2000,
  },
  kioraku: {
    templateId:'kioraku', name:'Jeux d\'Ombre', duration:1, cooldown:270,
    description:'Le prochain clic inflige l\'équivalent de 80 clics normaux',
    effect:{ nextClickMultiplier:80 }, animDuration:2200,          // ← nerfé : était x100
  },
  arthur_pandragon: {
    templateId:'arthur_pandragon', name:'Excalibur', duration:1, cooldown:270,
    description:'Inflige instantanément 150% du DPS d\'équipe',
    effect:{ instantDamagePctTeamDps:150 }, animDuration:2200,      // ← nerfé : était 300%
  },
  nagito_komaeda: {
    templateId:'nagito_komaeda', name:'Chance', duration:8, cooldown:270,
    description:'15% de chance par clic de générer une explosion de monnaie',
    effect:{ chancePerClickCoinBurst:{ chancePct:15, coinFlat:25 } }, animDuration:2000, // ← nerfé
  },
  chuuya: {
    templateId:'chuuya', name:'Gravité', duration:8, cooldown:270,
    description:'L\'ennemi reçoit +20% de dégâts pendant 8s',
    effect:{ enemyDamageTakenBonusPct:20 }, animDuration:2000,     // ← nerfé : était +30% 10s
  },

  // ══ MYTHIQUES — cooldown 360s ═════════════════════════════════════════
  ren_m: {
    templateId:'ren_m', name:'All-Out Attack', duration:1, cooldown:360,
    description:'Inflige instantanément 180% du DPS d\'équipe',
    effect:{ instantDamagePctTeamDps:180 }, animDuration:2400,     // ← nerfé : était 500%
  },
  ichigo: {
    templateId:'ichigo', name:'Bankai', duration:1, cooldown:360,
    description:'Envoie une attaque à 700% de son propre DPS',
    effect:{ instantDamagePctSelfDps:700 }, animDuration:2400,     // ← nerfé : était 1000%
  },
  ouma: {
    templateId:'ouma', name:'Mensonge', duration:10, cooldown:360,
    description:'×1.5 DPC & ×1.3 DPS pendant 10s',
    effect:{ dpcMultiplier:1.5, dpsMultiplier:1.3 }, animDuration:2200, // ← nerfé : était x2
  },
  jax: {
    templateId:'jax', name:'Numéro de Charme', duration:12, cooldown:360,
    description:'Le DPC croît de +6% à chaque clic pendant 12s',
    effect:{ comboGrowthPct:6 }, animDuration:2200,                // ← nerfé : était +15%
  },
  dazai: {
    templateId:'dazai', name:'Annulation', duration:1, cooldown:360,
    description:'Réinitialise le cooldown de l\'ultimate allié le plus avancé',
    effect:{ resetBestOtherCooldown:true }, animDuration:2200,
  },

  // ══ STELLAIRES — cooldown 420s ════════════════════════════════════════
  naruto: {
    templateId:'naruto', name:'Rasengan Géant', duration:12, cooldown:420,
    description:'×3 DPS personnel pendant 12s',
    effect:{ selfDpsMultiplier:3 }, animDuration:2400,             // ← nerfé : était x5
  },
  luffy: {
    templateId:'luffy', name:'Gatling Gun', duration:7, cooldown:420,
    description:'attaque automatiques (30/s à 5% du DPS d\'équipe) pendant 7s',
    effect:{ autoStrikes:{ perSecond:30, source:'teamDpsPct', value:5 } }, animDuration:2800, // ← nerfé
  },

  // ══ COSMIQUES — cooldown 480s ═════════════════════════════════════════
  vegeta: {
    templateId:'vegeta', name:'Final Flash', duration:30, cooldown:480,
    description:'×3.5 DPC et 1.75 DPS pendant 30s',
    effect:{ dpcMultiplier:3.5, dpsMultiplier:1.75 }, animDuration:2600, // ← nerfé : était x5
  },
  minato: {
    templateId:'minato', name:'Hiraishin', duration:1, cooldown:480,
    description:'Inflige instantanément 15% des PV max de l\'ennemi',
    effect:{ instantDamagePctMaxHp:15 }, animDuration:2600,         // ← nerfé : était 35%
  },
  gilgamesh: {
    templateId:'gilgamesh', name:'Gate of Babylon', duration:5, cooldown:480,
    description:'Épées automatiques (3/s à 90% du DPS d\'équipe) pendant 5s',
    effect:{ autoStrikes:{ perSecond:3, source:'teamDpsPct', value:90 } }, animDuration:2800, // ← nerfé
  },
  link_midona: {
    templateId:'link_midona', name:'Lien', duration:15, cooldown:480,
    description:'Le DPC croît de +8% à chaque clic pendant 15s (plafonné ×20)',
    effect:{ comboGrowthPct:8 }, animDuration:2600,                // ← nerfé : était +20% x50
  },
  jinwoo: {
    templateId:'jinwoo', name:'Arise', duration:7, cooldown:480,
    description:'Soldats de l\'ombre (3 attaques/s à 80% du DPS d\'équipe) pendant 7s',
    effect:{ autoStrikes:{ perSecond:3, source:'teamDpsPct', value:80 } }, animDuration:2600, // ← nerfé
  },

  // ══ PRIMORDIAUX — cooldown 540s ═══════════════════════════════════════
  goku: {
    templateId:'goku', name:'Kamehameha', duration:1, cooldown:1,
    description:'Inflige instantanément 100% des PV max de l\'ennemi',
    effect:{ instantDamagePctMaxHp:100 }, animDuration:2600, 
  },
  limule: {
    templateId:'limule', name:'Prédateur', duration:15, cooldown:540,
    description:'×2 DPS et ×2 monnaie pendant 15s',
    effect:{ dpsMultiplier:2, coinMultiplier:2 }, animDuration:3200,  // ← nerfé : était x6/x2
  },
  arthur_leywin: {
    templateId:'arthur_leywin', name:'Lame d\'Éther', duration:5, cooldown:540,
    description:'Épées automatiques (4/s à 100% du DPS d\'équipe) pendant 5s',
    effect:{ autoStrikes:{ perSecond:4, source:'teamDpsPct', value:100 } }, animDuration:3000,
  },

  // ══ TRANSCENDANT — cooldown 600s ══════════════════════════════════════
  nekoz: {
    templateId:'nekoz', name:'A Perte', duration:15, cooldown:600,
    description:'×2.5 DPC, ×2.5 DPS et ×1.5 monnaie pendant 15s',
    effect:{ dpcMultiplier:2.5, dpsMultiplier:2.5, coinMultiplier:1.5 }, animDuration:3200, // ← nerfé : était x3
  },
};

export const getUltimateDef = (templateId: string): UltimateDef | undefined =>
  ULTIMATE_DEFS[templateId];
