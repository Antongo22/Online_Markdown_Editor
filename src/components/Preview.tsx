import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface PreviewProps {
  content: string;
  documentType: string; // оставляем для совместимости с App.tsx
  uploadedImages?: Record<string, string>;
  mobile?: boolean;
}

const Preview = ({ content, uploadedImages = {}, mobile = false }: PreviewProps): React.ReactElement => {
  
  return (
    <div className={`preview-container ${mobile ? 'preview-container-mobile' : ''}`}>
      <div className={`markdown-preview ${mobile ? 'markdown-preview-mobile' : ''}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSlug]}
          components={{
            code({node, inline, className, children, ...props}: any) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              const isDarkMode = true; // Теперь всегда используем темную тему

              return !inline && match ? (
                <div className="code-block dark-code">
                  {language && <div className="code-language">{language}</div>}
                  <SyntaxHighlighter
                    style={tomorrow}
                    language={language}
                    PreTag="div"
                    showLineNumbers={true}
                    wrapLines={true}
                    customStyle={{
                      backgroundColor: '#1e1e1e',
                      borderRadius: '0 0 5px 5px',
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            table({node, ...props}: any) {
              return <div className="table-container"><table {...props} /></div>;
            },
            pre({node, ...props}: any) {
              return <pre {...props} />;
            },
            img({node, ...props}: any) {
              const src = props.src || '';
              // Проверка, есть ли загруженное изображение
              if (src.startsWith('upload:') && uploadedImages) {
                const imageName = src.replace('upload:', '');
                const imageData = uploadedImages[imageName];
                if (imageData) {
                  return <img src={imageData} alt={props.alt || ''} className="uploaded-image" />;
                }
              }
              return <img {...props} />;
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default Preview;
