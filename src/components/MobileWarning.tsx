import React from 'react';

/**
 * Компонент предупреждения для мобильных устройств
 */
const MobileWarning: React.FC = () => {
  return (
    <div className="mobile-warning">
      <div className="mobile-warning-content">
        <div className="warning-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h2>Редактор недоступен на мобильных устройствах</h2>
        <p>
          Для комфортной работы с Markdown редактором, пожалуйста, 
          используйте компьютер или ноутбук. Мобильная версия в настоящее 
          время не поддерживается из-за сложности интерфейса.
        </p>
        <div className="features-list">
          <h3>Возможности полной версии:</h3>
          <ul>
            <li>Расширенное редактирование кода</li>
            <li>Синтаксис Markdown с поддержкой GFM</li>
            <li>Загрузка изображений</li>
            <li>и многое другое</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MobileWarning;
