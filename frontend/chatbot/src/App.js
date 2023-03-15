import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, ListGroup, Button } from 'react-bootstrap';

function App() {
    const [sessions, setSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState('');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const fetchSessions = async () => {
        const response = await axios.get('http://localhost:5000/sessions');
        setSessions(response.data);

        if (response.data.length > 0) {
            setCurrentSession(response.data[response.data.length - 1].id);
        } else {
            createSession();
        }
    };

    const createSession = async () => {
        const response = await axios.post('http://localhost:5000/create_session');
        const session_id = response.data.session_id;
        const session_name = response.data.session_name;
        setCurrentSession(session_id);
        setSessions([...sessions, { id: session_id, name: session_name }]);
    };

    const fetchHistory = async () => {
        if (currentSession) {
            const response = await axios.get(`http://localhost:5000/history?session_id=${currentSession}`);
            setMessages(response.data);
        } else {
            setMessages([]);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [currentSession]);


    useEffect(() => {
        if (messages.length === 2) {
            // Summarize the session after the first iteration of chat
            updateSessionName();
        }
    }, [messages]);

    const updateSessionName = async () => {
        const response = await axios.post('http://localhost:5000/update_session_name', { session_id: currentSession });
        const session_name = response.data.session_name;
        setSessions(
            sessions.map((session) =>
                session.id === currentSession ? { id: currentSession, name: session_name } : session
            )
        );
    };

    const sendMessage = async () => {
        if (input && currentSession) {
            setMessages([...messages, { sender: 'User', text: input }]);
            setInput('');

            const response = await axios.post('http://localhost:5000/chat', { session_id: currentSession, message: input });
            setMessages([...messages, { sender: 'User', text: input }, { sender: 'Bot', text: response.data.response }]);
        }
    };

    return (
        <Container fluid>
            <Row className="mt-5">
                <Col md={3}>
                    <h3 className="mb-3">Sessions</h3>
                    <ListGroup>
                        {sessions.map((session, index) => (
                            <ListGroup.Item
                                key={index}
                                active={currentSession === session.id}
                                onClick={() => setCurrentSession(session.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                {session.name}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                    <Button className="mt-3" onClick={createSession}>
                        Create new session
                    </Button>
                </Col>
                <Col md={9}>
                    <div className="text-center">
                        <h1 className="mb-3">WhatGPT!</h1>
                        <h5>Made with ChatGPT (GPT-4)</h5>
                    </div>
                    <div className="card">
                        <div className="card-body chat-window">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`message d-flex mb-2 justify-content-${message.sender === 'User' ? 'end' : 'start'}`}
                                >
                                    <div className={`card ${message.sender === 'User' ? 'bg-primary' : 'bg-light'}`}>
                                        <div className={`card-body p-2 ${message.sender === 'User' ? 'text-white' : ''}`}>
                                            {message.text}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="card-footer">
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            sendMessage();
                                        }
                                    }}
                                />
                                <div className="input-group-append">
                                    <button className="btn btn-primary" onClick={sendMessage}>
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

export default App;
