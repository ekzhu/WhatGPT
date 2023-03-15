from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from uuid import uuid4

app = Flask(__name__)
CORS(app)


class ChatBot:
    def __init__(self):
        self.sessions = {}

    def respond(self, session_id, message):
        response = f"Bot: {message[::-1]}"
        self.sessions[session_id]["messages"].append(
            {"sender": "User", "text": message}
        )
        self.sessions[session_id]["messages"].append(
            {"sender": "Bot", "text": response}
        )
        return response

    def get_history(self, session_id):
        if session_id in self.sessions:
            return self.sessions[session_id]["messages"]
        return []

    def create_session(self):
        session_id = str(uuid4())
        session_name = f"Session {len(self.sessions) + 1}: Unnamed"
        self.sessions[session_id] = {"name": session_name, "messages": []}
        return session_id

    def update_session_name(self, session_id):
        if session_id in self.sessions:
            text = " ".join(
                message["text"] for message in self.sessions[session_id]["messages"]
            )
            summary = text[:20] + "..." if len(text) > 20 else text
            name = (
                f"Session {list(self.sessions.keys()).index(session_id) + 1}: {summary}"
            )
            self.sessions[session_id]["name"] = name

    def save_sessions(self):
        with open("chat_sessions.json", "w") as file:
            json.dump(self.sessions, file)

    def load_sessions(self):
        try:
            with open("chat_sessions.json", "r") as file:
                self.sessions = json.load(file)
        except FileNotFoundError:
            self.sessions = {}


chat_bot = ChatBot()
chat_bot.load_sessions()


@app.route("/chat", methods=["POST"])
def chat():
    session_id = request.json.get("session_id", "")
    message = request.json.get("message", "")
    response = chat_bot.respond(session_id, message)
    chat_bot.save_sessions()
    return jsonify({"response": response})


@app.route("/history", methods=["GET"])
def history():
    session_id = request.args.get("session_id", "")
    chat_bot.load_sessions()
    return jsonify(chat_bot.get_history(session_id))


@app.route("/create_session", methods=["POST"])
def create_session():
    session_id = chat_bot.create_session()
    chat_bot.save_sessions()
    return jsonify(
        {
            "session_id": session_id,
            "session_name": chat_bot.sessions[session_id]["name"],
        }
    )


@app.route("/update_session_name", methods=["POST"])
def update_session_name():
    session_id = request.json.get("session_id", "")
    chat_bot.update_session_name(session_id)
    chat_bot.save_sessions()
    return jsonify({"session_name": chat_bot.sessions[session_id]["name"]})


@app.route("/sessions", methods=["GET"])
def sessions():
    return jsonify(
        [{"id": key, "name": value["name"]} for key, value in chat_bot.sessions.items()]
    )


if __name__ == "__main__":
    app.run(debug=True)
