/**
 * Logo corporativo Seguros Bolívar + marca VÍNCULO
 *
 * El logo PNG es horizontal con fondo transparente y texto verde oscuro.
 * En fondos oscuros se aplica `brightness(0) invert(1)` para volverlo blanco.
 */

const LOGO_URL =
  'https://teasesoramos.com/wp-content/uploads/2025/09/Logo-Seguros-Bolivar.png';

interface BolivarLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show "VÍNCULO" product name */
  showName?: boolean;
  /** 'light' = white logo for dark backgrounds, 'dark' = original green */
  variant?: 'light' | 'dark';
}

const SIZES = {
  sm: { h: 22, name: '12px', gap: '8px', divider: '14px' },
  md: { h: 28, name: '14px', gap: '10px', divider: '18px' },
  lg: { h: 34, name: '17px', gap: '12px', divider: '22px' },
  xl: { h: 44, name: '21px', gap: '14px', divider: '28px' },
};

export default function BolivarLogo({
  size = 'md',
  showName = true,
  variant = 'dark',
}: BolivarLogoProps) {
  const s = SIZES[size];
  const isLight = variant === 'light';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: s.gap }}>
      {/* Logo corporativo */}
      <img
        src={LOGO_URL}
        alt="Seguros Bolívar"
        height={s.h}
        style={{
          objectFit: 'contain',
          flexShrink: 0,
          filter: isLight ? 'brightness(0) invert(1)' : 'none',
        }}
      />

      {/* Divider + VÍNCULO */}
      {showName && (
        <>
          <div
            style={{
              width: '1px',
              height: s.divider,
              background: isLight
                ? 'rgba(255,255,255,0.3)'
                : 'var(--sb-ui-color-grayscale-L200, #e1e1e1)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontWeight: 700,
              fontSize: s.name,
              letterSpacing: '0.5px',
              color: isLight
                ? '#fff'
                : 'var(--sb-ui-color-primary-D200, #026B41)',
            }}
          >
            VÍNCULO
          </span>
        </>
      )}
    </div>
  );
}

export { LOGO_URL };
