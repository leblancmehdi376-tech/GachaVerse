'use client';
import { Rarity, RARITY_CONFIG } from '@/types/game';
import { useFallbackImage, buildImageCandidates } from '@/lib/image-fallback';

interface Props {
  templateId: string;
  formIndex?: number;
  name: string;
  rarity: Rarity;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

// Carte de personnage (/sprites/cards/[id].*) avec repli en cascade :
// carte de la forme évoluée -> carte de base -> pastille de couleur avec initiales.
// À chaque étape, plusieurs extensions sont essayées (.png/.webp/.jpg/.jpeg) au cas
// où un fichier aurait été renommé sans être réellement converti.
export function CharacterCardThumb({ templateId, formIndex = 0, name, rarity, width = 64, height = 88, style }: Props) {
  const cfg = RARITY_CONFIG[rarity];

  const formCandidates = formIndex > 0 ? buildImageCandidates(`/sprites/cards/${templateId}_evo${formIndex}`) : [];
  const baseCandidates  = buildImageCandidates(`/sprites/cards/${templateId}`);
  const candidates = [...formCandidates, ...baseCandidates];

  const { src, failed, onError } = useFallbackImage(candidates);

  if (failed || !src) {
    return (
      <div style={{
        width, height, borderRadius:8, flexShrink:0,
        background:`radial-gradient(circle at 35% 35%, ${cfg.color}33, ${cfg.color}0a)`,
        border:`2px solid ${cfg.color}55`,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:`0 0 16px ${cfg.glow}33, inset 0 0 12px ${cfg.color}11`,
        ...style,
      }}>
        <span style={{ fontFamily:'var(--f-ui)', fontWeight:900, fontSize:Math.round(width*0.32), color:cfg.color, lineHeight:1 }}>
          {name.slice(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src} alt={name} width={width} height={height}
      style={{
        borderRadius:8, objectFit:'cover', display:'block', flexShrink:0,
        border:`2px solid ${cfg.color}66`, boxShadow:`0 0 12px ${cfg.glow}33`,
        ...style,
      }}
      onError={onError}
    />
  );
}
