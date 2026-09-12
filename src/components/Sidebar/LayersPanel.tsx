import React, { useRef, useState } from 'react'
import { Eye, EyeOff, LockKeyhole, UnlockKeyhole, ChevronRight, ChevronDown, Layers, Boxes, Pencil, Plus, Trash2, CornerDownRight, ArrowLeft, MoveRight, Box } from 'lucide-react'
import { useStore, getActiveElements } from '../../store/useStore'
import { getBloxById } from '../../blox/definitions'
import { formatFeet } from '../../utils/scale'
import type { Layer, ElementGroup, PlacedElement } from '../../types'

const DEFAULT_LAYER_ID='layer-default'
function IconButton({label,children,onClick,pressed,expanded,disabled}:{label:string;children:React.ReactNode;onClick:()=>void;pressed?:boolean;expanded?:boolean;disabled?:boolean}) {
  return <button type="button" className="layer-action" title={label} aria-label={label} aria-pressed={pressed} aria-expanded={expanded} disabled={disabled} onClick={onClick}>{children}</button>
}
function RenameField({name,label,onCommit,onCancel}:{name:string;label:string;onCommit:(name:string)=>void;onCancel:()=>void}) {
  const [draft,setDraft]=useState(name)
  const done=useRef(false)
  const finish=(commit:boolean)=>{
    if(done.current) return
    done.current=true
    if(commit&&draft.trim()) onCommit(draft.trim());else onCancel()
  }
  return <input className="layer-name-input" aria-label={label} autoFocus value={draft} onFocus={e=>e.currentTarget.select()} onChange={e=>setDraft(e.target.value)} onBlur={()=>finish(true)} onKeyDown={e=>{
    e.stopPropagation()
    if(e.key==='Enter'){e.preventDefault();finish(true)}
    if(e.key==='Escape'){e.preventDefault();finish(false)}
  }}/>
}
function ObjectRow({el}:{el:PlacedElement}) {
  const {selectedElementIds,selectElement,clearSelection}=useStore()
  const name=getBloxById(el.bloxId)?.name??el.bloxId
  const selected=selectedElementIds.includes(el.id)
  return <button type="button" className="layer-object" aria-pressed={selected} title={`${name} — ${formatFeet(el.width)} × ${formatFeet(el.height)}`} onClick={e=>{
    if(e.shiftKey||e.metaKey||e.ctrlKey) selectElement(el.id,true)
    else {clearSelection();selectElement(el.id)}
  }}><Box size={13} aria-hidden="true"/><span>{name}</span><small>{formatFeet(el.width)} × {formatFeet(el.height)}</small>{el.locked&&<LockKeyhole size={12} aria-label="Locked"/>}</button>
}
function GroupRow({group,elements}:{group:ElementGroup;elements:PlacedElement[]}) {
  const {selectedElementIds,activeGroupId,enterGroup,renameGroup,selectMany}=useStore()
  const [expanded,setExpanded]=useState(true),[editing,setEditing]=useState(false)
  const ids=elements.map(e=>e.id),active=activeGroupId===group.id
  return <div className="layer-group" data-active={active}>
    <div className="layer-group-heading">
      <IconButton label={`${expanded?'Collapse':'Expand'} group ${group.name}`} expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?<ChevronDown size={14}/>:<ChevronRight size={14}/>}</IconButton>
      <Boxes size={14} aria-hidden="true"/>
      {editing?<RenameField name={group.name} label="Group name" onCommit={name=>{renameGroup(group.id,name);setEditing(false)}} onCancel={()=>setEditing(false)}/>:<button className="layer-name" aria-label={`Select group ${group.name}`} aria-pressed={ids.some(id=>selectedElementIds.includes(id))} onClick={()=>selectMany(ids)} onDoubleClick={()=>{enterGroup(group.id);selectMany(ids)}}>{group.name}<small>{elements.length}</small></button>}
      <IconButton label={`Rename group ${group.name}`} onClick={()=>setEditing(true)}><Pencil size={13}/></IconButton>
      <IconButton label={`Edit group ${group.name}`} pressed={active} onClick={()=>{enterGroup(group.id);selectMany(ids)}}><CornerDownRight size={14}/></IconButton>
    </div>
    {expanded&&<div className="layer-children">{elements.map(el=><ObjectRow key={el.id} el={el}/>)}</div>}
  </div>
}
function LayerRow({layer}:{layer:Layer}) {
  const {project,activeLayerId,updateLayer,deleteLayer,setActiveLayer,selectedElementIds,setElementsLayer,selectedArcWallIds,selectArcWall}=useStore()
  const [expanded,setExpanded]=useState(true),[editing,setEditing]=useState(false)
  const elements=getActiveElements(useStore.getState()).filter(e=>(e.layerId??DEFAULT_LAYER_ID)===layer.id)
  const arcs=project?.mode==='detail'?[]:(project?.arcWalls??[]).filter(w=>(w.layerId??DEFAULT_LAYER_ID)===layer.id)
  const groups=(project?.groups??[]).filter(g=>elements.some(e=>e.groupId===g.id))
  const knownGroups=new Set(groups.map(g=>g.id))
  const active=activeLayerId===layer.id,count=elements.length+arcs.length
  return <section className="layer-card" data-active={active} aria-label={`${layer.name} layer`}>
    <div className="layer-card-heading">
      <IconButton label={`${expanded?'Collapse':'Expand'} layer ${layer.name}`} expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?<ChevronDown size={15}/>:<ChevronRight size={15}/>}</IconButton>
      <span className="layer-color" style={{background:layer.color}}/>
      {editing?<RenameField name={layer.name} label="Layer name" onCommit={name=>{updateLayer(layer.id,{name});setEditing(false)}} onCancel={()=>setEditing(false)}/>:<button className="layer-name" aria-label={`Activate layer ${layer.name}`} aria-pressed={active} onClick={()=>setActiveLayer(layer.id)} onDoubleClick={()=>setEditing(true)}>{layer.name}<small>{count}</small></button>}
      <IconButton label={`Rename layer ${layer.name}`} onClick={()=>setEditing(true)}><Pencil size={13}/></IconButton>
    </div>
    <div className="layer-card-controls">
      <span className="layer-state">{active?'Drawing layer':layer.visible?'Visible':'Hidden'}{layer.locked?' · Locked':''}</span>
      <IconButton label={`${layer.visible?'Hide':'Show'} layer ${layer.name}`} pressed={layer.visible} onClick={()=>updateLayer(layer.id,{visible:!layer.visible})}>{layer.visible?<Eye size={15}/>:<EyeOff size={15}/>}</IconButton>
      <IconButton label={`${layer.locked?'Unlock':'Lock'} layer ${layer.name}`} pressed={layer.locked} onClick={()=>updateLayer(layer.id,{locked:!layer.locked})}>{layer.locked?<LockKeyhole size={14}/>:<UnlockKeyhole size={14}/>}</IconButton>
      {selectedElementIds.length>0&&<IconButton label={`Move selected objects to ${layer.name}`} disabled={layer.locked} onClick={()=>setElementsLayer(selectedElementIds,layer.id)}><MoveRight size={15}/></IconButton>}
      {layer.id!==DEFAULT_LAYER_ID&&<IconButton label={`Delete layer ${layer.name}; move objects to Default`} onClick={()=>deleteLayer(layer.id)}><Trash2 size={14}/></IconButton>}
    </div>
    {expanded&&<div className="layer-contents" data-hidden={!layer.visible}>
      {!count&&<p className="layer-empty">No objects on this layer yet.</p>}
      {groups.map(g=><GroupRow key={g.id} group={g} elements={elements.filter(e=>e.groupId===g.id)}/>)}
      {elements.filter(e=>!e.groupId||!knownGroups.has(e.groupId)).map(el=><ObjectRow key={el.id} el={el}/>)}
      {arcs.map(w=><button key={w.id} className="layer-object" aria-pressed={selectedArcWallIds.includes(w.id)} onClick={e=>selectArcWall(w.id,e.shiftKey||e.metaKey||e.ctrlKey)}><CornerDownRight size={13}/><span>Arc Wall</span><small>R {formatFeet(w.radius)}</small></button>)}
    </div>}
  </section>
}
export function LayersPanel() {
  const {project,addLayer,activeGroupId,exitGroup}=useStore()
  const layers=project?.layers??[]
  return <div className="layers-panel utility-content flex flex-col h-full">
    <div className="layers-heading"><Layers size={17}/><div><strong>Drawing structure</strong><span>{layers.length} {layers.length===1?'layer':'layers'}</span></div><IconButton label="Add layer" onClick={()=>addLayer()}><Plus size={17}/></IconButton></div>
    {activeGroupId&&<button className="layer-exit" onClick={exitGroup}><ArrowLeft size={14}/> Finish editing group</button>}
    <p className="layers-help">Choose a drawing layer. Use Shift or ⌘ to select multiple objects.</p>
    <div className="layers-list">{layers.map(layer=><LayerRow key={layer.id} layer={layer}/>)}</div>
  </div>
}
