# 🎮 Guide de Placement des Sprites — GACHA VERSE

## 📁 Structure des dossiers

```
public/
├── backgrounds/
│   ├── bg_palier_1.png     ← Background Palier 1 (Dragon Ball)
│   ├── bg_palier_2.png     ← Background Palier 2 (One Piece)
│   └── bg_palier_3.png     ← Background Palier 3 (Naruto)
│
└── sprites/
    ├── heroes/
    │   └── hero_main.png   ← Ton héros principal
    │
    ├── enemies/
    │   ├── palier1/        ← DRAGON BALL — Arc Saiyen
    │   │   ├── radditz.png
    │   │   ├── saibaman.png
    │   │   ├── nappa.png
    │   │   ├── vegeta.png
    │   │   └── vegeta_ozaru.png   ← BOSS
    │   │
    │   ├── palier2/        ← ONE PIECE — East Blue
    │   │   ├── alvida.png
    │   │   ├── morgan.png
    │   │   ├── buggy.png
    │   │   ├── kuro.png
    │   │   ├── don_krieg.png
    │   │   ├── mihawk.png
    │   │   ├── arlong.png
    │   │   └── smoker.png         ← BOSS
    │   │
    │   └── palier3/        ← NARUTO — Première Partie
    │       ├── mizuki.png
    │       ├── haku.png
    │       ├── zabuza.png
    │       ├── orochimaru.png
    │       ├── neji.png
    │       ├── gaara.png
    │       ├── temari.png
    │       ├── kabuto.png
    │       └── shukaku.png        ← BOSS
    │
    └── allies/             ← Personnages invocables (gacha)
        ├── neko_c1.png
        ├── neko_r1.png
        └── ... (voir lib/game/characters.ts)
```

## 🗺️ Correspondance vagues ↔ ennemis

### PALIER 1 — Dragon Ball (Arc Saiyen)
| Étage | Ennemi        | Fichier                          |
|-------|---------------|----------------------------------|
| 1     | Raditz        | palier1/radditz.png              |
| 2     | Saibaman      | palier1/saibaman.png             |
| 3     | Saibaman      | palier1/saibaman.png             |
| 4     | Saibaman      | palier1/saibaman.png             |
| 5     | Nappa         | palier1/nappa.png (HP ×2.5)      |
| 6     | Saibaman      | palier1/saibaman.png             |
| 7     | Végéta        | palier1/vegeta.png (HP ×1.8)     |
| 8     | Saibaman      | palier1/saibaman.png             |
| 9     | Végéta        | palier1/vegeta.png (HP ×2.0)     |
| BOSS  | Végéta Ōzaru  | palier1/vegeta_ozaru.png (HP ×6) |

### PALIER 2 — One Piece (East Blue)
| Étage | Ennemi          | Fichier                            |
|-------|-----------------|------------------------------------|
| 1     | Alvida          | palier2/alvida.png                 |
| 2     | Capitaine Morgan| palier2/morgan.png (HP ×1.4)       |
| 3     | Baggy le Clown  | palier2/buggy.png (HP ×1.6)        |
| 4     | Capitaine Kuro  | palier2/kuro.png (HP ×1.8)         |
| 5     | Don Krieg       | palier2/don_krieg.png (HP ×2.2)    |
| 6     | Mihawk          | palier2/mihawk.png (HP ×3.0)       |
| 7     | Arlong          | palier2/arlong.png (HP ×2.5)       |
| 8     | Baggy le Clown  | palier2/buggy.png (HP ×1.5)        |
| 9     | Baggy le Clown  | palier2/buggy.png (HP ×1.5)        |
| BOSS  | Smoker          | palier2/smoker.png (HP ×6)         |

### PALIER 3 — Naruto (Première Partie)
| Étage | Ennemi       | Fichier                               |
|-------|--------------|---------------------------------------|
| 1     | Mizuki       | palier3/mizuki.png                    |
| 2     | Haku         | palier3/haku.png (HP ×1.6)            |
| 3     | Zabuza       | palier3/zabuza.png (HP ×2.0)          |
| 4     | Orochimaru   | palier3/orochimaru.png (HP ×2.5)      |
| 5     | Neji Hyūga   | palier3/neji.png (HP ×1.8)            |
| 6     | Gaara        | palier3/gaara.png (HP ×2.8)           |
| 7     | Temari       | palier3/temari.png (HP ×1.6)          |
| 8     | Kabuto       | palier3/kabuto.png (HP ×2.0)          |
| 9     | Orochimaru   | palier3/orochimaru.png (HP ×3.5)      |
| BOSS  | Shukaku      | palier3/shukaku.png (HP ×7)           |

## 🖼️ Specs des sprites
- Format : **PNG** avec fond transparent
- Taille recommandée : **128×128** ou **256×256** px
- Orientation : face au joueur (regardant vers la gauche)
- Les bosses sont affichés en **172px**, les ennemis normaux en **130px**
- `imageRendering: pixelated` est activé automatiquement

## 🎨 Backgrounds
- Format : **PNG** ou **WebP**
- Taille recommandée : **1280×720** ou **1920×1080**
- Si absent → gradient CSS de fallback affiché automatiquement
