import React,{useMemo} from 'react'
import {useStore,getPixelsPerFoot} from '../../../store/useStore'
import {siteGeometry} from '../../../utils/siteGeometry'
import {refinedFixture} from './RefinedFixture'
import type {RendererComponent} from './shared'
export function refinedSite(id:string):RendererComponent {
  return function Site(props) {
    const currentScale=useStore(getPixelsPerFoot),p=props.pixelsPerFoot??currentScale
    const Renderer=useMemo(()=>refinedFixture(id,(name,w,h)=>siteGeometry(name,w,h,p,props.properties)),[p,props.properties])
    return <Renderer {...props}/>
  }
}
