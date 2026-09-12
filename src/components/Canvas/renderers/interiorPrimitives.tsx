import React from 'react'
import { Rect as BaseRect, Line as BaseLine, Circle as BaseCircle, Ellipse as BaseEllipse } from './shared'
import { furnitureColor } from '../../../utils/furnitureStyle'

// Keep all geometry, dashes, and pen weights. Theme only known paint values.
function paint<T extends { fill?: string | CanvasGradient; stroke?: string | CanvasGradient }>(props: T) {
  return { ...props,
    fill: typeof props.fill === 'string' ? furnitureColor(props.fill) : props.fill,
    stroke: typeof props.stroke === 'string' ? furnitureColor(props.stroke) : props.stroke }
}
export function Rect(props: React.ComponentProps<typeof BaseRect>) { return <BaseRect {...paint(props)} /> }
export function Line(props: React.ComponentProps<typeof BaseLine>) { return <BaseLine {...paint(props)} /> }
export function Circle(props: React.ComponentProps<typeof BaseCircle>) { return <BaseCircle {...paint(props)} /> }
export function Ellipse(props: React.ComponentProps<typeof BaseEllipse>) { return <BaseEllipse {...paint(props)} /> }
