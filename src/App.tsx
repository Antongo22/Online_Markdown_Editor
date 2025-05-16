import React, { useState, useRef, useEffect } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Toolbar from './components/Toolbar';
import { isMobileDevice } from './utils/deviceDetector';
import './styles/App.css';

// Константы приложения
const APP_TITLE = 'Markdown Editor';
const STORAGE_KEY = 'markdown-editor-content';

// Дефолтный контент для редактора
const DEFAULT_CONTENT = `# Добро пожаловать в Markdown редактор

## Функциональность

- **Синтаксис Markdown** с поддержкой GitHub Flavored Markdown
- **Подсветка синтаксиса** для блоков кода
- **Темная тема** для комфортной работы
- **Автосохранение** ваших изменений

## Примеры разметки

### Выделение текста

*Курсив*, **жирный текст**, и ~~зачеркнутый текст~~.

### Код

Встроенный \`код\` выглядит так.

\`\`\`javascript
// Блок кода с подсветкой синтаксиса
function hello() {
  console.log("Привет, мир!");
}
\`\`\`

### Таблицы

| Название | Описание | Цена |
|----------|----------|------|
| Товар 1  | Описание товара 1 | 100₽ |
| Товар 2  | Описание товара 2 | 200₽ |

### Списки

1. Первый пункт
2. Второй пункт
   - Вложенный пункт
   - Еще один вложенный пункт
3. Третий пункт

Приятного использования!
`;

function App() {
  // Состояние для мобильного устройства
  const [isMobile, setIsMobile] = useState(false);
  
  // Состояние для мобильного вида (редактор/превью)
  const [mobileView, setMobileView] = useState('editor'); // 'editor' или 'preview'
  
  // Состояние для выдвижного меню
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Основное состояние редактора
  const [content, setContent] = useState('');
  
  // Динамическая ширина панелей (только для десктопа)
  const [editorWidth, setEditorWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  
  // Рефы для элементов DOM
  const dividerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Проверка мобильного устройства при загрузке
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);
  
  // Загрузка сохраненного контента при первом рендере
  useEffect(() => {
    const savedContent = localStorage.getItem(STORAGE_KEY);
    if (savedContent) {
      setContent(savedContent);
    } else {
      setContent(DEFAULT_CONTENT);
      localStorage.setItem(STORAGE_KEY, DEFAULT_CONTENT);
    }
  }, []);
  
  // Сохранение контента при изменении
  useEffect(() => {
    if (content) {
      localStorage.setItem(STORAGE_KEY, content);
    }
  }, [content]);
  
  // Обработчик изменения размера панелей
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  // Обработчик движения мыши для изменения размера
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !contentRef.current) return;
      
      const containerWidth = contentRef.current.clientWidth;
      const mouseX = e.clientX;
      const containerRect = contentRef.current.getBoundingClientRect();
      const containerX = containerRect.left;
      
      const newEditorWidth = ((mouseX - containerX) / containerWidth) * 100;
      
      // Ограничиваем размер между 20% и 80%
      if (newEditorWidth >= 20 && newEditorWidth <= 80) {
        setEditorWidth(newEditorWidth);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  // Обработчик изменения контента
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };
  
  // Вставка шаблонного кода/текста в редактор
  const handleToolbarAction = (templateContent: string) => {
    setContent((prevContent) => {
      return prevContent + templateContent;
    });
  };
  
  // Переключение между редактором и предпросмотром на мобильных устройствах
  const toggleMobileView = () => {
    setMobileView(view => view === 'editor' ? 'preview' : 'editor');
    setIsMobileMenuOpen(false); // Закрыть меню после переключения
  };
  
  // Переключение видимости меню
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(isOpen => !isOpen);
  };

  return (
    <div className={`app dark-theme ${isMobile ? 'mobile-layout' : ''}`}>
      <header className="app-header">
        <div className="header-top">
          <h1>{APP_TITLE}</h1>
          {isMobile && (
            <button 
              className="mobile-menu-button" 
              onClick={toggleMobileMenu}
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          )}
        </div>
        
        {isMobile ? (
          <div className={`mobile-action-menu ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="mobile-menu-section">
              <h3>Навигация</h3>
              <div className="mobile-menu-buttons">
                <button 
                  className={`mobile-menu-button ${mobileView === 'editor' ? 'active' : ''}`}
                  onClick={() => setMobileView('editor')}
                >
                  <i className="fas fa-code"></i> Редактор
                </button>
                <button 
                  className={`mobile-menu-button ${mobileView === 'preview' ? 'active' : ''}`}
                  onClick={() => setMobileView('preview')}
                >
                  <i className="fas fa-eye"></i> Предпросмотр
                </button>
              </div>
            </div>
            
            <div className="mobile-menu-section">
              <h3>Вставка элементов</h3>
              <Toolbar onAction={(template) => {
                handleToolbarAction(template);
                setIsMobileMenuOpen(false);
              }} mobile={true} />
            </div>
          </div>
        ) : (
          <Toolbar onAction={handleToolbarAction} mobile={false} />
        )}
      </header>
      
      {isMobile ? (
        // Мобильная версия с переключением между редактором и предпросмотром
        <div className="mobile-content-container" ref={contentRef}>
          {mobileView === 'editor' ? (
            <div className="mobile-editor-pane">
              <Editor 
                content={content} 
                onChange={handleContentChange} 
                mobile={true}
              />
            </div>
          ) : (
            <div className="mobile-preview-pane">
              <Preview 
                content={content} 
                documentType="markdown" 
                mobile={true}
              />
            </div>
          )}
          
          {/* Индикатор текущего режима и кнопка быстрого переключения */}
          <div className="mobile-view-indicator" onClick={toggleMobileView}>
            {mobileView === 'editor' ? (
              <>
                <i className="fas fa-code"></i> Редактор
              </>
            ) : (
              <>
                <i className="fas fa-eye"></i> Предпросмотр
              </>  
            )}
            <i className="fas fa-exchange-alt"></i>
          </div>
        </div>
      ) : (
        // Десктопная версия с разделенными панелями
        <div className="content-container" ref={contentRef}>
          <div 
            className="editor-pane" 
            style={{ width: `${editorWidth}%` }}
          >
            <Editor 
              content={content} 
              onChange={handleContentChange} 
              mobile={false}
            />
          </div>
          
          <div 
            className="divider" 
            ref={dividerRef} 
            onMouseDown={handleMouseDown}
            style={{ cursor: isDragging ? 'col-resize' : 'default' }}
          ></div>
          
          <div 
            className="preview-pane" 
            style={{ width: `${100 - editorWidth}%` }}
          >
            <Preview 
              content={content} 
              documentType="markdown" 
              mobile={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
