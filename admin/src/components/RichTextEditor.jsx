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
  Code,
  Palette,
  Highlighter,
  Plus,
  Minus,
  FileText,
  BarChart3,
  Target,
  Layout,
  BookOpen,
  Users
} from 'lucide-react'

// Helper function to escape HTML special characters
const escapeHtml = (text) => {
  if (!text) return ''
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, char => map[char])
}

const RichTextEditor = ({ value, onChange, placeholder = "Start writing..." }) => {
  const editorRef = useRef(null)
  const [selectedFont, setSelectedFont] = useState('Arial')
  const [selectedFormat, setSelectedFormat] = useState('normal')
  const [selectedFontSize, setSelectedFontSize] = useState('14px')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showTableOptions, setShowTableOptions] = useState(false)
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)

  // Floating Toolbar State
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 })
  const [selectionStyles, setSelectionStyles] = useState({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    isHighlighted: false,
    isJustifyLeft: false,
    isJustifyCenter: false,
    isJustifyRight: false,
    isJustifyFull: false,
    isUnorderedList: false,
    isOrderedList: false
  })

  // Save selection for link insertion
  const savedSelection = useRef(null)

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      savedSelection.current = selection.getRangeAt(0);
    }
  }

  const restoreSelection = () => {
    if (savedSelection.current) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedSelection.current);
    }
  }

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      const newValue = value || '';

      // More robust check for HTML content, including inline styles
      const isHTML = /<[a-z][\s\S]*>/i.test(newValue);
      const hasStyleAttr = /style=/i.test(newValue);

      // Prevent cursor jump when typing: don't update innerHTML if the editor is focused
      if (document.activeElement === editorRef.current) {
        return;
      }

      console.log(`🔍 RichTextEditor - Content Update:`, {
        isHTML,
        hasStyleAttr,
        contentLength: newValue.length,
        contentPreview: newValue.substring(0, 100)
      });

      // If content is already HTML, render it directly
      if (isHTML) {
        editorRef.current.innerHTML = newValue;
      }
      // If it's plain text, convert it
      else if (newValue && newValue.trim().length > 0) {
        const formattedHTML = convertPlainTextToHTML(newValue);
        editorRef.current.innerHTML = formattedHTML;
      }
      // Handle empty content
      else {
        editorRef.current.innerHTML = '';
      }
    }
  }, [value]);

  // Convert plain text to HTML format
  const convertPlainTextToHTML = (text) => {
    if (!text || typeof text !== 'string') return '';

    let html = text.trim();

    // Clean up Excel formatting
    html = html.replace(/\t/g, '  '); // Replace tabs with spaces
    html = html.replace(/\r\n/g, '\n'); // Normalize line breaks
    html = html.replace(/\r/g, '\n'); // Remove carriage returns

    // Normalize bullet points
    html = html.replace(/[•·▪▫◦‣⁃]/g, '•');
    html = html.replace(/^[-*]\s+/gm, '• ');
    html = html.replace(/^\s*•\s*/gm, '• ');

    // Normalize numbered lists
    html = html.replace(/^(\d+)[\.\)]\s*/gm, '$1. ');

    // Split into blocks
    const blocks = [];
    const lines = html.split('\n');

    let currentBlock = [];
    let currentBlockType = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Empty line - end current block
      if (!line) {
        if (currentBlock.length > 0) {
          blocks.push({ type: currentBlockType, content: currentBlock });
          currentBlock = [];
          currentBlockType = null;
        }
        continue;
      }

      // Detect line type
      const isBullet = /^•\s+/.test(line);
      const isNumbered = /^\d+\.\s+/.test(line);
      const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line) && line.split(' ').length <= 10;
      const endsWithColon = line.endsWith(':') && line.length < 80;
      const isTitleCase = line.length < 80 &&
        line.split(' ').length <= 12 &&
        line.split(' ').every(word => word.length > 0 && /^[A-Z]/.test(word)) &&
        !line.match(/[.!?]$/);

      let lineType;
      if (isBullet) {
        lineType = 'bullet';
      } else if (isNumbered) {
        lineType = 'numbered';
      } else if (isAllCaps) {
        lineType = 'heading1';
      } else if (endsWithColon || isTitleCase) {
        lineType = 'heading2';
      } else {
        lineType = 'paragraph';
      }

      // Check if we need to start a new block
      if (currentBlockType && currentBlockType !== lineType) {
        // Keep list items together
        const bothLists = (currentBlockType === 'bullet' || currentBlockType === 'numbered') &&
          (lineType === 'bullet' || lineType === 'numbered');

        if (!bothLists) {
          blocks.push({ type: currentBlockType, content: currentBlock });
          currentBlock = [];
          currentBlockType = null;
        }
      }

      if (!currentBlockType) {
        currentBlockType = lineType;
      }

      currentBlock.push(line);
    }

    // Add remaining block
    if (currentBlock.length > 0) {
      blocks.push({ type: currentBlockType, content: currentBlock });
    }

    // Convert blocks to HTML with proper formatting
    const htmlBlocks = blocks.map(block => {
      switch (block.type) {
        case 'heading1':
          return block.content.map(line =>
            `<h1>${escapeHtml(line)}</h1>`
          ).join('\n');

        case 'heading2':
          return block.content.map(line =>
            `<h2>${escapeHtml(line.replace(/:$/, ''))}</h2>`
          ).join('\n');

        case 'bullet':
          const bulletItems = block.content.map(line => {
            const content = line.replace(/^•\s+/, '');
            return `  <li>${escapeHtml(content)}</li>`;
          }).join('\n');
          return `<ul>\n${bulletItems}\n</ul>`;

        case 'numbered':
          const numberedItems = block.content.map(line => {
            const content = line.replace(/^\d+\.\s+/, '');
            return `  <li>${escapeHtml(content)}</li>`;
          }).join('\n');
          return `<ol>\n${numberedItems}\n</ol>`;

        case 'paragraph':
        default:
          // Combine short consecutive lines, keep long lines separate
          const paragraphs = [];
          let currentPara = [];

          block.content.forEach(line => {
            if (line.length > 80 || currentPara.join(' ').length > 100) {
              if (currentPara.length > 0) {
                paragraphs.push(currentPara.join(' '));
                currentPara = [];
              }
              if (line.length > 80) {
                paragraphs.push(line);
              } else {
                currentPara.push(line);
              }
            } else {
              currentPara.push(line);
            }
          });

          if (currentPara.length > 0) {
            paragraphs.push(currentPara.join(' '));
          }

          return paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n');
      }
    });

    return htmlBlocks.join('\n\n');
  };
  // const convertPlainTextToHTML = (text) => {
  //   if (!text || typeof text !== 'string') return ''

  //   let html = text.trim()

  //   // Clean up formatting
  //   html = html.replace(/\t/g, ' ')
  //   html = html.replace(/\r/g, '')

  //   // Handle bullet points that might be mixed in with text
  //   html = html.replace(/([.!?])\s*([•·▪▫◦‣⁃])\s*/g, '$1\n$2 ')
  //   html = html.replace(/([.!?])\s*([-*])\s+([A-Z])/g, '$1\n$2 $3')

  //   // Split paragraphs by looking for sentence endings followed by capital letters
  //   html = html.replace(/([.!?])\s+([A-Z][a-z])/g, '$1\n\n$2')

  //   // Handle section headings (text ending with colon)
  //   html = html.replace(/([.!?])\s+([A-Z][^.!?]*:)\s*/g, '$1\n\n$2\n')

  //   // Handle bullet points
  //   html = html.replace(/^[•·▪▫◦‣⁃]\s*/gm, '• ')
  //   html = html.replace(/^[-*]\s*/gm, '• ')
  //   html = html.replace(/^\u2022\s*/gm, '• ')

  //   // Split into paragraphs by double line breaks first
  //   let paragraphs = html.split(/\n\s*\n/).filter(para => para.trim())

  //   // If no paragraphs found, try to split by sentence patterns
  //   if (paragraphs.length === 1) {
  //     paragraphs = html.split(/(?<=[.!?])\s+(?=[A-Z])/).filter(para => para.trim())
  //   }

  //   let allFormattedLines = []

  //   paragraphs.forEach((paragraph, paraIndex) => {
  //     const lines = paragraph.split(/\n/).filter(line => line.trim())
  //     let formattedLines = []
  //     let inList = false

  //     lines.forEach((line, index) => {
  //       const trimmedLine = line.trim()

  //       if (!trimmedLine) return

  //       // Handle bullet points
  //       if (trimmedLine.startsWith('•') || trimmedLine.match(/^[-*]\s/)) {
  //         if (!inList) {
  //           formattedLines.push('<ul>')
  //           inList = true
  //         }
  //         const content = trimmedLine.replace(/^[•\-*]\s*/, '')
  //         formattedLines.push(`<li>${content}</li>`)
  //       } else {
  //         // Close list if needed
  //         if (inList) {
  //           formattedLines.push('</ul>')
  //           inList = false
  //         }

  //         // Check if it's a heading
  //         const isHeading = (
  //           trimmedLine.length < 100 && 
  //           (
  //             trimmedLine.endsWith(':') ||
  //             trimmedLine === trimmedLine.toUpperCase() ||
  //             (trimmedLine.split(' ').length <= 10 && 
  //              trimmedLine.includes('Market') || trimmedLine.includes('Report') || 
  //              trimmedLine.includes('Application') || trimmedLine.includes('Region') ||
  //              trimmedLine.includes('Takeaways'))
  //           )
  //         )

  //         if (isHeading) {
  //           formattedLines.push(`<h3>${trimmedLine.replace(/:$/, '')}</h3>`)
  //         } else {
  //           formattedLines.push(`<p>${trimmedLine}</p>`)
  //         }
  //       }
  //     })

  //     // Close any remaining list
  //     if (inList) {
  //       formattedLines.push('</ul>')
  //     }

  //     allFormattedLines.push(...formattedLines)
  //   })

  //   return allFormattedLines.join('\n')
  // }

  // Close dropdowns when clicking outside and handle keyboard shortcuts
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.relative')) {
        setShowColorPicker(false)
        setShowHighlightPicker(false)
        setShowTableOptions(false)
      }
    }

    const handleKeyDown = (event) => {
      // Ctrl+Shift+H for highlighting with default yellow color
      if (event.ctrlKey && event.shiftKey && event.key === 'H') {
        event.preventDefault()
        applyHighlight('#FFFF00')
      }
    }

    const handlePaste = (event) => {
      event.preventDefault();

      let pasteContent;
      if (event.clipboardData && event.clipboardData.getData) {
        // Try to get HTML first (preserves formatting)
        pasteContent = event.clipboardData.getData('text/html');

        // Fallback to plain text if no HTML
        if (!pasteContent || pasteContent.trim() === '') {
          pasteContent = event.clipboardData.getData('text/plain');
        }
      }

      if (pasteContent) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        // Delete any selected content first
        selection.deleteFromDocument();
        const range = selection.getRangeAt(0);

        // Check if we have HTML content
        const isHTML = /<[a-z][\s\S]*>/i.test(pasteContent);

        if (isHTML) {
          // Parse HTML content
          const parser = new DOMParser();
          const doc = parser.parseFromString(pasteContent, 'text/html');

          // Create a fragment to hold the content
          const fragment = document.createDocumentFragment();

          // Function to clone node with all attributes and styles preserved
          const cloneNodeWithStyles = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              return document.createTextNode(node.textContent);
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
              // Normalize tag names for better compatibility
              let tagName = node.tagName.toLowerCase();

              // Convert deprecated tags to modern equivalents
              if (tagName === 'b') tagName = 'strong';
              if (tagName === 'i') tagName = 'em';
              if (tagName === 'strike') tagName = 's';

              const clone = document.createElement(tagName);

              // Copy all attributes including style, class, align, etc.
              Array.from(node.attributes).forEach(attr => {
                clone.setAttribute(attr.name, attr.value);
              });

              // Ensure font-weight is preserved for bold text
              if (node.style.fontWeight === 'bold' || node.style.fontWeight >= 600) {
                if (tagName !== 'strong') {
                  clone.style.fontWeight = 'bold';
                }
              }

              // Ensure font-style is preserved for italic text
              if (node.style.fontStyle === 'italic') {
                if (tagName !== 'em') {
                  clone.style.fontStyle = 'italic';
                }
              }

              // Recursively clone children
              Array.from(node.childNodes).forEach(child => {
                const childClone = cloneNodeWithStyles(child);
                if (childClone) {
                  clone.appendChild(childClone);
                }
              });

              return clone;
            }

            return null;
          };

          // Clone all body children with styles preserved
          Array.from(doc.body.childNodes).forEach(node => {
            const clonedNode = cloneNodeWithStyles(node);
            if (clonedNode) {
              fragment.appendChild(clonedNode);
            }
          });

          // Insert the fragment
          range.insertNode(fragment);
        } else {
          // Plain text - insert as text node
          const textNode = document.createTextNode(pasteContent);
          range.insertNode(textNode);
        }

        // Move cursor to end of pasted content
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);

        // Update the content
        updateContent();
      }
    };

    if (editorRef.current) {
      editorRef.current.addEventListener('paste', handlePaste)
    }



    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      if (editorRef.current) {
        editorRef.current.removeEventListener('paste', handlePaste)
      }
    }
  }, [])

  // Effect for updating toolbar state
  useEffect(() => {
    const handleSelectionChange = () => {
      // We use a small timeout to let the selection settle (especially for key navigation)
      setTimeout(updateToolbarState, 10);
    };

    const element = editorRef.current;
    if (element) {
      element.addEventListener('mouseup', handleSelectionChange);
      element.addEventListener('keyup', handleSelectionChange);
      element.addEventListener('click', handleSelectionChange);
    }

    return () => {
      if (element) {
        element.removeEventListener('mouseup', handleSelectionChange);
        element.removeEventListener('keyup', handleSelectionChange);
        element.removeEventListener('click', handleSelectionChange);
      }
    };
  }); // Run on every render to ensure we have latest scope if needed, or we can use generic refs. 
  // Actually with no dependency array it runs every render which is fine for adding/removing 
  // (though slightly inefficient, it ensures closure freshness). Better: use [] and refs for state if needed.
  // But updateToolbarState uses setState, which is stable. 
  // Let's rely on the function definition being hoisted or available.


  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current.focus()
    updateContent()
  }

  const updateContent = () => {
    if (editorRef.current && onChange) {
      // Get the inner HTML which preserves formatting
      const content = editorRef.current.innerHTML
      onChange(content)
    }
  }

  // Enhanced style application to support exact pixel sizes
  const applyStyle = (styleName, value) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style[styleName] = value;

    if (!range.collapsed) {
      try {
        // Try simple wrapper first
        range.surroundContents(span);
      } catch (e) {
        // Fallback for complex selections (e.g. crossing block boundaries)
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
      }
    } else {
      // If nothing selected, we can't easily "prepare" the next character style 
      // without inserting a zero-width space or similar, which is messy.
      // For now, we'll try to focus on selected text. 
      // As a fallback for cursor placement, we might just have to rely on browser behavior or insert a placeholder.
      // Let's use the standard command as a partial fallback or just return.
      // But standard 'fontSize' uses 1-7, so that doesn't help with pixels.
      // We will insert a temporary span with a zero width space
      const textNode = document.createTextNode('\u200B');
      span.appendChild(textNode);
      range.insertNode(span);
      // Move cursor inside span
      range.setStart(textNode, 1);
      range.setEnd(textNode, 1);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    updateContent();
  }

  const handleFontChange = (font) => {
    setSelectedFont(font)
    applyStyle('fontFamily', font)
  }

  const handleFontSizeChange = (size) => {
    setSelectedFontSize(size)
    applyStyle('fontSize', size)
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
      case 'h4':
        executeCommand('formatBlock', '<h4>')
        break
      case 'h5':
        executeCommand('formatBlock', '<h5>')
        break
      case 'h6':
        executeCommand('formatBlock', '<h6>')
        break
      case 'normal':
        executeCommand('formatBlock', '<div>')
        break
      default:
        break
    }
  }

  // Update toolbar state based on cursor position
  const updateToolbarState = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    let node = selection.anchorNode;
    // Walk up the DOM tree to find computed styles
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const computed = window.getComputedStyle(node);

        // Font Family
        let font = computed.fontFamily.replace(/['"]/g, '');
        // Browser might return full stack "Arial, Helvetica, sans-serif", take first
        font = font.split(',')[0].trim();
        if (font) setSelectedFont(font);

        // Font Size
        const size = computed.fontSize;
        if (size) setSelectedFontSize(size);

        // Block format (simple check)
        const tagName = node.tagName.toLowerCase();
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'p'].includes(tagName)) {
          // Mapping tag to format value
          if (tagName === 'div' || tagName === 'p') setSelectedFormat('normal');
          else setSelectedFormat(tagName);
        }

        break; // Found the closest element, stop
      }
      node = node.parentNode;
    }

    // Check for standard command states
    const isBold = document.queryCommandState('bold');
    const isItalic = document.queryCommandState('italic');
    const isUnderline = document.queryCommandState('underline');
    const isStrikethrough = document.queryCommandState('strikeThrough');
    const isJustifyLeft = document.queryCommandState('justifyLeft');
    const isJustifyCenter = document.queryCommandState('justifyCenter');
    const isJustifyRight = document.queryCommandState('justifyRight');
    const isJustifyFull = document.queryCommandState('justifyFull');
    const isUnorderedList = document.queryCommandState('insertUnorderedList');
    const isOrderedList = document.queryCommandState('insertOrderedList');

    // Check highlight - this is tricky as hiliteColor isn't always reliable for queryCommandState
    // We check if the parent node or any ancestor has background color
    let isHighlighted = false;
    let currentNode = selection.anchorNode;
    while (currentNode && currentNode !== editorRef.current) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const bg = window.getComputedStyle(currentNode).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          isHighlighted = true;
          break;
        }
      }
      currentNode = currentNode.parentNode;
    }

    setSelectionStyles({
      isBold,
      isItalic,
      isUnderline,
      isStrikethrough,
      isHighlighted,
      isJustifyLeft,
      isJustifyCenter,
      isJustifyRight,
      isJustifyFull,
      isUnorderedList,
      isOrderedList
    });

    // Calculate position for floating toolbar
    if (!selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      // We need relative position to the editor container if possible, 
      // but absolute position on page is easier if the toolbar is fixed/portal 
      // OR relative to the editor container if that is the offset parent.
      // Let's assume the editor container (relative) is the parent.
      // We can get offsets relative to the editorRef.
      if (editorRef.current) {
        const editorRect = editorRef.current.getBoundingClientRect();
        // Position above the selection
        const top = rect.top - editorRect.top - 40; // 40px above
        const left = rect.left - editorRect.left;

        setToolbarPosition({ top, left });
        setShowFloatingToolbar(true);
      }
    } else {
      setShowFloatingToolbar(false);
    }
  };


  // Color functions
  const applyTextColor = (color) => {
    executeCommand('foreColor', color)
    setShowColorPicker(false)
  }

  // Enhanced highlight that handles partial and full block selections better
  const applyHighlight = (color) => {
    saveSelection(); // Save before doing anything complex
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    if (!range.collapsed) {
      try {
        const span = document.createElement('span');
        span.style.backgroundColor = color;
        span.style.borderRadius = '3px';

        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);

        // Restore selection to inside
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);

      } catch (error) {
        console.error("Highlight error:", error);
        // Fallback
        executeCommand('hiliteColor', color)
      }
    } else {
      executeCommand('hiliteColor', color)
    }

    setShowHighlightPicker(false)
    updateContent()
  }

  const removeHighlight = () => {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (!range.collapsed) {
        // Remove highlighting from selected text
        executeCommand('removeFormat')
        updateContent()
      }
    }
    setShowHighlightPicker(false)
  }

  // Enhanced table function with custom rows/columns
  const insertTable = () => {
    let tableHTML = `<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">`

    for (let i = 0; i < tableRows; i++) {
      tableHTML += '<tr>'
      for (let j = 0; j < tableCols; j++) {
        const cellNumber = i * tableCols + j + 1
        tableHTML += `<td style="padding: 8px; border: 1px solid #ddd; background-color: #ffffff;">Cell ${cellNumber}</td>`
      }
      tableHTML += '</tr>'
    }

    tableHTML += '</table>'
    executeCommand('insertHTML', tableHTML)
    setShowTableOptions(false)
  }

  // Simple table insert (original functionality)
  const insertSimpleTable = () => {
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

  // Link insertion with proper selection restoration
  const insertLink = () => {
    saveSelection();
    setTimeout(() => {
      const url = prompt('Enter URL:')
      if (url) {
        restoreSelection(); // Restore the exact range
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
          executeCommand('createLink', url);
        } else {
          const linkHTML = `<a href="${url}" target="_blank">Link</a>`
          executeCommand('insertHTML', linkHTML)
        }
      }
    }, 10);
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

  const insertStructuredSection = (level, number, title) => {
    const sectionHTML = `
      <div style="margin: ${level === 1 ? '20px' : '15px'} 0;">
        <h${level + 1} style="margin: 10px 0; color: #333; ${level === 1 ? 'border-bottom: 1px solid #ccc; padding-bottom: 5px;' : ''}">${number} ${title}</h${level + 1}>
      </div>
    `
    executeCommand('insertHTML', sectionHTML)
  }

  const insertReportTemplate = () => {
    const reportHTML = `
      <div style="margin: 20px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
        <h1 style="color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px;">Report Title</h1>
        
        <div style="margin: 20px 0;">
          <h2 style="color: #374151; margin: 15px 0 10px 0;">Executive Summary</h2>
          <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;">Brief overview of the report findings and key insights...</p>
        </div>

        <div style="margin: 20px 0;">
          <h2 style="color: #374151; margin: 15px 0 10px 0;">Key Findings</h2>
          <ul style="margin: 10px 0; padding-left: 20px; color: #4b5563;">
            <li style="margin: 5px 0;">Finding 1: Description</li>
            <li style="margin: 5px 0;">Finding 2: Description</li>
            <li style="margin: 5px 0;">Finding 3: Description</li>
          </ul>
        </div>

        <div style="margin: 20px 0;">
          <h2 style="color: #374151; margin: 15px 0 10px 0;">Data Analysis</h2>
          <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;">Detailed analysis of the data and methodology...</p>
        </div>

        <div style="margin: 20px 0;">
          <h2 style="color: #374151; margin: 15px 0 10px 0;">Recommendations</h2>
          <ol style="margin: 10px 0; padding-left: 20px; color: #4b5563;">
            <li style="margin: 5px 0;">Recommendation 1</li>
            <li style="margin: 5px 0;">Recommendation 2</li>
            <li style="margin: 5px 0;">Recommendation 3</li>
          </ol>
        </div>
      </div>
    `
    executeCommand('insertHTML', reportHTML)
  }

  const insertSegmentTemplate = () => {
    const segmentHTML = `
      <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #10b981; background-color: #f0fdf4; border-radius: 0 8px 8px 0;">
        <h3 style="color: #065f46; margin: 0 0 15px 0;">Market Segment Analysis</h3>
        
        <div style="margin: 15px 0;">
          <h4 style="color: #047857; margin: 10px 0 5px 0;">Target Demographics</h4>
          <p style="margin: 5px 0; color: #374151; line-height: 1.5;">Age group, income level, geographic location, and other demographic factors...</p>
        </div>

        <div style="margin: 15px 0;">
          <h4 style="color: #047857; margin: 10px 0 5px 0;">Market Size & Growth</h4>
          <p style="margin: 5px 0; color: #374151; line-height: 1.5;">Current market size, projected growth rate, and market potential...</p>
        </div>

        <div style="margin: 15px 0;">
          <h4 style="color: #047857; margin: 10px 0 5px 0;">Key Characteristics</h4>
          <ul style="margin: 5px 0; padding-left: 20px; color: #374151;">
            <li style="margin: 3px 0;">Characteristic 1</li>
            <li style="margin: 3px 0;">Characteristic 2</li>
            <li style="margin: 3px 0;">Characteristic 3</li>
          </ul>
        </div>

        <div style="margin: 15px 0;">
          <h4 style="color: #047857; margin: 10px 0 5px 0;">Opportunities & Challenges</h4>
          <p style="margin: 5px 0; color: #374151; line-height: 1.5;">Market opportunities and potential challenges for this segment...</p>
        </div>
      </div>
    `
    executeCommand('insertHTML', segmentHTML)
  }

  const insertProfessionalTable = () => {
    const tableHTML = `
      <div style="margin: 20px 0; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <th style="padding: 15px; text-align: left; color: white; font-weight: 600; border: none;">Metric</th>
              <th style="padding: 15px; text-align: left; color: white; font-weight: 600; border: none;">Current Year</th>
              <th style="padding: 15px; text-align: left; color: white; font-weight: 600; border: none;">Previous Year</th>
              <th style="padding: 15px; text-align: left; color: white; font-weight: 600; border: none;">Growth %</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #2d3748; font-weight: 500;">Revenue</td>
              <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #2d3748;">$1,200,000</td>
              <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #2d3748;">$1,000,000</td>
              <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #059669; font-weight: 600;">+20%</td>
            </tr>
            <tr style="background-color: #ffffff;">
              <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #2d3748; font-weight: 500;">Market Share</td>
              <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #2d3748;">15.2%</td>
              <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #2d3748;">12.8%</td>
              <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #059669; font-weight: 600;">+2.4%</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #2d3748; font-weight: 500;">Customer Base</td>
              <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #2d3748;">25,000</td>
              <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #2d3748;">22,000</td>
              <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #059669; font-weight: 600;">+13.6%</td>
            </tr>
          </tbody>
        </table>
      </div>
    `
    executeCommand('insertHTML', tableHTML)
  }

  const insertTableOfContents = () => {
    const tocHTML = `
      <div style="margin: 20px 0; padding: 15px; border-radius: 8px; background-color: #ffffff; border: 1px solid #e5e7eb; background-color: #f9fafb;">
        <h3 style="color: #1f2937; margin: 15px 0 10px 0; font-weight: 600;">Table of Contents</h3>
        
        <div style="margin: 15px 0;">
          <h3 style="color: #1f2937; margin: 15px 0 10px 0; font-weight: 600;">Chapter 1. Global Market Report Scope & Methodology</h3>
          <div style="margin-left: 20px;">
            <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;"><strong>1.1. Research Objective</strong></p>
            <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;"><strong>1.2. Research Methodology</strong></p>
            <div style="margin-left: 20px;">
              <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;">1.2.1. Forecast Model</p>
              <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;">1.2.2. Desk Research</p>
              <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;">1.2.3. Top-Down and Bottom-Up Approach</p>
            </div>
            <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;"><strong>1.3. Research Attributes</strong></p>
            <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;"><strong>1.4. Scope of the Study</strong></p>
            <div style="margin-left: 20px;">
              <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;">1.4.1. Market Definition</p>
              <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;">1.4.2. Market Segmentation</p>
            </div>
          </div>
        </div>

        <div style="margin: 15px 0;">
          <h3 style="color: #1f2937; margin: 15px 0 10px 0; font-weight: 600;">Chapter 2. Executive Summary</h3>
          <div style="margin-left: 20px;">
            <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;"><strong>2.1. CEO/CXO Standpoint</strong></p>
            <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;"><strong>2.2. Strategic Insights</strong></p>
          </div>
        </div>

        <div style="margin: 15px 0;">
          <h3 style="color: #1f2937; margin: 15px 0 10px 0; font-weight: 600;">Chapter 3. Market Overview</h3>
          <div style="margin-left: 20px;">
            <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;"><strong>3.1. Market Definition</strong></p>
            <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;"><strong>3.2. Market Dynamics</strong></p>
            <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;"><strong>3.3. Market Trends</strong></p>
          </div>
        </div>

        <div style="margin: 15px 0;">
          <h3 style="color: #1f2937; margin: 15px 0 10px 0; font-weight: 600;">Chapter 4. Market Analysis</h3>
          <div style="margin-left: 20px;">
            <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;"><strong>4.1. Market Size & Forecast</strong></p>
            <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;"><strong>4.2. Competitive Landscape</strong></p>
            <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;"><strong>4.3. Regional Analysis</strong></p>
          </div>
        </div>

        <div style="margin: 15px 0;">
          <h3 style="color: #1f2937; margin: 15px 0 10px 0; font-weight: 600;">Chapter 5. Company Profiles</h3>
          <div style="margin-left: 20px;">
            <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;"><strong>5.1. Key Players Overview</strong></p>
            <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;"><strong>5.2. Financial Analysis</strong></p>
            <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;"><strong>5.3. Strategic Initiatives</strong></p>
          </div>
        </div>
      </div>
    `
    executeCommand('insertHTML', tocHTML)
  }

  // Insert standardized content templates that match backend formatting
  const insertStandardizedReportOverview = () => {
    const overviewHTML = `
      <div style="margin: 20px 0; padding: 15px; border-radius: 8px; background-color: #ffffff; border-left: 4px solid #3b82f6; background-color: #f8fafc;">
        <h3 style="color: #1f2937; margin: 15px 0 10px 0; font-weight: 600;">Report Overview</h3>
        <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;">This comprehensive market research report provides detailed analysis of the industry landscape, market dynamics, and growth opportunities.</p>
        
        <h3 style="color: #1f2937; margin: 15px 0 10px 0; font-weight: 600;">Key Highlights</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #4b5563;">
          <li style="margin: 5px 0; line-height: 1.6;">Market size and growth projections</li>
          <li style="margin: 5px 0; line-height: 1.6;">Competitive landscape analysis</li>
          <li style="margin: 5px 0; line-height: 1.6;">Regional market insights</li>
          <li style="margin: 5px 0; line-height: 1.6;">Technology trends and innovations</li>
        </ul>
        
        <h3 style="color: #1f2937; margin: 15px 0 10px 0; font-weight: 600;">Market Scope</h3>
        <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;">The report covers comprehensive analysis across multiple segments, regions, and application areas to provide stakeholders with actionable insights for strategic decision-making.</p>
      </div>
    `
    executeCommand('insertHTML', overviewHTML)
  }

  const insertStandardizedSegmentCompanies = () => {
    const segmentHTML = `
      <div style="margin: 20px 0; padding: 15px; border-radius: 8px; background-color: #ffffff; border-left: 4px solid #10b981; background-color: #f0fdf4;">
        <h3 style="color: #1f2937; margin: 15px 0 10px 0; font-weight: 600;">Market Segmentation</h3>
        <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;">The market is segmented based on various factors to provide detailed insights into different market dynamics.</p>
        
        <h3 style="color: #1f2937; margin: 15px 0 10px 0; font-weight: 600;">By Product Type</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #4b5563;">
          <li style="margin: 5px 0; line-height: 1.6;">Product Category A</li>
          <li style="margin: 5px 0; line-height: 1.6;">Product Category B</li>
          <li style="margin: 5px 0; line-height: 1.6;">Product Category C</li>
        </ul>
        
        <h3 style="color: #1f2937; margin: 15px 0 10px 0; font-weight: 600;">By Application</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #4b5563;">
          <li style="margin: 5px 0; line-height: 1.6;">Application Area 1</li>
          <li style="margin: 5px 0; line-height: 1.6;">Application Area 2</li>
          <li style="margin: 5px 0; line-height: 1.6;">Application Area 3</li>
        </ul>
        
        <h3 style="color: #1f2937; margin: 15px 0 10px 0; font-weight: 600;">Key Companies</h3>
        <p style="margin: 10px 0; line-height: 1.6; color: #4b5563;">Major players in the market include leading companies that drive innovation and market growth through strategic initiatives and technological advancements.</p>
        <ul style="margin: 10px 0; padding-left: 20px; color: #4b5563;">
          <li style="margin: 5px 0; line-height: 1.6;">Company A - Market leader with innovative solutions</li>
          <li style="margin: 5px 0; line-height: 1.6;">Company B - Strong regional presence</li>
          <li style="margin: 5px 0; line-height: 1.6;">Company C - Emerging player with disruptive technology</li>
        </ul>
      </div>
    `
    executeCommand('insertHTML', segmentHTML)
  }

  // Color palettes
  const textColors = [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
    '#FF0000', '#FF6600', '#FFCC00', '#FFFF00', '#CCFF00', '#66FF00',
    '#00FF00', '#00FF66', '#00FFCC', '#00FFFF', '#00CCFF', '#0066FF',
    '#0000FF', '#6600FF', '#CC00FF', '#FF00FF', '#FF00CC', '#FF0066'
  ]

  const highlightColors = [
    '#FFFF00', '#FFE135', '#FFD700', '#FFA500', '#FF6B6B', '#FF4757',
    '#7BED9F', '#70A1FF', '#5352ED', '#A4B0BE', '#FF9FF3', '#54A0FF',
    '#FFCCCC', '#CCFFCC', '#CCCCFF', '#FFFFCC', '#FFCCFF', '#CCFFFF'
  ]

  const toolbarButtons = [
    {
      group: 'font',
      items: [
        {
          type: 'select',
          value: selectedFont,
          onChange: handleFontChange,
          options: [
            // Sans Serif Fonts
            { value: 'Arial', label: 'Arial' },
            { value: 'Helvetica', label: 'Helvetica' },
            { value: 'Calibri', label: 'Calibri' },
            { value: 'Verdana', label: 'Verdana' },
            { value: 'Tahoma', label: 'Tahoma' },
            { value: 'Trebuchet MS', label: 'Trebuchet MS' },
            { value: 'Segoe UI', label: 'Segoe UI' },
            { value: 'Open Sans', label: 'Open Sans' },
            { value: 'Roboto', label: 'Roboto' },
            { value: 'Lato', label: 'Lato' },
            { value: 'Montserrat', label: 'Montserrat' },
            { value: 'Source Sans Pro', label: 'Source Sans Pro' },

            // Serif Fonts
            { value: 'Times New Roman', label: 'Times New Roman' },
            { value: 'Times', label: 'Times' },
            { value: 'Georgia', label: 'Georgia' },
            { value: 'Garamond', label: 'Garamond' },
            { value: 'Book Antiqua', label: 'Book Antiqua' },
            { value: 'Palatino', label: 'Palatino' },
            { value: 'Merriweather', label: 'Merriweather' },
            { value: 'Playfair Display', label: 'Playfair Display' },

            // Monospace Fonts
            { value: 'Courier New', label: 'Courier New' },
            { value: 'Monaco', label: 'Monaco' },
            { value: 'Consolas', label: 'Consolas' },
            { value: 'Menlo', label: 'Menlo' },
            { value: 'Source Code Pro', label: 'Source Code Pro' },
            { value: 'Fira Code', label: 'Fira Code' },

            // Display Fonts
            { value: 'Impact', label: 'Impact' },
            { value: 'Oswald', label: 'Oswald' },
            { value: 'Raleway', label: 'Raleway' },
            { value: 'Nunito', label: 'Nunito' },
            { value: 'Poppins', label: 'Poppins' }
          ]
        },
        {
          type: 'select',
          value: selectedFontSize,
          onChange: handleFontSizeChange,
          options: [
            { value: '8px', label: '8px' },
            { value: '9px', label: '9px' },
            { value: '10px', label: '10px' },
            { value: '11px', label: '11px' },
            { value: '12px', label: '12px' },
            { value: '14px', label: '14px' },
            { value: '16px', label: '16px' },
            { value: '18px', label: '18px' },
            { value: '20px', label: '20px' },
            { value: '22px', label: '22px' },
            { value: '24px', label: '24px' },
            { value: '26px', label: '26px' },
            { value: '28px', label: '28px' },
            { value: '32px', label: '32px' },
            { value: '36px', label: '36px' },
            { value: '48px', label: '48px' },
            { value: '72px', label: '72px' }
          ]
        },
        {
          type: 'select',
          value: selectedFormat,
          onChange: handleFormatChange,
          options: [
            { value: 'normal', label: 'Normal' },
            { value: 'h1', label: 'Chapter (H1)' },
            { value: 'h2', label: 'Section (H2)' },
            { value: 'h3', label: 'Subsection (H3)' },
            { value: 'h4', label: 'Sub-subsection (H4)' },
            { value: 'h5', label: 'Heading 5' },
            { value: 'h6', label: 'Heading 6' }
          ]
        }
      ]
    },
    {
      group: 'formatting',
      items: [
        { icon: Bold, command: 'bold', title: 'Bold', isActive: selectionStyles.isBold },
        { icon: Italic, command: 'italic', title: 'Italic', isActive: selectionStyles.isItalic },
        { icon: Underline, command: 'underline', title: 'Underline', isActive: selectionStyles.isUnderline },
        { icon: Strikethrough, command: 'strikeThrough', title: 'Strikethrough', isActive: selectionStyles.isStrikethrough }
      ]
    },
    {
      group: 'colors',
      items: [
        { icon: Palette, action: () => setShowColorPicker(!showColorPicker), title: 'Text Color', type: 'color' },
        { icon: Highlighter, action: () => setShowHighlightPicker(!showHighlightPicker), title: 'Highlight Color', type: 'highlight' }
      ]
    },
    {
      group: 'alignment',
      items: [
        { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left', isActive: selectionStyles.isJustifyLeft },
        { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center', isActive: selectionStyles.isJustifyCenter },
        { icon: AlignRight, command: 'justifyRight', title: 'Align Right', isActive: selectionStyles.isJustifyRight },
        { icon: AlignJustify, command: 'justifyFull', title: 'Justify', isActive: selectionStyles.isJustifyFull }
      ]
    },
    {
      group: 'lists',
      items: [
        { icon: List, command: 'insertUnorderedList', title: 'Bullet List', isActive: selectionStyles.isUnorderedList },
        { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List', isActive: selectionStyles.isOrderedList }
      ]
    },
    {
      group: 'templates',
      items: [
        { icon: FileText, action: insertReportTemplate, title: 'Insert Report Template' },
        { icon: Target, action: insertSegmentTemplate, title: 'Insert Segment Analysis' },
        { icon: BarChart3, action: insertProfessionalTable, title: 'Insert Professional Table' },
        { icon: BookOpen, action: insertStandardizedReportOverview, title: 'Insert Standardized Report Overview' },
        { icon: Users, action: insertStandardizedSegmentCompanies, title: 'Insert Standardized Segment/Companies' },
        { icon: Layout, action: insertTableOfContents, title: 'Insert Table of Contents' }
      ]
    },
    {
      group: 'insert',
      items: [
        { icon: Table, action: () => setShowTableOptions(!showTableOptions), title: 'Insert Table', type: 'table' },
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
            <div key={group.group} className="flex items-center gap-1 relative">
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
                    <div key={itemIndex} className="relative">
                      <button
                        onClick={() => item.action ? item.action() : executeCommand(item.command)}
                        className={`p-1 hover:bg-gray-200 rounded transition-colors ${(item.type === 'color' && showColorPicker) ||
                            (item.type === 'highlight' && showHighlightPicker) ||
                            (item.type === 'table' && showTableOptions) ||
                            (item.isActive) ? 'bg-blue-100 text-blue-600' : ''
                          }`}
                        title={item.title}
                        type="button"
                      >
                        <Icon className="w-4 h-4" />
                      </button>

                      {/* Color Picker Dropdown */}
                      {item.type === 'color' && showColorPicker && (
                        <div className="absolute top-8 left-0 z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                          <div className="grid grid-cols-6 gap-1 w-48">
                            {textColors.map((color, colorIndex) => (
                              <button
                                key={colorIndex}
                                onClick={() => applyTextColor(color)}
                                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Highlight Picker Dropdown */}
                      {item.type === 'highlight' && showHighlightPicker && (
                        <div className="absolute top-8 left-0 z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-2">Select highlight color:</p>
                              <div className="grid grid-cols-6 gap-1 w-48">
                                {highlightColors.map((color, colorIndex) => (
                                  <button
                                    key={colorIndex}
                                    onClick={() => applyHighlight(color)}
                                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                    title={`Highlight with ${color}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="border-t pt-2">
                              <button
                                onClick={removeHighlight}
                                className="w-full px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                title="Remove highlighting from selected text"
                              >
                                Remove Highlight
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Table Options Dropdown */}
                      {item.type === 'table' && showTableOptions && (
                        <div className="absolute top-8 left-0 z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Rows:</label>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setTableRows(Math.max(1, tableRows - 1))}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  type="button"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-sm">{tableRows}</span>
                                <button
                                  onClick={() => setTableRows(Math.min(10, tableRows + 1))}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  type="button"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Columns:</label>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setTableCols(Math.max(1, tableCols - 1))}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  type="button"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-sm">{tableCols}</span>
                                <button
                                  onClick={() => setTableCols(Math.min(10, tableCols + 1))}
                                  className="p-1 hover:bg-gray-200 rounded"
                                  type="button"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={insertTable}
                                className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                type="button"
                              >
                                Insert Table
                              </button>
                              <button
                                onClick={insertSimpleTable}
                                className="flex-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                                type="button"
                              >
                                Quick 2x2
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&family=Roboto:wght@300;400;500;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;600;700&family=Source+Sans+Pro:wght@300;400;600;700&family=Merriweather:wght@300;400;700&family=Playfair+Display:wght@400;700&family=Source+Code+Pro:wght@300;400;600&family=Fira+Code:wght@300;400;500&family=Oswald:wght@300;400;600&family=Raleway:wght@300;400;600;700&family=Nunito:wght@300;400;600;700&family=Poppins:wght@300;400;600;700&display=swap');
        
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
        
        /* Ensure HTML elements render properly */
        [contenteditable] {
          line-height: 1.6;
          font-size: 14px;
          color: #374151;
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
        
        [contenteditable] h4 {
          font-size: 1em;
          font-weight: bold;
          margin: 0.75em 0;
        }
        
        [contenteditable] h5 {
          font-size: 0.9em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        
        [contenteditable] h6 {
          font-size: 0.8em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          margin: 1em 0;
          padding-left: 2em;
          list-style-type: disc;
        }
        
        [contenteditable] ol {
          list-style-type: decimal;
        }
        
        [contenteditable] li {
          margin: 0.5em 0;
          display: list-item;
        }
        
        [contenteditable] p {
          margin: 1em 0;
          line-height: 1.6;
          text-align: justify;
        }
        
        [contenteditable] p:first-child {
          margin-top: 0;
        }
        
        [contenteditable] p:last-child {
          margin-bottom: 0;
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
        
        [contenteditable] span[style*="background-color"] {
          display: inline;
          padding: 2px 4px;
          border-radius: 3px;
          margin: 0 1px;
        }
        
        [contenteditable] mark {
          background-color: #ffff00;
          padding: 2px 4px;
          border-radius: 3px;
          color: inherit;
        }
      `}</style>
    </div>
  )
}

export default RichTextEditor
