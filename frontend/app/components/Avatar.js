'use client';

export default function Avatar({ src, username, size = 32 }) {
  if (src) {
    return (
      <img
        src={src}
        alt={username || 'User avatar'}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size, minWidth: size }}
      />
    );
  }

  const colors = [
    '#FF4500', '#0079D3', '#46D160', '#FFB000',
    '#FF585B', '#7193FF', '#00A6A5', '#EA0027',
    '#CC3600', '#0045AC', '#349E48', '#CC8F00',
  ];
  const charCode = (username || 'U').charCodeAt(0);
  const color = colors[charCode % colors.length];
  const initial = (username || 'U')[0].toUpperCase();

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        minWidth: size,
        backgroundColor: color,
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </div>
  );
}
