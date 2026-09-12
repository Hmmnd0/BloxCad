import type { Project } from '../types'
import { permitSheetHTML, type PermitData } from './permitSheet'
import { buildPrintSheet } from './printSheet'
import { syncPermitSchedules } from './permitSync'

/** Named page size keeps the drawing's physical scale independent of schedule pagination. */
export async function buildPermitSetHTML(project:Project,data:PermitData) {
  data=syncPermitSchedules(project,data)
  const sheet=await buildPrintSheet({...project,permitData:data},true,true,'image/png')
  const {widthIn,heightIn}=sheet.page
  const style=`<style>@page drawing{size:${widthIn}in ${heightIn}in;margin:0}.permit-drawing{page:drawing;break-before:page;width:${widthIn}in;height:${heightIn}in;overflow:hidden}.permit-drawing img{display:block;width:100%;height:100%}</style>`
  return permitSheetHTML(project,data).replace('</head>',`${style}</head>`).replace('</body>',`<div class="permit-drawing"><img alt="Scaled drawing sheet" src="${sheet.dataUrl}"></div></body>`)
}
