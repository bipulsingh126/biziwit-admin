import { useRef, useEffect, useState } from 'react'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Table,
  Link,
  Image,
  Code
} from 'lucide-react'

const RichTextEditor = ({ value, onChange, placeholder = "Start writing..." }) => {
  const editorRef = useRef(null)
  const [selectedFont, setSelectedFont] = useState('Arial')
  const [selectedFormat, setSelectedFormat] = useState('normal')

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current.focus()
    updateContent()
  }

  const updateContent = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleFontChange = (font) => {
    setSelectedFont(font)
    executeCommand('fontName', font)
  }

  const handleFormatChange = (format) => {
    setSelectedFormat(format)
    switch (format) {
      case 'h1':
        executeCommand('formatBlock', '<h1>')
        break
      case 'h2':
        executeCommand('formatBlock', '<h2>')
        break
      case 'h3':
        executeCommand('formatBlock', '<h3>')
        break
      case 'normal':
        executeCommand('formatBlock', '<div>')
        break
      default:
        break
    }
  }

  const insertTable = () => {
    const tableHTML = `
      <table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 1</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 2</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 3</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 4</td>
        </tr>
      </table>
    `
    executeCommand('insertHTML', tableHTML)
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      const text = window.getSelection().toString() || 'Link'
      const linkHTML = `<a href="${url}" target="_blank">${text}</a>`
      executeCommand('insertHTML', linkHTML)
    }
  }

  const insertImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imgHTML = `<img src="${e.target.result}" style="max-width: 100%; height: auto; margin: 10px 0;" alt="Inserted image" />`
          executeCommand('insertHTML', imgHTML)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const insertCodeBlock = () => {
    const codeHTML = `<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; margin: 10px 0; overflow-x: auto;"><code>// Your code here</code></pre>`
    executeCommand('insertHTML', codeHTML)
  }

  const toolbarButtons = [
    {
      group: 'font',
      items: [
        {
          type: 'select',
          value: selectedFont,
          onChange: handleFontChange,
          options: [
            { value: 'Arial', label: 'Sans Serif' },
            { value: 'Times New Roman', label: 'Serif' },
            { value: 'Courier New', label: 'Monospace' }
          ]
        },
        {
          type: 'select',
          value: selectedFormat,
          onChange: handleFormatChange,
          options: [
            { value: 'normal', label: 'Normal' },
            { value: 'h1', label: 'Heading 1' },
            { value: 'h2', label: 'Heading 2' },
            { value: 'h3', label: 'Heading 3' }
          ]
        }
      ]
    },
    {
      group: 'formatting',
      items: [
        { icon: Bold, command: 'bold', title: 'Bold' },
        { icon: Italic, command: 'italic', title: 'Italic' },
        { icon: Underline, command: 'underline', title: 'Underline' },
        { icon: Strikethrough, command: 'strikeThrough', title: 'Strikethrough' }
      ]
    },
    {
      group: 'alignment',
      items: [
        { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
        { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
        { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
        { icon: AlignJustify, command: 'justifyFull', title: 'Justify' }
      ]
    },
    {
      group: 'lists',
      items: [
        { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
        { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' }
      ]
    },
    {
      group: 'insert',
      items: [
        { icon: Table, action: insertTable, title: 'Insert Table' },
        { icon: Link, action: insertLink, title: 'Insert Link' },
        { icon: Image, action: insertImage, title: 'Insert Image' },
        { icon: Code, action: insertCodeBlock, title: 'Code Block' }
      ]
    }
  ]

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-3">
        <div className="flex items-center gap-1 flex-wrap">
          {toolbarButtons.map((group, groupIndex) => (
            <div key={group.group} className="flex items-center gap-1">
              {group.items.map((item, itemIndex) => {
                if (item.type === 'select') {
                  return (
                    <select
                      key={itemIndex}
                      value={item.value}
                      onChange={(e) => item.onChange(e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {item.options.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )
                } else {
                  const Icon = item.icon
                  return (
                    <button
                      key={itemIndex}
                      onClick={() => item.action ? item.action() : executeCommand(item.command)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title={item.title}
                      type="button"
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  )
                }
              })}
              {groupIndex < toolbarButtons.length - 1 && (
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={updateContent}
          onBlur={updateContent}
          className="w-full min-h-96 p-4 focus:outline-none"
          style={{ 
            minHeight: '384px',
            maxHeight: '600px',
            overflowY: 'auto'
          }}
          suppressContentEditableWarning={true}
          data-placeholder={placeholder}
        />
        {(!value || value.trim() === '') && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
        
        [contenteditable] h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
        }
        
        [contenteditable] h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        
        [contenteditable] li {
          margin: 0.5em 0;
        }
        
        [contenteditable] p {
          margin: 1em 0;
        }
        
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        [contenteditable] table {
          border-collapse: collapse;
          width: 100%;
          margin: 10px 0;
        }
        
        [contenteditable] td, [contenteditable] th {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        [contenteditable] pre {
          background-color: #f4f4f4;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
        }
      `}</style>
    </div>
  )
}

export default RichTextEditor
