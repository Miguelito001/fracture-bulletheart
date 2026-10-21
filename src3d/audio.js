// FRACTURE sound engine — Web Audio, no external media, no permissions.
// Every event is synthesized at interaction time and requires a user gesture.
// Distinct sword, revolver, impacts, movement, doors and atmospheric ambience.
export class AudioBus {
 constructor(){this.ctx=null;this.master=null;this.enabled=true;this.noise=null;this.ambientClock=0;this.started=false;}
 unlock(){
  if(!this.enabled)return;
  if(!this.ctx){
   const AC=window.AudioContext||window.webkitAudioContext;
   if(!AC)return;
   this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=.36;this.master.connect(this.ctx.destination);
   this.noise=this.ctx.createBuffer(1,Math.round(this.ctx.sampleRate*.5),this.ctx.sampleRate);
   const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  }
  if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
  this.started=true;
 }
 mute(flag){this.enabled=!flag;if(this.master)this.master.gain.setTargetAtTime(this.enabled?.36:0,this.ctx.currentTime,.08);}
 tone(frequency,to,duration,volume=.25,type='sine',delay=0){
  if(!this.ctx||!this.enabled)return;
  const start=this.ctx.currentTime+delay,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();
  osc.type=type;osc.frequency.setValueAtTime(Math.max(20,frequency),start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20,to),start+duration);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(Math.max(.00011,volume),start+.008);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(gain);gain.connect(this.master);osc.start(start);osc.stop(start+duration+.02);
 }
 burst(duration=.18,volume=.13,cutoff=1600,filterType='bandpass',delay=0){
  if(!this.ctx||!this.enabled)return;
  const now=this.ctx.currentTime+delay,source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();
  source.buffer=this.noise;filter.type=filterType;filter.frequency.value=cutoff;filter.Q.value=.7;
  gain.gain.setValueAtTime(Math.max(.00011,volume),now);
  gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  source.connect(filter);filter.connect(gain);gain.connect(this.master);
  source.start(now);source.stop(now+duration+.01);
 }
 play(event){
  if(!this.ctx||!this.enabled)return;
  switch(event){
   case 'sword':this.burst(.21,.20,1900);this.tone(480,95,.20,.10,'triangle');break;
   case 'gun':this.burst(.27,.40,2200,'highpass');this.tone(160,45,.20,.34,'sawtooth');this.tone(890,180,.10,.12,'square');break;
   case 'hit':this.burst(.11,.17,380,'lowpass');this.tone(160,60,.16,.17,'triangle');break;
   case 'hurt':this.burst(.18,.15,600);this.tone(245,90,.33,.23,'sawtooth');break;
   case 'dodge':this.burst(.24,.11,840);this.tone(460,210,.19,.09);break;
   case 'step':this.burst(.06,.045,230,'lowpass');break;
   case 'gate':this.burst(.43,.12,320,'lowpass');this.tone(115,45,.48,.18,'sawtooth');break;
   case 'pickup':this.tone(480,820,.14,.12);this.tone(700,1100,.20,.10,'sine',.09);break;
   case 'heal':this.tone(330,660,.31,.15);this.tone(550,960,.29,.1,'sine',.08);break;
   case 'room':this.tone(130,180,.58,.11,'triangle');this.tone(260,350,.57,.07,'sine',.05);break;
   case 'death':this.tone(210,45,.85,.24,'sawtooth');this.burst(.65,.14,260,'lowpass');break;
  }
 }
 update(dt,environment){
  if(!this.ctx||!this.enabled||this.ctx.state!=='running')return;
  this.ambientClock-=dt;
  if(this.ambientClock<=0){
   const dark=environment==='dungeon';
   this.tone(dark?68:100,dark?64:103,4.7,.018,'sine');
   this.tone(dark?103:150,dark?96:145,4.2,.011,'triangle',.3);
   this.ambientClock=4.6;
  }
 }
}
