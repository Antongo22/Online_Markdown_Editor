/**
 * Утилиты для определения типа устройства пользователя
 */

/**
 * Проверяет, является ли устройство мобильным
 */
export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Регулярное выражение для обнаружения мобильных устройств
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  // Проверка ширины экрана (дополнительный критерий)
  const isSmallScreen = window.innerWidth < 768;
  
  return mobileRegex.test(userAgent) || isSmallScreen;
};

/**
 * Проверяет, является ли устройство планшетом
 */
export const isTabletDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Регулярное выражение для обнаружения планшетов
  const tabletRegex = /iPad|Android(?!.*Mobile)/i;
  
  // Проверка ширины экрана (дополнительный критерий)
  const isMediumScreen = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  return tabletRegex.test(userAgent) || isMediumScreen;
};

/**
 * Проверяет, является ли устройство настольным компьютером
 */
export const isDesktopDevice = (): boolean => {
  return !isMobileDevice() && !isTabletDevice();
};
