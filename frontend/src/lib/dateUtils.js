// Turkish date formatting utilities

const turkishMonths = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const turkishDays = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'
];

/**
 * Format date string to Turkish format: "1 Mart 2026"
 * @param {string} dateStr - Date string in "YYYY-MM-DD" format
 * @returns {string} Formatted date in Turkish
 */
export const formatDateTurkish = (dateStr) => {
  if (!dateStr) return '';
  
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const monthName = turkishMonths[month - 1];
    return `${day} ${monthName} ${year}`;
  } catch (error) {
    return dateStr; // Return original if parsing fails
  }
};

/**
 * Format date string to Turkish format with day name: "Pazartesi, 1 Mart 2026"
 * @param {string} dateStr - Date string in "YYYY-MM-DD" format
 * @returns {string} Formatted date in Turkish with day name
 */
export const formatDateTurkishWithDay = (dateStr) => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    const dayName = turkishDays[date.getDay()];
    const day = date.getDate();
    const monthName = turkishMonths[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} ${monthName} ${year}`;
  } catch (error) {
    return dateStr;
  }
};

/**
 * Format Date object to "YYYY-MM-DD" string
 * @param {Date} date - JavaScript Date object
 * @returns {string} Date string in "YYYY-MM-DD" format
 */
export const formatDateToISO = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse "YYYY-MM-DD" string to Date object
 * @param {string} dateStr - Date string in "YYYY-MM-DD" format
 * @returns {Date|null} JavaScript Date object or null
 */
export const parseISODate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  } catch (error) {
    return null;
  }
};

/**
 * Get Turkish month name
 * @param {number} monthIndex - Month index (0-11)
 * @returns {string} Turkish month name
 */
export const getTurkishMonth = (monthIndex) => {
  return turkishMonths[monthIndex] || '';
};

/**
 * Get Turkish day name
 * @param {number} dayIndex - Day index (0-6, where 0 is Sunday)
 * @returns {string} Turkish day name
 */
export const getTurkishDay = (dayIndex) => {
  return turkishDays[dayIndex] || '';
};

// Turkish locale for react-day-picker
export const turkishLocale = {
  localize: {
    month: (n) => turkishMonths[n],
    day: (n) => turkishDays[n].substring(0, 2), // Pz, Pt, Sa, Ça, Pe, Cu, Ct
  },
  formatLong: {
    date: () => 'd MMMM yyyy',
  },
};
