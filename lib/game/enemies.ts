import { Enemy, getPalierConfig } from '@/types/game';

interface EnemyDef {
  name: string;
  sprite: string;
  isBoss?: boolean;
  hpMult?: number;
}

// Sprite helper
const sp = (palier: number, name: string) =>
  `sprites/enemies/palier${palier}/${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;

const PALIER_ENEMIES: Record<number, EnemyDef[]> = {
  // ── PALIER 1 : Dragon Ball — Arc Saiyen ─────────────────────────────────
  1: [
    { name:'Raditz',        sprite: sp(1,'radditz')      },
    { name:'Saibaman',      sprite: sp(1,'saibaman')     },
    { name:'Saibaman',      sprite: sp(1,'saibaman')     },
    { name:'Saibaman',      sprite: sp(1,'saibaman')     },
    { name:'Nappa',         sprite: sp(1,'nappa'),       hpMult:2.5 },
    { name:'Saibaman',      sprite: sp(1,'saibaman')     },
    { name:'Végéta',        sprite: sp(1,'vegeta'),      hpMult:1.8 },
    { name:'Saibaman',      sprite: sp(1,'saibaman')     },
    { name:'Végéta',        sprite: sp(1,'vegeta'),      hpMult:2.2 },
    { name:'Végéta Ōzaru',  sprite: sp(1,'vegeta_ozaru'),isBoss:true, hpMult:6 },
  ],
  // ── PALIER 2 : One Piece — East Blue ────────────────────────────────────
  2: [
    { name:'Alvida',        sprite: sp(2,'alvida')      },
    { name:'Capitaine Morgan',sprite:sp(2,'morgan'),    hpMult:1.4 },
    { name:'Baggy le Clown',sprite: sp(2,'buggy'),      hpMult:1.6 },
    { name:'Capitaine Kuro',sprite: sp(2,'kuro'),       hpMult:1.8 },
    { name:'Don Krieg',     sprite: sp(2,'don_krieg'),  hpMult:2.2 },
    { name:'Mihawk',        sprite: sp(2,'mihawk'),     hpMult:3.0 },
    { name:'Arlong',        sprite: sp(2,'arlong'),     hpMult:2.5 },
    { name:'Baggy le Clown',sprite: sp(2,'buggy'),      hpMult:1.5 },
    { name:'Baggy le Clown',sprite: sp(2,'buggy'),      hpMult:1.5 },
    { name:'Smoker',        sprite: sp(2,'smoker'),     isBoss:true, hpMult:6 },
  ],
  // ── PALIER 3 : Naruto — Examen Chūnin ───────────────────────────────────
  3: [
    { name:'Mizuki',        sprite: sp(3,'mizuki')      },
    { name:'Haku',          sprite: sp(3,'haku'),       hpMult:1.6 },
    { name:'Zabuza',        sprite: sp(3,'zabuza'),     hpMult:2.0 },
    { name:'Orochimaru',    sprite: sp(3,'orochimaru'), hpMult:2.5 },
    { name:'Neji Hyūga',    sprite: sp(3,'neji'),       hpMult:1.8 },
    { name:'Gaara de Suna', sprite: sp(3,'gaara'),      hpMult:2.8 },
    { name:'Temari',        sprite: sp(3,'temari'),     hpMult:1.6 },
    { name:'Kabuto',        sprite: sp(3,'kabuto'),     hpMult:2.0 },
    { name:'Orochimaru',    sprite: sp(3,'orochimaru'), hpMult:3.5 },
    { name:'Shukaku',       sprite: sp(3,'shukaku'),    isBoss:true, hpMult:7 },
  ],
  // ── PALIER 4 : Pokémon — Kanto ──────────────────────────────────────────
  4: [
    { name:'Pierre & Onix',       sprite: sp(4,'pierre_onix')        },
    { name:'Ondine & Staross',    sprite: sp(4,'ondine_staross')     },
    { name:'Bob & Raichu',        sprite: sp(4,'bob_raichu'),        hpMult:1.5 },
    { name:'Erika & Rafflesia',   sprite: sp(4,'erika_rafflesia')    },
    { name:'Koga & Smogogo',      sprite: sp(4,'koga_smogogo'),      hpMult:1.8 },
    { name:'Morgane & Alakazam',  sprite: sp(4,'morgane_alakazam'),  hpMult:2.0 },
    { name:'Auguste & Magmar',    sprite: sp(4,'auguste_magmar'),    hpMult:2.2 },
    { name:'Giovanni & Rhinoferos',sprite:sp(4,'giovanni_rhino'),    hpMult:2.5 },
    { name:'Blue & Roucarnage',   sprite: sp(4,'blue_roucarnage'),   hpMult:3.0 },
    { name:'Mewtwo',              sprite: sp(4,'mewtwo'),            isBoss:true, hpMult:8 },
  ],
  // ── PALIER 5 : Persona 5 ────────────────────────────────────────────────
  5: [
    { name:'Mona',          sprite: sp(5,'mona')         },
    { name:'Skull',         sprite: sp(5,'skull')        },
    { name:'Panther',       sprite: sp(5,'panther'),     hpMult:1.4 },
    { name:'Fox',           sprite: sp(5,'fox'),         hpMult:1.6 },
    { name:'Queen',         sprite: sp(5,'queen'),       hpMult:1.8 },
    { name:'Navi',          sprite: sp(5,'navi')         },
    { name:'Noir',          sprite: sp(5,'noir'),        hpMult:2.0 },
    { name:'Violet',        sprite: sp(5,'violet'),      hpMult:2.2 },
    { name:'Crow',          sprite: sp(5,'crow'),        hpMult:2.8 },
    { name:'Joker',         sprite: sp(5,'joker'),       isBoss:true, hpMult:6 },
  ],
  // ── PALIER 6 : Poppy Playtime ───────────────────────────────────────────
  6: [
    { name:'Huggy Wuggy',       sprite: sp(6,'huggy_wuggy')      },
    { name:'PJ Pugapillar',     sprite: sp(6,'pj_pugapillar')    },
    { name:'Mommy Long Legs',   sprite: sp(6,'mommy_long_legs'), hpMult:2.0 },
    { name:'Miss Delight',      sprite: sp(6,'miss_delight'),    hpMult:1.8 },
    { name:'Dog Day',           sprite: sp(6,'dog_day'),         hpMult:1.6 },
    { name:'CatNap',            sprite: sp(6,'catnap'),          hpMult:2.5 },
    { name:'The Doctor',        sprite: sp(6,'the_doctor'),      hpMult:2.0 },
    { name:'Doey',              sprite: sp(6,'doey'),            hpMult:2.2 },
    { name:'Lily Lovebraids',   sprite: sp(6,'lily_lovebraids'), hpMult:2.8 },
    { name:'The Prototype',     sprite: sp(6,'the_prototype'),   isBoss:true, hpMult:6 },
  ],
  // ── PALIER 7 : Black Clover ─────────────────────────────────────────────
  7: [
    { name:'Revchi Salik',   sprite: sp(7,'revchi')         },
    { name:'Mars',           sprite: sp(7,'mars')           },
    { name:'Rades Spirito',  sprite: sp(7,'rades'),         hpMult:1.6 },
    { name:'Vetto',          sprite: sp(7,'vetto'),         hpMult:2.0 },
    { name:'Ladros',         sprite: sp(7,'ladros'),        hpMult:1.8 },
    { name:'Patolli (Licht)',sprite: sp(7,'patolli'),       hpMult:2.5 },
    { name:'Vanica Zogratis',sprite: sp(7,'vanica'),        hpMult:2.2 },
    { name:'Zenon Zogratis', sprite: sp(7,'zenon'),         hpMult:2.8 },
    { name:'Zagred (Le Démon)',sprite:sp(7,'zagred'),       hpMult:3.5 },
    { name:'Dante Zogratis', sprite: sp(7,'dante'),         isBoss:true, hpMult:6.25 },
  ],
  // ── PALIER 8 : Brotato ──────────────────────────────────────────────────
  8: [
    { name:'Baby Alien',    sprite: sp(8,'baby_alien')     },
    { name:'Chaser',        sprite: sp(8,'chaser')         },
    { name:'Spitter',       sprite: sp(8,'spitter')        },
    { name:'Charger',       sprite: sp(8,'charger'),       hpMult:1.6 },
    { name:'Ogre',          sprite: sp(8,'ogre'),          hpMult:1.8 },
    { name:'Bruiser',       sprite: sp(8,'bruiser'),       hpMult:2.0 },
    { name:'Hornder Bruiser',sprite:sp(8,'hornder'),       hpMult:2.2 },
    { name:'Slasher',       sprite: sp(8,'slasher'),       hpMult:2.5 },
    { name:'Invoker',       sprite: sp(8,'invoker'),       hpMult:3.0 },
    { name:'Dead Whale',    sprite: sp(8,'dead_whale'),    isBoss:true, hpMult:6.5 },
  ],
  // ── PALIER 9 : Tensei Slime ─────────────────────────────────────────────
  9: [
    { name:'Gobelin',       sprite: sp(9,'gobelin')        },
    { name:'Loup Tempête',  sprite: sp(9,'loup_tempete')   },
    { name:'Orc',           sprite: sp(9,'orc'),           hpMult:1.5 },
    { name:'Ogre',          sprite: sp(9,'ogre'),          hpMult:1.8 },
    { name:'Geld',          sprite: sp(9,'geld'),          hpMult:2.0 },
    { name:'Gabiru',        sprite: sp(9,'gabiru')         },
    { name:'Charybde',      sprite: sp(9,'charybde'),      hpMult:2.2 },
    { name:'Hinata',        sprite: sp(9,'hinata'),        hpMult:2.5 },
    { name:'Clayman',       sprite: sp(9,'clayman'),       hpMult:3.0 },
    { name:'Yuki',          sprite: sp(9,'yuki'),          isBoss:true, hpMult:6.75 },
  ],
  // ── PALIER 10 : Minecraft Overworld ─────────────────────────────────────
  10: [
    { name:'Zombie',        sprite: sp(10,'zombie')        },
    { name:'Squelette',     sprite: sp(10,'squelette')     },
    { name:'Araignée',      sprite: sp(10,'araignee')      },
    { name:'Creeper',       sprite: sp(10,'creeper'),      hpMult:1.5 },
    { name:'Slime',         sprite: sp(10,'slime')         },
    { name:'Witch',         sprite: sp(10,'witch'),        hpMult:1.8 },
    { name:'Pillager',      sprite: sp(10,'pillager'),     hpMult:2.0 },
    { name:'Ravager',       sprite: sp(10,'ravager'),      hpMult:2.5 },
    { name:'Guardian',      sprite: sp(10,'guardian'),     hpMult:3.0 },
    { name:'Elder Guardian',sprite: sp(10,'elder_guardian'),isBoss:true, hpMult:6.75 },
  ],
  // ── PALIER 11 : Subnautica ───────────────────────────────────────────────
  11: [
    { name:'Peeper',              sprite: sp(11,'peeper')          },
    { name:'Gazopode',            sprite: sp(11,'gazopode')        },
    { name:'Rodeur',              sprite: sp(11,'rodeur')          },
    { name:'Anguille Tesla',      sprite: sp(11,'anguille_tesla'), hpMult:1.6 },
    { name:'Calmar Crabe',        sprite: sp(11,'calmar_crabe'),   hpMult:1.8 },
    { name:'Reefback Leviathan',  sprite: sp(11,'reefback'),       hpMult:2.5 },
    { name:'Reaper Leviathan',    sprite: sp(11,'reaper_lev'),     hpMult:3.0 },
    { name:'Ghost Leviathan',     sprite: sp(11,'ghost_lev'),      hpMult:4.0 },
    { name:'Sea Emperor Leviathan',sprite:sp(11,'sea_emperor'),    hpMult:5.0 },
    { name:'Sea Emperor Leviathan',sprite:sp(11,'sea_emperor'),    isBoss:true, hpMult:7 },
  ],
  // ── PALIER 12 : Bleach ──────────────────────────────────────────────────
  12: [
    { name:'Hollow',        sprite: sp(12,'hollow')        },
    { name:'Grand Fisher',  sprite: sp(12,'grand_fisher'), hpMult:1.5 },
    { name:'Ikkaku',        sprite: sp(12,'ikkaku')        },
    { name:'Renji',         sprite: sp(12,'renji'),        hpMult:1.8 },
    { name:'Kenpachi',      sprite: sp(12,'kenpachi'),     hpMult:2.5 },
    { name:'Byakuya',       sprite: sp(12,'byakuya'),      hpMult:2.8 },
    { name:'Grimmjow',      sprite: sp(12,'grimmjow'),     hpMult:3.0 },
    { name:'Ulquiorra',     sprite: sp(12,'ulquiorra'),    hpMult:3.5 },
    { name:'Aizen',         sprite: sp(12,'aizen'),        hpMult:4.5 },
    { name:'Yhwach',        sprite: sp(12,'yhwach'),       isBoss:true, hpMult:7 },
  ],
  // ── PALIER 13 : Fate ────────────────────────────────────────────────────
  13: [
    { name:'Enkidu',              sprite: sp(13,'enkidu')             },
    { name:'Héraclès (Strange/Fake)',sprite:sp(13,'heracles_sf')     },
    { name:'Mordred',             sprite: sp(13,'mordred'),           hpMult:1.8 },
    { name:'Karna',               sprite: sp(13,'karna'),             hpMult:2.0 },
    { name:'Cu Chulainn',         sprite: sp(13,'cu_chulainn'),       hpMult:1.8 },
    { name:'Héraclès (UBW)',      sprite: sp(13,'heracles_ubw'),      hpMult:2.5 },
    { name:'Emiya Shirou',        sprite: sp(13,'emiya'),             hpMult:2.0 },
    { name:'Achilles',            sprite: sp(13,'achilles'),          hpMult:2.8 },
    { name:'Richard Cœur de Lion',sprite: sp(13,'richard'),           hpMult:3.5 },
    { name:'Iskandar',            sprite: sp(13,'iskandar'),          isBoss:true, hpMult:7.25 },
  ],
  // ── PALIER 14 : Zelda — Twilight Princess ────────────────────────────────
  14: [
    { name:'Iria',              sprite: sp(14,'iria')             },
    { name:'Telma',             sprite: sp(14,'telma')            },
    { name:'Machaon',           sprite: sp(14,'machaon'),         hpMult:1.5 },
    { name:'Agent Du Crépuscule',    sprite: sp(14,'agent_crepuscule')         },
    { name:'Link Loup',         sprite: sp(14,'link_loup'),       hpMult:1.8 },
    { name:'Matornia (Maléfique)',sprite:sp(14,'matornia'),       hpMult:2.5 },
    { name:'Auguste & Magmar',  sprite: sp(14,'auguste')         },
    { name:'Gor Cobalt',        sprite: sp(14,'gor_cobalt'),      hpMult:2.2 },
    { name:'Roi Bulbin',        sprite: sp(14,'roi_bulbin'),      hpMult:3.0 },
    { name:'Ganondorf',         sprite: sp(14,'ganondorf'),       isBoss:true, hpMult:7.5 },
  ],
  // ── PALIER 15 : R.E.P.O ─────────────────────────────────────────────────
  15: [
    { name:'Gnome',             sprite: sp(15,'gnome')            },
    { name:'Bella',              sprite: sp(15,'bella')             },
    { name:'Rugrat',            sprite: sp(15,'rugrat')           },
    { name:'Reaper',            sprite:sp(15,'reaper'),hpMult:1.6 },
    { name:'Cleanup Crew',sprite:sp(15,'cleanup_crew'),        hpMult:1.8 },
    { name:'Headman',             sprite: sp(15,'headman'),           hpMult:2.0 },
    { name:'Clown',             sprite: sp(15,'clown'),           hpMult:2.2 },
    { name:'Dress',             sprite: sp(15,'dress'),           hpMult:2.5 },
    { name:'Huntsman',             sprite: sp(15,'Huntsman'),           hpMult:3.0 },
    { name:'Nonne',             sprite: sp(15,'nonne'),           isBoss:true, hpMult:7.75 },
  ],
  // ── PALIER 16 : Danganronpa ──────────────────────────────────────────────
  16: [
    { name:'Kirigiri',          sprite: sp(16,'kirigiri')         },
    { name:'Chiaki',            sprite: sp(16,'chiaki')           },
    { name:'Fuyuhiko',          sprite: sp(16,'fuyuhiko'),        hpMult:1.5 },
    { name:'Miu',               sprite: sp(16,'miu'),             hpMult:1.6 },
    { name:'Peko',          sprite: sp(16,'peko'),        hpMult:1.8 },
    { name:'Korekiyo',          sprite: sp(16,'korekiyo'),        hpMult:2.0 },
    { name:'Celeste',           sprite: sp(16,'celeste'),         hpMult:2.2 },
    { name:'Kiibo',             sprite: sp(16,'kiibo'),           hpMult:2.5 },
    { name:'Rantaro',           sprite: sp(16,'rantaro'),         hpMult:3.0 },
    { name:'Maki',              sprite: sp(16,'maki'),            isBoss:true, hpMult:8 },
  ],
  // ── PALIER 17 : Digital Circus ───────────────────────────────────────────
  17: [
    { name:'Ragatha',           sprite: sp(17,'ragatha')          },
    { name:'Gangle',            sprite: sp(17,'gangle')           },
    { name:'Zooble',            sprite: sp(17,'zooble'),          hpMult:1.5 },
    { name:'Crappy',            sprite: sp(17,'crappy')           },
    { name:'Abel',              sprite: sp(17,'abel'),            hpMult:1.8 },
    { name:'Pomni',             sprite: sp(17,'pomni'),           hpMult:2.0 },
    { name:'Jax',               sprite: sp(17,'jax'),             hpMult:2.5 },
    { name:'Kinger',            sprite: sp(17,'kinger'),          hpMult:2.2 },
    { name:'Bubble',            sprite: sp(17,'bubble'),          hpMult:3.0 },
    { name:'Caine',             sprite: sp(17,'caine'),           isBoss:true, hpMult:8.25 },
  ],
  // ── PALIER 18 : Sword Art Online ────────────────────────────────────────
  18: [
    { name:'Illfang',           sprite: sp(18,'illfang')          },
    { name:'The Gleam Eyes',    sprite: sp(18,'gleam_eyes'),      hpMult:1.6 },
    { name:'Kuradeel',          sprite: sp(18,'kuradeel')         },
    { name:'Rosalia',sprite:sp(18,'rosalia'),hpMult:4.5 },
    { name:'Death Gun',         sprite: sp(18,'death_gun'),       hpMult:2.0 },
    { name:'PoH',               sprite: sp(18,'poh'),             hpMult:2.2 },
    { name:'Chudelkin',         sprite: sp(18,'chudelkin'),       hpMult:1.8 },
    { name:'Quinella',          sprite: sp(18,'quinella'),        hpMult:3.0 },
    { name:'Dark God Vecta (Gabriel)',sprite:sp(18,'gabriel'),    hpMult:3.5 },
    { name:'Subtilizer (forme finale)',sprite:sp(18,'subtilizer'),isBoss:true, hpMult:8.25 },
  ],
  // ── PALIER 19 : Bungou Stray Dogs ────────────────────────────────────────
  19: [
    { name:'Naomie',            sprite: sp(19,'naomie')           },
    { name:"Jun'ichi",          sprite: sp(19,'junichi')          },
    { name:'Ranpo',             sprite: sp(19,'ranpo')            },
    { name:'Kunikida',             sprite: sp(19,'kunikida')            },
    { name:'Kenji',             sprite: sp(19,'kenji'),           hpMult:1.5 },
    { name:'Kyouka',            sprite: sp(19,'kyouka'),          hpMult:1.8 },
    { name:'Mori',              sprite: sp(19,'mori'),            hpMult:2.5 },
    { name:'Atsushi',           sprite: sp(19,'atsushi'),         hpMult:2.0 },
    { name:'Akutagawa',         sprite: sp(19,'akutagawa'),       hpMult:3.0 },
    { name:'Fyodor',            sprite: sp(19,'fyodor'),          isBoss:true, hpMult:8.5 },
  ],
  // ── PALIER 20 : Overwatch ────────────────────────────────────────────────
  20: [
    { name:'Sombra',            sprite: sp(20,'sombra')           },
    { name:'Widow',             sprite: sp(20,'widow'),           hpMult:1.5 },
    { name:'Sigma',             sprite: sp(20,'sigma'),           hpMult:1.8 },
    { name:'Emre',              sprite: sp(20,'emre')             },
    { name:'Domina',            sprite: sp(20,'domina'),          hpMult:1.8 },
    { name:'Moira',             sprite: sp(20,'moira'),           hpMult:2.0 },
    { name:'Mauga',             sprite: sp(20,'mauga'),           hpMult:2.5 },
    { name:'Reaper',            sprite: sp(20,'reaper'),          hpMult:3.0 },
    { name:'Doomfist',          sprite: sp(20,'doomfist'),        hpMult:4.0 },
    { name:'Vendetta',          sprite: sp(20,'vendetta'),        isBoss:true, hpMult:9 },
  ],
};

function getFallback(wave: number, palier: number): EnemyDef {
  return {
    name: wave === 10 ? `★ BOSS — Palier ${palier}` : `Ennemi Niv.${(palier-1)*10+wave}`,
    sprite: `sprites/enemies/palier${palier}/wave${wave}.png`,
    isBoss: wave === 10,
    hpMult: wave === 10 ? 7 : 1,
  };
}

export function generateEnemy(wave: number, palier: number): Enemy {
  const defs   = PALIER_ENEMIES[palier];
  const def    = defs ? defs[wave - 1] : getFallback(wave, palier);
  const isBoss = def.isBoss ?? (wave === 10);
  const hpMult = def.hpMult ?? 1;
  const global = (palier - 1) * 10 + wave;

  const baseHp = Math.floor(25 * Math.pow(1.18, global - 1));
  const maxHp  = Math.floor(baseHp * hpMult);

  const pixelCoins = isBoss
    ? Math.floor(72  * Math.pow(1.177, global - 1))
    : Math.floor(36  * Math.pow(1.156, global - 1));

  const gemsReward = isBoss ? Math.ceil(palier / 2) : (wave === 5 ? 1 : 0);

  return {
    id: `p${palier}_w${wave}`,
    name: isBoss ? `★ BOSS — ${def.name}` : def.name,
    wave, palier, maxHp, currentHp: maxHp,
    spritePath: `/${def.sprite}`,
    pixelCoinsReward: pixelCoins,
    gemsReward,
    isBoss,
  };
}
