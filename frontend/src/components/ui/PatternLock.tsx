import React from 'react';

interface PatternLockProps {
    value: string;
    onChange: (v: string) => void;
}

export const PatternLock: React.FC<PatternLockProps> = ({ value, onChange }) => {
    const path = value ? value.split('').map(Number) : [];
    const getPos = (n: number) => ({ x: 15 + ((n - 1) % 3) * 45, y: 15 + Math.floor((n - 1) / 3) * 45 });
    return (
        <div style={{ width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{ width: '120px', height: '120px', position: 'relative' }}>
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    {path.map((dot, i) => {
                        if (i === 0) return null;
                        const p1 = getPos(path[i - 1]);
                        const p2 = getPos(dot);
                        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#6366f1" strokeWidth="3" strokeLinecap="round" opacity={0.6} />;
                    })}
                </svg>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(dot => {
                    const isActive = path.includes(dot);
                    const isLast = path[path.length - 1] === dot;
                    const pos = getPos(dot);
                    return (
                        <div key={dot}
                            onClick={() => {
                                if (isActive && isLast) onChange(path.slice(0, -1).join(''));
                                else if (!isActive) onChange([...path, dot].join(''));
                                else onChange([dot].join(''));
                            }}
                            style={{
                                position: 'absolute', top: pos.y - 15, left: pos.x - 15, width: '30px', height: '30px', borderRadius: '50%',
                                background: isActive ? '#6366f1' : 'rgba(255,255,255,0.05)',
                                border: isActive ? 'none' : '2px solid rgba(255,255,255,0.15)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s', zIndex: 2
                            }}
                        >
                            {isActive && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                        </div>
                    );
                })}
            </div>
            <button type="button" onClick={() => onChange('')} style={{ marginTop: '12px', fontSize: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', padding: '5px 12px', borderRadius: '12px', cursor: 'pointer' }}>
                Limpar
            </button>
        </div>
    );
};
