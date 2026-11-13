/** Ilustración de una trastada típica del elfo, para el chat de demostración (SVG propio, sin derechos de terceros). */
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 190">
<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2150"/><stop offset="1" stop-color="#241237"/></linearGradient></defs>
<rect width="256" height="190" fill="url(#w)"/>
<rect y="150" width="256" height="40" fill="#4a2f2a"/>
<g opacity=".9"><circle cx="30" cy="30" r="2" fill="#ffe9a8"/><circle cx="220" cy="24" r="2.5" fill="#ffe9a8"/><circle cx="200" cy="70" r="1.6" fill="#ffe9a8"/><circle cx="60" cy="74" r="1.6" fill="#ffe9a8"/></g>
<polygon points="128,16 78,70 100,70 66,112 94,112 58,152 198,152 162,112 190,112 156,70 178,70" fill="#1f6b46"/>
<rect x="118" y="150" width="20" height="14" fill="#6b4328"/>
<g fill="none" stroke="#fffdf4" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
<path d="M104 52 Q140 60 150 74 Q112 82 96 96 Q150 104 168 122 Q118 128 82 142"/>
<path d="M150 74 Q186 92 196 140" stroke-width="6"/>
<path d="M82 142 Q60 156 54 176" stroke-width="6"/>
</g>
<g fill="#fffdf4" opacity=".9"><circle cx="54" cy="178" r="9"/><circle cx="196" cy="146" r="8"/></g>
<polygon points="128,6 133,18 146,18 135,26 140,38 128,31 116,38 121,26 110,18 123,18" fill="#f6d77a"/>
<g transform="translate(160 88)">
<ellipse cx="14" cy="34" rx="14" ry="12" fill="#c8312b"/>
<circle cx="14" cy="14" r="12" fill="#f6d2aa"/>
<path d="M2 11 Q14 -14 26 11 Z" fill="#2f9e5b"/>
<circle cx="26" cy="9" r="3.4" fill="#f6d77a"/>
<circle cx="9" cy="14" r="1.8" fill="#2b1b0e"/><circle cx="19" cy="14" r="1.8" fill="#2b1b0e"/>
<path d="M8 20 Q14 26 20 20" stroke="#b5483f" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<circle cx="6" cy="19" r="2.4" fill="#f08a7a" opacity=".7"/><circle cx="22" cy="19" r="2.4" fill="#f08a7a" opacity=".7"/>
</g>
</svg>`;

export const ELF_PRANK_SCENE = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
