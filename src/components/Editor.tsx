import React, { useRef } from 'react';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  onEditorDidMount?: (editor: any) => void;
  mobile?: boolean;
  onSelectLine?: () => void;
  onCopyAll?: () => void;
  onCursorChange?: (position: { lineNumber: number; column: number } | null) => void;
  onEditorRef?: (editor: any) => void; // Добавляем функцию для передачи ссылки на редактор
}

const Editor = ({ content, onChange, onEditorDidMount, mobile = false, onSelectLine, onCopyAll, onCursorChange, onEditorRef }: EditorProps): React.ReactElement => {
  // Храним редактор в ref, чтобы иметь к нему доступ из разных функций
  const editorRef = useRef<any>(null);
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };
  
  // Используем состояние вместо простой переменной, чтобы React мог отслеживать изменения
  const [isDarkTheme, setIsDarkTheme] = React.useState<boolean>(document.body.classList.contains('dark-theme') || !document.body.classList.contains('light-theme'));
  
  // Используем useEffect для отслеживания изменений темы
  React.useEffect(() => {
    // Функция проверки темы
    const checkTheme = () => {
      const darkTheme = document.body.classList.contains('dark-theme') || !document.body.classList.contains('light-theme');
      setIsDarkTheme(darkTheme);
    };
    
    // Создаем наблюдатель за изменениями классов body
    const observer = new MutationObserver(checkTheme);
    
    // Начинаем наблюдение за изменениями классов
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    // Также проверяем тему при изменении размера окна
    window.addEventListener('resize', checkTheme);
    
    // Проверяем сразу при монтировании
    checkTheme();
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkTheme);
    };
  }, []);

  // Обработчик события, когда редактор загружен
  const handleEditorDidMount = (editor: any) => {
    // Сохраняем инстанс редактора в ref
    editorRef.current = editor;
    
    // Передаем ссылку на редактор в родительский компонент, если функция передана
    if (onEditorRef) {
      onEditorRef(editor);
    }
    
    // Добавляем обработчик изменения положения курсора
    editor.onDidChangeCursorPosition((e: any) => {
      if (onCursorChange) {
        // Передаем новую позицию курсора
        onCursorChange(e.position);
      }
    });
    
    // Добавляем горячие клавиши - универсальный подход, работающий как в HTTP, так и в HTTPS
    
    try {
      // Пробуем использовать Monaco API для регистрации команд
      if (typeof monaco !== 'undefined') {
        // Регистрируем Ctrl+S/Cmd+S для сохранения
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          console.log('Monaco command: Ctrl+S triggered');
          // Генерируем пользовательское событие для сохранения
          const event = new CustomEvent('app-save-file', { bubbles: true });
          document.dispatchEvent(event);
        });
        
        // Регистрируем Ctrl+O/Cmd+O для открытия
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyO, () => {
          // Предотвращаем стандартное действие браузера
          window.event?.preventDefault();
          console.log('Monaco command: Ctrl+O triggered');
          
          // Вместо генерации события, напрямую создаем и кликаем по input
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = '.md, .markdown, .txt';
          fileInput.style.display = 'none';
          
          fileInput.addEventListener('change', (event) => {
            console.log('File selected:', (event.target as HTMLInputElement).files?.[0]?.name);
            // Генерируем событие только после выбора файла
            const customEvent = new CustomEvent('app-open-file-selected', { 
              bubbles: true,
              detail: { inputElement: event.target }
            });
            document.dispatchEvent(customEvent);
          });
          
          // Добавляем элемент в DOM и кликаем по нему
          document.body.appendChild(fileInput);
          fileInput.click();
          
          // Удаляем с задержкой
          setTimeout(() => {
            document.body.removeChild(fileInput);
          }, 500); // Увеличиваем время задержки
        });
      }
    } catch (monacoError) {
      console.warn('Monaco commands registration failed:', monacoError);
    }
    
    // Дополнительный резервный метод для перехвата клавиш (работает в HTTP)
    // Используем тот же DOM узел для обработки клавиш
    const editorDomNode = editor.getDomNode();
    if (editorDomNode) {
      // Добавляем обработчик клавиш на DOM-узел редактора
      editorDomNode.addEventListener('keydown', (e: KeyboardEvent) => {
        // Перехватываем Ctrl+S / Cmd+S
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
          console.log('DOM event: Ctrl+S triggered');
          e.preventDefault();
          e.stopPropagation();
          const event = new CustomEvent('app-save-file', { bubbles: true });
          document.dispatchEvent(event);
        }
        
        // Перехватываем Ctrl+O / Cmd+O
        if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O')) {
          console.log('DOM event: Ctrl+O triggered');
          e.preventDefault();
          e.stopPropagation();
          const event = new CustomEvent('app-open-file', { bubbles: true });
          document.dispatchEvent(event);
        }
      }, true); // Используем фазу перехвата (capture)
    }
    
    if (mobile && editor) {
      // Добавляем обработчик двойного клика для мобильных устройств
      editor.onMouseDown((e: any) => {
        if (e.event.detail === 2) { // Двойной клик
          const position = editor.getPosition();
          const model = editor.getModel();
          
          if (position && model) {
            // Получаем текущую линию и слово под курсором
            const lineContent = model.getLineContent(position.lineNumber);
            const word = model.getWordAtPosition(position);
            
            if (word) {
              // Выделяем слово
              editor.setSelection({
                startLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endLineNumber: position.lineNumber,
                endColumn: word.endColumn
              });
            }
          }
        }
      });
    }
    
    // Добавляем поддержку перетаскивания файлов на редактор
    // Используем тот же DOM-узел для обработки перетаскивания
    if (editorDomNode) {
      // Функция обработки перетаскивания
      editorDomNode.addEventListener('dragover', (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'copy';
        }
      });
      
      // Обработка сброса файла
      editorDomNode.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          console.log('File drop detected:', file.name, 'Type:', file.type);
          
          // Проверяем, что это текстовый файл (более широкая проверка)
          const isTextFile = 
            file.type === 'text/plain' || 
            file.type === 'text/markdown' || 
            file.type === '' || // некоторые файлы могут не иметь типа
            file.name.toLowerCase().endsWith('.md') || 
            file.name.toLowerCase().endsWith('.markdown') || 
            file.name.toLowerCase().endsWith('.txt') || 
            file.name.toLowerCase().endsWith('.text');
          
          if (isTextFile) {
            console.log('File is valid, reading content directly...');
            
            // Вместо генерации события, сразу читаем файл
            const reader = new FileReader();
            
            reader.onload = (loadEvent) => {
              if (loadEvent.target && typeof loadEvent.target.result === 'string') {
                console.log('File content loaded, length:', loadEvent.target.result.length);
                
                // Генерируем событие с уже загруженным содержимым
                const event = new CustomEvent('app-file-content-loaded', { 
                  bubbles: true,
                  detail: { 
                    fileName: file.name,
                    content: loadEvent.target.result 
                  }
                });
                document.dispatchEvent(event);
              }
            };
            
            reader.onerror = (error) => {
              console.error('Error reading file:', error);
              // Фаллбэк - отправляем только файл, пусть App разбирается
              const event = new CustomEvent('app-file-dropped', { 
                bubbles: true,
                detail: { file }
              });
              document.dispatchEvent(event);
            };
            
            // Читаем файл как текст
            reader.readAsText(file);
          } else {
            // Если это не текстовый файл, то просто отправляем событие с файлом
            console.log('File is not a recognized text format');
            const event = new CustomEvent('app-file-dropped', { 
              bubbles: true,
              detail: { file }
            });
            document.dispatchEvent(event);
          }
        }
      });
    }
    
    // Вызываем переданный обработчик, если он есть
    if (onEditorDidMount) {
      onEditorDidMount(editor);
    }
  };
  
  // Функция выделения всей текущей строки
  const selectCurrentLine = () => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const position = editor.getPosition();
    if (!position) return;
    
    const lineNumber = position.lineNumber;
    const model = editor.getModel();
    if (!model) return;
    
    const lineContent = model.getLineContent(lineNumber);
    const lineLength = lineContent.length;
    
    editor.setSelection({
      startLineNumber: lineNumber,
      startColumn: 1,
      endLineNumber: lineNumber,
      endColumn: lineLength + 1
    });
  };
  
  // Функция копирования всего текста
  const copyAllContent = () => {
    if (content) {
      navigator.clipboard.writeText(content)
        .then(() => {
          // Отображаем анимацию успешного копирования (добавим в стили)
          const editorContainer = document.querySelector('.editor-container');
          if (editorContainer) {
            editorContainer.classList.add('copy-success');
            setTimeout(() => {
              editorContainer.classList.remove('copy-success');
            }, 1000);
          }
        })
        .catch(err => {
          console.error('Ошибка при копировании: ', err);
        });
    }
  };
  
  // Прокрутка к концу содержимого (просто прокрутка)
  const scrollToBottom = () => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const model = editor.getModel();
    if (!model) return;
    
    const lineCount = model.getLineCount();
    editor.revealLine(lineCount);
    editor.setPosition({ lineNumber: lineCount, column: model.getLineMaxColumn(lineCount) });
    editor.focus();
  };
  
  // Добавление новой строки в конец документа
  const addNewLineAtBottom = () => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const model = editor.getModel();
    if (!model) return;
    
    const lineCount = model.getLineCount();
    
    // Добавляем пустые строки в конец документа
    editor.executeEdits('', [
      {
        range: {
          startLineNumber: lineCount + 1,
          startColumn: 1,
          endLineNumber: lineCount + 1,
          endColumn: 1
        },
        text: '\n\n',
        forceMoveMarkers: true
      }
    ]);
    
    // Перемещаем курсор на новую строку и обновляем содержимое
    editor.setPosition({ lineNumber: lineCount + 2, column: 1 });
    editor.focus();
    handleEditorChange(model.getValue());
  };
  
  // Прокрутка к началу содержимого
  const scrollToTop = () => {
    const editor = editorRef.current;
    if (!editor) return;
    
    editor.revealLine(1);
  };
  
  // Добавление табуляции в текущей позиции
  const addTab = () => {
    const editor = editorRef.current;
    if (!editor) return;
    
    const model = editor.getModel();
    if (!model) return;
    
    const position = editor.getPosition();
    if (!position) return;
    
    // Добавляем таб на текущей позиции
    editor.executeEdits('', [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: '\t',
        forceMoveMarkers: true
      }
    ]);
    
    // Фокусируем редактор и обновляем содержимое
    editor.focus();
    handleEditorChange(model.getValue());
  };
  
  // Регистрируем обработчики функций, если они переданы извне
  React.useEffect(() => {
    if (onSelectLine) {
      onSelectLine = selectCurrentLine;
    }
    if (onCopyAll) {
      onCopyAll = copyAllContent;
    }
  }, [onSelectLine, onCopyAll]);
  
  return (
    <div className={`editor-container ${mobile ? 'editor-container-mobile' : ''}`}>
      {mobile && (
        <div className="mobile-editor-actions">
          <button className="mobile-editor-button" onClick={selectCurrentLine} title="Выделить строку">
            <i className="fas fa-i-cursor"></i>
          </button>
          <button className="mobile-editor-button" onClick={copyAllContent} title="Копировать всё">
            <i className="fas fa-copy"></i>
          </button>
          <button className="mobile-editor-button" onClick={scrollToTop} title="К началу">
            <i className="fas fa-arrow-up"></i>
          </button>
          <button className="mobile-editor-button" onClick={scrollToBottom} title="К концу">
            <i className="fas fa-arrow-down"></i>
          </button>
          <button className="mobile-editor-button" onClick={addNewLineAtBottom} title="Добавить пустую строку внизу">
            <i className="fas fa-level-down-alt"></i>
          </button>
          <button className="mobile-editor-button" onClick={addTab} title="Добавить табуляцию">
            <i className="fas fa-indent"></i>
          </button>
        </div>
      )}
      <MonacoEditor
        height="100%"
        defaultLanguage="markdown"
        value={content}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false }, // Отключаем миникарту везде
          fontSize: mobile ? 14 : 16,
          wordWrap: 'on',
          lineNumbers: 'on', // Включаем нумерацию строк везде
          scrollBeyondLastLine: false,
          automaticLayout: true,
          selectionHighlight: true,
          contextmenu: true,
          quickSuggestions: mobile ? false : true,
          overviewRulerBorder: false,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: mobile ? 8 : 10,
          },
          folding: true, // Включаем складывание везде
          glyphMargin: true, // Включаем поле для иконок везде
          lineDecorationsWidth: 10, // Увеличиваем ширину поля для нумерации
          lineNumbersMinChars: 3 // Минимальное количество символов для номеров строк
        }}
      />
    </div>
  );
};

export default Editor;
