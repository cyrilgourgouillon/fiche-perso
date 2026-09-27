const RACES = [
  { value: 'human', label: 'Humain', skin: '#e9b58b', hair: '#533629', feature: 'human' },
  { value: 'elf', label: 'Elfe', skin: '#f1c5a0', hair: '#355f49', feature: 'elf' },
  { value: 'dwarf', label: 'Nain', skin: '#d69b72', hair: '#74472f', feature: 'beard' },
  { value: 'halfling', label: 'Halfelin', skin: '#efbf94', hair: '#70442d', feature: 'halfling' },
  { value: 'gnome', label: 'Gnome', skin: '#e7af88', hair: '#a95038', feature: 'beard' },
  { value: 'half-elf', label: 'Demi-elfe', skin: '#e8b38e', hair: '#795136', feature: 'elf' },
  { value: 'half-orc', label: 'Demi-orc', skin: '#95aa72', hair: '#3c4932', feature: 'orc' },
  { value: 'orc', label: 'Orc', skin: '#7fa65d', hair: '#344b31', feature: 'orc' },
  { value: 'tiefling', label: 'Tieffelin', skin: '#cb7772', hair: '#4a2949', feature: 'tiefling' },
  { value: 'paladin', label: 'Paladin', skin: '#edc092', hair: '#795331', feature: 'paladin' },
];

export const AVATAR_RACES = RACES.map(({ value, label }) => ({ value, label }));

const RACE_ALIASES = {
  'half-elf': 'half-elf',
  'half-elfe': 'half-elf',
  'half-orc': 'half-orc',
  'halfelin': 'halfling',
  'demi-elfe': 'half-elf',
  'demi-elf': 'half-elf',
  'demi-orc': 'half-orc',
  'halfling': 'halfling',
  'tieffelin': 'tiefling',
  'nain': 'dwarf',
  'elfe': 'elf',
  'paladin': 'paladin',
  'gnome': 'gnome',
  'humain': 'human',
  'human': 'human',
  'elf': 'elf',
  'dwarf': 'dwarf',
  'orc': 'orc',
  'tiefling': 'tiefling',
};

export function avatarRaceFor(data) {
  if (RACES.some(({ value }) => value === data.avatar_race)) return data.avatar_race;
  const species = (data.espece || '').trim().toLocaleLowerCase('fr').replace(/^demi[- ]/, 'demi-');
  const speciesRace = RACE_ALIASES[species];
  return RACES.some(({ value }) => value === speciesRace) ? speciesRace : 'human';
}

/** A tiny, deliberately blocky portrait built from crisp SVG pixels. */
export default function PixelAvatar({ data, className = '' }) {
  const race = RACES.find(({ value }) => value === avatarRaceFor(data)) || RACES[0];
  const shirt = data.avatar_shirt_color || 'teal';
  const trousers = data.avatar_trousers_color || 'plum';
  const shirtColors = {
    crimson: '#b84f48', ocean: '#397a9a', teal: '#438b78', plum: '#775a91', gold: '#d09a3d', charcoal: '#4d5364', brown: '#8b5e3c',
    black: '#27272a', white: '#f3f1e9',
  };
  const trouserColors = {
    crimson: '#a54642', ocean: '#315d83', teal: '#376b5c', plum: '#654b7b', gold: '#a8782e', charcoal: '#3e4352', brown: '#70472f',
    black: '#26262a', white: '#deddd7',
  };
  const top = shirtColors[shirt] || shirtColors.teal;
  const legs = trouserColors[trousers] || trouserColors.plum;
  const topStyle = data.avatar_shirt_style || 'tunic';
  const trouserStyle = data.avatar_trousers_style || 'straight';
  const gender = data.avatar_gender || 'male';
  const weapon = data.avatar_weapon || 'none';
  const skinShadow = race.skin === '#63a98f' ? '#43806e' : race.skin === '#7fa65d' || race.skin === '#95aa72' ? '#5e7948' : '#bf8968';
  const hairShadow = race.hair;

  return (
    <svg
      className={`pixel-avatar ${className}`.trim()}
      viewBox="0 0 48 56"
      role="img"
      aria-label={`Avatar pixel art : ${race.label}`}
      shapeRendering="crispEdges"
    >
      <rect x="2" y="2" width="44" height="52" rx="8" fill="var(--avatar-back, #f0dfbd)" />
      <rect x="5" y="5" width="38" height="46" rx="5" fill="var(--avatar-back-inner, #f8edda)" />
      {race.feature === 'paladin' && <><rect x="20" y="4" width="8" height="2" fill="#d7a83d" /><rect x="23" y="2" width="2" height="6" fill="#d7a83d" /></>}

      {/* ears and the head */}
      {race.feature === 'elf' && <><rect x="8" y="14" width="7" height="3" fill={race.skin} /><rect x="10" y="12" width="5" height="2" fill={race.skin} /><rect x="33" y="14" width="7" height="3" fill={race.skin} /><rect x="33" y="12" width="5" height="2" fill={race.skin} /></>}
      <rect x="14" y="9" width="20" height="17" fill={race.skin} />
      <rect x="12" y="13" width="3" height="8" fill={race.skin} />
      <rect x="33" y="13" width="3" height="8" fill={race.skin} />
      <rect x="17" y="20" width="14" height="3" fill={skinShadow} />
      {race.feature === 'tiefling' && <><rect x="14" y="5" width="4" height="5" fill={race.hair} /><rect x="12" y="3" width="3" height="3" fill={race.hair} /><rect x="30" y="5" width="4" height="5" fill={race.hair} /><rect x="33" y="3" width="3" height="3" fill={race.hair} /></>}
      {race.feature === 'paladin' ? <><rect x="14" y="8" width="20" height="5" fill={hairShadow} /><rect x="17" y="6" width="14" height="3" fill="#d09a3d" /></> : <><rect x="14" y="8" width="20" height="5" fill={hairShadow} /><rect x="14" y="12" width="3" height="5" fill={hairShadow} /><rect x="31" y="12" width="3" height="3" fill={hairShadow} /></>}
      {gender === 'female' && <><rect x="13" y="14" width="4" height="9" fill={hairShadow} /><rect x="31" y="14" width="4" height="9" fill={hairShadow} /><rect x="14" y="21" width="3" height="3" fill={hairShadow} /><rect x="31" y="21" width="3" height="3" fill={hairShadow} /></>}
      <rect x="18" y="15" width="2" height="2" fill="#302b2c" />
      <rect x="28" y="15" width="2" height="2" fill="#302b2c" />
      <rect x="22" y="20" width="4" height="1" fill="#814c48" />
      {race.feature === 'orc' && <><rect x="17" y="21" width="2" height="3" fill="#fff0d4" /><rect x="29" y="21" width="2" height="3" fill="#fff0d4" /></>}
      {race.feature === 'beard' && gender !== 'female' && <><rect x="17" y="21" width="14" height="5" fill={hairShadow} /><rect x="20" y="25" width="8" height="2" fill={hairShadow} /></>}
      {race.feature === 'halfling' && <><rect x="12" y="24" width="4" height="2" fill="#70442d" /><rect x="32" y="24" width="4" height="2" fill="#70442d" /></>}

      {/* sleeves, tunic, doublet, or flowing robe */}
      <rect x="11" y="28" width="26" height="14" fill={top} />
      <rect x="7" y="30" width="5" height="10" fill={top} />
      <rect x="36" y="30" width="5" height="10" fill={top} />
      <rect x="7" y="38" width="5" height="3" fill={race.skin} />
      <rect x="36" y="38" width="5" height="3" fill={race.skin} />
      {topStyle === 'doublet' && <><rect x="22" y="28" width="4" height="14" fill="#f2dba9" /><rect x="17" y="30" width="5" height="3" fill="#f2dba9" /><rect x="26" y="30" width="5" height="3" fill="#f2dba9" /><rect x="23" y="34" width="2" height="2" fill="#78512e" /></>}
      {topStyle === 'robe' && <><rect x="9" y="39" width="30" height="5" fill={top} /><rect x="13" y="42" width="6" height="5" fill={top} /><rect x="29" y="42" width="6" height="5" fill={top} /><rect x="12" y="29" width="3" height="12" fill="#f0d58b" /></>}
      {topStyle === 'armor' && <><rect x="9" y="29" width="7" height="6" fill="#bfc8c5" /><rect x="32" y="29" width="7" height="6" fill="#bfc8c5" /><rect x="14" y="29" width="20" height="12" fill={top} /><rect x="17" y="31" width="14" height="2" fill="#d7ddd7" /><rect x="22" y="32" width="4" height="7" fill="#aab4b0" /><rect x="23" y="34" width="2" height="3" fill="#f2dba9" /><rect x="12" y="37" width="3" height="3" fill="#bfc8c5" /><rect x="33" y="37" width="3" height="3" fill="#bfc8c5" /></>}
      {topStyle === 'cape' && <><rect x="8" y="30" width="4" height="14" fill={top} /><rect x="36" y="30" width="4" height="14" fill={top} /><rect x="10" y="28" width="7" height="5" fill={top} /><rect x="31" y="28" width="7" height="5" fill={top} /><rect x="10" y="42" width="3" height="4" fill={top} /><rect x="35" y="42" width="3" height="4" fill={top} /><rect x="22" y="29" width="4" height="3" fill="#f2dba9" /></>}
      {topStyle === 'tabard' && <><rect x="17" y="28" width="14" height="14" fill="#f0e2c4" /><rect x="15" y="39" width="4" height="6" fill={top} /><rect x="29" y="39" width="4" height="6" fill={top} /><rect x="20" y="30" width="8" height="2" fill={top} /><rect x="22" y="33" width="4" height="5" fill={top} /></>}
      {topStyle === 'tunic' && <><rect x="14" y="39" width="20" height="3" fill="#87654b" /><rect x="22" y="31" width="4" height="2" fill="#f2dba9" /></>}

      {/* Five trouser silhouettes, from everyday to adventure-ready. */}
      {trouserStyle === 'puffy' && <><rect x="13" y="42" width="10" height="7" fill={legs} /><rect x="25" y="42" width="10" height="7" fill={legs} /><rect x="14" y="48" width="8" height="3" fill={legs} /><rect x="26" y="48" width="8" height="3" fill={legs} /></>}
      {trouserStyle === 'leggings' && <><rect x="16" y="42" width="6" height="10" fill={legs} /><rect x="26" y="42" width="6" height="10" fill={legs} /><rect x="14" y="48" width="8" height="2" fill={legs} /><rect x="26" y="48" width="8" height="2" fill={legs} /></>}
      {trouserStyle === 'shorts' && <><rect x="14" y="42" width="8" height="6" fill={legs} /><rect x="26" y="42" width="8" height="6" fill={legs} /><rect x="15" y="48" width="6" height="3" fill={race.skin} /><rect x="27" y="48" width="6" height="3" fill={race.skin} /></>}
      {trouserStyle === 'greaves' && <><rect x="14" y="42" width="8" height="9" fill={legs} /><rect x="26" y="42" width="8" height="9" fill={legs} /><rect x="14" y="46" width="8" height="3" fill="#bfc8c5" /><rect x="26" y="46" width="8" height="3" fill="#bfc8c5" /></>}
      {trouserStyle === 'cargo' && <><rect x="14" y="42" width="8" height="9" fill={legs} /><rect x="26" y="42" width="8" height="9" fill={legs} /><rect x="12" y="44" width="4" height="5" fill="#c9ad7e" /><rect x="32" y="44" width="4" height="5" fill="#c9ad7e" /><rect x="12" y="46" width="4" height="1" fill="#8b6b43" /><rect x="32" y="46" width="4" height="1" fill="#8b6b43" /></>}
      {(trouserStyle === 'straight' || !['puffy', 'leggings', 'shorts', 'greaves', 'cargo'].includes(trouserStyle)) && <><rect x="14" y="42" width="8" height="9" fill={legs} /><rect x="26" y="42" width="8" height="9" fill={legs} /></>}
      <rect x="13" y="51" width="10" height="3" fill="#49352f" />
      <rect x="25" y="51" width="10" height="3" fill="#49352f" />
      <rect x="23" y="29" width="2" height="2" fill="#fff1c9" />

      {weapon === 'axe' && <g aria-hidden="true"><rect x="8" y="29" width="2" height="15" fill="#78513a" /><rect x="4" y="27" width="7" height="6" fill="#aeb8b9" /><rect x="3" y="28" width="2" height="4" fill="#d7dedd" /><rect x="5" y="29" width="5" height="2" fill="#d7dedd" /></g>}
      {weapon === 'sword_one' && <g aria-hidden="true"><rect x="39" y="23" width="2" height="15" fill="#cbd5d9" /><rect x="38" y="20" width="4" height="4" fill="#e4ebeb" /><rect x="36" y="37" width="8" height="2" fill="#d09a3d" /><rect x="39" y="39" width="2" height="5" fill="#78513a" /></g>}
      {weapon === 'sword_two' && <g aria-hidden="true"><rect x="39" y="12" width="2" height="25" fill="#cbd5d9" /><rect x="38" y="9" width="4" height="4" fill="#e4ebeb" /><rect x="35" y="36" width="10" height="2" fill="#d09a3d" /><rect x="39" y="38" width="2" height="7" fill="#78513a" /></g>}
      {weapon === 'sword_shield' && <g aria-hidden="true"><rect x="4" y="31" width="9" height="11" fill="#d09a3d" /><rect x="6" y="33" width="5" height="7" fill={top} /><rect x="8" y="34" width="1" height="5" fill="#f2dba9" /><rect x="39" y="23" width="2" height="15" fill="#cbd5d9" /><rect x="38" y="20" width="4" height="4" fill="#e4ebeb" /><rect x="36" y="37" width="8" height="2" fill="#d09a3d" /><rect x="39" y="39" width="2" height="5" fill="#78513a" /></g>}
      {weapon === 'bow' && <g aria-hidden="true"><rect x="7" y="24" width="2" height="3" fill="#78513a" /><rect x="5" y="27" width="2" height="4" fill="#78513a" /><rect x="4" y="31" width="2" height="9" fill="#78513a" /><rect x="5" y="40" width="2" height="4" fill="#78513a" /><rect x="7" y="44" width="2" height="3" fill="#78513a" /><rect x="9" y="27" width="1" height="17" fill="#e9e0ca" /><rect x="8" y="34" width="25" height="1" fill="#78513a" /><rect x="32" y="32" width="3" height="5" fill="#cbd5d9" /></g>}
      {weapon === 'boxing' && <g aria-hidden="true"><rect x="5" y="35" width="8" height="6" rx="2" fill="#b84f48" /><rect x="6" y="33" width="5" height="4" fill="#ca6258" /><rect x="35" y="35" width="8" height="6" rx="2" fill="#b84f48" /><rect x="37" y="33" width="5" height="4" fill="#ca6258" /><rect x="6" y="39" width="6" height="1" fill="#f2dba9" /><rect x="36" y="39" width="6" height="1" fill="#f2dba9" /></g>}
    </svg>
  );
}
