import { CharacterTemplate, EvoForm } from '@/types/game';

// ── Stub héros (conservé pour compatibilité gameStore — Kael supprimé) ────
export const HERO_TEMPLATE: CharacterTemplate = {
  id: 'hero_main', name: 'Héros', rarity: 'L', baseDps: 1,
  spritePath: '/sprites/heroes/hero_main.png',
  description: 'Héros principal.', isHero: true, universe: 'Gacha Verse',
  forms: [
    { formId:'hero_base', name:'Héros', spritePath:'/sprites/heroes/hero_main.png', levelCap:100, dpsFormMult:1, description:'Forme de base.' },
  ] as EvoForm[],
};

// ── Helpers ────────────────────────────────────────────────────────────────
function c(id: string, name: string, rarity: CharacterTemplate['rarity'], baseDps: number, universe: string): CharacterTemplate {
  return { id, name, rarity, baseDps, universe, description: name, spritePath: `/sprites/allies/${id}.png` };
}
function ce(id: string, name: string, rarity: CharacterTemplate['rarity'], baseDps: number, universe: string, forms: EvoForm[]): CharacterTemplate {
  return { id, name, rarity, baseDps, universe, description: name, spritePath: `/sprites/allies/${id}.png`, forms };
}
function f(formId: string, name: string, id: string, levelCap: number, mult: number, requiredItemId?: string): EvoForm {
  const tag = formId.replace(`${id}_`, '');
  const sprite = tag === 'base' ? `/sprites/allies/${id}.png` : `/sprites/allies/${id}_${tag}.png`;
  return { formId, name, spritePath: sprite, levelCap, dpsFormMult: mult, description: name, requiredItemId };
}

// ══════════════════════════════════════════════════════════════════════════
export const CHARACTER_POOL: CharacterTemplate[] = [

  // ── COMMUNS ─────────────────────────────────────────────────────────────
  c('canarticho',  'Canarticho',      'C',  5,  'Pokémon'),
  c('cyborg',      'Cyborg',          'C',  6,  'Brotato'),
  c('slime',       'Slime',           'C',  5,  'Minecraft'),
  c('axolotl',     'Axolotl',         'C',  4,  'Minecraft'),
  c('garry_fish',  'Garry Fish',      'C',  5,  'Digital Circus'),
  c('birthday_boy','Birthday Boy',    'C',  4,  'R.E.P.O'),
  c('gummigoo',    'Gummigoo',        'C',  5,  'Digital Circus'),
  c('yamcha',      'Yamcha',          'C',  5,  'Dragon Ball Z'),
  c('korogu',      'Korogu Zelda',    'C',  4,  'The Legend of Zelda'),
  c('bangers',     'Bangers',         'C',  5,  'R.E.P.O'),
  c('bubba',       'Bubba Bubbaphant','C',  5,  'Poppy Playtime'),
  c('tentacool',   'Tentacool',       'C',  4,  'Pokémon'),
  c('chenipan',    'Chenipan',        'C',  3,  'Pokémon'),
  c('mr_popo',     'Mr Popo',         'C',  5,  'Dragon Ball Z'),

  // ── UNCOMMUNS ────────────────────────────────────────────────────────────
  c('prince_lars', 'Prince Lars',     'U', 13,  'The Legend of Zelda'),
  c('eugeo',       'Eugeo',           'U', 14,  'Sword Art Online'),
  c('angie',       'Angie',           'U', 13,  'Danganronpa'),
  c('gobuta',      'Gobuta',          'U', 15,  'Tensei Slime'),
  c('vogue_merry', 'Vogue Merry',     'U', 12,  'One Piece'),

  // ── RARES ────────────────────────────────────────────────────────────────
  ce('salamèche', 'Salamèche', 'R', 25, 'Pokémon', [
    f('salamèche_base', 'Salamèche',  'salamèche', 100, 1),
    f('salamèche_evo1', 'Reptincel',  'salamèche', 200, 3),
    f('salamèche_evo2', 'Dracaufeu',  'salamèche', 300, 8),
  ]),
  ce('carapuce', 'Carapuce', 'R', 24, 'Pokémon', [
    f('carapuce_base', 'Carapuce',  'carapuce', 100, 1),
    f('carapuce_evo1', 'Carabaffe', 'carapuce', 200, 3),
    f('carapuce_evo2', 'Tortank',   'carapuce', 300, 8),
  ]),
  ce('bulbizarre', 'Bulbizarre', 'R', 24, 'Pokémon', [
    f('bulbizarre_base', 'Bulbizarre', 'bulbizarre', 100, 1),
    f('bulbizarre_evo1', 'Herbizarre', 'bulbizarre', 200, 3),
    f('bulbizarre_evo2', 'Florizarre', 'bulbizarre', 300, 8),
  ]),
  c('kissy_missy', 'Kissy Missy',     'R', 20,  'Poppy Playtime'),
  ce('yuno', 'Yuno', 'R', 22, 'Black Clover', [
    f('yuno_base', 'Yuno',                  'yuno', 100, 1),
    f('yuno_evo1', 'Yuno — Esprit du Vent', 'yuno', 200, 4),
  ]),
  c('the_dress',   'The Dress',       'R', 21,  'R.E.P.O'),
  c('kirito',      'Kirito',          'R', 23,  'Sword Art Online'),

  // ── ÉPIQUES ─────────────────────────────────────────────────────────────
  c('arsene',           'Arsène',           'E',  70, 'Persona 5'),
  c('huggy_wuggy',      'Huggy Wuggy',      'E',  75, 'Poppy Playtime'),
  c('diablo',           'Diablo',           'E',  72, 'Tensei Slime'),
  c('reaper_leviathan', 'Reaper Leviathan', 'E',  85, 'Subnautica'),
  c('reinhardt',        'Reinhardt',        'E',  80, 'Overwatch'),

  // ── LÉGENDAIRES ──────────────────────────────────────────────────────────
  ce('sanji', 'Sanji', 'L', 210, 'One Piece', [
    f('sanji_base', 'Sanji',            'sanji', 100, 1),
    f('sanji_evo1', 'Sanji — Raid Suit','sanji', 200, 5),
  ]),
  ce('asta', 'Asta', 'L', 200, 'Black Clover', [
    f('asta_base', 'Asta',              'asta', 100, 1),
    f('asta_evo1', 'Asta — Démon Noir', 'asta', 200, 5),
  ]),
  c('taureau',     'Taureau',          'L', 195, 'R.E.P.O'),
  ce('kioraku', 'Kyoraku', 'L', 210, 'Bleach', [
    f('kioraku_base', 'Kyoraku',          'kioraku', 100, 1),
    f('kioraku_evo1', 'Kyoraku — Bankai', 'kioraku', 200, 5),
  ]),
  c('arthur_pandragon', 'Arthur Pandragon', 'L', 200, 'Fate'),
  ce('arthur_leywin', 'Arthur Leywin', 'P', 600000, 'Tbate', [
    f('arthur_leywin_base', 'Arthur Leywin',           'arthur_leywin', 100, 1),
    f('arthur_leywin_evo1', 'Arthur Leywin — Lame d’Éther', 'arthur_leywin', 200, 100,  'cristal_ether'),
    f('arthur_leywin_evo2', 'Arthur Leywin — Épée de l’Aube', 'arthur_leywin', 300, 112, 'epee_ether'),
    f('arthur_leywin_evo3', 'Arthur Leywin — Roi du Soleil',  'arthur_leywin', 400, 550, 'sylvia'),
  ]),
  ce('nagito_komaeda', 'Nagito Komaeda', 'L', 205, 'Danganronpa', [
    f('nagito_komaeda_base', 'Nagito Komaeda',         'nagito_komaeda', 100, 1),
    f('nagito_komaeda_evo1', 'Nagito — Espoir Ultime', 'nagito_komaeda', 200, 4.5),
  ]),
  c('chuuya',      'Chuuya',           'L', 215, 'Bungou Stray Dogs'),

  // ── MYTHIQUES ────────────────────────────────────────────────────────────
  ce('ren_m', 'Ren', 'M', 550, 'Persona 5', [
    f('ren_m_base', 'Ren',   'ren_m', 100, 1),
    f('ren_m_evo1', 'Joker', 'ren_m', 200, 6),
  ]),
  ce('ichigo', 'Ichigo', 'M', 580, 'Bleach', [
    f('ichigo_base', 'Ichigo',          'ichigo', 100, 1),
    f('ichigo_evo1', 'Ichigo — Bankai', 'ichigo', 200, 4.5),
    f('ichigo_evo2', 'Ichigo — Vasto',  'ichigo', 300, 14),
  ]),
  c('ouma',  'Kokichi Ouma', 'M', 1010, 'Danganronpa'),
  c('jax',   'Jax',          'M', 570, 'Digital Circus'),
  c('dazai', 'Dazai',        'M', 570, 'Bungou Stray Dogs'),

  // ── STELLAIRES ───────────────────────────────────────────────────────────
  ce('naruto', 'Naruto', 'S', 1200, 'Naruto', [
    f('naruto_base', 'Naruto',                 'naruto', 100, 1),
    f('naruto_evo1', 'Naruto — Mode Sage',     'naruto', 200, 5),
    f('naruto_evo2', 'Naruto — Chakra Kyuubi', 'naruto', 300, 18),
    f('naruto_evo3', 'Naruto — Mode Baryon',   'naruto', 400, 60),
  ]),
  ce('luffy', 'Luffy', 'S', 1200, 'One Piece', [
    f('luffy_base', 'Luffy',          'luffy', 100, 1),
    f('luffy_evo1', 'Luffy — Gear 2', 'luffy', 200, 5),
    f('luffy_evo2', 'Luffy — Gear 4', 'luffy', 300, 18),
    f('luffy_evo3', 'Luffy — Gear 5', 'luffy', 400, 60),
  ]),

  // ── COSMIQUES ────────────────────────────────────────────────────────────
  ce('vegeta', 'Végéta', 'CO', 2500, 'Dragon Ball Z', [
    f('vegeta_base', 'Végéta',            'vegeta', 100, 1),
    f('vegeta_evo1', 'Végéta SS',         'vegeta', 200, 8),
    f('vegeta_evo2', 'Végéta SS Divin',   'vegeta', 300, 26),
    f('vegeta_evo3', 'Végéta SS Blue',    'vegeta', 400, 90),
  ]),
  ce('minato', 'Minato', 'CO', 1900, 'Naruto', [
    f('minato_base', 'Minato',              'minato', 100, 1),
    f('minato_evo1', 'Minato — 4ème Hokage','minato', 200, 6.5),
  ]),
  ce('gilgamesh', 'Gilgamesh', 'CO', 2050, 'Fate', [
    f('gilgamesh_base', 'Gilgamesh',               'gilgamesh', 100, 1),
    f('gilgamesh_evo1', 'Gilgamesh — Roi des Héros','gilgamesh', 200, 9.5),
  ]),
  c('link_midona','Link & Midona',    'CO', 1800, 'The Legend of Zelda'),
  ce('jinwoo', 'Sung Jin Woo', 'CO', 2375, 'Solo Leveling', [
    f('jinwoo_base', 'Sung Jin Woo',                     'jinwoo', 100, 1),
    f('jinwoo_evo1', 'Sung Jin Woo — Monarque Éveillé',  'jinwoo', 200, 7,  'elixir_vie'),
    f('jinwoo_evo2', 'Sung Jin Woo — Seigneur des Ombres','jinwoo', 300, 16, 'manteau_ombre'),
    f('jinwoo_evo3', 'Sung Jin Woo — Monarque des Ombres','jinwoo', 400, 50, 'beru'),
  ]),

  // ── PRIMORDIAUX ──────────────────────────────────────────────────────────
  ce('goku', 'Goku', 'P', 5000, 'Dragon Ball Z', [
    f('goku_base', 'Goku',                'goku', 100,  1),
    f('goku_evo1', 'Goku Super Saiyen',   'goku', 200,  7),
    f('goku_evo2', 'Goku Super Saiyen 3', 'goku', 300,  38),
    f('goku_evo3', 'Goku SS Divin',       'goku', 400,  60),
    f('goku_evo4', 'Goku SS Blue',        'goku', 500,  100),
    f('goku_evo5', 'Goku Signe UI',       'goku', 600,  170),
    f('goku_evo6', 'Goku Ultra Instinct', 'goku', 700,  400),
  ]),
  ce('limule', 'Limule', 'P', 4500, 'Tensei Slime', [
    f('limule_base', 'Limule',            'limule', 100,  1),
    f('limule_evo1', 'Limule Évoluée',    'limule', 200,  7),
    f('limule_evo2', 'Limule Ancestrale', 'limule', 300, 65),
    f('limule_evo3', 'Limule Divine',     'limule', 400, 180),
  ]),

  // ── TRANSCENDANT ─────────────────────────────────────────────────────────
  ce('nekoz', 'NekoZ', 'T', 12500, 'Chill&Cool', [
    f('nekoz_base', 'NekoZ',             'nekoz', 100, 1),
    f('nekoz_evo1', 'NekoZ — Mode Divin','nekoz', 200, 11),
  ]),
];

export const getCharacterById = (id: string): CharacterTemplate | undefined =>
  id === 'hero_main' ? HERO_TEMPLATE : CHARACTER_POOL.find(ch => ch.id === id);

// Personnages exclusifs aux récompenses d'événement — jamais disponibles sur
// la bannière gacha normale (ni dans le tirage, ni dans la liste affichée).
export const EVENT_EXCLUSIVE_IDS = ['jinwoo', 'arthur_leywin'];

// Pool effectivement tirable/affichable sur la bannière standard
export const BANNER_POOL: CharacterTemplate[] = CHARACTER_POOL.filter(c => !EVENT_EXCLUSIVE_IDS.includes(c.id));

export function getCharSprite(tpl: CharacterTemplate, currentForm: number): string {
  if (tpl.forms && tpl.forms.length > 0)
    return tpl.forms[Math.min(currentForm, tpl.forms.length - 1)]?.spritePath ?? tpl.spritePath;
  return tpl.spritePath;
}

export function getCharFormName(tpl: CharacterTemplate, currentForm: number): string {
  if (tpl.forms && tpl.forms.length > 0)
    return tpl.forms[Math.min(currentForm, tpl.forms.length - 1)]?.name ?? tpl.name;
  return tpl.name;
}
