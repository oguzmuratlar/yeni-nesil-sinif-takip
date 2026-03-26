import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * ExpandableText - Uzun metinleri kısaltarak gösterir, "devamını gör" ile açılır
 */
export function ExpandableText({ 
  text, 
  maxLength = 50,
  className,
  expandText = "devamını gör",
  collapseText = "gizle"
}) {
  const [expanded, setExpanded] = React.useState(false)
  
  if (!text) return null
  
  const isLong = text.length > maxLength
  
  if (!isLong) {
    return <span className={className}>{text}</span>
  }
  
  return (
    <span className={className}>
      {expanded ? text : `${text.substring(0, maxLength)}...`}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setExpanded(!expanded)
        }}
        className="ml-1 text-blue-600 hover:text-blue-800 hover:underline text-xs font-medium"
      >
        {expanded ? collapseText : expandText}
      </button>
    </span>
  )
}
