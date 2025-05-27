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
    // Проверяем, есть ли сохраненный контент в localStorage
    const savedContent = localStorage.getItem(STORAGE_KEY);
    
    if (savedContent) {
      setContent(savedContent);
      localStorage.setItem(STORAGE_KEY, savedContent);
    } else {
      // Если нет сохраненного контента, загружаем дефолтный
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
    
    // Получаем имя файла по умолчанию из первой строки документа
    const getDefaultFileName = () => {
      const lines = content.split('\n');
      let firstNonEmptyLine = '';
      
      // Ищем первую непустую строку
      for (let line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          // Удаляем маркеры заголовков и пробелы
          firstNonEmptyLine = trimmedLine.replace(/^#+\s*/, '');
          break;
        }
      }
      
      // Очищаем имя файла от спецсимволов Markdown
      let cleanFileName = firstNonEmptyLine;
      if (cleanFileName) {
        // Удаляем различные Markdown-элементы
        cleanFileName = cleanFileName
          // Удаляем заголовки (#, ##, ###)
          .replace(/^#+\s*/, '')
          // Удаляем выделения (**bold**, *italic*, ~~strikethrough~~)
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1')
          .replace(/~~([^~]+)~~/g, '$1')
          .replace(/`([^`]+)`/g, '$1')
          // Удаляем ссылки [text](url)
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          // Удаляем символы списков (-, *, +)
          .replace(/^[\-*+]\s+/, '')
          // Удаляем нумерацию списков (1., 2., и т.д.)
          .replace(/^\d+\.\s+/, '')
          // Удаляем оставшиеся недопустимые для имени файла символы
          .replace(/[\\/:\*?"<>|]/g, '');
        
        // Ограничиваем длину имени файла до 70 символов
        cleanFileName = cleanFileName.substring(0, 70).trim();
      }
      
      // Если не нашли непустую строку или после очистки ничего не осталось, используем стандартное имя
      return cleanFileName ? `${cleanFileName}.md` : 'document.md';
    };
    
    try {
      // Проверяем, что браузер поддерживает File System Access API и мы в безопасном контексте (HTTPS)
      const isSecureContext = window.isSecureContext && 'showSaveFilePicker' in window;
      console.log('Is secure context with File System Access API:', isSecureContext);
      
      if (isSecureContext) {
        // Современный способ с выбором места сохранения
        const options = {
          suggestedName: getDefaultFileName(),
          types: [{
            description: 'Markdown файлы',
            accept: { 'text/markdown': ['.md'] }
          }]
        };
        
        let fileHandle;
        try {
          // @ts-ignore - TypeScript может не распознать этот метод
          fileHandle = await window.showSaveFilePicker(options);
          
          // Создаем поток для записи
          const writable = await fileHandle.createWritable();
          
          // Записываем текст в файл
          await writable.write(content);
          
          // Закрываем поток
          await writable.close();
          
          console.log('File saved successfully using File System Access API');
        } catch (error) {
          console.error('Error using File System Access API:', error);
          // Проверяем, была ли это отмена пользователем
          const isUserCancelled = (error instanceof Error && 
                                 error.name === 'AbortError') || 
                                 !fileHandle;
          
          if (!isUserCancelled) {
            // Если это не отмена, а другая ошибка, используем резервный метод
            useDownloadFallback();
          }
        }
      } else {
        // Выполняем резервный метод сохранения
        console.log('Using download fallback method for HTTP context');
        useDownloadFallback();
      }
    } catch (error) {
      console.error('Unexpected error during save:', error);
      // При любой ошибке используем резервный метод
      useDownloadFallback();
    }
    
    setIsMobileMenuOpen(false);
    
    // Резервный метод сохранения для HTTP-контекста
    function useDownloadFallback() {
      try {
        // Создаем Blob из текста
        const blob = new Blob([content], { type: 'text/markdown' });
        
        // Создаем URL для Blob
        const url = URL.createObjectURL(blob);
        
        // Создаем элемент <a> для загрузки
        const a = document.createElement('a');
        a.href = url;
        a.download = getDefaultFileName();
        a.style.display = 'none';
        
        // Добавляем в DOM и кликаем
        document.body.appendChild(a);
        a.click();
        
        // Чистим ресурсы
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        console.log('File saved successfully using download fallback');
      } catch (downloadError) {
        console.error('Error in download fallback:', downloadError);
        alert('Произошла ошибка при сохранении файла. Попробуйте еще раз.');
      }
    }
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
  
  // Обработчики для пользовательских событий из Monaco Editor
  useEffect(() => {
    // Обработчик сохранения файла (Ctrl+S / Cmd+S)
    const handleSaveEvent = () => {
      // Используем текущее значение content
      console.log('Save event triggered with content length:', content.length);
      handleSaveAsMd();
    };
    
    // Обработчик открытия файла - устаревший метод (оставлен для обратной совместимости)
    const handleOpenEvent = () => {
      console.log('Legacy open event triggered');
      // Просто открываем диалог выбора файла
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.md, .markdown, .txt';
      fileInput.style.display = 'none';
      
      fileInput.addEventListener('change', (event) => {
        if (event.target instanceof HTMLInputElement && event.target.files && event.target.files.length > 0) {
          const syntheticEvent = {
            target: event.target
          } as React.ChangeEvent<HTMLInputElement>;
          
          handleFileUpload(syntheticEvent);
        }
      });
      
      document.body.appendChild(fileInput);
      fileInput.click();
      setTimeout(() => document.body.removeChild(fileInput), 500);
    };
    
    // Новый обработчик для выбранного файла (работает с новым событием)
    const handleOpenFileSelectedEvent = (event: Event) => {
      if (event instanceof CustomEvent && event.detail && event.detail.inputElement) {
        console.log('File selected event received');
        const inputElement = event.detail.inputElement as HTMLInputElement;
        
        if (inputElement.files && inputElement.files.length > 0) {
          const syntheticEvent = {
            target: inputElement
          } as React.ChangeEvent<HTMLInputElement>;
          
          handleFileUpload(syntheticEvent);
        }
      }
    };
    
    // Обработчик перетаскивания файла на редактор (старый метод, в котором сами читаем файл)
    const handleFileDropEvent = (event: Event) => {
      if (event instanceof CustomEvent && event.detail && event.detail.file) {
        const file = event.detail.file;
        console.log('File drop event received:', file.name);
        const reader = new FileReader();
        
        reader.onload = (e) => {
          if (e.target && typeof e.target.result === 'string') {
            // Устанавливаем содержимое файла
            setContent(e.target.result);
            
            // Добавляем в историю
            const fileContent = e.target.result as string;
            setHistory(prev => [...prev, fileContent]);
            setHistoryIndex(prevIndex => prevIndex + 1);
            
            // Сохраняем в localStorage
            localStorage.setItem(STORAGE_KEY, e.target.result);
          }
        };
        
        reader.readAsText(file);
      }
    };
    
    // Новый обработчик для уже загруженного содержимого файла
    const handleFileContentLoadedEvent = (event: Event) => {
      if (event instanceof CustomEvent && event.detail) {
        const { fileName, content } = event.detail;
        console.log('File content loaded event received:', fileName, 'Content length:', content.length);
        
        if (typeof content === 'string') {
          // Устанавливаем содержимое файла
          setContent(content);
          
          // Добавляем в историю
          setHistory(prev => [...prev, content]);
          setHistoryIndex(prevIndex => prevIndex + 1);
          
          // Сохраняем в localStorage
          localStorage.setItem(STORAGE_KEY, content);
        }
      }
    };
    
    // Регистрируем обработчики событий
    document.addEventListener('app-save-file', handleSaveEvent);
    document.addEventListener('app-open-file', handleOpenEvent); // Старый метод
    document.addEventListener('app-open-file-selected', handleOpenFileSelectedEvent); // Новый метод
    document.addEventListener('app-file-dropped', handleFileDropEvent);
    document.addEventListener('app-file-content-loaded', handleFileContentLoadedEvent); // Новый метод для перетаскивания
    
    // Добавляем глобальный обработчик Ctrl+O для всего документа
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O')) {
        console.log('Global Ctrl+O intercepted');
        e.preventDefault();
        e.stopPropagation();
        handleOpenEvent();
      }
    };
    
    // Добавляем глобальный обработчик с высоким приоритетом
    document.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    
    // Удаляем обработчики при размонтировании
    return () => {
      document.removeEventListener('app-save-file', handleSaveEvent);
      document.removeEventListener('app-open-file', handleOpenEvent);
      document.removeEventListener('app-open-file-selected', handleOpenFileSelectedEvent);
      document.removeEventListener('app-file-dropped', handleFileDropEvent);
      document.removeEventListener('app-file-content-loaded', handleFileContentLoadedEvent);
      document.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
    };
  }, [content]); // Добавляем зависимость от content
  


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
