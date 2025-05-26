import React, { useState, useRef, useEffect } from 'react';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Toolbar from './components/Toolbar';
import { isMobileDevice } from './utils/deviceDetector';
import './styles/App.css';
import './styles/Footer.css';

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
  
  // Состояние для позиции курсора
  const [cursorPosition, setCursorPosition] = useState<{ lineNumber: number; column: number } | null>(null);
  
  // История редактирования для Undo/Redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Динамическая ширина панелей (только для десктопа)
  const [editorWidth, setEditorWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  
  // Рефы для элементов DOM
  const dividerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Состояние для адаптивного меню на экранах меньше 2000px
  const [useMobileMenu, setUseMobileMenu] = useState(false);

  // Проверка устройства и размера экрана
  useEffect(() => {
    const checkDevice = () => {
      // Настоящий мобильный режим только для узких экранов и мобильных устройств
      const isMobileCheck = isMobileDevice() || window.innerWidth < 550;
      setIsMobile(isMobileCheck);
      
      // Мобильное меню для экранов меньше 1450px
      const shouldUseMobileMenu = window.innerWidth < 1450;
      setUseMobileMenu(shouldUseMobileMenu);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);
  
  // Инициализируем историю при первой загрузке содержимого
  useEffect(() => {
    if (content && history.length === 0) {
      setHistory([content]);
      setHistoryIndex(0);
    }
  }, [content]);
  
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
    // Добавляем в историю только если содержимое изменилось
    if (content !== newContent) {
      // Создаем новую историю, удаляя все после текущего индекса
      const newHistory = [...history.slice(0, historyIndex + 1), newContent];
      
      // Ограничиваем историю до 50 шагов
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    
    setContent(newContent);
  };
  
  // Функция отмены последнего действия (Undo)
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setContent(history[historyIndex - 1]);
    }
  };
  
  // Функция возврата отмененного действия (Redo)
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setContent(history[historyIndex + 1]);
    }
  };
  
  // Ссылка на текущий редактор
  const editorRef = useRef<any>(null);
  
  // Функция установки ссылки на редактор
  const handleEditorRef = (editor: any) => {
    editorRef.current = editor;
  };
  
  // Вставка шаблонного кода/текста в редактор
  const handleToolbarAction = (templateContent: string) => {
    // Прямая вставка в редактор Monaco
    if (editorRef.current) {
      const editor = editorRef.current;
      
      // Получаем текущую позицию
      const position = editor.getPosition();
      const selection = editor.getSelection();
      const model = editor.getModel();
      
      if (position && model) {
        // Создаем редактирование для позиции курсора
        const range = selection && !selection.isEmpty() ? 
          selection : 
          { startLineNumber: position.lineNumber, startColumn: position.column, endLineNumber: position.lineNumber, endColumn: position.column };
          
        // Вставляем текст в позицию курсора
        editor.executeEdits('template-insertion', [{
          range: range,
          text: templateContent,
          forceMoveMarkers: true
        }]);
        
        // Получаем обновленный контент и обновляем состояние
        const updatedContent = model.getValue();
        
        // Обновляем состояние и историю
        handleContentChange(updatedContent);
        
        // Позиционируем курсор в конце вставленного текста
        // Но сначала даем время на обновление редактора
        setTimeout(() => {
          editor.focus();
        }, 10);
        
        return;
      }
    }
    
    // Запасной вариант, если нет доступа к редактору
    let newContent;
    
    // Если известна позиция курсора, вставляем в эту позицию
    if (cursorPosition) {
      const lines = content.split('\n');
      let charCount = 0;
      
      // Находим позицию для вставки в общем тексте
      for (let i = 0; i < cursorPosition.lineNumber - 1; i++) {
        charCount += lines[i].length + 1; // +1 для \n
      }
      
      const insertIndex = charCount + cursorPosition.column - 1;
      
      // Вставляем текст в позицию курсора
      newContent = content.substring(0, insertIndex) + templateContent + content.substring(insertIndex);
    } else {
      // Если позиция курсора неизвестна, добавляем в конец
      newContent = content + templateContent;
    }
    
    // Обновляем состояние
    handleContentChange(newContent);
  };
  
  // Очистка всего кода
  const handleClearAll = () => {
    if (window.confirm('Вы уверены, что хотите очистить весь текст?')) {
      setContent('');
      setIsMobileMenuOpen(false);
    }
  };
  
  // Загрузка MD файла
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setContent(text);
        // Обновляем историю
        const newHistory = [...history.slice(0, historyIndex + 1), text];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    };
    reader.readAsText(file);
    
    // Сбрасываем значение инпута, чтобы можно было загрузить тот же файл повторно
    event.target.value = '';
    setIsMobileMenuOpen(false);
  };
  
  // Сохранение в MD файл с выбором места сохранения
  const handleSaveAsMd = async () => {
    if (!content) {
      alert('Нет содержимого для сохранения');
      return;
    }
    
    try {
      // Получаем первую непустую строку без MD разметки для имени файла
      let defaultFileName = 'document.md';
      
      // Получаем все строки документа
      const lines = content.split('\n');
      
      // Ищем первую непустую строку
      for (const line of lines) {
        // Игнорируем пробелы, табуляцию и другие пустые символы
        const trimmedLine = line.trim();
        if (trimmedLine) {
          // Удаляем маркеры заголовков (# ## ### и т.д.)
          const cleanTitle = trimmedLine.replace(/^#+\s*/, '');
          
          if (cleanTitle) {
            // Преобразуем в допустимое имя файла, убирая недопустимые символы
            defaultFileName = cleanTitle.replace(/[\/:*?"<>|]/g, '_').substring(0, 100) + '.md';
            break; // Нашли первую непустую строку, выходим из цикла
          }
        }
      }
      
      // Используем File System Access API для открытия диалога сохранения
      if ('showSaveFilePicker' in window) {
        // Современные браузеры с поддержкой File System Access API
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: defaultFileName,
          types: [{
            description: 'Markdown файл',
            accept: { 'text/markdown': ['.md'] }
          }]
        });
        
        // Создаем записываемый поток
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
      } else {
        // Запасной вариант для старых браузеров
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = defaultFileName;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Ошибка при сохранении файла:', error);
      
      // Проверяем, не является ли ошибка отменой пользователя
      const errorMessage = String(error);
      const isUserCancelled = errorMessage.includes('user aborted') || 
                            errorMessage.includes('abort') || 
                            errorMessage.includes('cancel') || 
                            errorMessage.includes('The user aborted a request');
      
      // Показываем алерт только если это не отмена пользователем
      if (!isUserCancelled) {
        alert('Произошла ошибка при сохранении файла. Попробуйте еще раз.');
      }
    }
    
    setIsMobileMenuOpen(false);
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
          {useMobileMenu && (
            <button 
              className="mobile-menu-button" 
              onClick={toggleMobileMenu}
              aria-label="Меню"
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          )}
        </div>
        
        {useMobileMenu ? (
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
              <h3>Действия редактирования</h3>
              <div className="mobile-menu-buttons">
                <button 
                  className="mobile-menu-button"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                >
                  <i className="fas fa-undo"></i> Отмена
                </button>
                <button 
                  className="mobile-menu-button"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <i className="fas fa-redo"></i> Вернуть
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

            <div className="mobile-menu-section">
              <h3>О разработчике</h3>
              <div className="mobile-menu-about">
                <a href="http://trexon.ru/" target="_blank" rel="noopener noreferrer" className="mobile-company-link">
                  <i className="fas fa-code"></i> Разработано компанией <span className="company-name">Trexon</span>
                </a>
              </div>
            </div>
            
            <div className="mobile-menu-section">
              <h3>Файлы и действия</h3>
              <div className="mobile-menu-buttons">
                <label 
                  className="mobile-menu-button upload-button"
                >
                  <i className="fas fa-file-upload"></i> <span className="button-text">Загрузить MD</span>
                  <input 
                    type="file" 
                    accept=".md"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </label>
                <button 
                  className="mobile-menu-button save-button"
                  onClick={handleSaveAsMd}
                >
                  <i className="fas fa-file-download"></i> <span className="button-text">Сохранить MD</span>
                </button>
                <button 
                  className="mobile-menu-button danger-button"
                  onClick={handleClearAll}
                >
                  <i className="fas fa-trash"></i> <span className="button-text">Очистить всё</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="desktop-toolbar-container">
            <div className="full-width-toolbar">
              <div className="toolbar-section undo-redo-section">
                <button 
                  className="edit-action-button" 
                  onClick={handleUndo} 
                  disabled={historyIndex <= 0}
                  title="Отменить"
                >
                  <i className="fas fa-undo"></i>
                </button>
                <button 
                  className="edit-action-button" 
                  onClick={handleRedo} 
                  disabled={historyIndex >= history.length - 1}
                  title="Вернуть"
                >
                  <i className="fas fa-redo"></i>
                </button>
              </div>
              
              <div className="toolbar-section">
                <Toolbar onAction={handleToolbarAction} />
              </div>
              
              <div className="toolbar-section file-actions-section">
                <label 
                  className="edit-action-button file-upload-button upload-button"
                  title="Загрузить MD"
                >
                  <i className="fas fa-file-upload"></i>
                  <span className="button-text">Загрузить</span>
                  <input 
                    type="file" 
                    accept=".md"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </label>
                <button 
                  className="edit-action-button save-button" 
                  onClick={handleSaveAsMd} 
                  title="Сохранить как MD"
                >
                  <i className="fas fa-file-download"></i>
                  <span className="button-text">Сохранить</span>
                </button>
                <button 
                  className="edit-action-button danger-button" 
                  onClick={handleClearAll} 
                  title="Очистить всё"
                >
                  <i className="fas fa-trash"></i>
                  <span className="button-text">Очистить</span>
                </button>
              </div>
            </div>
          </div>
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
                onCursorChange={setCursorPosition}
                onEditorRef={handleEditorRef}
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
          <div className="mobile-view-indicator">
            <div className="mobile-view-label" onClick={toggleMobileView}>
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
            
            <div className="mobile-quick-actions">
              <button 
                className="quick-action-button" 
                onClick={handleUndo} 
                disabled={historyIndex <= 0}
                title="Отменить"
              >
                <i className="fas fa-undo"></i>
              </button>
              <button 
                className="quick-action-button" 
                onClick={handleRedo} 
                disabled={historyIndex >= history.length - 1}
                title="Вернуть"
              >
                <i className="fas fa-redo"></i>
              </button>
              <button 
                className="quick-action-button" 
                onClick={() => {
                  navigator.clipboard.writeText(content);
                  alert('Текст скопирован в буфер обмена');
                }}
                title="Копировать весь текст"
              >
                <i className="fas fa-copy"></i>
              </button>
            </div>
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
              onCursorChange={setCursorPosition}
              onEditorRef={handleEditorRef}
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
      
      {/* Футер с информацией о компании */}
      <footer className="app-footer">
        <div className="footer-content">
          <a href="http://trexon.ru/" target="_blank" rel="noopener noreferrer" className="company-link">
            <span>Разработано компанией</span>
            <span className="company-name">Trexon</span>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
