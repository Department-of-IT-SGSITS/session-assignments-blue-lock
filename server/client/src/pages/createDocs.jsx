import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import React, { useRef, useEffect, useState } from 'react';
import JoditEditor from 'jodit-pro-react';
import { api_base_url } from '../Helper';
import { io } from 'socket.io-client';
import { debounce } from 'lodash';

const CreateDocs = () => {
  const { docsId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  const senderId = useRef(Math.random().toString(36).substr(2, 9));
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const isRemoteUpdate = useRef(false);
  const isInitialLoad = useRef(true);

  /* ------------------- DEBOUNCED SAVE TO DATABASE ------------------- */
  const saveToDatabase = useRef(
    debounce((newContent) => {
      fetch(`${api_base_url}/uploadDoc`, {
        mode: 'cors',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: localStorage.getItem('userId'),
          docId: docsId,
          content: newContent,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.success) setError(data.message || '');
          else setError('');
        });
    }, 400)
  ).current;

  /* ------------------- INSTANT SOCKET EMIT (NO DEBOUNCE) ------------------- */
  const emitChanges = (newContent) => {
    if (socketRef.current) {
      socketRef.current.emit('send-changes', {
        docId: docsId,
        html: newContent,
        sender: senderId.current,
      });
    }
  };

  /* ------------------- SOCKET SETUP ------------------- */
  useEffect(() => {
    socketRef.current = io(api_base_url, { transports: ['websocket'] });
    socketRef.current.emit('join-doc', docsId);

    socketRef.current.on('receive-changes', ({ html, sender }) => {
      if (sender === senderId.current) return;
      
      isRemoteUpdate.current = true;
      setContent(html);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [docsId]);

  /* ------------------- LOAD INITIAL CONTENT ------------------- */
  useEffect(() => {
    const loadDocument = async () => {
      try {
        const res = await fetch(`${api_base_url}/getDoc`, {
          mode: 'cors',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: localStorage.getItem('userId'),
            docId: docsId,
          }),
        });
        const data = await res.json();

        if (data.success && data.doc?.content !== undefined) {
          setContent(data.doc.content);
        } else {
          setContent('');
        }
        isInitialLoad.current = false;
      } catch {
        setContent('');
        isInitialLoad.current = false;
      }
    };

    loadDocument();
  }, [docsId]);

  /* ------------------- HANDLE EDITOR CHANGE ------------------- */
  const handleEditorChange = (newContent) => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    if (isInitialLoad.current) {
      return;
    }

    // Emit changes INSTANTLY to other users (real-time)
    emitChanges(newContent);
    
    // Save to database with debounce (to avoid too many DB writes)
    saveToDatabase(newContent);
  };

  /* ------------------- DOWNLOAD AS PDF ------------------- */
  const downloadAsPDF = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Document</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          ${editorRef.current?.value || content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  /* ------------------- HANDLE BACK NAVIGATION ------------------- */
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <Navbar />
      <div className="px-[100px] mt-3 bg-blue-50">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={handleBack}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text hover:bg-blue-500 text-white font-medium py-1 px-3 rounded-2xl flex items-center gap-2"
          >
            <span>←</span> Back
          </button>
          <button
            onClick={downloadAsPDF}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text hover:bg-blue-700 text-white font-medium py-1 px-4 rounded-2xl"
          >
            Download as PDF
          </button>
        </div>
        <JoditEditor
          ref={editorRef}
          value={content}
          tabIndex={1}
          onChange={handleEditorChange}
          config={{
            readonly: false,
            height: 500,
            uploader: { insertImageAsBase64URI: true },
            useNativeTooltip: true,
          }}
        />
      </div>
      {error && <p className="text-red-500">{error}</p>}
    </>
  );
};

export default CreateDocs;