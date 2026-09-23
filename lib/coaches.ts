export type Coach = { name:string; icon:string; description:string; drills:string[] };
export const coaches: Coach[] = [
 {name:'Beginner Rock Coach',icon:'🎸',description:'Build strong fundamentals, rhythm, chords, and confidence.',drills:['Power-chord changes','Downstroke endurance','Simple rock riffs']},
 {name:'Solo Coach',icon:'🔥',description:'Develop bends, vibrato, phrasing, scales, and expressive solos.',drills:['Pentatonic sequences','Bend intonation','Call-and-response phrases']},
 {name:'Chord & Rhythm Coach',icon:'🥁',description:'Lock into the groove with clean chords and powerful rhythm.',drills:['Chord transitions','Palm muting','Metronome groove work']},
 {name:'Technique Coach',icon:'⚡',description:'Improve picking, speed, legato, and fretboard control.',drills:['Alternate picking','Hammer-ons and pull-offs','String crossing']},
 {name:'Song Coach',icon:'🎵',description:'Break songs into manageable sections and practice them intelligently.',drills:['Riff isolation','Section loops','Full-song performance']}
];
export const plan = [{title:'Warm up',time:'10 min',text:'Chromatic exercise with relaxed hands.'},{title:'Core technique',time:'15 min',text:'Alternate picking and clean string changes.'},{title:'Song or solo',time:'20 min',text:'Practice one section slowly with a metronome.'},{title:'Play for fun',time:'10 min',text:'Finish by improvising over a rock backing track.'}];
