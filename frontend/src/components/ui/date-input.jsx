import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Masked Date Input - DD.MM.YYYY formatında yazılabilir tarih girişi
 * Otomatik nokta ekleme ve format kontrolü
 */
export function DateInput({ 
  value, 
  onChange, 
  placeholder = "GG.AA.YYYY",
  className,
  disabled = false,
  ...props
}) {
  const inputRef = React.useRef(null)
  
  // Convert YYYY-MM-DD to DD.MM.YYYY for display
  const formatForDisplay = (isoDate) => {
    if (!isoDate) return ''
    if (isoDate.includes('.')) return isoDate // Already in display format
    const [year, month, day] = isoDate.split('-')
    if (year && month && day) {
      return `${day}.${month}.${year}`
    }
    return isoDate
  }

  // Convert DD.MM.YYYY to YYYY-MM-DD for storage
  const formatForStorage = (displayDate) => {
    if (!displayDate) return ''
    if (displayDate.includes('-')) return displayDate // Already in storage format
    const parts = displayDate.split('.')
    if (parts.length === 3) {
      const [day, month, year] = parts
      if (day && month && year && year.length === 4) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
    }
    return ''
  }

  const [displayValue, setDisplayValue] = React.useState(formatForDisplay(value))

  React.useEffect(() => {
    setDisplayValue(formatForDisplay(value))
  }, [value])

  const handleChange = (e) => {
    let input = e.target.value
    const cursorPos = e.target.selectionStart
    
    // Remove non-numeric characters except dots
    let cleaned = input.replace(/[^\d.]/g, '')
    
    // Remove extra dots, keep only the format dots
    let parts = cleaned.split('.')
    if (parts.length > 3) {
      parts = parts.slice(0, 3)
    }
    
    // Rebuild with proper formatting
    let formatted = ''
    let nums = cleaned.replace(/\./g, '')
    
    for (let i = 0; i < nums.length && i < 8; i++) {
      if (i === 2 || i === 4) {
        formatted += '.'
      }
      formatted += nums[i]
    }
    
    setDisplayValue(formatted)
    
    // If we have a complete date, convert and send to parent
    if (formatted.length === 10) {
      const isoDate = formatForStorage(formatted)
      if (isoDate) {
        onChange(isoDate)
      }
    } else if (formatted.length === 0) {
      onChange('')
    }
  }

  const handleBlur = () => {
    // On blur, validate and format
    if (displayValue && displayValue.length === 10) {
      const isoDate = formatForStorage(displayValue)
      if (isoDate) {
        onChange(isoDate)
      }
    }
  }

  const handleKeyDown = (e) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 46, 9, 27, 13].includes(e.keyCode)) {
      return
    }
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode)) {
      return
    }
    // Allow: home, end, left, right
    if (e.keyCode >= 35 && e.keyCode <= 39) {
      return
    }
    // Block if not a number
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault()
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={10}
      className={cn(
        "flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
