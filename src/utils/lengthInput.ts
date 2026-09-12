/** Bare numbers are feet; explicit inch units and architectural fractions are supported. */
export function parseLengthInput(input:string):number|null {
  const s=input.trim().toLowerCase().replace(/[′’]/g,"'").replace(/[″“”]/g,'"').replace(/feet|foot|ft/g,"'").replace(/inches|inch|in/g,'"').trim()
  const number=String.raw`(?:\d+(?:\.\d*)?|\.\d+)`
  const inches=String.raw`(?:${number}(?:\s+\d+\/\d+)?|\d+\/\d+)`
  const amount=(v:string)=>v.trim().split(/\s+/).reduce((sum,part)=>{
    if(part.includes('/')){const [a,b]=part.split('/').map(Number);return sum+(b?a/b:NaN)}
    return sum+Number(part)
  },0)
  let result:number
  if(new RegExp(`^${number}$`).test(s))result=Number(s)
  else {
    const feet=s.match(new RegExp(`^(${number})\\s*'\\s*(?:-?\\s*(${inches})\\s*"?)?$`))
    const inch=s.match(new RegExp(`^(${inches})\\s*"$`))
    if(feet)result=Number(feet[1])+(feet[2]?amount(feet[2])/12:0)
    else if(inch)result=amount(inch[1])/12
    else return null
  }
  return Number.isFinite(result)&&result>0?result:null
}

export function formatLengthInput(feet:number):string {
  // Preserve precision for lengths that do not land on a sixteenth inch.
  const ticks=feet*192,rounded=Math.round(ticks)
  if(Math.abs(ticks-rounded)>1e-6)return String(feet)
  const wholeFeet=Math.floor(rounded/192),inchTicks=rounded%192,wholeInches=Math.floor(inchTicks/16)
  let numerator=inchTicks%16,denominator=16
  while(numerator&&numerator%2===0){numerator/=2;denominator/=2}
  return `${wholeFeet}'${wholeInches}${numerator?` ${numerator}/${denominator}`:''}"`
}
