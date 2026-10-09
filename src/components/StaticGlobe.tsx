import type { GlobeMood } from '../types/landing'

/** Quiet illustration for devices without WebGL. */
export function StaticGlobe({ mood }: { mood: GlobeMood }) {
  const glassId = `glass-${mood}`
  const baseId = `base-${mood}`
  return <svg className="static-globe" viewBox="0 0 480 500" aria-hidden="true">
    <defs>
      <radialGradient id={glassId} cx="30%" cy="20%" r="80%"><stop stopColor="#fff" stopOpacity=".7"/><stop offset="1" stopColor="#acd9ff" stopOpacity=".5"/></radialGradient>
      <linearGradient id={baseId}><stop stopColor="#bad9e6"/><stop offset=".5" stopColor="#edf5f8"/><stop offset="1" stopColor="#99bccf"/></linearGradient>
    </defs>
    <ellipse cx="240" cy="447" rx="124" ry="15" fill="#789cad" opacity=".12"/>
    <path d="M103 379V408Q240 457 377 408V379Z" fill={`url(#${baseId})`}/>
    <ellipse cx="240" cy="379" rx="137" ry="35" fill="#cae3ed"/>
    <circle cx="240" cy="224" r="190" fill={`url(#${glassId})`} stroke="#8cc7f7" strokeWidth="2"/>
    <ellipse cx="240" cy="353" rx="147" ry="43" fill="#82c3d5"/>
    <ellipse cx="232" cy="335" rx="114" ry="37" fill="#f4e9cf"/>
    <ellipse cx="230" cy="329" rx="104" ry="30" fill="#a5cdb1"/>
    {mood === 'trekking' ? <g>
      <path d="M144 321L209 187L270 321Z" fill="#a2bfc5"/><path d="M194 218L209 187L225 221L209 216Z" fill="#f8fbfa"/>
      <path d="M233 321L276 223L322 321Z" fill="#b7cecd"/><path d="M266 246L276 223L288 249Z" fill="#f8fbfa"/>
      <path d="M163 329Q209 314 220 281" stroke="#f3e7cf" strokeWidth="8" fill="none"/>
      <path d="M283 140Q318 107 357 145Q324 131 283 140Z" fill="#e5b9a7"/>
      <path d="M288 140L321 184L352 144" stroke="#b0c7ce" fill="none"/><circle cx="321" cy="186" r="5" fill="#70a3af"/>
      <path d="M272 334L331 334M272 321Q302 337 331 321" stroke="#bba180" strokeWidth="4" fill="none"/>
      <g fill="#79a68c"><path d="M146 291L127 326H165Z"/><path d="M304 276L287 311H321Z"/><path d="M336 299L323 324H349Z"/></g>
      <circle cx="186" cy="309" r="4" fill="#e3bd9e"/><path d="M186 314V325M186 321L178 330M186 321L193 331" stroke="#789aaa" strokeWidth="5"/><path d="M182 315L190 318" stroke="#e3a984" strokeWidth="3"/>
    </g> : mood === 'golf' ? <g>
      <path d="M159 345Q190 321 214 305Q264 289 282 261" stroke="#709d72" strokeWidth="45" strokeLinecap="round" fill="none"/>
      <path d="M159 345Q190 321 214 305Q264 289 282 261" stroke="#b4ca93" strokeWidth="30" strokeLinecap="round" fill="none"/>
      <ellipse cx="280" cy="262" rx="28" ry="15" fill="#c2d59f"/><ellipse cx="237" cy="286" rx="19" ry="9" fill="#efdfbd"/><ellipse cx="304" cy="296" rx="17" ry="8" fill="#efdfbd"/>
      <path d="M282 265V217" stroke="#f7f1d8" strokeWidth="3"/><path d="M283 216H310L283 230Z" fill="#dc9e87"/>
      <path d="M296 325H326V338H296ZM294 304H329V311H294Z" fill="#e6e5d4"/><path d="M298 310V326M325 310V326" stroke="#9cae9e" strokeWidth="3"/><circle cx="302" cy="340" r="5" fill="#46616d"/><circle cx="323" cy="340" r="5" fill="#46616d"/>
      <path d="M159 274V234H208V274Z" fill="#f8eddb"/><path d="M153 235L185 211L216 235Z" fill="#819b90"/>
      <circle cx="177" cy="310" r="5" fill="#e4bc9d"/><path d="M177 316V331M177 322L186 328M177 329L171 342M177 329L182 342" stroke="#f2ebd4" strokeWidth="5"/><path d="M186 327L197 342L202 342" stroke="#97aaac" strokeWidth="2"/><circle cx="199" cy="343" r="3" fill="#fbfbec"/>
      <circle cx="231" cy="343" r="10" fill="#f8f5e6"/><g fill="#e0e1d4"><circle cx="228" cy="338" r="1.5"/><circle cx="235" cy="340" r="1.5"/><circle cx="229" cy="347" r="1.5"/></g>
    </g> : <g>
      <path d="M188 325V277H252V325Z" fill="#fff6e5"/><path d="M180 277L220 246L261 277Z" fill={mood === 'honeymoon' ? '#dea69a' : '#92b6d5'}/>
      <path d="M210 325V299H229V325" fill="#91b9c9"/>
      <path d="M144 323Q142 288 151 257M300 321Q303 285 310 254" stroke="#c3ac8c" strokeWidth="9" fill="none"/>
      {mood === 'honeymoon' ? <path d="M111 258Q150 228 186 258Q155 266 151 249Q142 271 111 258M272 255Q310 227 345 256Q316 264 310 247Q301 268 272 255" fill="#91bea6"/> : <g fill="#9dc4ad"><ellipse cx="146" cy="265" rx="27" ry="35"/><ellipse cx="308" cy="262" rx="26" ry="34"/></g>}
      {mood === 'honeymoon' ? <path d="M267 180L318 165L322 153L330 151L329 166L363 160L369 165L330 177L315 203L308 204L310 180L279 185Z" fill="#8cbee0"/> : <g><ellipse cx="299" cy="161" rx="27" ry="35" fill="#b7d7e5"/><ellipse cx="299" cy="161" rx="13" ry="35" fill="#f0d1cb"/><path d="M282 188L290 209H308L316 188" stroke="#c9b391" fill="none"/><path d="M289 208H310V219H289Z" fill="#d4b89a"/></g>}
      {mood === 'honeymoon' ? <g><path d="M272 332V306Q287 280 301 306V332" fill="none" stroke="#edc6b7" strokeWidth="6"/><ellipse cx="184" cy="336" rx="16" ry="5" fill="#faf1dc"/><path d="M184 337V348" stroke="#c4a284" strokeWidth="3"/><circle cx="164" cy="326" r="5" fill="#e4bc9c"/><circle cx="204" cy="326" r="5" fill="#e4bc9c"/><path d="M164 331V341" stroke="#dca5a0" strokeWidth="7"/><path d="M204 331V341" stroke="#f2e8d4" strokeWidth="7"/></g> : <g><ellipse cx="273" cy="335" rx="35" ry="14" fill="#c5c6b5"/><ellipse cx="273" cy="333" rx="27" ry="10" fill="#a7d0ca"/><path d="M151 346H229" stroke="#c3a480" strokeWidth="7"/><path d="M157 343V328M223 343V328" stroke="#c3a480" strokeWidth="3"/><circle cx="176" cy="312" r="5" fill="#c2c2b4"/><circle cx="207" cy="312" r="5" fill="#c2c2b4"/><path d="M176 318V331" stroke="#94aabd" strokeWidth="7"/><path d="M207 318V331" stroke="#c3a595" strokeWidth="7"/></g>}
    </g>}
    <path d="M108 159Q134 99 185 81" stroke="#fff" strokeWidth="11" strokeLinecap="round" fill="none" opacity=".85"/>
    <g fill="#fff" opacity=".75"><circle cx="155" cy="192" r="2"/><circle cx="195" cy="150" r="2"/><circle cx="350" cy="225" r="2"/><circle cx="280" cy="248" r="2"/><circle cx="129" cy="279" r="2"/></g>
  </svg>
}
