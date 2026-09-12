import type { BloxDefinition } from '../types'
export const DEMOLITION_BLOX: BloxDefinition[] = [
  {id:'demo-wall',name:'Wall to Remove',description:'Dashed wall removal notation; does not cut or join existing walls.',defaultWidth:8,defaultHeight:.5},
  {id:'demo-door',name:'Door to Remove',description:'Dashed leaf and swing for an existing door to be removed.',defaultWidth:3,defaultHeight:3},
  {id:'demo-window',name:'Window to Remove',description:'Dashed frame and glazing for an existing window to be removed.',defaultWidth:4,defaultHeight:.5},
  {id:'demo-area',name:'Area to Remove',description:'Dashed removal extent with diagonal cross; identify scope in demolition notes.',defaultWidth:6,defaultHeight:4},
  {id:'existing-wall-remain',name:'Existing Wall to Remain',description:'Unfilled solid existing-wall notation, separate from new wall geometry.',defaultWidth:8,defaultHeight:.5},
].map(d=>({...d,category:'Demolition',isResizable:true,resizeAxis:'both',minWidth:.1,minHeight:.1}))
