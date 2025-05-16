import React from 'react';

interface ToolbarProps {
  onAction: (template: string) => void;
  mobile?: boolean;
}

const Toolbar = ({ onAction, mobile = false }: ToolbarProps): React.ReactElement => {
  // Markdown шаблоны
  const insertHeading = () => {
    onAction('# Заголовок');
  };

  const insertSubheading = () => {
    onAction('## Подзаголовок');
  };

  const insertBold = () => {
    onAction('**жирный текст**');
  };

  const insertItalic = () => {
    onAction('*курсив текст*');
  };

  const insertCode = () => {
    onAction('```\nВаш код здесь\n```');
  };

  const insertList = () => {
    onAction('- Элемент 1\n- Элемент 2\n- Элемент 3');
  };

  const insertOrderedList = () => {
    onAction('1. Первый элемент\n2. Второй элемент\n3. Третий элемент');
  };

  const insertLink = () => {
    onAction('[Текст ссылки](https://example.com)');
  };

  const insertTable = () => {
    const tableTemplate = `| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`;
    
    onAction(tableTemplate);
  };
  
  // Добавление полного шаблона документа
  const insertTemplate = () => {
    const template = `# Заголовок документа

## Раздел 1

Текст раздела 1

## Раздел 2

Текст раздела 2

### Подраздел 2.1

- Пункт 1
- Пункт 2
- Пункт 3

## Таблица

| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |`;

    onAction(template);
  };
  
  return (
    <div className={`toolbar ${mobile ? 'toolbar-mobile' : ''}`}>
      {mobile ? (
        // Мобильная версия панели инструментов - компактная
        <>
          <div className="toolbar-group-mobile">
            <button onClick={insertBold} title="Жирный"><strong>B</strong></button>
            <button onClick={insertItalic} title="Курсив"><em>I</em></button>
            <button onClick={insertList} title="Список"><i className="fas fa-list"></i></button>
            <button onClick={insertCode} title="Код"><i className="fas fa-code"></i></button>
          </div>
          <div className="toolbar-group-mobile">
            <button onClick={insertLink} title="Ссылка"><i className="fas fa-link"></i></button>
            <button onClick={insertTable} title="Таблица"><i className="fas fa-table"></i></button>
            <button onClick={insertTemplate} title="Шаблон"><i className="fas fa-file"></i></button>
          </div>
        </>
      ) : (
        // Десктопная версия панели инструментов
        <>
          <div className="toolbar-group">
            <button onClick={insertHeading} title="Заголовок">Заголовок</button>
            <button onClick={insertSubheading} title="Подзаголовок">Подзаголовок</button>
            <button onClick={insertBold} title="Жирный"><strong>B</strong></button>
            <button onClick={insertItalic} title="Курсив"><em>I</em></button>
          </div>
          <div className="toolbar-group">
            <button onClick={insertList} title="Маркированный список">Список</button>
            <button onClick={insertOrderedList} title="Нумерованный список">Нум. список</button>
            <button onClick={insertCode} title="Блок кода">Код</button>
            <button onClick={insertLink} title="Ссылка">Ссылка</button>
            <button onClick={insertTable} title="Таблица">Таблица</button>
          </div>
          <div className="toolbar-group">
            <button onClick={insertTemplate} title="Вставить шаблон" className="template-btn">Шаблон</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Toolbar;
