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

  return (
    <div className={`editor-container ${mobile ? 'editor-container-mobile' : ''}`}>
      <MonacoEditor
        height={mobile ? "calc(100vh - 160px)" : "calc(100vh - 220px)"}
        defaultLanguage="markdown"
        value={content}
        onChange={handleEditorChange}
        onMount={onEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: mobile ? false : true },
          fontSize: mobile ? 14 : 16,
          wordWrap: 'on',
          lineNumbers: mobile ? 'off' : 'on',
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
          folding: mobile ? false : true,
          glyphMargin: mobile ? false : true
        }}
      />
    </div>
  );
};

export default Editor;
