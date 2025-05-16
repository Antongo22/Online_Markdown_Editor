import React from 'react';
import { Editor as MonacoEditor } from '@monaco-editor/react';

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
  onEditorDidMount?: (editor: any) => void;
  mobile?: boolean;
}

const Editor = ({ content, onChange, onEditorDidMount, mobile = false }: EditorProps): React.ReactElement => {
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
  
  return (
    <div className={`editor-container ${mobile ? 'editor-container-mobile' : ''}`}>
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
