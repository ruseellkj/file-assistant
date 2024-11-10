import { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';

function App() {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [documentFile, setDocumentFile] = useState(null);
    const [loading, setLoading] = useState(false);

    // useEffect to set the document title once on component mount
    useEffect(() => {
        document.title = "FileAssistant Chat";
    }, []);

    const handleFileChange = (e) => {
        setDocumentFile(e.target.files[0]);
        setMessages([]);
    };

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
            const newMessage = { text: trimmedMessage, type: 'user' };
            setMessages((prevMessages) => [...prevMessages, newMessage]);
            setInputMessage('');

            const response = await axios.post('http://localhost:5000/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const context = response.data.text;

            const answerResponse = await axios.post('http://localhost:5000/answer', {
                query: trimmedMessage,
                context: context,
            });

            const newAnswer = { text: answerResponse.data.answer, type: 'bot' };

            setMessages((prevMessages) => [...prevMessages, newAnswer]);
            toast.success("Message Sent");
        } catch (error) {
            console.error('Error:', error);
            toast.error("Error sending message");
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setMessages([]);
        setInputMessage('');
        setDocumentFile(null);
        toast.success("Chat Cleared");
    };

    return (
        <div className="App flex flex-col justify-center items-center h-screen bg-gray-100 p-5">
            <div className="title-container mb-5 text-center">
                <h1 className="text-3xl font-bold">FileAssistant Chat</h1>
            </div>
            <div className="container bg-white w-full max-w-lg p-10 rounded-lg shadow-lg">
                <div className="chat-container mb-5 max-h-72 overflow-y-auto">
                    {messages.map((message, index) => (
                        <div key={index} className={`chat-item mb-2 p-3 rounded-lg ${message.type === 'user' ? 'bg-blue-200 text-right' : 'bg-gray-200'}`}>
                            <p className="chat-text">{message.text}</p>
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-item bot flex justify-center items-center">
                            <div className="loader w-8 h-8 border-4 border-t-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
                <form onSubmit={handleSendMessage} className="form-container flex flex-col space-y-3">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf, .docx, .txt"
                        disabled={loading} // Disable file input while loading
                        className="p-2 border border-gray-300 rounded-md"
                    />
                    <input
                        type="text"
                        className="p-2 border border-gray-300 rounded-md"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your message here..."
                        disabled={loading} // Disable message input while loading
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 text-white p-2 rounded-md"
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Send'}
                    </button>
                    <button
                        type="button"
                        className="bg-gray-500 text-white p-2 rounded-md"
                        onClick={handleClear}
                    >
                        Clear Chat
                    </button>
                </form>
            </div>
            <Toaster position="top-right" />
        </div>
    );
}

export default App;
