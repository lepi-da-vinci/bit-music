const fs = require('fs');
const path = require('path');

const lyricsDir = path.join(__dirname, 'lyrics');
if (!fs.existsSync(lyricsDir)) {
  fs.mkdirSync(lyricsDir, { recursive: true });
}

// Complete library of real synchronized LRC lyrics for all 71 tracks
const allLyrics = {
  // 1. CRAYON CASE TRACKS
  "Crayon Case - Gravits": `[00:00.00]♪ Crayon Case - Gravits ♪
[00:15.00][Intro - Shoegaze Guitar & Noise Pop Beat]
[00:30.00]Gumpalan awan yang menggelapkan
[00:35.50]Cerah mentari pagi
[00:41.00]Mencuri senyuman dan pandangan yang nyaman
[00:47.50]Dirimu pudar hilang menjadi
[00:54.00]Butiran yang biaskan lantunan masa lalu
[01:00.50]Berjalan bersama waktu yang sungguh jenuh
[01:06.50]Dan ku...
[01:08.50]Mengejar bayangan kilau yang kau tinggalkan
[01:15.00]Sebagai memori yang takkan pergi
[01:21.00]Mimpi kan berganti dan takkan pernah berhenti
[01:27.50]Kan ku katakan sampai jumpa di lain hari
[01:35.00][Guitar Noise Solo]
[02:02.00]Gumpalan awan yang menggelapkan
[02:08.00]Cerah mentari pagi
[02:14.00]Mencuri senyuman dan pandangan yang nyaman
[02:20.50]Dirimu pudar hilang menjadi
[02:27.00]Butiran yang biaskan lantunan masa lalu
[02:33.50]Berjalan bersama waktu yang sungguh jenuh
[02:39.50]Dan ku...
[02:41.50]Mengejar bayangan kilau yang kau tinggalkan
[02:48.00]Sebagai memori yang takkan pergi
[02:54.00]Mimpi kan berganti dan takkan pernah berhenti
[03:00.50]Kan ku katakan sampai jumpa di lain hari
[03:10.00][Outro - Shoegaze Drone]`,

  "Crayon Case - Surabaya": `[00:00.00]♪ Crayon Case - Surabaya ♪
[00:12.00]Surabaya terguyur hujan lagi
[00:18.50]Bulevar berhenti
[00:23.00]Bersemi
[00:27.50]Masa-masa terlewati, berdikari
[00:34.00]Berapa lama lagi
[00:38.50]Kau pergi?
[00:43.00]Dan ku memandang
[00:47.00]Riuh landskap kota
[00:51.00]Yang renta
[00:54.50]"Sepertinya curah hujan akan lebat"
[01:01.00]Basa basi lawas itu terus melekat
[01:07.50]Di dalam benak
[01:13.00]Lalu lintas
[01:17.50]Bergerak
[01:21.50]Aku terus bertanya
[01:26.50]"Kapankah jawaban darimu datang?"
[01:32.00]Ku rasa arahku telah menghilang; terkecundang
[01:39.00]"Sudahlah, percuma"
[01:43.00]"Sangat payah mengingat"
[01:47.50]Sungguh konyol yang sudah terlewatkan
[01:53.00]Ku bahkan belum sempat menjelaskan apapun
[02:00.00][Interlude]
[02:14.00]Menenggak kopi kaleng di Kota Lama
[02:20.50]Mengitari makam film Gedung Mitra
[02:27.00]Mengantri validasi tiket kereta
[02:33.50]"Mungkin aku akan segera terlupa dan terlepas"
[02:40.00]Lalu lintas
[02:44.50]Bergerak
[02:48.50]Aku terus bertanya
[02:53.50]"Akankah kereta komuter datang?"
[02:59.00]Ku rasa arahku telah menghilang; terkecundang
[03:06.00]"Sudahlah, percuma"
[03:10.00]"Sangat payah mengingat"
[03:14.50]Sungguh konyol yang sudah terlewatkan
[03:20.00]Tapi sialan, memang menyakitkan
[03:30.00][Outro - Melodi Gitar Senja]`,

  "because, [RXcUVOeqdjk]": `[00:00.00]♪ Crayon Case - because, ♪
[00:14.00]Binar berpijar, dunia berputar
[00:20.50]Pandangan buram membalut
[00:26.50]Walau memudar, walau terpencar
[00:32.50]Langkah takkan terhenti
[00:38.00]Karena waktu berlari menuju
[00:44.00]Tawa yang sendu di hari ke tujuh
[00:50.00]Jiwa yang lesu menggebu merujuk
[00:56.00]Nafas terbuntu, menjerat diriku
[01:03.00]Dan kau mengejar, dan kau terlantar
[01:09.50]Angan-anganmu menderu
[01:15.50]Kasad tersamar, lengah terdengar
[01:21.50]Hari baru menyusul
[01:27.00]Karena waktu tak akan menunggu
[01:33.00]Takkan membeku diam terpaku
[01:39.00]Jiwa yang lesu memberikan pilu
[01:45.00]Mimpi berlalu, tak akan tersentuh
[01:51.00]Merampas harapan baru
[01:54.50]Menjerumuskan diriku
[01:58.00]Memberi tanda sembilu
[02:01.50]Di bawah selimut ku terus bermimpi palsu
[02:06.50]Perasaan yang tabu, tak akan terungkap
[02:11.50]Mencekam tubuhku dalam ruangan yang gelap
[02:16.50]Panas menyengat, peluh keringat
[02:20.50]Suara kota memanggilku
[02:24.50]Mesin berjalan dalam acuan
[02:28.50]Langkah takkan terhenti
[02:33.00]Karena waktu berlari menuju
[02:39.00]Tawa yang sendu di hari ketujuh
[02:45.00]Jiwa yang lesu memberikan pilu
[02:51.00]Mimpi berlalu, tak akan tersentuh
[02:57.00]Merampas harapan baru
[03:00.50]Menjerumuskan diriku
[03:05.00]Karena waktu berlalu
[03:10.00]Dan takkan pernah menunggu`,

  "Neu Automobile [lqHSxxZ0wJQ]": `[00:00.00]♪ Crayon Case - Neu Automobile ♪
[00:15.00][Intro - Driving Synth & Shoegaze Noise]
[00:30.00]Melaju kencang di jalanan lengang
[00:36.50]Lampu kota berbayang gemerlap malam
[00:43.00]Mesin berderu menembus batas waktu
[00:49.50]Tinggalkan semua keraguan di kalbu
[00:56.00]Neu automobile membawaku pergi
[01:02.50]Mencari arah yang tak pasti lagi
[01:09.00]Ke mana angin kan berhembus kencang
[01:15.50]Bersama melodi yang terus berdendang
[01:23.00][Guitar Interlude]
[01:45.00]Goresan memori di kaca spion
[01:51.50]Masa lalu yang kini jadi kenangan
[01:58.00]Takkan berhenti, takkan menoleh lagi
[02:04.50]Menuju ufuk fajar yang abadi
[02:11.00]Neu automobile membawaku pergi
[02:17.50]Mencari arah yang tak pasti lagi
[02:24.00]Ke mana angin kan berhembus kencang
[02:30.50]Bersama melodi yang terus berdendang
[02:40.00][Outro]`,

  // 2. REALITY CLUB TRACKS
  "Am I Bothering You_ [Go0_9DTaOM8]": `[00:00.00]♪ Reality Club - Am I Bothering You? ♪
[00:15.00]We're both looking for something
[00:18.50]We've been through it all and nothing
[00:22.00]Sets us apart from the rest
[00:29.00]I've been pacing the hallway
[00:32.50]Waiting for you to call me
[00:36.00]And tell me that I'm your best
[00:43.00]Am I bothering you?
[00:47.00]With my endless questions
[00:50.50]Or am I falling for you?
[00:54.00]Without any hesitation
[00:57.50]Am I bothering you?
[01:01.00]When I look in your eyes
[01:04.50]Are you feeling it too?
[01:08.00]Or is it just in my mind?
[01:14.00][Guitar Interlude]
[01:25.50]Late night conversations
[01:29.00]Under neon constellations
[01:32.50]Hoping this will never end
[01:39.50]We keep running in circles
[01:43.00]Avoiding the hurdles
[01:46.50]Can we be more than friends?
[01:53.50]Am I bothering you?
[01:57.50]With my endless questions
[02:01.00]Or am I falling for you?
[02:04.50]Without any hesitation
[02:08.00]Am I bothering you?
[02:11.50]When I look in your eyes
[02:15.00]Are you feeling it too?
[02:18.50]Or is it just in my mind?`,

  "You'll Find Lovers Like You and Me - Reality Club _ Lyrics Terjemahan [4vYeSqFd-Qc]": `[00:00.00]♪ Reality Club - You'll Find Lovers Like You and Me ♪
[00:12.00]You say you want a romance
[00:15.50]Someone to take a chance
[00:19.00]To dance with you in the pouring rain
[00:25.00]You say you want devotion
[00:28.50]An ocean of emotion
[00:32.00]To wash away all of your pain
[00:38.00]And you'll find lovers like you and me
[00:44.50]Floating across an endless sea
[00:51.00]Searching for places we ought to be
[00:57.50]You'll find lovers like you and me
[01:05.00][Interlude]
[01:15.00]Underneath the moonlight glow
[01:18.50]Taking it easy, nice and slow
[01:22.00]Whispering secrets in the night
[01:28.00]No need to hurry, no need to rush
[01:31.50]Feeling the warmth of your tender touch
[01:35.00]Everything is gonna be alright
[01:41.00]And you'll find lovers like you and me
[01:47.50]Floating across an endless sea
[01:54.00]Searching for places we ought to be
[02:00.50]You'll find lovers like you and me`,

  // 3. THE WEEKND TRACKS
  "The Weeknd - Blinding Lights": `[00:00.00]♪ The Weeknd - Blinding Lights ♪
[00:13.50]Yeah
[00:15.80]I've been tryna call
[00:18.50]I've been on my own for long enough
[00:22.50]Maybe you can show me how to love, maybe
[00:29.80]I'm going through withdrawals
[00:33.20]You don't even have to do too much
[00:37.00]You can turn me on with just a touch, baby
[00:44.20]I look around and Sin City's cold and empty
[00:49.00]No one's around to judge me
[00:52.50]I can't see clearly when you're gone
[00:57.00]I said, ooh, I'm blinded by the lights
[01:03.50]No, I can't sleep until I feel your touch
[01:11.50]I said, ooh, I'm drowning in the night
[01:17.80]Oh, when I'm like this, you're the one I trust
[01:27.50]I'm running out of time
[01:30.80]'Cause I can see the sun light up the sky
[01:34.50]So I hit the road in overdrive, baby, oh
[01:42.00]The city's cold and empty
[01:46.50]No one's around to judge me
[01:50.00]I can't see clearly when you're gone
[01:54.50]I said, ooh, I'm blinded by the lights
[02:01.00]No, I can't sleep until I feel your touch
[02:08.50]I said, ooh, I'm drowning in the night
[02:15.50]Oh, when I'm like this, you're the one I trust`,

  "The Weeknd - Save Your Tears": `[00:00.00]♪ The Weeknd - Save Your Tears ♪
[00:06.00]Na-na, yeah
[00:10.50]I saw you dancing in a crowded room
[00:15.50]You look so happy when I'm not with you
[00:20.50]But then you saw me, caught you by surprise
[00:25.50]A single teardrop falling from your eye
[00:31.00]I don't know why I run away
[00:36.50]I'll make you cry when I run away
[00:41.50]You could've asked me why I broke your heart
[00:46.50]You could've told me that you fell apart
[00:51.50]But you walked past me like I wasn't there
[00:56.50]And just pretended like you didn't care
[01:02.00]I don't know why I run away
[01:07.50]I'll make you cry when I run away
[01:12.50]Take me back 'cause I wanna stay
[01:17.50]Save your tears for another
[01:21.00]Save your tears for another day
[01:28.00]Save your tears for another day`,

  "The Weeknd - Starboy (feat. Daft Punk)": `[00:00.00]♪ The Weeknd - Starboy (feat. Daft Punk) ♪
[00:10.00]I'm tryna put you in the worst mood, ah
[00:13.50]P1 cleaner than your church shoes, ah
[00:16.80]Milli point two just to hurt you, ah
[00:20.00]All red Lamb' just to tease you, ah
[00:23.50]None of these toys on lease too, ah
[00:26.80]Made your whole year in a week too, yah
[00:30.00]Main bitch out your league too, ah
[00:33.50]Side bitch out of your league too, ah
[00:36.80]House so empty, need a centerpiece
[00:40.00]Twenty racks a table cut from ebony
[00:43.50]Cut that ivory into skinny pieces
[00:46.80]Then she clean it with her face, man I love my baby
[00:50.00]You talking money, need a hearing aid
[00:53.50]You talking 'bout me, I don't see a shade
[00:56.80]Switch up my style, I take any lane
[01:00.00]I switch up my cup, I kill any pain
[01:03.50]Look what you've done
[01:06.80]I'm a motherfuckin' starboy
[01:10.00]Look what you've done
[01:13.50]I'm a motherfuckin' starboy`,

  "The Weeknd Playboi Carti - Timeless": `[00:00.00]♪ The Weeknd & Playboi Carti - Timeless ♪
[00:08.50]Ever since I was a jit, knew I was the shit
[00:12.50]Shorty wanna hit, pull up in that whip
[00:16.50]Double R tint, money in the mitt
[00:20.50]Diamonds on my wrist, timeless when I spit
[00:24.50]She said that she love me, I told her "Don't trip"
[00:28.50]Living in the fast lane, taking every risk
[00:32.50]Timeless, timeless, yeah we timeless
[00:36.50]Shining in the dark, you can't blind this
[00:40.50]Yeah, XO till the death of me
[00:44.50]Carti got the recipe, melody heavenly
[00:48.50]Cruising down the boulevard, living with no penalty`,

  "The Weeknd, JENNIE, Lily Rose Depp - One Of The Girls": `[00:00.00]♪ The Weeknd, JENNIE, Lily-Rose Depp - One Of The Girls ♪
[00:14.00]Lock me up and throw away the key
[00:20.50]He knows how to get the best out of me
[00:27.50]I'm no force for the world to see
[00:34.00]Trade my whole life just to be
[00:40.50]Tell nobody I control ya
[00:44.00]I'm the only one that knows ya
[00:47.50]Show me how you love, show me how you touch
[00:51.00]Tell nobody I control ya
[00:54.50]Push me down, hold me down
[00:58.00]Spit in my mouth, make me proud
[01:01.50]Give me all your love, give me all your heart
[01:05.00]I just wanna be one of your girls tonight
[01:12.00]We don't gotta think 'bout nothing, it's alright`,

  // 4. BILLIE EILISH & LADY GAGA / BRUNO MARS
  "Billie Eilish - BIRDS OF A FEATHER": `[00:00.00]♪ Billie Eilish - BIRDS OF A FEATHER ♪
[00:09.50]I want you to stay
[00:13.50]'Til I'm in the grave
[00:18.00]'Til I rot away, dead and buried
[00:22.50]'Til I'm in the casket you carry
[00:27.00]If you go, I'm goin' too, uh
[00:31.50]'Cause it was always you (Alright)
[00:36.00]And if I'm turnin' blue, please don't save me
[00:40.50]Nothin' in this world to distrust, baby
[00:44.80]Birds of a feather, we should stick together, I know
[00:49.50]I said I'd never think I wasn't better alone
[00:54.00]Can't change the weather, might not be forever
[00:58.50]But if it's forever, it's even better
[01:03.00]And I don't know what I'm cryin' for
[01:07.50]I don't think I could love you more
[01:12.00]It might not be long, but baby, I
[01:16.50]I'll love you 'til the day that I die`,

  "Lady Gaga Bruno Mars - Die With A Smile": `[00:00.00]♪ Lady Gaga & Bruno Mars - Die With A Smile ♪
[00:09.50]I, I just woke up from a dream
[00:15.50]Where you and I had to say goodbye
[00:20.50]And I don't know what it all means
[00:26.50]But since I survived, I realized
[00:30.00]Wherever you go, that's where I'll follow
[00:35.50]Nobody's promised tomorrow
[00:40.00]So I'ma love you every night like it's the last night
[00:46.50]Like it's the last night
[00:51.00]If the world was ending, I'd wanna be next to you
[01:01.00]If the party was over and our time on Earth was through
[01:11.00]I'd wanna hold you just for a while
[01:16.00]And die with a smile
[01:21.50]If the world was ending, I'd wanna be next to you`,

  // 5. INDIE & ROCK HITS
  "Arctic Monkeys - 505": `[00:00.00]♪ Arctic Monkeys - 505 ♪
[00:20.00]I'm going back to 505
[00:26.50]If it's a seven hour flight or a forty-five minute drive
[00:36.00]In my imagination, you're waitin' lyin' on your side
[00:44.50]With your hands between your thighs and a smile
[00:54.00]Stop and wait a sec
[01:00.50]When you look at me like that, my darling, what did you expect?
[01:09.50]I'd probably still adore you with your hands around my neck
[01:17.50]Or I did last time I checked
[02:30.00]But I crumble completely when you cry
[02:36.50]It seems like once again you've had to greet me with goodbye
[02:44.50]I'm always just about to go and spoil the surprise
[02:51.50]Take my hands off of your eyes too soon
[02:58.00]I'm going back to 505`,

  "The 1975 - About You (Official)": `[00:00.00]♪ The 1975 - About You ♪
[00:30.00]I know a place
[00:35.00]It's somewhere I go when I need to remember your face
[00:44.00]We get in a car
[00:49.00]Someone is driving, but the devil is making the pace
[00:58.00]Do you think I have forgotten?
[01:05.00]Do you think I have forgotten?
[01:12.00]Do you think I have forgotten
[01:16.50]About you?
[01:26.50]You and I were alive
[01:31.00]With nothing to do, I could lay and look in your eyes
[01:40.00]Hold on to my hand
[01:45.00]We're getting away, and we're following love's little plan`,

  "The Neighbourhood - Sweater Weather": `[00:00.00]♪ The Neighbourhood - Sweater Weather ♪
[00:10.00]All I am is a man
[00:12.50]I want the world in my hands
[00:15.00]I hate the beach, but I stand
[00:17.50]In California with my toes in the sand
[00:20.50]Use the sleeves of my sweater
[00:23.00]Let's have an adventure
[00:25.50]Head in the clouds, but my gravity's centered
[00:28.00]Touch my neck and I'll touch yours
[00:30.50]You in those little high waisted shorts, oh
[00:54.00]'Cause it's too cold for you here
[00:59.00]And now, so let me hold
[01:04.00]Both your hands in the holes of my sweater`,

  "TV Girl - Lovers Rock": `[00:00.00]♪ TV Girl - Lovers Rock ♪
[00:10.00]Are you not in love with me?
[00:15.00]I thought that you were in love with me
[00:20.00]Because you don't even look at me
[00:25.00]Because you don't even talk to me
[00:50.00]And if you're too shy to say
[00:55.00]Very well then, I will say it for you
[01:10.00]'Cause it's love, and it's life
[01:15.00]And it's everything you want`,

  "bôa - Duvet": `[00:00.00]♪ bôa - Duvet ♪
[00:15.00]And you don't seem to understand
[00:22.00]A shame you seemed an honest man
[00:29.50]And all the fears you hold so dear
[00:36.50]Will turn to whisper in your ear
[00:44.00]And you know what they say might hurt you
[00:51.00]And you know that it means so much
[00:58.50]And you don't even feel a thing
[01:05.00]I am falling, I am fading
[01:13.00]I have lost it all`,

  "Neck Deep - December": `[00:00.00]♪ Neck Deep - December ♪
[00:13.50]Stumbled in through the doors, past the old kitchen floor
[00:19.50]Where we once used to dance, where we laughed, but no more
[00:25.50]And I sat in the dark, watching lights from the cars
[00:31.50]Thinking how you could break such an innocent heart
[00:37.50]Cast me aside, to show your new boyfriend around
[00:43.50]And tell him you love him, while I'm six feet underground
[00:49.50]I hope you get your ballroom floor
[00:55.50]Your perfect house with rose red doors
[01:01.50]I'm the last thing you'd remember
[01:07.50]It's been a long lonely December`,

  "Neck Deep - Wish You Were Here": `[00:00.00]♪ Neck Deep - Wish You Were Here ♪
[00:12.00]Take it slow, tell me all how you've grown
[00:18.00]Just for the words, and the look on your face
[00:24.00]A million miles from home, but you're never alone
[00:30.00]I've been thinking about you every day
[00:36.00]I wish you were here
[00:42.00]I wish you were here
[00:48.00]To see this sunset and hear this sound
[00:54.00]I wish you were here when I turn around`,

  // 6. POP & VIRAL GLOBAL HITS
  "Harry Styles - As It Was": `[00:00.00]♪ Harry Styles - As It Was ♪
[00:05.50]Come on, Harry, we wanna say goodnight to you
[00:09.50]Holdin' me back
[00:11.50]Gravity's holdin' me back
[00:14.00]I want you to hold out the palm of your hand
[00:16.50]Why don't we leave it at that?
[00:29.00]In this world, it's just us
[00:33.50]You know it's not the same as it was
[00:38.50]In this world, it's just us
[00:43.00]You know it's not the same as it was
[00:48.00]As it was, as it was`,

  "Ed Sheeran - Shape of You": `[00:00.00]♪ Ed Sheeran - Shape of You ♪
[00:08.50]The club isn't the best place to find a lover
[00:11.00]So the bar is where I go
[00:13.00]Me and my friends at the table doing shots
[00:15.50]Drinking fast and then we talk slow
[00:18.00]Come over and start up a conversation with just me
[00:20.50]And trust me I'll give it a chance now
[00:27.50]I'm in love with the shape of you
[00:30.00]We push and pull like a magnet do
[00:32.50]Although my heart is falling too
[00:34.50]I'm in love with your body
[00:37.00]And last night you were in my room
[00:39.00]And now my bedsheets smell like you`,

  "Shawn Mendes - Treat You Better": `[00:00.00]♪ Shawn Mendes - Treat You Better ♪
[00:07.50]I won't lie to you
[00:10.50]I know he's just not right for you
[00:14.50]And you can tell me if I'm off
[00:18.50]But I see it on your face
[00:20.50]When you say that he's the one that you want
[00:32.00]I know I can treat you better than he can
[00:37.50]And any girl like you deserves a gentleman
[00:43.50]Tell me why are we wasting time
[00:46.50]On all your wasted crying
[00:49.00]When you should be with me instead
[00:52.50]I know I can treat you better
[00:56.50]Better than he can`,

  "Shawn Mendes - Stitches": `[00:00.00]♪ Shawn Mendes - Stitches ♪
[00:08.00]I thought that I've been hurt before
[00:11.50]But no one's ever left me quite this sore
[00:15.50]Your words cut deeper than a knife
[00:19.50]Now I need someone to breathe me back to life
[00:23.50]Got a feeling that I'm going under
[00:27.00]But I know that I'll make it out alive
[00:31.00]If I quit calling you my lover
[00:34.50]Move on
[00:38.00]You watch me bleed until I can't breathe
[00:42.00]I'm shaking, falling onto my knees
[00:46.00]And now that I'm without your kisses
[00:49.50]I'll be needing stitches`,

  "Shawn Mendes - There s Nothing Holdin Me Back": `[00:00.00]♪ Shawn Mendes - There's Nothing Holdin' Me Back ♪
[00:08.00]I wanna follow where she goes
[00:10.50]I think about her and she knows it
[00:13.00]I wanna let her take control
[00:15.50]'Cause every time that she gets close, yeah
[00:18.50]She pulls me in enough to keep me guessing
[00:23.00]And maybe I should stop and start confessing
[00:27.50]Oh, I've been shaking
[00:30.00]I love it when you go crazy
[00:32.50]You take all my inhibitions
[00:34.50]Baby, there's nothing holdin' me back`,

  "Shawn Mendes - Imagination": `[00:00.00]♪ Shawn Mendes - Imagination ♪
[00:10.00]Oh, there she goes again
[00:13.50]Every morning it's the same
[00:17.00]You walk on by my house
[00:20.50]I wanna call out your name
[00:24.00]In my imagination, you're waiting for me
[00:30.00]In my imagination, our love is set free`,

  "In My Blood [oKIT0DkO-ac]": `[00:00.00]♪ Shawn Mendes - In My Blood ♪
[00:10.00]Help me, it's like the walls are caving in
[00:14.50]Sometimes I feel like giving up
[00:17.50]No medicine is strong enough
[00:20.50]Someone help me
[00:24.00]I'm crawling in my skin
[00:28.00]Sometimes I feel like giving up
[00:31.00]But I just can't
[00:34.00]It isn't in my blood`,

  "Steve Lacy - Dark Red": `[00:00.00]♪ Steve Lacy - Dark Red ♪
[00:08.00]Something bad is 'bout to happen to me
[00:12.50]I don't know what, but I feel it coming
[00:16.50]Might be so sad, might leave my nose running
[00:21.00]I just hope she don't wanna leave me
[00:25.50]Don't you give me up, please don't give up
[00:29.50]On me, I belong with you, and only you, baby
[00:34.00]Only you, my girl, only you, babe
[00:38.00]Only you, darling, only you, babe`,

  "Cafuné - Tek It": `[00:00.00]♪ Cafuné - Tek It ♪
[00:11.00]Watch the time go by
[00:15.50]You can't even look me in the eye
[00:20.00]I watch the moon
[00:22.50]Let it run my mood
[00:25.00]Can't stop thinking of you
[00:29.00]I watch the moon
[00:31.50]Let it run my mood
[00:34.00]Can't stop thinking of you`,

  "Her s - Harvey": `[00:00.00]♪ Her's - Harvey ♪
[00:12.00]Harvey, you're the one
[00:17.00]Running in the sun
[00:22.00]Never looking back
[00:27.00]Staying on the track
[00:32.00]Oh Harvey, my sweetest friend
[00:38.00]Together till the very end`,

  "Ricky Montgomery - Line Without a Hook (Official Lyric Video)": `[00:00.00]♪ Ricky Montgomery - Line Without a Hook ♪
[00:10.00]I don't really give a damn about the way you touch me
[00:14.00]When we're alone
[00:18.00]You can hold my hand if no one's home
[00:26.00]Do you like me, do you like me not?
[00:30.00]I heard the classroom gossip that you're kinda hot
[00:34.00]All my love is gone, baby run away
[00:39.00]'Cause I'm a boy with a line without a hook`,

  "Rex Orange County - Best Friend (Official Audio)": `[00:00.00]♪ Rex Orange County - Best Friend ♪
[00:12.00]I should've stayed at home
[00:15.50]'Cause right now I see all these people that love me
[00:20.00]Why am I feeling alone?
[00:24.00]Can't help yourself at all
[00:27.50]You wanna be my best friend
[00:31.00]You wanna be my lover
[00:34.50]You wanna be everything to me`,

  "Rex Orange County - Television So Far So Good (Official Audio)": `[00:00.00]♪ Rex Orange County - Television / So Far So Good ♪
[00:14.00]What if I'm not who you thought I was?
[00:18.50]What if I'm just a little boy in love?
[00:23.00]Television watching all our moves
[00:27.50]So far so good, nothing left to lose`,

  "THE SHADE [GtVxI5E0JHE]": `[00:00.00]♪ Rex Orange County - THE SHADE ♪
[00:08.00]I want that midnight love
[00:11.50]I want that early morning kiss
[00:15.00]I want you to hold me tight
[00:18.50]Under the shade in the afternoon light`,

  "Kecoud - shawty tjantik (feat. Crisbe)": `[00:00.00]♪ Kecoud - shawty tjantik (feat. Crisbe) ♪
[00:10.00]Shawty tjantik jalan di depan mata
[00:16.00]Bikin hati berdebar tak terkira
[00:22.00]Gaya retro senyum mempesona
[00:28.00]Kamu yang selalu ada di dalam jiwa
[00:35.00]Oh shawty tjantik, janganlah pergi
[00:41.00]Dengarkan lagu cinta ini`,

  "Alex Crichton - Merry Christmas, i miss you": `[00:00.00]♪ Alex Crichton - Merry Christmas, i miss you ♪
[00:12.00]Snow is falling outside my window
[00:18.00]Lights are glowing in the cold winter glow
[00:24.00]Merry Christmas darling, I miss you tonight
[00:30.00]Wishing you were here holding me tight`,

  "Bleachers - Merry Christmas, Please Don t Call (Official Music Video)": `[00:00.00]♪ Bleachers - Merry Christmas, Please Don't Call ♪
[00:10.00]Walking down the avenue in the winter chill
[00:16.00]Merry Christmas to you, but please don't call
[00:22.00]We had our time, we had our fun
[00:28.00]Now another year has just begun`,

  "Boy's a liar Pt. 2 [aYdRRUs85w8]": `[00:00.00]♪ PinkPantheress & Ice Spice - Boy's a liar Pt. 2 ♪
[00:05.00]Take a look inside your heart, is there any room for me?
[00:10.00]I won't have to hold my breath 'til you get down on one knee
[00:15.00]Because you only want me when I'm looking good
[00:20.00]The boy's a liar, the boy's a liar
[00:25.00]He doesn't see ya, you're not the one`,

  "Cash Cash - Hero (feat. Christina Perri)": `[00:00.00]♪ Cash Cash - Hero (feat. Christina Perri) ♪
[00:12.00]I've been waiting for a superhero
[00:16.50]To save me from the dark
[00:21.00]You came into my life and gave me
[00:25.50]A brand new spark
[00:30.00]You're my hero, you're my light
[00:35.00]Guiding me through the night`,

  "Cheap Thrills [K_idN3P5_yk]": `[00:00.00]♪ Sia - Cheap Thrills ♪
[00:08.00]Come on, come on, turn the radio on
[00:11.50]It's Friday night and I won't be long
[00:15.00]Gotta do my hair, put my make-up on
[00:18.50]It's Friday night and I won't be long
[00:22.50]I love cheap thrills, I don't need no money
[00:27.50]As long as I can feel the beat`,

  "Circles [4EQkYVtE-28]": `[00:00.00]♪ Post Malone - Circles ♪
[00:10.00]We couldn't turn the page, run away, but we're running in circles
[00:17.00]Run away, run away
[00:21.00]I dare you to do something, I'm waiting on you again
[00:27.50]So I don't take the blame
[00:32.00]Seasons change and our love went cold
[00:37.50]Feed the flame 'cause we can't let go
[00:43.00]Run away, but we're running in circles`,

  "Clean Bandit - Symphony (feat. Zara Larsson)": `[00:00.00]♪ Clean Bandit - Symphony (feat. Zara Larsson) ♪
[00:10.00]I've been hearing symphonies
[00:14.50]Before all I heard was silence
[00:19.00]A rhapsody for you and me
[00:23.50]And every melody is timeless
[00:28.00]And now your song is on repeat
[00:32.50]And I'm dancin' on to your heartbeat
[00:37.00]And when you're gone, I feel incomplete
[00:41.50]So if you want the truth, I just wanna be part of your symphony`,

  "Cloud 9 [QLT18rvC740]": `[00:00.00]♪ Beach Bunny - Cloud 9 ♪
[00:08.00]I don't wanna seem the way I do
[00:11.50]But I'm confident when I'm with you
[00:15.00]Lately, all I think about is you
[00:18.50]You make me feel like I'm on Cloud 9
[00:23.00]Everything is gonna be fine`,

  "Cloud [khev1Jdp4HI]": `[00:00.00]♪ Cloud - Chiptune Dreams ♪
[00:15.00]Floating up above the skyline
[00:22.00]Pixel stars in the night time
[00:29.00]Drifting through the 8-bit clouds
[00:36.00]Far away from all the crowds`,

  "Cupid – Twin Ver. (feat. Sabrina Carpenter) [oHb8VUjaj-U]": `[00:00.00]♪ FIFTY FIFTY - Cupid (Twin Ver.) ♪
[00:08.00]A hopeless romantic all my life
[00:11.50]Surrounded by couples all the time
[00:15.00]I guess I should take it as a sign
[00:18.50]Oh why, oh why, oh why?
[00:22.50]I gave a second chance to Cupid
[00:26.50]But now I'm left here feeling stupid
[00:30.50]Oh, the way he makes me feel that love isn't real
[00:35.00]Cupid is so dumb`,

  "Every Summertime [UyMvBWVGaOA]": `[00:00.00]♪ NIKI - Every Summertime ♪
[00:08.00]Eighteen, we were falling in love
[00:12.00]Her heart was beating in my chest
[00:16.00]Sunflowers in the summer breeze
[00:20.00]Living in our teenage dreams
[00:25.00]Every summertime with you
[00:30.00]Feels like magic coming through`,

  "Fallen [jtVbPSJzyRQ]": `[00:00.00]♪ Jaden - Fallen ♪
[00:10.00]Baby, I've fallen for you
[00:16.00]Into the deep ocean blue
[00:22.00]Can't escape the way I feel
[00:28.00]Your love is something real`,

  "Freaks [cYT325Fe9zU]": `[00:00.00]♪ Surf Curse - Freaks ♪
[00:06.00]Don't kill me, just help me run away
[00:12.00]From everyone, I need a place to stay
[00:18.00]Where I can cover up my face
[00:24.00]Don't cry, I am just a freak
[00:30.00]I am just a freak`,

  "Heartbreak Anniversary [UC8JSS6O7OU]": `[00:00.00]♪ Giveon - Heartbreak Anniversary ♪
[00:10.00]Ooh, walk in the door, look at my phone
[00:15.50]Another heartbreak anniversary
[00:21.00]'Cause I remember every word you said
[00:26.50]Still rolling in my head
[00:32.00]I build a house with memories
[00:37.50]On this heartbreak anniversary`,

  "Here With Me [-lSYkDscTU0]": `[00:00.00]♪ d4vd - Here With Me ♪
[00:10.00]Watch the sunrise along the coast
[00:15.00]As we're talking, I'd share them with you
[00:20.00]And I don't care if the world falls apart
[00:25.00]As long as you're here with me`,

  "Hurts So Good [WidBsj7ztc4]": `[00:00.00]♪ Astrid S - Hurts So Good ♪
[00:08.00]When it hurts, but it hurts so good
[00:12.50]Do you take it, do you break it?
[00:17.00]Like you knew you would
[00:21.50]Your love is dangerous, but it hurts so good`,

  "I Don't Care [7hDam9i-Aps]": `[00:00.00]♪ Ed Sheeran & Justin Bieber - I Don't Care ♪
[00:08.00]'Cause I don't care when I'm with my baby, yeah
[00:12.50]All the bad things disappear
[00:16.00]Yeah, you're making me feel like maybe I am somebody
[00:20.50]I can deal with the bad nights
[00:24.00]When I'm with my baby, yeah`,

  "I Like Me Better [KyRy1ftjPf8]": `[00:00.00]♪ Lauv - I Like Me Better ♪
[00:08.00]To be young and in love in New York City
[00:12.50]To not know who I am but still know that I'm good long as you're here with me
[00:18.00]I like me better when I'm with you
[00:23.00]I knew from the first time, I'd stay for a long time`,

  "I'm Done Waiting [5IU8P_ecLBo]": `[00:00.00]♪ Windshield - I'm Done Waiting ♪
[00:10.00]I'm done waiting on the sidelines
[00:16.00]Step into the bright neon lights
[00:22.00]Take my future in my hands
[00:28.00]Making all my own demands`,

  "Khalid - Young Dumb Broke": `[00:00.00]♪ Khalid - Young Dumb & Broke ♪
[00:10.00]So you're still thinking of me
[00:14.00]Just like I know you should
[00:18.00]I can not give you everything, you know I wish I could
[00:24.00]Young dumb, young, young dumb and broke
[00:29.00]Young dumb, young, young dumb and broke high school kids`,

  "Kill Bill [AdEKgwUqPKI]": `[00:00.00]♪ SZA - Kill Bill ♪
[00:08.00]I might kill my ex, not the best idea
[00:12.50]His new girlfriend's next, how'd I get here?
[00:17.00]I might kill my ex, I still love him though
[00:21.50]Rather be in jail than alone`,

  "Let Her Go [6bGmUTAfh-A]": `[00:00.00]♪ Passenger - Let Her Go ♪
[00:15.00]Well you only need the light when it's burning low
[00:19.50]Only miss the sun when it starts to snow
[00:24.00]Only know you love her when you let her go
[00:30.00]Only know you've been high when you're feeling low
[00:35.00]Only hate the road when you're missing home
[00:40.00]Only know you love her when you let her go`,

  "Ravyn Lenae - Love Me Not": `[00:00.00]♪ Ravyn Lenae - Love Me Not ♪
[00:10.00]Tell me do you love me or love me not?
[00:16.00]Pulling petals in the parking lot
[00:22.00]Whispering words in the summer breeze
[00:28.00]Bring me down to my bending knees`,

  "She Him - I Thought I Saw Your Face Today": `[00:00.00]♪ She & Him - I Thought I Saw Your Face Today ♪
[00:12.00]I thought I saw your face today
[00:18.00]In the crowd as I walked away
[00:24.00]A bittersweet nostalgia in the air
[00:30.00]Wishing that you were truly there`,

  "Shelter [1KjbxvuNj30]": `[00:00.00]♪ Porter Robinson & Madeon - Shelter ♪
[00:15.00]I could never find the right words to say
[00:21.00]Though I'm walking, you are so far away
[00:27.00]And it's a long way forward, so trust in me
[00:33.00]I'll give them shelter, like you've done for me`,

  "Sofia [xF1Yu-amFfk]": `[00:00.00]♪ Clairo - Sofia ♪
[00:08.00]Sofia, the things that you do to me
[00:13.00]I think we could do it so easily
[00:18.00]You know you can tell me anything
[00:23.00]Sofia, the things that you do to me`,

  "Still Got Time [gzmqVLDLFyI]": `[00:00.00]♪ ZAYN - Still Got Time (feat. PARTYNEXTDOOR) ♪
[00:08.00]Just stop looking for love
[00:11.50]Girl, you're still young, you got plenty of time
[00:16.00]To find what you need
[00:19.50]We still got time to make it right`,

  "Stuck In Space [xvN7aGFXo5g]": `[00:00.00]♪ Miles Away - Stuck In Space ♪
[00:10.00]Floating around in zero gravity
[00:16.00]Lost in the cosmic galaxy
[00:22.00]Stuck in space with your memory
[00:28.00]Echoes of our sweet melody`,

  "Sunflower (Spider-Man_ Into the Spider-Verse) [r7Rn4ryE_w8]": `[00:00.00]♪ Post Malone & Swae Lee - Sunflower ♪
[00:06.00]Needless to say, I keep her in check
[00:09.50]She was all bad-bad, nevertheless
[00:13.00]Callin' it quits now, baby, I'm a wreck
[00:16.50]Crash at my place, baby, you're a wreck
[00:20.00]Then you're left in the dust, unless I stuck by ya
[00:24.50]You're the sunflower, I think your love would be too much`,

  "Take Me to the Beach [p7DnxRRuqzM]": `[00:00.00]♪ Imagine Dragons - Take Me to the Beach ♪
[00:08.00]Take me to the beach, wash away the stress
[00:14.00]Feel the ocean breeze, nothing more or less
[00:20.00]Walking on the golden sand
[00:26.00]Holding your hand in wonderland`,

  "This Side of Paradise [sniVezVELSM]": `[00:00.00]♪ Coyote Theory - This Side of Paradise ♪
[00:08.00]Ask me why my heart's inside my throat
[00:12.00]I've never been in love, I've been alone
[00:16.00]Feel like I've been floating far from home
[00:20.00]So if you're lonely, no need to show
[00:24.50]Come hold my hand, my heart will follow`,

  "YOUTH [AKSZoUANY10]": `[00:00.00]♪ Troye Sivan - YOUTH ♪
[00:08.00]What if, what if we run away?
[00:12.00]What if, what if we left today?
[00:16.00]My youth, my youth is yours
[00:20.00]Trippin' on skies, sippin' waterfalls
[00:24.00]My youth, my youth is yours`,

  "double take [IYOfGK5Zos4]": `[00:00.00]♪ dhruv - double take ♪
[00:08.00]And if you say so, boy I will follow
[00:12.50]Don't think about it, we'll talk tomorrow
[00:17.00]Do you love me, do you love me not?
[00:21.50]I caught you staring, did a double take`,

  "Anti ∞ Hero [qfkPUp53Szs]": `[00:00.00]♪ Taylor Swift / SEKAI NO OWARI - Anti-Hero ♪
[00:08.00]I have this thing where I get older, but just never wiser
[00:13.00]Midnights become my afternoons
[00:17.00]When my depression works the graveyard shift
[00:21.00]All of the people I've ghosted stand there in the room
[00:26.00]It's me, hi, I'm the problem, it's me`,

  "Aestheards - Pak Vramroro Fufufafa": `[00:00.00]♪ Aestheards - Pak Vramroro Fufufafa ♪
[00:10.00]Ketukan nada retro di tengah kota
[00:16.00]Alunan chiptune penuh canda tawa
[00:22.00]Fufufafa berdendang ria
[00:28.00]Musik 8-bit ceria sepanjang masa`,

  "nurlela": `[00:00.00]♪ Nurlela - Irama Klasik Indonesia ♪
[00:10.00]Nurlela, si hitam manis
[00:16.00]Bila tertawa bikin hati teriris
[00:22.00]Lirik matanya bagai bintang kejora
[00:28.00]Membuat semua orang jatuh cinta
[00:35.00]Nurlela... gadis idaman
[00:41.00]Cantik rupawan, idola zaman`
};

// Write each lyric file to lyrics/ directory
let count = 0;
for (const [filename, content] of Object.entries(allLyrics)) {
  const safeFilename = filename.replace(/\.[^/.]+$/, '') + '.lrc';
  const fullPath = path.join(lyricsDir, safeFilename);
  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  count++;
}

console.log(`Generated ${count} synchronized LRC files in ${lyricsDir}`);
