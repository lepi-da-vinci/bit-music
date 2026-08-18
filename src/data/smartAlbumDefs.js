// Smart Album & Curated Playlist Definitions

export const SMART_ALBUM_DEFS = [
  {
    name: 'The Weeknd - The Starboy Highlights',
    pattern: /weeknd|blinding|save your|starboy|timeless|one of the girls/i
  },
  {
    name: 'Shawn Mendes - Greatest Essentials',
    pattern: /shawn mendes|treat you|stitches|holdin me back|imagination|in my blood/i
  },
  {
    name: 'Rex Orange County & Bedroom Pop',
    pattern: /rex orange|best friend|television so far|ricky montgomery|line without|steve lacy|dark red|tek it|sofia/i
  },
  {
    name: 'Indie Rock & Pop-Punk Anthems',
    pattern: /arctic monkeys|505|neck deep|december|wish you were here|bleachers|cash cash|hero/i
  },
  {
    name: 'Alternative, Dreampop & Shoegaze',
    pattern: /the 1975|about you|the neighbourhood|sweater weather|bôa|duvet|tv girl|lovers rock|her s|harvey|she him|i thought i saw|freaks/i
  },
  {
    name: 'Reality Club & Crayon Case Hits',
    pattern: /reality club|am i bothering|lovers like you|crayon case|gravits|surabaya|because|neu automobile/i
  },
  {
    name: 'Pop Viral Hits & Radio Favorites',
    pattern: /billie eilish|birds of a feather|die with a smile|shape of you|as it was|cupid|symphony|cheap thrills|circles|boy's a liar|kill bill|i don't care/i
  },
  {
    name: 'Chill Vibes, R&B & Senja',
    pattern: /kecoud|shawty|alex crichton|merry christmas|ravyn lenae|love me not|heartbreak anniversary|here with me|every summertime|hurts so good|i like me better|let her go|khalid|young dumb|still got time|double take|take me to the beach|nurlela/i
  },
  {
    name: 'Retro Chiptune & 8-Bit Beats',
    pattern: /pak vramroro|fufufafa|anti|hero|stuck in space|cloud 9|cloud|sunflower|the shade|this side of paradise|youth|fallen|i'm done waiting|shelter/i
  }
];

export const FEATURED_MIX_DEFS = [
  {
    id: 'mix_pop',
    name: 'Mix Pop & Hits Pilihan',
    desc: 'The Weeknd, Billie Eilish, Harry Styles, Sabrina Carpenter',
    filter: t => /weeknd|billie|harry|shawn|sheer|die with|gaga|cupid|starboy|blinding|as it was|symphony/i.test(t.title + ' ' + t.artist)
  },
  {
    id: 'mix_indie',
    name: 'Mix Indie & Alternatif',
    desc: 'Arctic Monkeys, Reality Club, The 1975, TV Girl, bôa',
    filter: t => /arctic|reality|1975|neighbourhood|tv girl|bôa|harvey|her s|dark red|freaks|lovers rock|sweater/i.test(t.title + ' ' + t.artist)
  },
  {
    id: 'mix_rock',
    name: 'Mix Rock & Pop-Punk',
    desc: 'Neck Deep, Crayon Case, Bleachers, Cash Cash',
    filter: t => /neck deep|crayon|bleachers|cash cash|december|wish you|surabaya|gravits|because/i.test(t.title + ' ' + t.artist)
  },
  {
    id: 'mix_chill',
    name: 'Mix Santai & Nostalgia Senja',
    desc: 'Rex Orange County, Ricky Montgomery, Steve Lacy, Kecoud',
    filter: t => /rex orange|ricky|steve lacy|kecoud|alex crichton|best friend|television|shawty|tears|thought/i.test(t.title + ' ' + t.artist)
  },
  {
    id: 'mix_chiptune',
    name: 'Mix Retro 8-Bit & Arcade',
    desc: 'Aestheards, Pak Vramroro, Synthwave, 8-Bit Beats',
    filter: t => /aestheards|vramroro|fufufafa|anti|hero|stuck|space|cloud|sunflower|shade|paradise/i.test(t.title + ' ' + t.artist)
  }
];

export const MOOD_KEYWORDS = {
  'sedih': ['sad', 'ballad', 'slow', 'acoustic', 'mellow', 'cry', 'rain', 'lonely', 'miss', 'hurt', 'heart', 'dark', 'december', 'tears'],
  'tidur': ['sleep', 'ambient', 'chill', 'lofi', 'lullaby', 'calm', 'night', 'dream', 'soft', 'peace', 'quiet', 'duvet', 'shade'],
  'bersantai': ['relax', 'chill', 'easy', 'jazz', 'pop', 'groove', 'summer', 'sunset', 'breeze', 'coffee', 'lo-fi', 'nurlela', 'shawty'],
  'senang': ['happy', 'dance', 'disco', 'fun', 'upbeat', 'party', 'joy', 'sun', 'bright', 'smile', 'energy', 'vibe', 'birds of a feather'],
  'olahraga': ['workout', 'rock', 'metal', 'electronic', 'edm', 'energy', 'beat', 'fast', 'run', 'gym', 'heavy', 'power', 'starboy', 'blinding'],
  'fokus': ['focus', 'study', 'instrumental', 'classical', 'synthwave', 'piano', 'code', 'work', 'deep', 'flow', '505', 'sweater']
};

export const RETRO_GENRES = [
  { name: 'Synthwave', gradient: 'linear-gradient(135deg, #e13c50, #ffdc64)' },
  { name: '8-Bit', gradient: 'linear-gradient(135deg, #1a1c2c, #5d275d)' },
  { name: 'Chiptune', gradient: 'linear-gradient(135deg, #0f380f, #8bac0f)' },
  { name: 'Vaporwave', gradient: 'linear-gradient(135deg, #2ce8f4, #f038ff)' },
  { name: 'Shoegaze', gradient: 'linear-gradient(135deg, #404973, #68aed4)' },
  { name: 'Indie Pop', gradient: 'linear-gradient(135deg, #b55945, #ea8b54)' },
  { name: 'R&B / Soul', gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
  { name: 'Pop-Punk', gradient: 'linear-gradient(135deg, #ef4444, #f97316)' }
];
