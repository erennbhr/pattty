import React, { useState, useEffect, useRef } from 'react';
import { adjustColor } from '../utils/helpers';

const InteractiveSleepingPet = ({ type, color, className, fullSize = false }) => {
  const [petState, setPetState] = useState('sleeping');
  const [clipId] = useState(`clip-${Math.random().toString(36).substr(2,9)}`);
  const timeoutRef = useRef(null);

  const baseColor = color && color.startsWith('#') ? color : '#e5e7eb';
  // adjustColor helper fonksiyonundan geliyor
  const shadowColor = adjustColor(baseColor, -40); 
  const darkerColor = adjustColor(baseColor, -60);
  
  // Arka plan rengine göre çizgi rengini belirleme (Kontrast)
  const contrastStroke = parseInt(baseColor.replace('#', ''), 16) > 0xffffff / 2 ? '#374151' : '#f3f4f6';

  const handleClick = (e) => {
    if(e) e.stopPropagation(); 
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Tıklayınca durum değiştirme: uyuyor -> uyanık -> kızgın
    const nextState = petState === 'sleeping' ? 'awake' : petState === 'awake' ? 'angry' : 'sleeping';
    setPetState(nextState);

    if(nextState !== 'sleeping') {
        timeoutRef.current = setTimeout(() => {
            setPetState(nextState === 'awake' ? 'angry' : 'sleeping');
            if(nextState === 'awake') setTimeout(() => setPetState('sleeping'), 2000);
        }, 2000);
    }
  };

  useEffect(() => { 
      return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); } 
  }, []);

  const animationStyles = `
    @keyframes float-zzz { 
        0% { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; } 
        20% { opacity: 0.7; } 
        100% { transform: translateY(-20px) translateX(5px) scale(1.1); opacity: 0; } 
    }
    .animate-float-zzz { animation: float-zzz 2.5s linear infinite; transform-box: fill-box; transform-origin: center; }
    
    @keyframes breathing { 
        0%, 100% { transform: scale(1); } 
        50% { transform: scale(1.03); } 
    }
    .animate-breathing { animation: breathing 3s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }

    @keyframes tail-wag { 
        0%, 100% { transform: rotate(0deg); } 
        25% { transform: rotate(5deg); } 
        75% { transform: rotate(-5deg); } 
    }
    .animate-tail-wag { animation: tail-wag 2s ease-in-out infinite; transform-box: fill-box; transform-origin: left center; }
  `;

  const renderZzz = (xOffset = 0, yOffset = 0) => (
    <g className="opacity-80">
      <text x={75 + xOffset} y={30 + yOffset} fontSize="14" fill={contrastStroke} className="animate-float-zzz opacity-0" style={{ animationDelay: '0s', fontFamily: '"Comic Sans MS", "Chalkboard SE", "marker felt", sans-serif', fontWeight: 'bold' }}>Z</text>
      <text x={85 + xOffset} y={20 + yOffset} fontSize="10" fill={contrastStroke} className="animate-float-zzz opacity-0" style={{ animationDelay: '1s', fontFamily: '"Comic Sans MS", "Chalkboard SE", "marker felt", sans-serif', fontWeight: 'bold' }}>z</text>
    </g>
  );

  const renderGenericFace = (lx, rx, y) => {
      const leftEyeX = lx;
      const rightEyeX = rx; 
      const eyeY = y;
      
      const DetailedEye = ({ cx, cy, move = false }) => (
          <g>
            <circle cx={cx} cy={cy} r="7.5" fill="white" stroke="#e5e7eb" strokeWidth="0.5" />
            <g className={move ? "animate-look-around" : ""}>
                <circle cx={cx} cy={cy} r="3.75" fill="#1f2937" />
                <circle cx={cx - 2.25} cy={cy - 2.25} r="1.5" fill="white" opacity="0.8" />
            </g>
          </g>
      );

      if (petState === 'awake') {
          return (
            <g className="animate-in fade-in duration-200">
                <DetailedEye cx={leftEyeX} cy={eyeY} move={true} />
                <DetailedEye cx={rightEyeX} cy={eyeY} move={true} />
            </g>
          );
      } else if (petState === 'angry') {
          return (
            <g className="animate-in fade-in duration-200">
               <defs>
                   <clipPath id={`${clipId}-left`}><path d={`M${leftEyeX-7},${eyeY-5} L${leftEyeX+7},${eyeY-2} L${leftEyeX+7},${eyeY+7} L${leftEyeX-7},${eyeY+7} Z`} /></clipPath>
                   <clipPath id={`${clipId}-right`}><path d={`M${rightEyeX-7},${eyeY-2} L${rightEyeX+7},${eyeY-5} L${rightEyeX+7},${eyeY+7} L${rightEyeX-7},${eyeY+7} Z`} /></clipPath>
               </defs>
                <g clipPath={`url(#${clipId}-left)`}><DetailedEye cx={leftEyeX} cy={eyeY} move={false} /></g>
                <path d={`M${leftEyeX-6},${eyeY-5} L${leftEyeX+6},${eyeY-2}`} stroke={contrastStroke} strokeWidth="1.5" strokeLinecap="round" /> 
                <g clipPath={`url(#${clipId}-right)`}><DetailedEye cx={rightEyeX} cy={eyeY} move={false} /></g>
                <path d={`M${rightEyeX+6},${eyeY-5} L${rightEyeX-6},${eyeY-2}`} stroke={contrastStroke} strokeWidth="1.5" strokeLinecap="round" /> 
            </g>
          );
      } else {
          return (
            <g>
                <path d={`M${lx-5},${y} Q${lx},${y+4} ${lx+5},${y}`} stroke={contrastStroke} strokeWidth="2" fill="none" strokeLinecap="round"/>
                <path d={`M${rx-5},${y} Q${rx},${y+4} ${rx+5},${y}`} stroke={contrastStroke} strokeWidth="2" fill="none" strokeLinecap="round"/>
                {renderZzz(0, -10)}
            </g>
          );
      }
  }

  const renderContent = () => {
    const gradId = `grad-${type}-${baseColor.replace('#', '')}-${Math.random().toString(36).substr(2, 5)}`;
    const earGradId = `ear-${gradId}`;
    
    const commonDefs = (
        <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: baseColor, stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: shadowColor, stopOpacity: 1 }} />
            </linearGradient>
            <radialGradient id={earGradId} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{stopColor: '#ffb6c1', stopOpacity: 0.8}} />
                <stop offset="100%" style={{stopColor: baseColor, stopOpacity: 1}} />
            </radialGradient>
        </defs>
    );

    const shadow = <ellipse cx="50" cy="90" rx="40" ry="8" fill="#000" opacity="0.1" className="animate-breathing-shadow" />;

    // === KEDİ (CAT) ===
    if (type === 'cat') return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio={fullSize ? 'xMidYMid slice' : 'xMidYMid meet'}>
            {commonDefs}{shadow}
            <g transform="translate(15, 15) scale(0.7)">
                <path className="animate-tail-wag" d="M30.93,97.46c-1.43,0-2.87-.15-4.29-.45-4.49-.95-8.24-3.31-10.58-6.65-1.82-2.61-2.8-5.8-2.89-9.48-.07-2.78.54-4.57,1.03-6,.37-1.07.63-1.84.69-3.2.04-.92.16-3.72-1.35-6.07-1.84-2.87-5.26-3.76-6.65-4.01-2.36-.42-3.92-2.68-3.5-5.03.42-2.36,2.68-3.92,5.03-3.5,2.5.45,8.73,2.12,12.41,7.86,1.98,3.09,2.89,6.83,2.71,11.11-.11,2.61-.69,4.29-1.15,5.63-.39,1.13-.6,1.75-.57,2.97.05,1.95.5,3.54,1.33,4.73,2.25,3.22,8.06,4.4,12.18,2.46,1.33-.62,2.5-1.58,3.48-2.86,1.46-1.89,4.18-2.24,6.08-.78,1.89,1.46,2.24,4.18.78,6.08-1.84,2.38-4.08,4.2-6.67,5.41-2.48,1.16-5.26,1.76-8.09,1.76Z" fill={`url(#${gradId})`} style={{ transformOrigin: "71px 60px", transformBox: "view-box" }} />
                <path d="M20.35,30.63c-1.23-3.55-2.68-9.13-2.51-16.04.13-5.53,1.25-10.08,2.31-13.28,2.63,1.09,5.89,2.72,9.32,5.15,3.33,2.36,5.88,4.81,7.76,6.87-5.62,5.76-11.25,11.52-16.87,17.28Z" fill={`url(#${gradId})`} />
                <path d="M79.57,30.63c1.23-3.55,2.68-9.13,2.51-16.04-.13-5.53-1.25-10.08-2.31-13.28-2.63,1.09-5.89,2.72-9.32,5.15-3.33,2.36-5.88,4.81-7.76,6.87,5.62,5.76,11.25,11.52,16.87,17.28Z" fill={`url(#${gradId})`} />
                <path className="animate-breathing" d="M71.75,68.43c-1.49-6.64-4.1-11.83-6.33-15.42h-30.89c-2.23,3.59-4.84,8.79-6.33,15.42-3.01,13.4.38,24.54,2.26,29.52h39.01c1.88-4.98,5.27-16.12,2.26-29.52Z" fill={`url(#${gradId})`} />
                <path d="M37.67,92.76c1.04-4.97-.05-10.75-3.91-14.11-4.53-3.98-11.24-2.24-13.24,3.45-1.39,3.71-.45,8.16,1.88,11.38,1.59,2.3,4.06,4.48,6.74,4.99,4.12.8,7.6-1.53,8.52-5.68v-.03Z" fill={darkerColor} />
                <path d="M62.33,92.82 c-1.04-4.97 .05-10.75 3.91-14.11 4.53-3.98 11.24-2.24 13.24,3.45 1.39,3.71 .45,8.16 -1.88,11.38 -1.59,2.3 -4.06,4.48 -6.74,4.99 -4.12.8 -7.6-1.53 -8.52-5.68 v-.03 Z" fill={darkerColor} />
                <path d="M38,98 c-2,-1 -3.5,-3 -3,-5 c0.5,-2 3,-3 5,-2 c2,0.5 3.5,2.5 3,4.5 c-0.5,2 -3,3.5 -5,2.5 z" fill={baseColor} />
                <path d="M62,98 c2,-1 3.5,-3 3,-5 c-0.5,-2 -3,-3 -5,-2 c-2,0.5 -3.5,2.5 -3,4.5 c0.5,2 3,3.5 5,2.5 z" fill={baseColor} />
                <path className="animate-breathing" style={{animationDuration: '4s'}} d="M88.03,46.05c-1.26,1.1-3.98,3.38-8,5.8-6.7,4.04-16.99,8.46-30.07,8.45-13.11,0-23.4-4.47-30.09-8.51-3.96-2.4-6.65-4.65-7.9-5.74h6.45c-.25-1.61-.38-3.26-.38-4.94,0-17.63,14.29-31.92,31.92-31.92s31.92,14.29,31.92,31.92c0,1.68-.13,3.33-.38,4.94h6.53Z" fill={`url(#${gradId})`} />
                <polygon points="46.59 43.64 53.93 43.64 50.26 49.32 46.59 43.64" fill="#161616"/>
                {renderGenericFace(40, 60, 38)}
            </g>
        </svg>
    );

    // === KÖPEK (DOG) ===
    if (type === 'dog') return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio={fullSize ? 'xMidYMid slice' : 'xMidYMid meet'}>
            {commonDefs}{shadow}
            <g transform="translate(15, 15) scale(0.7)">
                <path id="Body" className="animate-breathing" d="M28.78,50l-6.44,45.26s25.42,4.82,55.28,0l-7.17-49.51-41.66,4.25Z" fill={`url(#${gradId})`} />
                <path id="Left_Leg" d="M26.92,93.65c-3.17,7.33-17.96,6.65-19.85-1.37-.3-1.29-.17-2.66.36-3.88,3.04-6.92,16.11-6.47,19.36.17.79,1.61.85,3.43.14,5.07Z" fill={darkerColor} />
                <path id="Right_Leg" d="M73.08,93.65c3.17,7.33,17.96,6.65,19.85-1.37.3-1.29.17-2.66-.36-3.88-3.04-6.92-16.11-6.47-19.36.17-.79,1.61-.85,3.43-.14,5.07Z" fill={darkerColor} />
                <g className="animate-breathing" style={{animationDuration: '4s'}}>
                    <path id="Left_Ear" d="M26.67,23.8c-2.24.41-6.46,1.51-10.46,4.82-6.07,5.01-7.52,11.71-8.11,14.44-1.28,5.89-.41,10.91.43,13.96.16.57.55,1.05,1.08,1.3.42.2.92.37,1.49.47,5.96.98,12.61-8.18,15.22-14.78,3.35-8.49,1.5-16.51.35-20.2Z" fill={`url(#${gradId})`} />
                    <path id="Right_Ear" d="M73.28,23.8c2.24.41, 6.46,1.51, 10.46,4.82, 6.07,5.01, 7.52,11.71, 8.11,14.44, 1.28,5.89 .41,10.91 -.43,13.96 -.16.57 -.55,1.05 -1.08,1.3 -.42.2 -.92.37 -1.49.47 -5.96.98 -12.61-8.18 -15.22-14.78 -3.35-8.49 -1.5-16.51 -.35-20.2Z" fill={`url(#${gradId})`} />
                    <path d="M76.48,37.28c0,17.58-11.86,31.83-26.5,31.83s-26.5-14.25-26.5-31.83c0-21.86,11.86-31.83,26.5-31.83s26.5,9.81,26.5,31.83Z" fill={`url(#${gradId})`} />
                    <path d="M50.84,35.84c7.78-.36,15.41,6.63,12.11,14.42-3.32,8.49-17.44,9.8-23.01,2.37-6.03-7.95,1.84-16.76,10.69-16.78h.22Z" fill="white" opacity="0.5" />
                    <path id="Nose" d="M47.51,43.89h6.54c.2,0,.33.22.23.39l-3.27,5.61c-.1.17-.35.17-.45,0l-3.27-5.61c-.1-.17.02-.39.23-.39Z" fill="#161616" />
                    {renderGenericFace(36, 64, 45)}
                </g>
                <path id="Left_Hand" d="M33.45,98.28c-.19-.07-.27-.23-.27-.42.01-.96.31-2.56.82-3.65,2.43-5.36,8.92-6.05,12.12-1.09.67,1.03,1.1,2.33,1.21,3.55.08.88.11,1.62-.86,1.68-2.64.06-5.29,0-7.93.02-1.35,0-2.69,0-4.04,0-.34,0-.75,0-1.05-.09h-.01Z" fill={baseColor} />
                <path id="Right_Hand" d="M52.89,98.28c-.19-.07-.27-.23-.27-.42.01-.96.31-2.56.82-3.65,2.43-5.36,8.92-6.05,12.12-1.09.67,1.03,1.1,2.33,1.21,3.55.08.88.11,1.62-.86,1.68-2.64.06-5.29,0-7.93.02-1.35,0-2.69,0-4.04,0-.34,0-.75,0-1.05-.09h-.01Z" fill={baseColor} />
            </g>
        </svg>
    );

    // === KUŞ (BIRD) ===
    if (type === 'bird') return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio={fullSize ? 'xMidYMid slice' : 'xMidYMid meet'}>
            {commonDefs}{shadow}
            <g transform="translate(15, 15) scale(0.7)">
                <path d="M45.83,96.45c.02.19.06.74-.26,1.32-.32.58-.81.83-.98.91h-6.05c-.9-.55-1.39-1.54-1.25-2.5.15-1.05,1-1.61,1.14-1.7,1.08.41,2.29.82,3.63,1.17,1.36.36,2.63.62,3.78.79Z" fill={darkerColor} />
                <path d="M54.17,96.45c-.02.19-.06.74.26,1.32.32.58.81.83.98.91h6.05c.9-.55,1.39-1.54,1.25-2.5-.15-1.05-1-1.61-1.14-1.7-1.08.41-2.29.82-3.63,1.17-1.36.36-2.63.62-3.78.79Z" fill={darkerColor} />
                <path className="animate-tail-wag" d="M70.7,87.92c1.89.45,3.8.96,5.69,1.44,1.41.37,2.92.66,4.04,1.65.94.81,1.4,2.17.77,3.31-1.13,1.97-4.12,3.09-6.35,3.22-2.76.21-4.88-.78-7.09-2.13-1.49-.87-2.99-1.74-4.47-2.62-1.03-.59-2.1-1.44-1.8-2.72.31-1.31,1.5-2.8,2.83-3.27,1.21-.36,2.42.17,3.79.47.86.22,1.74.44,2.58.64h.02Z" fill={shadowColor} style={{ transformOrigin: "70px 88px", transformBox: "view-box" }} />
                <ellipse className="animate-breathing" cx="50" cy="66.03" rx="28.93" ry="30.87" fill={`url(#${gradId})`} />
                <path d="M25.58,49.43c-2.52,1.23-6.6,3.74-9.18,8.42-4.41,8-2.61,18.98,4.59,27.64,1.99-2.79,5.79-8.89,6.86-17.61,1.05-8.55-1.04-15.27-2.27-18.46Z" fill={shadowColor} />
                <path d="M74.42,49.43c2.52,1.23,6.6,3.74,9.18,8.42,4.41,8,2.61,18.98-4.59,27.64-1.99-2.79-5.79-8.89-6.86-17.61-1.05-8.55-1.04-15.27-2.27-18.46Z" fill={shadowColor} />
                <path className="animate-breathing" style={{animationDuration:'4s'}} d="M74.97,43.75c0,13.73-11.13,22.81-24.86,22.81s-24.86-9.09-24.86-22.81,11.13-24.86,24.86-24.86,24.86,11.13,24.86,24.86Z" fill={baseColor} />
                <path d="M49.1,44.87l-3.39,2.71c-.68.54-.8,1.52-.29,2.22.47.84,1.04,1.76,1.74,2.71.8,1.1,1.62,2.03,2.37,2.8.02.03.22.29.58.29.22,0,.44-.1.58-.29.8-.79,1.69-1.78,2.56-3,.63-.88,1.13-1.73,1.54-2.51.07-.09.39-.54.31-1.17-.05-.4-.25-.78-.59-1.05l-3.39-2.71c-.59-.47-1.42-.47-2.01,0Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
                {renderGenericFace(42, 58, 38)}
            </g>
        </svg>
    );

    // === TAVŞAN (RABBIT) ===
    if (type === 'rabbit') return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio={fullSize ? 'xMidYMid slice' : 'xMidYMid meet'}>
            {commonDefs}{shadow}
            <g transform="translate(15, 15) scale(0.7)">
                <path className="animate-tail-wag" style={{ transformOrigin: "75px 80px", transformBox: "view-box" }} d="M70.38,80.12 c1.61,-1.49 2.45,-2.24 3.74,-2.88 c1.37,-0.67 2.69,-1.32 4.31,-1 c1.9,0.38 3.54,1.96 4.08,3.88 c0.77,2.7 -0.96,4.92 -1.44,5.54 c-1.98,2.55 -5.46,3.52 -8.39,2.83 c-2.57,-0.6 -5.55,-2.67 -5.42,-4.71 c0.05,-0.83 1.08,-1.78 3.12,-3.67 Z" fill={darkerColor} />
                <g className="animate-breathing">
                    <path d="M70.89,71.17 c-1.56,-5.33 -3.7,-9.5 -5.44,-12.39 c-5.15,0.54 -10.3,1.07 -15.44,1.61 c-5.15,-0.54 -10.3,-1.07 -15.44,-1.61 c-1.74,2.89 -3.89,7.06 -5.44,12.39 c-1.31,4.48 -2.3,8.02 -1.61,12.61 c0.16,1.09 1.51,10 7.06,11.72 c0.93,0.29 1.76,0.31 2.33,0.28 c4.37,0 8.74,0.74 13.11,0.74 s8.74,-0.74 13.11,-0.74 c0.57,0.03 1.41,0 2.33,-0.28 c5.55,-1.72 6.89,-10.63 7.06,-11.72 c0.69,-4.59 -0.3,-8.13 -1.61,-12.61 Z" fill={`url(#${gradId})`} />
                    <path d="M36,85 Q36,98 42,98 Q48,98 48,85 Q48,78 42,78 Q36,78 36,85 Z" fill={darkerColor} />
                    <path d="M52,85 Q52,98 58,98 Q64,98 64,85 Q64,78 58,78 Q52,78 52,85 Z" fill={darkerColor} />
                </g>
                <path className="animate-breathing" style={{ transformOrigin: "34px 37.5px", transformBox: "view-box" }} d="M34.32,37.5c-3.54-11.62-8.97-17.12-8.72-29,.67-7.23,6.01-8.44 10.22-3.33 c5.01,6.87 7.03,23.67 5.42,32.33 h-6.92 Z" fill={`url(#${gradId})`} />
                <path className="animate-breathing" style={{ transformOrigin: "66px 37.5px", transformBox: "view-box" }} d="M65.68,37.5c3.54-11.62 8.97-17.12 8.72-29 c-0.67,-7.23 -6.01,-8.44 -10.22,-3.33 c-5.01,6.87 -7.03,23.67 -5.42,32.33 h6.92 Z" fill={`url(#${gradId})`} />
                <path className="animate-breathing" style={{animationDuration:'4s'}} d="M74.17,49.5c0,11.76 -10.88,19.92 -23.94,19.92 s-24.39,-8.21 -24.39,-19.97 s11.33,-22.61 24.39,-22.61 s23.94,10.91 23.94,22.67 Z" fill={`url(#${gradId})`} />
                <path d="M29.5,97.83 c-3.4,0.33 -6.82,-2 -8.64,-4.83 c-0.77,-1.2 -1.93,-3.01 -1.44,-5.17 c0.52,-2.3 2.71,-4.08 4.81,-4.39 c4.88,-0.71 9.2,6.59 9.22,10.42 c0,0.48 0,1.59 -0.72,2.53 c-0.96,1.22 -2.57,1.38 -3.22,1.44 Z" fill={darkerColor} />
                <path d="M70.5,97.83 c3.4,0.33 6.82,-2 8.64,-4.83 c0.77,-1.2 1.93,-3.01 1.44,-5.17 c-0.52,-2.3 -2.71,-4.08 -4.81,-4.39 c-4.88,-0.71 -9.2,6.59 -9.22,10.42 c0,0.48 0,1.59 0.72,2.53 c0.96,1.22 2.57,1.38 3.22,1.44 Z" fill={darkerColor} />
                <path d="M52.04,50.82 c-1.43,-0.7 -5.29,-0.58 -5.35,1.55 c0.31,1.29 2.1,2.48 2.71,3.33 c0.53,0.87 -0.13,2.35 0.42,3.17 c0.63,0.28 0.57,-0.66 0.57,-1.18 c0.02,-0.61 -0.06,-1.2 0.08,-1.73 c0.77,-1.49 4.72,-3.57 1.73,-5.07 l-0.16,-0.07 Z" fill="#161616" />
                {renderGenericFace(39, 62, 52)}
            </g>
        </svg>
    );

    // === BALIK (FISH) ===
    if (type === 'fish') return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio={fullSize ? 'xMidYMid slice' : 'xMidYMid meet'}>
            {commonDefs}
            <ellipse cx="50" cy="85" rx="20" ry="4" fill="#000" opacity="0.1" className="animate-breathing-shadow"/>
            <path d="M80,50 L95,35 L95,65 Z" fill={shadowColor} className="animate-tail-wag" style={{ transformOrigin: "80px 50px", transformBox: "view-box", animationDuration:'0.8s' }}/>
            <path d="M15,50 Q40,20 80,50 Q40,80 15,50 Z" fill={`url(#${gradId})`} className="animate-breathing" />
            <path d="M40,32 Q50,15 65,35" fill={shadowColor} opacity="0.8"/>
            <path d="M45,55 Q55,50 55,65 Q45,65 45,55" fill="white" opacity="0.3"/>
            <path d="M30,50 Q35,50 35,55 M40,45 Q45,45 45,50 M50,40 Q55,40 55,45" stroke="white" strokeWidth="1" fill="none" opacity="0.3"/>
            <circle cx="25" cy="45" r="3" fill="white" /><circle cx="26" cy="45" r="1.5" fill="black" />
        </svg>
    );

    // === KAPLUMBAĞA (TURTLE) ===
    if (type === 'turtle') return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio={fullSize ? 'xMidYMid slice' : 'xMidYMid meet'}>
            {commonDefs}{shadow}
            <g transform="scale(0.85) translate(8, 8)">
                <path d="M41.47,87.25c0,3.91-3.18,6.62-6.99,6.62s-7.12-2.73-7.12-6.63,3.31-7.51,7.12-7.51,6.99,3.62,6.99,7.53Z" fill={shadowColor} />
                <path d="M58.53,87.25c0,3.91,3.18,6.62,6.99,6.62s7.12-2.73-7.12-6.63-3.31-7.51-7.12-7.51-6.99,3.62-6.99,7.53Z" fill={shadowColor} />
                <g className="animate-breathing">
                    <path d="M83.33,64.89c0,5.73-2.16,10.86-5.76,15.04-6.13,7.14-16.43,11.54-27.28,11.54s-21.66-4.48-27.93-11.75c-3.55-4.11-5.69-9.12-5.69-14.72,0-15.5,16.41-29.67,33.62-29.67s33.04,14.06,33.04,29.56Z" fill={`url(#${gradId})`} />
                    <path d="M79.16,71.4c0,3.04-.56,5.9-1.59,8.53-6.13,7.14-16.43,11.54-27.28,11.54s-21.66-4.48-27.93-11.75c-.98-2.54-1.52-5.29-1.52-8.21,0-15.06,14.35-28.82,29.42-28.82s28.9,13.65,28.9,28.71Z" fill="white" opacity="0.3" />
                </g>
                <g className="animate-breathing" style={{animationDuration: '3s'}}>
                    <path d="M74.17,37.55c0,11.76-10.88,19.92-23.94,19.92s-24.39-8.21-24.39-19.97,11.33-22.61,24.39-22.61,23.94,10.91,23.94,22.67Z" fill={baseColor} />
                    <path d="M47.77,45.11c-.34.2-.92-.15-1.21-.52-.25-.33-.47-.93-.21-1.23.29-.32,1.04-.2,1.42.23.41.47.38,1.3,0,1.52Z" fill="#4a494a" />
                    <path d="M52.23,45.11c.34.2.92-.15,1.21-.52.25-.33.47-.93.21-1.23-.29-.32-1.04-.2-1.42.23-.41.47-.38,1.3,0,1.52Z" fill="#4a494a" />
                    {renderGenericFace(39, 61, 41)}
                </g>
                <path d="M29.64,70.56c-.93-4.27.57-7.28.44-10.28-.99-4.87-6.2-2.86-8.56.22-4.67,5.23-6.11,22.06,1.96,22.31,3.3.1-6.32-2.21,6.94-5.46.47-2.48-.42-4.78-.79-6.79Z" fill={shadowColor} />
                <path d="M70.36,70.56c.93-4.27-.57-7.28-.44-10.28.99-4.87,6.2-2.86,8.56.22,4.67,5.23,6.11,22.06-1.96,22.31-3.3.1-6.32-2.21-6.94-5.46-.47-2.48.42-4.78.79-6.79Z" fill={shadowColor} />
            </g>
        </svg>
    );

    // === DİĞER (OTHER / DEFAULT) ===
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio={fullSize ? 'xMidYMid slice' : 'xMidYMid meet'}>
            {commonDefs}{shadow}
            <circle cx="50" cy="60" r="30" fill={`url(#${gradId})`} stroke={shadowColor} strokeWidth="2" className="animate-breathing" />
            <circle cx="30" cy="40" r="8" fill={`url(#${gradId})`} stroke={shadowColor} strokeWidth="2" className="animate-tail-wag" style={{ transformOrigin: "30px 40px", transformBox: "view-box", animationDuration:'1s' }} />
            <circle cx="70" cy="40" r="8" fill={`url(#${gradId})`} stroke={shadowColor} strokeWidth="2" className="animate-tail-wag" style={{ transformOrigin: "70px 40px", transformBox: "view-box", animationDuration:'1s', animationDelay:'0.1s' }} />
            <path d="M48,65 L52,65 L50,68 Z" fill="#ffb6c1" />
            {renderGenericFace(40, 60, 55)}
        </svg>
    );
  };

  return (
    <div onClick={handleClick} className={`${className} cursor-pointer relative overflow-visible transition-all active:scale-95 group`}>
        <style>{animationStyles}</style>
        <div className={`w-full h-full ${petState === 'sleeping' ? '' : petState === 'surprised' ? 'animate-shake' : 'animate-pulse'}`}>
            {renderContent()}
        </div>
        {!fullSize && (
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-neutral-800 rounded-full p-1.5 shadow-md scale-0 group-hover:scale-100 transition-transform z-10 border border-gray-100 dark:border-neutral-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
        )}
    </div>
  );
};

export default InteractiveSleepingPet;