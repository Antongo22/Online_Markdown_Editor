import React, { useRef } from 'react';
import { Editor as MonacoEditor } from '@monaco-editor/react';

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
    
    // Передаем редактор внешнему обработчику, если он есть
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
