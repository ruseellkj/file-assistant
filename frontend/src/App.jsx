import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // State to manage gradient position
  const [gradient, setGradient] = useState({ x: 0, y: 0 });

  // useEffect to set the document title once on component mount
  useEffect(() => {
    document.title = "FileAssistant Chat";
  }, []);

  // Function to handle file change
  const handleFileChange = (e) => {
    setDocumentFile(e.target.files[0]);
    setMessages([]);
  };

  // Function to handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!documentFile) {
      toast.error('Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    const trimmedMessage = inputMessage.trim();
    if (trimmedMessage === '') {
      toast.error("Type your message");
      return;
    }

    const formData = new FormData();
    formData.append('file', documentFile);

    try {
      setLoading(true);

      // Update state with the user's message first
      const newMessage = { text: trimmedMessage, type: 'user' };
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setInputMessage('');

      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const context = response.data.text;

      const answerResponse = await axios.post('http://localhost:5000/answer', {
        query: trimmedMessage,
        context: context
      });

      const newAnswer = { text: answerResponse.data.answer, type: 'bot' };

      // Add the bot's response after the user's message is sent
      setMessages(prevMessages => [...prevMessages, newAnswer]);
      toast.success("Message Sent");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error sending message");
    } finally {
      setLoading(false);
    }
  };

  // Function to update gradient position based on mouse movement
  const handleMouseMove = (event) => {
    const { clientX, clientY, currentTarget } = event;
    const { offsetWidth, offsetHeight } = currentTarget;
    const x = (clientX / offsetWidth) * 100;
    const y = (clientY / offsetHeight) * 100;
    setGradient({ x, y });
  };

  const handleClear = () => {
    setMessages([]);
    setInputMessage('');
    toast.success("Chat Cleared");
  };

  return (
    <div className="App" onMouseMove={handleMouseMove} style={{ '--x': `${gradient.x}%`, '--y': `${gradient.y}%` }}>
      <div className="title-container">
        <h1 className="page-title">FileAssistant Chat</h1>
      </div>
      <div className="container">
        <div className="chat-container">
          {messages.map((message, index) => (
            <div key={index} className={`chat-item ${message.type}`}>
              <p className="chat-text">{message.text}</p>
            </div>
          ))}
          {loading && (
            <div className="chat-item bot">
              <div className="loader"></div>
            </div>
          )}
        </div>
        <form onSubmit={handleSendMessage} className="form-container">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf, .docx, .txt"
          />
          <input
            type="text"
            className="input-message"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message here..."
          />
          <button type="submit" className="btn-send">Send</button>
          <button type="button" className="btn-clear" onClick={handleClear}>Clear Chat</button>
        </form>
      </div>
      <Toaster position="top-right" /> {/* Toaster for toast notifications */}
    </div>
  );
}

export default App;
